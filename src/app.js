// reads in our .env file and makes those values available as environment variables
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const routes = require('./routes/main');
const secureRoutes = require('./routes/secure');
const passwordRoutes = require('./routes/password');
const asyncMiddleware = require('./middleware/asyncMiddleware');
const ChatModel = require('./models/chatModel');
const userModel = require('./models/userModel');


// setup mongo connection
const uri = process.env.MONGO_CONNECTION_URL;
mongoose.connect(uri, { useNewUrlParser : true, useCreateIndex: true });
mongoose.connection.on('error', (error) => {
  console.log(error);
  process.exit(1);
});
mongoose.connection.on('connected', function () {
  console.log('connected to mongo');
});
mongoose.set('useFindAndModify', false);

// create an instance of an express app
const app = express();

const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const players = {};
const balls = {};
var i = 0;
var playerCounter = 0;
io.on('connection', function (socket) {
  playerCounter = playerCounter + 1;
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  var bottomBool = false;
  var playerY=550;
  if ((playerCounter %2) ==0) {
    playerY = 50;
    bottomBool = true;
  }
  players[socket.id] = {
    flipX: false,
    x: 400,
    y: playerY,
    playerId: socket.id,
    bottom: bottomBool
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  //new
  i = i+1;
  balls[i] = {
    x: Math.floor(Math.random() * 400) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    ballId: i
  };
  if(playerCounter == 1) {
    console.log('making new ball: ', i);
    socket.emit('newBall', balls[i]);
  }
  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    playerCounter = playerCounter-1;
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData;
    //players[socket.id].y = movementData.y;
    // players[socket.id].flipX = movementData.flipX;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('ballMovement', function (movementData) {
    //socket.broadcast.emit('ballMoved', movementData);
    socket.broadcast.emit('ballMoved', movementData);

  });

  socket.on('gameOver', function (scoreData) {
    console.log('game ended');
  });

});

// update express settings
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(cookieParser());

// require passport auth
require('./auth/auth');


app.get('/game.html', passport.authenticate('jwt', { session : false }), function (req, res) {
  res.sendFile(__dirname + '/public/game.html');
});


app.get('/game.html', function (req, res) {
  res.sendFile(__dirname + '/public/game.html');
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/highScore', passport.authenticate('jwt', { session : false }), asyncMiddleware(async (req, res, next) => {
  const emailForQuery = req.user.email;
  const socketID = req.playerId;
  let highScore = await userModel.findOne({ email: emailForQuery }).select('highScore -_id');
  //console.log(highScore);
  //io.to(socketID).emit('highScore', highScore);
  res.send({ score:  highScore});
}));

app.post('/updateScore', passport.authenticate('jwt', { session : false }), asyncMiddleware(async (req, res, next) => {
  console.log('got here');
  const emailForQuery = req.user.email;
  const filter = { email: emailForQuery };
  let newScore = req.highScore;
  console.log('new score', newScore);
  //console.log(highScore);
  //io.to(socketID).emit('highScore', highScore);
  await userModel.updateOne(filter, { highScore: newScore });
  console.log('done');
}));

// main routes
app.use('/', routes);
app.use('/', passwordRoutes);
app.use('/', passport.authenticate('jwt', { session : false }), secureRoutes);

app.post('/submit-chatline', passport.authenticate('jwt', { session : false }), asyncMiddleware(async (req, res, next) => {
  const { message } = req.body;
  const { email, name } = req.user;
  await ChatModel.create({ email, message });
  io.emit('new message', {
    username: name,
    message,
  });
  res.status(200).json({ status: 'ok' });
}));

// catch all other routes
app.use((req, res, next) => {
  res.status(404).json({ message: '404 - Not Found' });
});

// handle errors
app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

// have the server start listening on the provided port
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});

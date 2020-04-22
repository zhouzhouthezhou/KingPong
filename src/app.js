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
var hit;
var index;
var down;
var xBall;
var yBall;
var downVelX = [2,-3,4,-2,3,-4,2];
var downVelY = [5,6,4,4,4,8,7];
var upVelX = [2,-3,4,-2,3,-4,2];
var upVelY = [-5,-6,-4,-4,-4,-8,-7];
var diffVelX;
var diffVelY;

io.on('connection', function (socket) {
  if (playerCounter == 1) {
    hit = 0;
    xBall = 400;
    yBall = 250;
    diffVelX = 0;
    diffVelY= -250;
    down = true;
  }
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

  if (playerCounter == 1) {
    socket.emit('firstPlayer', socket.id);
  } else if (playerCounter == 2) {
    socket.emit('secondPlayer', socket.id);
  }

  socket.on('createBall', function () {
    i = i+1;
    balls[i] = {
    x: 400,
    y: 250,
    ballId: i}; 
    console.log('making new ball: ', i);
    io.emit('newBall', balls[i]);
  });

  socket.on('destroyButton', function () {
    socket.broadcast.emit('buttonGone');
  });
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
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('ballMovement', function (movementData) {
    socket.broadcast.emit('ballMoved', movementData);

  });

  socket.on('gameOver', function (scoreData) {
    io.emit('gameEnded');
    console.log('game ended');
  });

  socket.on('ballRestart', function(velocity) {
    io.emit('autoRestart',velocity);
    console.log('point');
    xBall = 400;
    yBall=250;
    diffVelY = velocity.y;
  });
  
  socket.on('ballLocation', function() {
    var addOnX;
    var addOnY;
    index = hit%7;
    if(!down) {
      console.log('not down');
      if ((xBall + downVelX[index] <= 10) || (xBall + downVelX[index]>=790)) {
        addOnX = -downVelX[index];
      } else { 
        addOnX = downVelX[index];
      }
      xBall += addOnX;
      addOnY = downVelY[index];
      yBall+=addOnY;
      console.log('addon: ', addOnY);
    } else {
      console.log('down');
      if ((xBall +upVelX[index]<= 10) || (xBall+upVelX[index]>=790)) {
        addOnX = -upVelX[index];
      } else {
        addOnX = upVelX[index];
      }
      xBall += addOnX;
        addOnY = upVelY[index];
      yBall+=addOnY;
      console.log('addon: ', addOnY);
    }
    io.emit('updatedBall', {x: xBall, y: yBall});
  });

  socket.on('diffBallLocation', function() {
    yBall = yBall + (diffVelY/250)*3;
    io.emit('updatedBall', {x: xBall, y: yBall});
  });

  socket.on('ballHitPaddle', function(ballLocation) {
    console.log('hit');
    hit = hit +1;
    var y = ballLocation.y;
    if (y >500) {
      console.log('true');
      down = true;
    } else if (y< 50) {
      console.log('false');
      down = false;
    }
    socket.emit('switch');
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

app.get('/ballVelocity', function(req,res) {
  hit = hit+1;
  var index = hit %13;
  var velocity = {
    offsetProduced: randomNumbers[index],
    directionProduced: randomInt[index]
  };
  console.log(randomNumbers[index], randomInt[index]);
  res.send(velocity);
});

app.get('/game.html', function (req, res) {
  res.sendFile(__dirname + '/public/game.html');
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/scoreboard', function(req, res) {
  res.sendFile(__dirname + '/public/scoreboard.html');
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
  let newScore = req.body.score;
  console.log('new score', newScore);
  //console.log(highScore);
  //io.to(socketID).emit('highScore', highScore);
  await userModel.updateOne(filter, { highScore: newScore });
  console.log('done');
}));

app.get('/scores', asyncMiddleware(async (req, res, next) => {
  const users = await userModel.find({}, 'name highScore -_id').sort({ highScore: -1}).limit(10);
  res.status(200).json(users);
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

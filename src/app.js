//Adapted from the architecture and some code of :https://phasertutorials.com/how-to-create-a-phaser-3-mmorpg-part-1/
//and https://phasertutorials.com/creating-a-phaser-3-leaderboard-with-user-authentication-using-node-js-express-mongodb-part-1/
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
var downVelX = [2,-3,2,-2,3,-2,3];
var upVelX = [2,-3,2,-2,3,-2,3];
var pointWon;

//io socket event executed on user connection
io.on('connection', function (socket) {
  pointWon = false;
  //setting ball info on the first user's connection
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
  var bottomBool = false;
  var playerY=550;
  //every other player is placed at the top of the screen
  if ((playerCounter %2) ==0) {
    playerY = 50;
    bottomBool = true;
  }
  //the player object is created and this object is sent over the socket to ever other player except this one
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

  //socket event executed when ball is called to be created (places at middle of screen and emits this ball to all of the players)
  socket.on('createBall', function () {
    i = i+1;
    balls[i] = {
    x: 400,
    y: 250,
    ballId: i}; 
    console.log('making new ball: ', i);
    io.emit('newBall', balls[i]);
  });

  //sends the message to each clientside that one player clicked on the begin game button, so that all client's destroy this button and start the game (Simultaneously)
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

  //emitted to all players (except sender) that the ball moved on their client side
  socket.on('ballMovement', function (movementData) {
    socket.broadcast.emit('ballMoved', movementData);

  });

  //emits to all players to end the game
  socket.on('gameOver', function (scoreData) {
    io.emit('gameEnded');
    console.log('game ended');
  });

  //on ball restart (point won) autoRestart in each client is called and so is point awarded, the location and velocity of the ball is reset
  socket.on('ballRestart', function(velocity) {
    if ((velocity.currentY <= 15)|| (velocity.currentY >= 570)) {
      io.emit('autoRestart',velocity);
      io.emit('pointAwarded');
      console.log('point');
      xBall = 400;
      yBall=250;
      diffVelY = velocity.y;
    }
    pointWon = false;
  });
  
  //this is called to get the updated info of the ball's location
  socket.on('ballLocation', function() {
    var addOnX;
    var addOnY;
    //finds the "random" number of the downVelX and upVelX arrays by modding the number of hits with the size of the array and calling this array
    index = hit%7;
    if(!down) {
      console.log('not down');
      //if the side of screen is hit, the magnitude of the ball in the x-direction is reversed
      if ((xBall + downVelX[index] <= 10) || (xBall + downVelX[index]>=790)) {
        downVelX[index] = -downVelX[index];
      } else { 
        addOnX = downVelX[index];
      }
      //if a point hasn't been won, then more is added (this is a fail safe in the case that the ball has yet to reset)
      if (!pointWon) {
        xBall += addOnX;
        addOnY = 3;
        yBall+=addOnY;
        console.log('addon: ', addOnY);
      } else {
        console.log('addon is temp 0');
      }
    } else { //same as above but for the other direction
      console.log('down');
      if ((xBall +upVelX[index]<= 10) || (xBall+upVelX[index]>=790)) {
        upVelX[index] = -upVelX[index];
      } else {
        addOnX = upVelX[index];
      }
      if (!pointWon) {
        xBall += addOnX;
        addOnY =-3;
        yBall+=addOnY;
        console.log('addon: ', addOnY);
      } else {
        console.log('addon is temp 0');
      }
    }
    console.log('x,y', xBall, yBall);
    //sends the updated location to each client
    io.emit('updatedBall', {x: xBall, y: yBall});
  });

  socket.on('diffBallLocation', function() {
    console.log('diff');
  });

  //called when the ball hits the paddle and reverses the y-magnitude of the ball
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

  //signals to server a point was just won in one of the clients (prevents repeat point awarding for one scored point)
  socket.on('pointWon', function() {
    pointWon = true;
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

//returns the velocity of the ball to the client
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

//returns the file for the actual game
app.get('/game.html', function (req, res) {
  res.sendFile(__dirname + '/public/game.html');
});

app.use(express.static(__dirname + '/public'));

//gets the login page
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

//gets the scorebaord page
app.get('/scoreboard', function(req, res) {
  res.sendFile(__dirname + '/public/scoreboard.html');
});

//returns the highscore of a player based on login info
//adapted from: https://github.com/Automattic/mongoose/issues/688
app.get('/highScore', passport.authenticate('jwt', { session : false }), asyncMiddleware(async (req, res, next) => {
  const emailForQuery = req.user.email;
  const socketID = req.playerId;
  let highScore = await userModel.findOne({ email: emailForQuery }).select('highScore -_id');
  res.send({ score:  highScore});
}));

//updates a player's highscore based on login info
app.post('/updateScore', passport.authenticate('jwt', { session : false }), asyncMiddleware(async (req, res, next) => {
  console.log('got here');
  const emailForQuery = req.user.email;
  const filter = { email: emailForQuery };
  let newScore = req.body.score;
  console.log('new score', newScore);
  await userModel.updateOne(filter, { highScore: newScore });
  console.log('done');
}));

//returns all highscores of the players
app.get('/scores', asyncMiddleware(async (req, res, next) => {
  const users = await userModel.find({}, 'name highScore -_id').sort({ highScore: -1}).limit(10);
  res.status(200).json(users);
}));

// main routes
app.use('/', routes);
app.use('/', passwordRoutes);
app.use('/', passport.authenticate('jwt', { session : false }), secureRoutes);

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
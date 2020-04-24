/* Adapted from https://phasertutorials.com/how-to-create-a-phaser-3-mmorpg-part-1/ */
class BootScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'BootScene',
      active: true
    });
  }

  //asset images edited from: https://www.google.com/search?q=pong+paddle&tbm=isch&chips=q:pong+paddle,g_1:video+game:atqSEG8d3UQ%3D&hl=en&ved=2ahUKEwiOn9nVoKXoAhXEE80KHU9uAo8Q4lYoAHoECAEQFQ&biw=1161&bih=883#imgrc=gWSmNMq5qjFG2M
  preload() {
    this.load.image('ball', 'assets/images/ball.png');
    this.load.image('player', 'assets/images/paddle.png');
  }

  create() {
    this.scene.start('WorldScene');
  }
}

var cursors;
var ball;
var ballOldPosition;
var bottomScore;
var topScore;
var bottomScoreText;
var topScoreText;
var bottom;
var gameWon;
var score;
var timer;
var clickButton;
var firstID;
var secondID;
var offset;
var direction;
var ready;
var ballX;
var ballY;
var updateX;
var updateY;
var ballFirstHit;
var notified;
var caught;
var pointWon;

class WorldScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'WorldScene'
    });
  }

  create() {
    pointWon = false;

    notified = false;
    ready = false;
    //initializes websocket connection
    this.socket = io();
    caught = false;

    //creates group for players that aren't this player
    this.otherPlayers = this.physics.add.group();
    
    this.cursors = this.input.keyboard.createCursorKeys();

    gameWon = false;
    
    topScore =0;
	  topScoreText = this.add.text(16,13,'Score: 0', {fontSize: '32px',fill:'#FFF'});
	  bottomScore =0;
    bottomScoreText = this.add.text(16,559, 'Score: 0', {fontSize: '32px',fill:'#FFF'});

    //gets updated ball location
    this.socket.on('updatedBall', function(ballInfo) {
      updateX = ballInfo.x;
      updateY = ballInfo.y;
    }.bind(this));

    //gets list of currently connected players
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === this.socket.id) {
          bottom = players[id].bottom;
          this.createPlayer(players[id]);
        } else {
          this.addOtherPlayers(players[id]);
        }
      }.bind(this));
    }.bind(this));
  
    //creates a new player
    this.socket.on('newPlayer', function (playerInfo) {
      this.addOtherPlayers(playerInfo);
    }.bind(this));

    //deletes disconnected player
    this.socket.on('disconnect', function (playerId) {
      this.otherPlayers.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
          player.destroy();
        }
      }.bind(this));
    }.bind(this));

    //updates player location
    this.socket.on('playerMoved', function (playerInfo) {
      this.otherPlayers.getChildren().forEach(function (player) {
        if (playerInfo.playerId === player.playerId) {
          player.setPosition(playerInfo.x, playerInfo.y);
        }
      }.bind(this));
    }.bind(this));

    //adds a ball when requested
    this.socket.on('newBall', function(ballInfo) {
      this.createBall(ballInfo);
    }.bind(this));

    //updates ball location
    this.socket.on('ballMoved', function (movementData) {
      if(ball) {
        ball.setPosition(movementData.x, movementData.y);
      }
    }.bind(this));

    //gets id of first player connected
    this.socket.on('firstPlayer', function(id) {
      firstID = id;
      console.log('first: ',id);
    }.bind(this));

    //gets id of second player connected
    this.socket.on('secondPlayer', function(id) {
      secondID = id;
      console.log('second: ',id);
    }.bind(this));

    //indicates if the score must be changed
    this.socket.on('highScore', function(highScore) {
      if(score > highScore.highScore) {
        console.log('higher');
      } else {
        console.log('lower');
      }
    }.bind(this));

    //destroys the button for begin game
    this.socket.on('buttonGone', function () {
      clickButton.destroy();
    }.bind(this));

    //restarts ball location
    this.socket.on('autoRestart', function(velocity) {
      if (ball) {
        ballFirstHit = false;
        caught = false;
        console.log("x,y velocity",velocity.x,velocity.y);
        ball.setVelocity(velocity.x,velocity.y);
        //safe guard so this is not implemented unnecessarily
        if ( ball.body.y <= 50  && !(ball.body.y >= 550)) {
          if(!pointWon) {
            bottomScore+= 1;
            bottomScoreText.setText('Score: ' + Math.floor(bottomScore));
          }
        } else if ( ball.body.y >= 550 && !(ball.body.y <= 50)) {
          if (!pointWon) {
            topScore+= 1;
            topScoreText.setText('Score: ' + Math.floor(topScore));
          }
        }
      }
    }.bind(this));

    //called if the ball was just hit
    this.socket.on('ballHit', function(velocity) {
      offset=velocity.offsetProduced;
      direction=velocity.directionProduced;
      ready = true;
    }.bind(this));

    //called if the game has ended
    this.socket.on('gameEnded', function() {
      this.endGame();
    }.bind(this)); 

    //used to show the hit by paddle was accounted for
    this.socket.on('switch', function() {
      notified = false;
    }.bind(this));

    //used to show the point has been awarded already
    this.socket.on('pointAwarded', function() {
      pointWon = true;
    }.bind(this));

    //creates keys for input
    cursors = this.input.keyboard.createCursorKeys();
    //begin game button adapted from: https://snowbillr.github.io/blog//2018-07-03-buttons-in-phaser-3/
    clickButton = this.add.text(300, 300, 'Click me to begin game!', { fill: '#fff' })
      .setInteractive()
      .on('pointerdown', () => this.beginGame() );
  }

  //called when the begin game button has been pressed to start the game at the same time as every other player
  beginGame() {
    this.timedEvent = this.time.addEvent(40000, console.log('hey'), this);
    this.socket.emit('createBall');
    this.socket.emit('destroyButton');
    clickButton.destroy();
  }

  //creates the ball sprite and sets its initial velocity and physics settings including its overlap function with ballHitPaddle
  createBall(ballInfo) {
    ball = this.physics.add.sprite(ballInfo.x,ballInfo.y,'ball').setScale(0.5);    
    ball.enableBody = true;    
    ball.setVelocity(0,-250);
    ball.allowRotation = true;
    ball.setCollideWorldBounds(true);
    this.physics.add.overlap(this.player, ball, this.ballHitPaddle, null, this);
  }

  //creates a player sprite
  createPlayer(playerInfo) {
    this.player = this.physics.add.sprite(playerInfo.x, playerInfo.y, 'player');
    this.player.enableBody = true;
    this.player.setCollideWorldBounds(true)
  }
  
  //adds players to otherPlayers physics group
  addOtherPlayers(playerInfo) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'player');
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
  }

  //called to indicate that the ball has been hit by the paddle and pass this info along with ball location data to the server side
  ballHitPaddle(paddle1, ball){
    ballFirstHit = true;
    var bottomSide;
    if (ball.body.y > 300) {
      bottomSide = true;
    } else if (ball.body.y <300) {
      bottomSide = false;
    }
    var ballLocation = {
      x: ball.body.x,
      y: ball.body.y,
      ifBottom:bottomSide
    };
    if(!notified) {
      this.socket.emit('ballHitPaddle', ballLocation);
      notified = true;
    }
  }

  //called when the game is ended
  endGame() {
    var endGameText = this.add.text(300, 300, 'Game Over!', { fill: '#fff' });
      if (bottom) {
        score = bottomScore;
      } else {
        score = topScore;
      }
      //HTTP get req to server for this player's high score currently saved
      $.ajax({
        type: 'GET',
        url: '/highScore',
        data: {
          playerId: this.player.playerId,
          refreshToken: getCookie('refreshJwt')
        },
        success: function(data) {
          console.log(data.score.highScore);
          var highScore = data.score.highScore;
          //updates this high score using POST req if the just finished game broke the player's record
          if (highScore < score) {
            console.log('need to update');
            $.ajax({
              type: 'POST',
              url: '/updateScore',
              data: {
                score,
                refreshToken: getCookie('refreshJwt')
              },
              success: function(data) {console.log('succeeded in update')},
              error: function(xhr) {
                console.log(xhr);
              }
            })
          } else {
            console.log('do not update');
          }
        },
        error: function(xhr) {
          console.log(xhr);
        }
      })
      //returns scoreboard page using another GET req
      $.ajax({
        type: 'GET',
        url: '/scoreboard',
        data: {
          refreshToken: getCookie('refreshJwt')
        }, success: function(data) { window.location.replace('/scoreboard.html');},
        error: function(xhr) {
          console.log(xhr);
        }
      })
  }

  //called repeatedly during game execution
  update(time,delta) {
    //if a user has an excess of more than 5 points the game ends
    if (bottomScore - topScore > 5 || topScore-bottomScore > 5) {
      if (!gameWon) {
        gameWon = true;
        this.gameOver();
      }
    }
    if (ball) {
      //if the ball passes the bounds pointWon is false (meaning it hasn't been accounted for)
      if (ball.body.y > 50 && ball.body.y < 550) {
        pointWon = false;
      }
      //asks for ball's location from server
      this.socket.emit('ballLocation');
      //if the ball is past the bounds then it is checked that it's not because the ball overlaps with a paddle, and if not sends the signal that a point was won to the server and restarts the ball
      if (ball.body.y <= 15) {
        var clear = true;
        if (!((ball.body.x < this.player.x-40)||(ball.body.x > this.player.x+40))) {
          clear = false;
          console.log('not clear');
        }
        this.otherPlayers.getChildren().forEach(function (player) {
          if (!((ball.body.x < player.x - 40)||(ball.body.x > player.x+40))) {
            clear = false;
            console.log('not clear');
          }
        });
        if (clear) {
          this.socket.emit('pointWon');
          this.socket.emit('ballRestart',{x:0,y:250, currentY: ball.body.y, bottom: true});
          console.log('restarting');
        }
      } else if (ball.body.y >= 570) { //same as above for the other bound
        var clear = true;
        if (!((ball.body.x < this.player.x-25)||(ball.body.x > this.player.x+25))) {
          clear = false;
          console.log('not clear');
        }
        this.otherPlayers.getChildren().forEach(function (player) {
          if (!((ball.body.x < player.x - 25)||(ball.body.x > player.x+25))) {
            clear = false;
            console.log('not clear');
          }
        });
        if (clear) {
          this.socket.emit('pointWon');
          this.socket.emit('ballRestart',{x:0,y:250, currentY: ball.body.y, bottom: true});
          console.log('restarting');
        }
      }
    }
    if (this.player) {
      var x = this.player.x;
      //updates player position according to their movements
      if (this.player.oldPosition && x!= this.player.oldPosition.x) {
        this.socket.emit('playerMovement', x);
      }
      this.player.oldPosition = {
        x: this.player.x,
      };
    }

    //gets player input and updates player location
    if (cursors.left.isDown) {
      this.player.x -= delta/4;
    } else if (cursors.right.isDown) {
      this.player.x += delta/4;
    } 
    //updates ball position according to saved data from websocket
    if (updateX && updateY) {
      ball.setPosition(updateX,updateY);
      ballX=updateX;
      ballY=updateY;
    }
  }

  //signals to socket that the game is over
  gameOver() {
    this.socket.emit('gameOver');
    console.log('game is ending');
  }
}
//game set up info
var config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 0
      },
      debug: true // set to true to view zones
    }
  },
  scene: [
    BootScene,
    WorldScene
  ]
};
//game initialization
var game = new Phaser.Game(config);
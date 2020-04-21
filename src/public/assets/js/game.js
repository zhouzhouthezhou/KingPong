/* Adapted from https://phasertutorials.com/how-to-create-a-phaser-3-mmorpg-part-1/ */
class BootScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'BootScene',
      active: true
    });
  }

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

class WorldScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'WorldScene'
    });
  }

  create() {
    notified = false;
    ballFirstHit = false;
    ready = false;
    this.socket = io();

    this.otherPlayers = this.physics.add.group();
    
    this.cursors = this.input.keyboard.createCursorKeys();

    gameWon = false;
    
    topScore =0;
	  topScoreText = this.add.text(16,13,'Score: 0', {fontSize: '32px',fill:'#FFF'});
	  bottomScore =0;
    bottomScoreText = this.add.text(16,559, 'Score: 0', {fontSize: '32px',fill:'#FFF'});

    // listen for web socket events
    this.socket.on('updatedBall', function(ballInfo) {
      updateX = ballInfo.x;
      updateY = ballInfo.y;
      //console.log('ball was updated:', updateX, updateY);
    }.bind(this));

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
  
    this.socket.on('newPlayer', function (playerInfo) {
      this.addOtherPlayers(playerInfo);
    }.bind(this));

    this.socket.on('disconnect', function (playerId) {
      this.otherPlayers.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
          player.destroy();
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('playerMoved', function (playerInfo) {
      this.otherPlayers.getChildren().forEach(function (player) {
        if (playerInfo.playerId === player.playerId) {
          player.setPosition(playerInfo.x, playerInfo.y);
        }
      }.bind(this));
    }.bind(this));
    //new
    this.socket.on('newBall', function(ballInfo) {
      this.createBall(ballInfo);
    }.bind(this));

    this.socket.on('ballMoved', function (movementData) {
      if(ball) {
        ball.setPosition(movementData.x, movementData.y);
      }
    }.bind(this));

    this.socket.on('firstPlayer', function(id) {
      firstID = id;
      console.log('first: ',id);
    }.bind(this));

    this.socket.on('secondPlayer', function(id) {
      secondID = id;
      console.log('second: ',id);
    }.bind(this));

    this.socket.on('highScore', function(highScore) {
      if(score > highScore.highScore) {
        console.log('higher');
      } else {
        console.log('lower');
      }
    }.bind(this));

    this.socket.on('buttonGone', function () {
      clickButton.destroy();
    }.bind(this));

    this.socket.on('autoRestart', function(velocity) {
      if (ball) {
        ballFirstHit = false;
        ball.setPosition(400,250);
        ball.setVelocity(velocity.x,velocity.y);
      }
    }.bind(this));

    this.socket.on('ballHit', function(velocity) {
      offset=velocity.offsetProduced;
      direction=velocity.directionProduced;
      //console.log('received');
      ready = true;
    }.bind(this));

    this.socket.on('gameEnded', function() {
      this.endGame();
    }.bind(this)); 

    this.socket.on('switch', function() {
      notified = false;
    }.bind(this));

    cursors = this.input.keyboard.createCursorKeys();
    clickButton = this.add.text(300, 300, 'Click me to begin game!', { fill: '#fff' })
      .setInteractive()
      .on('pointerdown', () => this.beginGame() );
  }
  beginGame() {
    this.socket.emit('createBall');
    this.timedEvent = this.time.addEvent({
      delay: 60000,
      callback: console.log('done time'),//this.gameOver(),
      callbackScope: this,
      loop: false
    });
    this.socket.emit('destroyButton');
    clickButton.destroy();
  }
  createBall(ballInfo) {
    ball = this.physics.add.sprite(ballInfo.x,ballInfo.y,'ball').setScale(0.5);    
    ball.enableBody = true;    
    ball.setVelocity(0,-250);
    ball.allowRotation = true;
    ball.setCollideWorldBounds(true);
    //this.physics.add.overlap(this.player, ball, this.ballHitPaddle, null, this);
  }

  createPlayer(playerInfo) {
    // our player sprite created through the physics system
    this.player = this.physics.add.sprite(playerInfo.x, playerInfo.y, 'player'/*, 6*/);
    this.player.enableBody = true;
    this.player.setCollideWorldBounds(true)


  }
  
  addOtherPlayers(playerInfo) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'player'/*, 9*/);
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
  }
  randomNum(min, max){
	  return Math.random() * (max - min) + min;
  }

  randomInt(min, max){
	  return Math.floor(Math.random() * (max - min)) + min;
  }

//all below is new
  ballHitPaddle(paddle1, ball){
    // var ballInfo = {
    //   x: ball.body.x,
    //   y: ball.body.y,
    //   xVel: ball.body.velocity.x,
    //   yVel: ball.body.velocity.y
    // };
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
    // while(!ready) {
    //   console.log('waiting');
    // }
    // console.log('offset:',offset,'direction:',direction);
	  // var speedCoefficient = -1.01


	  // if(direction == 0){
		//   ball.setVelocity((ballInfo.xVel+offset), speedCoefficient*ballInfo.yVel);
	  // }else{
		//   ball.setVelocity(-1*(ballInfo.xVel+offset), speedCoefficient*ballInfo.yVel);
    // }
    // ready = false;
    //console.log('hit');
  }

  endGame() {
    console.log('ending game')
      gameWon = true;
      if (bottom) {
        score = bottomScore;
      } else {
        score = topScore;
      }
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

  update(time,delta) {
    if (ball) {
      if (ballFirstHit) {
        this.socket.emit('ballLocation');
      } else {
        this.socket.emit('diffBallLocation');
      }
      if (ball.body.y <= 60) {
        if (ball.body.x >= this.player.x -75) {
          if(ball.body.x <= this.player.x +75) {
            // console.log('hit');
            ballFirstHit = true;
            var ballLocation = {
              x: ball.body.x,
              y: ball.body.y,
            };
            if (!notified) {
              this.socket.emit('ballHitPaddle', ballLocation);
              notified = true;
            }
          }
        }

      } else if (ball.body.y >= 540) {
        if (ball.body.x >= this.player.x -75) {
          if(ball.body.x <= this.player.x +75) {
            console.log('hit');
            ballFirstHit = true;
            var ballLocation = {
              x: ball.body.x,
              y: ball.body.y,
            };
            if (!notified) {
              this.socket.emit('ballHitPaddle', ballLocation);
              notified = true;
            }
          }
        }
      }
      // var x = ball.x;
      // var y = ball.y;
      // if (ballOldPosition && (x != ballOldPosition.x || y != ballOldPosition.y)) {
      //   // if ((this.socket.id == firstID) && y >= 250) {
      //   //   this.socket.emit('ballMovement', {x,y});
      //   // } else if ((this.socket.id == secondID && y< 250)) {
      //     this.socket.emit('ballMovement', {x,y});
      //  // }
      // }
      // ballOldPosition = {
      //   x: ball.x,
      //   y: ball.y
      // }
      // if (ballY <= 30/*15*/) {
      //   // ball.setPosition(400,250);
      //   // ball.setVelocity(0,250);
      //   // if (this.socket.id == secondID) {
      //   //   this.socket.emit('ballRestart', {x:0,y:250});
      //   // }
      //   this.socket.emit('ballRestart',{x:0,y:250});
      //   bottomScore++;
      //   bottomScoreText.setText('Score: ' + bottomScore);
      // } else if (ballY >= 570) {
      //   // ball.setPosition(400,250);
      //   // ball.setVelocity(0,-250);
      //   // if (this.socket.id == firstID) {
      //   //   this.socket.emit('ballRestart', {x:0,y:250});
      //   // }
      //   this.socket.emit('ballRestart',{x:0,y:-250});
      //   topScore++;
      //   topScoreText.setText('Score: ' + topScore);
      // }
      this.check();
    }
    if (this.player) {
      var x = this.player.x;
      if (this.player.oldPosition && x!= this.player.oldPosition.x) {
        this.socket.emit('playerMovement', x);
      }
      this.player.oldPosition = {
        x: this.player.x,
      };
    }

    if (cursors.left.isDown) {
      this.player.x -= delta/4;
    } else if (cursors.right.isDown) {
      this.player.x += delta/4;
    } 
    if (updateX && updateY) {
      ball.setPosition(updateX,updateY);
      ballX=updateX;
      ballY=updateY;
      console.log(ballX,ballY);
    }
  }

  gameOver() {
    this.socket.emit('gameOver');
  }
  
  check() {
    if (this.player.y == 50) {
      if ((ball.body.y <=50)&&((ball.body.x < (this.player.x - 75)) ||(ball.body.x> (this.player.x+75)))) {
        this.socket.emit('ballRestart',{x:0,y:250});
        bottomScore++;
        bottomScoreText.setText('Score: ' + bottomScore);
      }
    } else {
      if((ball.body.y >= 550) && ((ball.body.x < (this.player.x - 75)) || (ball.body.x > (this.player.x+75)))) {
        this.socket.emit('ballRestart',{x:0,y:250});
        topScore++;
        topScoreText.setText('Score: ' + topScore);
      }
    }
  }
}

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
var game = new Phaser.Game(config);

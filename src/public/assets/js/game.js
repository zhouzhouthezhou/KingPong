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
class WorldScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'WorldScene'
    });
  }

  create() {
    this.socket = io();

    this.otherPlayers = this.physics.add.group();
    
    this.cursors = this.input.keyboard.createCursorKeys();

    gameWon = false;
    
    topScore =0;
	  topScoreText = this.add.text(16,13,'Score: 0', {fontSize: '32px',fill:'#FFF'});
	  bottomScore =0;
    bottomScoreText = this.add.text(16,559, 'Score: 0', {fontSize: '32px',fill:'#FFF'});
      
    // listen for web socket events
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
      console.log('new ball @', ballInfo.x, ballInfo.y);
      this.createBall(ballInfo);
    }.bind(this));

    this.socket.on('ballMoved', function (movementData) {
      console.log('ball moved');
      if(ball) {
        ball.setPosition(movementData.x, movementData.y);
      } else {
        var ballInfo = {
          x: movementData.x,
          y: movementData.y,
        }
        this.createBall(ballInfo);
      }
    }.bind(this));

    this.socket.on('highScore', function(highScore) {
      if(score > highScore.highScore) {
        console.log('higher');
      } else {
        console.log('lower');
      }
    }.bind(this));
    cursors = this.input.keyboard.createCursorKeys();

    this.timedEvent = this.time.addEvent({
      delay: 60000,
      callback: this.endGame,
      callbackScope: this,
      loop: false
    });
  }
  
  createBall(ballInfo) {
    ball = this.physics.add.sprite(ballInfo.x,ballInfo.y,'ball').setScale(0.5);    
    ball.enableBody = true;    
    ball.setVelocity(0,250);
    ball.allowRotation = true;
    ball.setCollideWorldBounds(true);
    this.physics.add.overlap(this.player, ball, this.ballHitPaddle, null, this);
  }
  createPlayer(playerInfo) {
    // our player sprite created through the physics system
    this.player = this.add.sprite(playerInfo.x, playerInfo.y, 'player'/*, 6*/);
    this.player.enableBody = true;

  }
  
  addOtherPlayers(playerInfo,) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'player'/*, 9*/);
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
  }

//all below is new
  ballHitPaddle(paddle1, ball){
    console.log('hit');
	  var x = ball.body.velocity.x;
	  var y = ball.body.velocity.y;

	  var offset = randomNum(-100, 100);
	  var direction = randomInt(0, 2);
	  var speedCoefficient = -1.01


	  if(direction == 0){
		  ball.setVelocity((x+offset), speedCoefficient*y)
	  }else{
		  ball.setVelocity(-1*(x+offset), speedCoefficient*y)
	  }
  }

  randomNum(min, max){
	  return Math.random() * (max - min) + min;
  }

  randomInt(min, max){
	  return Math.floor(Math.random() * (max - min)) + min;
  }

  endGame() {
    if (!gameWon) {
      gameWon = true;
      console.log('here');
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
    }
  }

  update(time,delta) {
    if (ball) {
      var x = ball.x;
      var y = ball.y;
      if (ballOldPosition && (x != ballOldPosition.x || y != ballOldPosition.y)) {
        this.socket.emit('ballMovement',{x,y});
      }
      ballOldPosition = {
        x: ball.x,
        y: ball.y
      }
      if (y <= 15) {
        ball.setPosition(400,250);
        ball.setVelocity(0,250);
        bottomScore++;
        bottomScoreText.setText('Score: ' + bottomScore);
      } else if (y >= 570) {
        ball.setPosition(400,250);
        ball.setVelocity(0,-250);
        topScore++;
        topScoreText.setText('Score: ' + topScore);
      }
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

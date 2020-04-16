class BootScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'BootScene',
      active: true
    });
  }

  preload() {
    this.load.image('ball', 'assets/images/ball.png');
    this.load.spritesheet('player', 'assets/images/paddle.png', {
      frameWidth: 50,
      frameHeight: 50
    });
  }

  create() {
    this.scene.start('WorldScene');
  }
}

var cursors;
var balls = [];
class WorldScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'WorldScene'
    });
  }

  create() {
    this.socket = io();

    this.otherPlayers = this.physics.add.group();

    this.totalBalls = this.physics.add.group({
      classType: Phaser.GameObjects.Sprite
    });
    
    this.cursors = this.input.keyboard.createCursorKeys();
  
    // listen for web socket events
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === this.socket.id) {
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
      const ball = this.physics.add.sprite(ballInfo.x,ballInfo.y,'ball').setScale(0.5);    
      ball.enableBody = true;    
      ball.setVelocity(0,250);
      ball.allowRotation = true;
      ball.setCollideWorldBounds(true);
      this.physics.add.overlap(this.player,ball, this.ballHitPaddle, null, this);
      //this.container.add(ball);
      balls.push(ball);
      //this.totalBalls.add(ball);
    }.bind(this));

    cursors = this.input.keyboard.createCursorKeys();
  }
  
  createPlayer(playerInfo) {
    // our player sprite created through the physics system
    this.player = this.add.sprite(playerInfo.x, playerInfo.y, 'player'/*, 6*/);
    this.player.enableBody = true;
    //this.container = this.add.container(playerInfo.x, playerInfo.y);
    //this.container.setSize(16, 16);
    // this.physics.world.enable(this.container);
    // this.container.add(this.player);
  
    // don't go out of the map
    //this.container.body.setCollideWorldBounds(true);

  }
  
  addOtherPlayers(playerInfo) {
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
  update(time,delta) {
    for (var i = 0; i < balls.length; i++) {
      console.log(i);
      if (balls[i].y  == this.player.y) {
        console.log('here');
      }
    }
    if (this.player) {
      var x = this.player.x;
      var y = this.player.y;
      if (this.player.oldPosition && (x!= this.player.oldPosition.x || y != this.player.oldPosition.y)) {
        this.socket.emit('playerMovement', {x,y});
      }
      this.player.oldPosition = {
        x: this.player.x,
        y: this.player.y
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
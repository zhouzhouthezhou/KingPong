var config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 }
		}
	},
	scene: {
		preload: preload,
		create: create,
		update: update
	}
};
var game = new Phaser.Game(config);
var cursors;
var paddle;
var ball;
var x;

function preload ()
{
	/*
	this.load.image('ball', 'assets/ball.png')
	this.load.image('paddle', 'assets/paddle.png');
	*/
}

function create ()
{
	/*
	paddle = this.physics.add.sprite(400, 500, 'paddle');
	paddle.setCollideWorldBounds(true);
	paddle.setImmovable(true);
	cursors = this.input.keyboard.createCursorKeys();
	ball = this.physics.add.sprite(400,20,'ball').setScale(0.5);
	ball.setVelocity(0,250);
	ball.setBounce(2);
	this.physics.add.collider(paddle,ball);
	*/
}
function update ()
{
/*
  if (cursors.left.isDown)
  {
	  paddle.setVelocityX(-200);
  }
  else if (cursors.right.isDown)
  {
	  paddle.setVelocityX(200);
  }
  else
  {
	  paddle.setVelocityX(0);
  }
  */
}
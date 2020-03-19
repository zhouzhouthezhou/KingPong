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
var paddle1;
var paddle2;
var ball;
var x;

function preload (){
	this.load.image('ball', '../assets/ball.png')
	this.load.image('paddle1', '../assets/paddle.png');
	this.load.image('paddle2', '../assets/paddle.png');
}

function create (){
	//create paddle1
	paddle1 = this.physics.add.sprite(400, 500, 'paddle1');
	paddle1.enableBody = true;
	paddle1.setCollideWorldBounds(true);
	paddle1.setImmovable(true);

	//create paddle2
	paddle2 = this.physics.add.sprite(400, 100, 'paddle2');
	paddle2.enableBody = true;
	paddle2.setCollideWorldBounds(true);
	paddle2.setImmovable(true);

	//create ball
	ball = this.physics.add.sprite(400,250,'ball').setScale(0.5);
	ball.enableBody = true;
	ball.setVelocity(0,250);
	ball.allowRotation = true;
	//ball.setBounce(1.4);

	//add collision boxes
	this.physics.add.overlap(paddle1, ball, ballHitPaddle, null, this)
	this.physics.add.overlap(paddle2, ball, ballHitPaddle, null, this)
	//this.physics.add.collider(paddle1, ball)
	//this.physics.add.collider(paddle2, ball)

	//initialize keyboard control
	cursors = this.input.keyboard.createCursorKeys();
}
function update (){
	if (cursors.left.isDown){
		paddle1.setVelocityX(-200);
		paddle2.setVelocityX(-200);
	}else if (cursors.right.isDown){
		paddle1.setVelocityX(200);
		paddle2.setVelocityX(200);
	}else{
		paddle1.setVelocityX(0);
		paddle2.setVelocityX(0);
	}
}

function ballHitPaddle(paddle1, ball){
	var x = ball.body.velocity.x;
	var y = ball.body.velocity.y;

	var offset = randomNum(-100, 100);
	var direction = randomInt(0, 2);
	var speedCoefficient = -1.05


	if(direction == 0){
		ball.setVelocity((x+offset), speedCoefficient*y)
	}else{
		ball.setVelocity(-1*(x+offset), speedCoefficient*y)
	}
}

function randomNum(min, max){
	return Math.random() * (max - min) + min;
}

function randomInt(min, max){
	return Math.floor(Math.random() * (max - min)) + min;
}
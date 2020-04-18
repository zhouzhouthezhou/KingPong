var width = 1000;
var height = 1000;
var centerX = width/2;
var centerY = height/2;

var config = {
	type: Phaser.AUTO,
	width: width,
	height: height,
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
var ngon;
var polygon;
var cursors;
var ball;

function preload (){
	this.load.image('ball', '../assets/ball.png')
}

var counter = 10;
function create (){
	ngon = this.add.graphics({ x: 0, y: 0 });
	generateGon(counter, ngon);

	ball = this.physics.add.sprite(400,250,'ball').setScale(0.2);    
	ball.enableBody = true;    
	ball.setVelocity(0,250);
	ball.allowRotation = true;
	ball.setCollideWorldBounds(true);

	cursors = this.input.keyboard.createCursorKeys();
}


function update (){
	//if(Phaser.Input.Keyboard.JustDown(cursors.left)){
		//if(counter == 10){
			//counter = 3;
		//}else{
			//counter++;
		//}
		//ngon.clear()
		//generateGon(counter, ngon);
	//}else if(Phaser.Input.Keyboard.JustDown(cursors.right)){
		//if(counter == 3){
			//counter = 10;
		//}else{
			//counter--;
		//}
		//ngon.clear();
		//generateGon(counter, ngon);
	//}

	if(!Phaser.Geom.Polygon.Contains(polygon, ball.x, ball.y)){
		ball.destroy()
		counter--;
		ngon.clear()
		generateGon(counter, ngon)
	}
}

function generateGon(n, graphics){
	var verticies = [];
	var scale = 300;
	var angle = (2*Math.PI)/n;

	for(i = 1; i <= n; i++){
		h = i * angle;
		var x = (scale * Math.cos(h)) + centerX;
		var y = (scale * Math.sin(h)) + centerY;
		verticies.push(x);
		verticies.push(y);
	}

	polygon = new Phaser.Geom.Polygon(verticies);


	graphics.lineStyle(2, 0x00aa00);
	graphics.strokePoints(polygon.points, true);

	//graphics.beginPath();

	//graphics.moveTo(polygon.points[0].x, polygon.points[0].y);

	//for (var i = 1; i < polygon.points.length; i++)
	//{
		//graphics.lineTo(polygon.points[i].x, polygon.points[i].y);
	//}

	//graphics.closePath();
	//graphics.strokePath();
	return graphics
}
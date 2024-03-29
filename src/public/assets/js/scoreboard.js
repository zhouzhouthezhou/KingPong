/* This is from: https://phasertutorials.com/creating-a-phaser-3-leaderboard-with-user-authentication-using-node-js-express-mongodb-part-1/ */
let game, scores;

class Highscore extends Phaser.Scene {

  constructor() {
    super({
      key: 'Highscore',
      active: true
    });

    this.scores = [];
  }

  preload() {
    this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml');
  }

  create() {
    this.add.bitmapText(100, 110, 'arcade', 'RANK  SCORE   NAME').setTint(0xffffff);

    for (let i = 1; i < 6; i++) {
      if (scores[i-1]) {
        var score = scores[i-1].highScore;
        this.add.bitmapText(100, 160 + 50 * i, 'arcade', ` ${i}      ${Math.floor(score)}   ${scores[i-1].name}`).setTint(0xffffff);
      } else {
        this.add.bitmapText(100, 160 + 50 * i, 'arcade', ` ${i}      0    ---`).setTint(0xffffff);
      }
    }
  }
}

let config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1000,
  height: 600,
  pixelArt: true,
  scene: [Highscore]
};

$.ajax({
  type: 'GET',
  url: '/scores',
  success: function(data) {
    game = new Phaser.Game(config);
    scores = data;
  },
  error: function(xhr) {
    console.log(xhr);
  }
});

# KingPong
**Battle Royal Pong**

Welcome to KingPong, the battle royal pong game. Join into an open online game with a growing n-gon of pong madness. Everyone starts defending their own side of the n-gon. When somone lets a ball through, they get removed from the arena and the n-gon turns into a (n-1)-gon. Survive until the end to become the king of pong.

#### Authors
* Antonio Narro
* Kyle Zhou
* Emma Goodwill
* Andres Varela
* Connor Adams
* Talon Knowlton

# Documentation
This project is based around a NodeJS server, described in `src/kingPong.js`, and the Phaser 3 game framework. To launch the server run the command `node kingPong.js` while in the  `src` directory and navigate to the url that is output into the console in your favorite web browser.

The main game driver is stored under `src/scripts/game.js` and is rendered by the index html file which can be found uner `src/views/index.html`. Example snippets of functionality can be found under the `src/examples` directory.

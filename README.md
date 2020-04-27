# KingPong

King Pong is an online multiplayer pong game. You log into a game with other people on one of two teams. The objective is simple, to defend your side from the ball. The opposing team will score a point if your team lets the ball through. If they get 5 points ahead of you, you lose and the game ends. We will then rank you on a global leaderboard.

#### Authors
* Antonio Narro
* Kyle Zhou
* Emma Goodwill
* Andres Varela
* Connor Adams
* Talon Knowlton

# Overview
King Pong uses NodeJS as the server infrastructure to create a standard RESTful site and Websocket.io inorder to implement the server-client interaction and enable different people to create different instances of the same game. The game itself was created using the Phaser 3 JavaScript game engine. We used MongoDB as the database architecture to store login information and highest score. The mongooseAPI was used to query from the database and generate the rankings for the leaderboard. The app was then deployed to Heroku for the public to enjoy. 

# Documentation
Access using https://king-pong-csci3308.herokuapp.com/ your favorite web browser and wait for a friend (or foe) to join.

NodeJS script and websocket.io implementation can be found under ``/src/app.js``.

Game scripts and assets can be found under ``/src/public/game.html`` and ``/src/public/assets`` respectively.

Signup, scorboard, and landing pages can befound in ``/src/public`` under their respective files.

Test cases can befound through out the commit history and in the ``ngondev`` branch under ``src/examples`` and ``src/scripts``

Experimental N-gon implementation can also be found in the ``ngondev`` branch.


# Resources Referenced/Used for This Game
* https://phasertutorials.com/how-to-create-a-phaser-3-mmorpg-part-1/
* https://phasertutorials.com/creating-a-phaser-3-leaderboard-with-user-authentication-using-node-js-express-mongodb-part-1/
* https://stackoverflow.com/questions/42159175/connecting-heroku-app-to-atlas-mongodb-cloud-service
* https://www.youtube.com/watch?v=imR9LlbG3pU
* https://stackoverflow.com/questions/596467/how-do-i-convert-a-float-number-to-a-whole-number-in-javascript
* https://www.freecodecamp.org/forum/t/node-app-on-heroku-getting-application-error/170632
* https://www.youtube.com/watch?v=N42pkl-aIIQ
* https://stackoverflow.com/questions/15486687/websockets-nodejs-is-it-possible-to-broadcast-a-message-to-all-connected-client
* https://photonstorm.github.io/phaser3-docs/Phaser.Time.TimerEvent.html
* https://phasertutorials.com/creating-a-simple-multiplayer-game-in-phaser-3-with-an-authoritative-server-part-3/
* https://phaser.io/tutorials/making-your-first-phaser-3-game/
* https://phaser.io/docs/2.4.4/Phaser.Physics.Arcade.Body.html#newVelocity
* https://phaser.discourse.group/t/help-my-text-doesnt-show-up/1336
* https://snowbillr.github.io/blog/2018-07-03-buttons-in-phaser-3/
* https://snowbillr.github.io/blog/2018-07-03-buttons-in-phaser-3/
* https://docs.atlas.mongodb.com/security-whitelist/
* https://thecodebarbarian.com/how-find-works-in-mongoose
* https://mongoosejs.com/docs/api.html#model_Model.find
* https://socket.io/docs/emit-cheatsheet/
* https://www.joshmorony.com/phaser-fundamentals-handling-collisions/
* https://phaser.io/examples/v2/time/elapsed-seconds
* https://medium.com/@qingweilim/how-do-multiplayer-games-sync-their-state-part-1-ab72d6a54043
* https://kb.objectrocket.com/mongo-db/mongoose-findone-with-multiple-conditions-935
* https://www.curtismlarson.com/blog/2016/05/11/mongoose-mongodb-exclude-select-fields/
* https://photonstorm.github.io/phaser3-docs/Phaser.Time.Clock.html
* https://docs.mongodb.com/manual/reference/method/db.collection.find/
* https://stackoverflow.com/questions/6095530/maximum-call-stack-size-exceeded-error
* https://phaser.io/examples/v2/time/custom-timer
* https://mongoosejs.com/docs/tutorials/findoneandupdate.html
* https://github.com/Automattic/mongoose/issues/7392
* https://www.tutorialspoint.com/nodejs/nodejs_response_object.htm
* https://github.com/Automattic/mongoose/issues/688
* https://www.html5gamedevs.com/topic/20931-uncaught-typeerror-cannot-set-property-text-of-undefined/
* https://stackoverflow.com/questions/41318354/mongodb-failed-to-connect-to-server-on-first-connect/48449732
Generally: 
* https://phaser.io/
* https://medium.com/

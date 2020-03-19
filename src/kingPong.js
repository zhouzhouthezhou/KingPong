//const http = require('http');
const express = require('express');
//const path = require('path');
const app = express();
//const fs = require('fs');
var server = require('http').Server(app);


//app.set('views', __dirname + '/views');
//app.engine('html', engine.mustache);
//app.set('view engine', 'html');
//app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(__dirname + '/'));

const hostname = '127.0.0.1';
const port = 3000;

/*const server = http.createServer((req, res) => { res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});*/

/*app.get('/', function(req, res) {
	res.render('views/index.html',{
		my_title:"King Pong"
	});
});*/

/*http.createServer(handleRequest).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});*/

app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});
 
/*server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});*/

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
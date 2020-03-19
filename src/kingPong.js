const express = require('express');
const app = express();
var server = require('http').Server(app);

const hostname = '127.0.0.1';
const port = 3000;

app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});
 
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
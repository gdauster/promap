var path = require('path');
var fs = require('fs');

require('babel-register');
console.log('compile server');
var Server = require('./server').Server;
console.log('server compiled');

var server = new Server(8082, '192.168.1.10');

server.use(__dirname + '/public/');

server.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});
server.get('/edit', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/edit.html'));
});

server.get('/js/main.js', function (req, res) {
  res.sendFile(path.join(__dirname + '/lib/main.js'));
});
server.get('/js/edit.js', function (req, res) {
  res.sendFile(path.join(__dirname + '/lib/edit.js'));
});

server.serve(function () {
  console.log('todo');
});
console.log('start listening');

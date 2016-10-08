/**
 * Very lite server system
 */

var express = require('express');
var socketio = require('socket.io');
var path = require('path');
var fs = require('fs');

require('babel-register');

var application = express();
var server = require('http').createServer(application);

var io = socketio.listen(server);
io.on('connection', function (socket) {
  console.log('connection establish');
});

application.use(express.static(__dirname + '/public/'));
application.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

application.get('/js/main.js', function (req, res) {
  res.sendFile(path.join(__dirname + '/lib/main.js'));
});

server.listen(8082, '127.0.0.1');

const express = require('express');
const socketio = require('socket.io');
const fs = require('fs');
const path = require('path');
const babel = require('babel-core');

const base = '/../mapping/',
      index = base + 'view/index.html';

class Server {
  constructor(port, ip) {
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.port = port;
    this.ip = ip;
    this.io = socketio.listen(this.server);
    this.sockets = [];
  }
  addStatic(folder) {
    this.app.use(express.static(folder));
  }
  handleURL(path, callback) {
    this.app.get(path, callback);
  }
  serve(callback) {
    this.io.on('connection', (socket) => {
      this.sockets.push(socket);
      // socket.on('disconnect', ...)
      callback(socket);
    });
    this.server.listen(this.port, this.ip);
  }
  compile(files, useBabel = false) {
    let content = '';
    for (let i = 0; i < files.length; i++)
      content += fs.readFileSync(__dirname + '/' + files[i] + '.js', 'binary');
    if (useBabel)
      return babel.transform(content, { presets: ['es2015'] }).code;
    return content
  }
}

// Create server instance, with specific port, ip
const configFile = fs.readFileSync(__dirname + '/../config.json', 'binary'),
      config = JSON.parse(configFile),
      server = new Server(config.port, config.ipaddr),
      files = [
        'utils', 'VisualModel', 'VisualModelUI', 'bbox',
      ],
      argv = process.argv.slice(2);

server.addStatic(__dirname + '/../mapping/public/');

// URLs to handle
server.handleURL('/', (req, res) => {
    res.sendFile(path.join(__dirname + index));
});

// register events, start listening
server.serve((socket) => {
    socket.on('ask.model', () => {
    });

    socket.emit('server.ok');
});

console.log('server ready');

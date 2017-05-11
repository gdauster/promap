const express = require('express');
const socketio = require('socket.io');
const fs = require('fs');
const path = require('path');
const babel = require('babel-core');


class Server {
  constructor(port, ip) {
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.port = port;
    this.ip = ip;
    this.io = socketio.listen(this.server);
    this.sockets = [];
    this.socketsByURL = {};
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

const base = '/../mapping/',
      index = base + 'view/index.html',
      editor = base + 'view/editor.html',
      projection = base + 'view/projection.html';

// Create server instance, with specific port, ip
const configFile = fs.readFileSync(__dirname + '/../config.json', 'binary'),
      config = JSON.parse(configFile),
      server = new Server(config.port, config.ipaddr),
      api = {
        editor: server.compile(['Client', 'variable', '../mapping/api/editor'], true),
        projection: server.compile(['Client', '../mapping/api/projection'], true),
      };

server.addStatic(__dirname + '/../mapping/public/');

// URLs to handle
server.handleURL('/', (req, res) => {
    res.sendFile(path.join(__dirname + index));
});

server.handleURL('/editor', (req, res) => {
    res.sendFile(path.join(__dirname + editor));
});

server.handleURL('/projection', (req, res) => {
    res.sendFile(path.join(__dirname + projection));
});

server.handleURL('/js/editor.js', (req, res) => {
  console.log('editor');
  api.editor = server.compile(['Client', 'variable', '../mapping/api/editor'], true);
  res.send(api.editor);
});

server.handleURL('/js/projection.js', (req, res) => {
  console.log('projection');
  api.projection = server.compile(['Client', '../mapping/api/projection'], true);
  res.send(api.projection);
});

// register events, start listening
server.serve((socket) => {

  socket.on('editor.status', (info) => {
    console.log(info);
  });

  socket.on('editor.send_rendered', (dataURL) => {
    console.log('send rendered');
    for (var i = 0; i < server.sockets.length; i++) {
      server.sockets[i].emit('projection.receive_rendered', dataURL);
    }
  })

  socket.emit('server.ok');
});

console.log('server ready');

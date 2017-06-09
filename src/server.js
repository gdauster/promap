const express = require('express');
const socketio = require('socket.io');
const fs = require('fs');
const path = require('path');
const babel = require('babel-core');
const WebSocket = require('ws');


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
      editor2 = base + 'view/editor2.html',
      projection = base + 'view/projection.html';

// Create server instance, with specific port, ip
const configFile = fs.readFileSync(__dirname + '/../config.json', 'binary'),
      config = JSON.parse(configFile),
      server = new Server(config.port, config.ipaddr),
      api = {
        editor: server.compile(['Client', 'variable', '../mapping/api/editor'], true),
        editor2: server.compile(['Client', '../mapping/api/WorkingSpace', '../mapping/api/editor2d'], true),
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

server.handleURL('/editor2', (req, res) => {
    res.sendFile(path.join(__dirname + editor2));
});

server.handleURL('/projection', (req, res) => {
    res.sendFile(path.join(__dirname + projection));
});

server.handleURL('/js/editor.js', (req, res) => {
  console.log('editor');
  api.editor = server.compile(['Client', 'variable', '../mapping/api/editor'], true);
  res.send(api.editor);
});

server.handleURL('/js/editor2d.js', (req, res) => {
  console.log('editor');
  api.editor2 = server.compile(['Client', '../mapping/api/WorkingSpace', '../mapping/api/editor2d'], true);
  res.send(api.editor2);
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

    console.log(new Date().getTime());
    console.time("serveur");
    console.log('send rendered');
    for (var i = 0; i < server.sockets.length; i++) {
      server.sockets[i].emit('projection.receive_rendered', dataURL);
    }
      console.timeEnd("serveur");
  })

  socket.emit('server.ok');
});

const wss = new WebSocket.Server({ port: 8090 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.send('something');
});

console.log('server ready');

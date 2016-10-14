let express = require('express');

/**
 * A simple server
 * @param {number} port - A port to connect to.
 * @param {string} ip - An IPV4 address the server will connect to.
 */
class Server {
  constructor(port, ip) {
    // ATTRIBUTES
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.io = require('socket.io')(this.server);
    this.sockets = []; // all client sockets

    this.port = port || '127.0.0.1';
    this.ip = ip || 8082;
  }
  /**
   * Warpper for express.static.
   * @param {string} folder - Path to a folder to serve static files or
   * directory.
   */
  use(folder) {
    this.app.use(express.static(folder));
  }
  get(path, handleURL) {
    this.app.get(path, handleURL);
  }
  serve(onConnection) {
    this.io.on('connection', (socket) => {
      this.sockets.push(socket);
      socket.on('log.server', (msg) => { console.log(msg); });
      socket.on('disconnect', () => {
        this.sockets.splice(this.sockets.indexOf(socket), 1);
      });
      socket.emit('init.client');
      onConnection(socket);
    });
    // start listenning
    this.server.listen(this.port, this.ip);
  }
}
exports.Server = Server

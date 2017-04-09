
class Client {
    constructor() {
        this.socket = io();
        this.active = false;
        this.socket.on('server.ok', () => {
            this.active = true;
            this.ready();
        });
        this.type = 'basic'; // Basic Client
    }
    ready() {
      console.log(this.type);
    }
}

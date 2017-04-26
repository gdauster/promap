// projection

class Projection extends Client {
  constructor() {
    super();
  }
}

const _p = new Projection();

window.addEventListener("click", () => {
  _p.socket.emit('editor.status', 'coucou');
  console.log('proj');
}, false);

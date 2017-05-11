// projection

class Projection extends Client {
  constructor() {
    super();
    var canvas = document.createElement( 'canvas' );
    this.context = canvas.getContext( '2d' ); // 2048
    document.body.appendChild(canvas);
    canvas.width = 2048;
    canvas.height = 1024;
  }
  ready() {
    console.log('readyyyyyy');
    this.socket.on('projection.receive_rendered', (dataURL) => {
      const image = new Image();
      const ctx = this.context;
      image.onload = function(){
            ctx.drawImage(image, 0, 0);
};

      image.src = dataURL;
    });
  }
}

const _p = new Projection();

window.addEventListener("click", () => {
  _p.socket.emit('editor.status', 'coucou');
  console.log('proj');
}, false);

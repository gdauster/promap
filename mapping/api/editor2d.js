
const mouse = { x : 0, y : 0, fx : 0, fy : 0, isMousePressed : false };

class Editor2d extends Client {
  constructor() {
    super();
    this.container = document.createElement('canvas');
    document.body.appendChild(this.container);
    this.context = this.container.getContext( '2d' );
    this.container.width = window.innerWidth;
    this.container.height = window.innerHeight;

    this.spaces = [];

    // test
    this.addWorkingSpace(0, 0, 500, 500);
    this.spaces[0].space.addImage('img/car.jpg');
    this.spaces[0].space.render();
  }
  addWorkingSpace(x, y, width, height) {
    this.spaces.push({
      x, y, space : new WorkingSpace(width, height)
    });
  }
  events() {
    window.addEventListener('resize', (event) => {
      this.container.width = window.innerWidth;
      this.container.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (event) => {
      if (mouse.isMousePressed && this.spaces[0].space.fragments.length > 0) {
        const frag = this.spaces[0].space.fragments[0];
        frag.position.x = mouse.fx + event.clientX - mouse.x;
        frag.position.y = mouse.fy + event.clientY - mouse.y;
        this.spaces[0].space.render();
      }
    });
    window.addEventListener('mouseup', (event) => {
      mouse.isMousePressed = false;
    });
    window.addEventListener('mousedown', (event) => {
      mouse.isMousePressed = true;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (this.spaces[0].space.fragments.length > 0) {
        const frag = this.spaces[0].space.fragments[0];
        mouse.fx = frag.position.x;
        mouse.fy = frag.position.y;
      }
    });
  }

  // call when server is ready
  ready() {
    // start listening events
    this.events();
  }

  render() {
    const width = this.container.width;
    const height = this.container.height;
    const imagedata = this.context.getImageData(0, 0, width, height);
    for (var i = 0; i < imagedata.data.length; i++) {
      imagedata.data[i] = 125;
    }
    for (let x = 0; x < this.spaces[0].space.width; x++) {
      for (let y = 0; y < this.spaces[0].space.height; y++) {
        // Get the pixel index
        const pixelindex = ((y * width + x) * 4);
        const pixelindexBuf = ((y * this.spaces[0].space.width + x) * 4);

        // Set the pixel data
        imagedata.data[pixelindex] = this.spaces[0].space.mainBuffer[pixelindexBuf];     // Red
        imagedata.data[pixelindex+1] = this.spaces[0].space.mainBuffer[pixelindexBuf+1]; // Green
        imagedata.data[pixelindex+2] = this.spaces[0].space.mainBuffer[pixelindexBuf+2];  // Blue
        imagedata.data[pixelindex+3] = this.spaces[0].space.mainBuffer[pixelindexBuf+3];   // Alpha
      }
    }
    this.context.putImageData(imagedata, 0, 0);
  }
}

const _e2d = new Editor2d();

let start, progress, elapsed = 0, oldtime = 0;
const every_ms = 1000;

function animate(timestamp) {
  if (!start) start = timestamp;
  elapsed = timestamp - start;
  if (elapsed - oldtime > every_ms) {
    // insert code here
    oldtime = timestamp - start;
  }
  progress = timestamp - start;
  requestAnimationFrame(animate);
  // render the sceen on every frames
  _e2d.render();
}
// start animation
animate();

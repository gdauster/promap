
const mouse = { x : 0, y : 0, fx : 0, fy : 0, isMousePressed : false };
/*
class Editor2d extends Client {
  constructor() {
    super();
    this.container = document.createElement('canvas')
    this.container.style.position = "absolute";
    document.body.appendChild(this.container);
    this.context = this.container.getContext( '2d' );
    this.container.width = window.innerWidth;
    this.container.height = window.innerHeight;

    this.spaces = [];
    this.aKeyIsPressed = false;

    // test
    this.addWorkingSpace(0, 0, window.innerWidth, window.innerHeight);
    this.spaces[0].space.addImage('img/car.jpg');
    this.current = this.spaces[0].space;
  }
  addWorkingSpace(x, y, width, height) {
    this.spaces.push({
      x, y, space : new WorkingSpace(this.container)
    });
  }
  events() {
    window.addEventListener('resize', (event) => {
      this.container.width = window.innerWidth;
      this.container.height = window.innerHeight;
      this.current.resize(this.container.width, this.container.height);
    });

    window.addEventListener('wheel', (event) => {
        if (this.aKeyIsPressed) {
          this.current.current.addRotation(event.deltaY / 60);
          this.current.needsUpdate = true;
        } else {
          this.current.current.addZoom(event.deltaY / 600);
          this.current.needsUpdate = true;
        }
    });
    window.addEventListener('keydown', (event) => {
      this.aKeyIsPressed = true;
    });
    window.addEventListener('keyup', (event) => {
      this.aKeyIsPressed = false;
    });
    window.addEventListener('mousemove', (event) => {
      this.current.setMousePosition(event.clientX, event.clientY, 'move');
      if (mouse.isMousePressed && this.current.fragments.length > 0) {
        const frag = this.current.current;
        frag.position.x = mouse.fx + event.clientX - mouse.x;
        frag.position.y = mouse.fy + event.clientY - mouse.y;
        this.current.needsUpdate = true;
      }
    });
    window.addEventListener('mouseup', (event) => {
      this.current.setMousePosition(event.clientX, event.clientY, 'up');
      mouse.isMousePressed = false;
    });
    window.addEventListener('mousedown', (event) => {
      this.current.setMousePosition(event.clientX, event.clientY, 'down');
      if (event.clientX <= this.current.width || event.clientY <= this.current.height) {
        mouse.isMousePressed = true;
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        if (this.current.fragments.length > 0) {
          const frag = this.current.current;
          mouse.fx = frag.position.x;
          mouse.fy = frag.position.y;
        }
      }
    });
  }
  // call when server is ready
  ready() {
    // start listening events
    this.events();
  }

  render() {
    //this.current.renderLoop();
  }
}

const _e2d = new Editor2d();

// main animation loop
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
  _e2d.render();


  requestAnimationFrame(animate);
}
// start animation
animate();*/

const app = new PIXI.Application(800, 600, { backgroundColor : 0x1099bb });
document.body.appendChild(app.view);

const container = new PIXI.Container();
app.stage.addChild(container);

/*const perso = PIXI.Sprite.fromImage('img/perso.png');
perso.anchor.set(0.5);
perso.scale.set(0.2, 0.2);
perso.x = app.renderer.width / 2;
perso.y = app.renderer.height / 2;*/
const texture = PIXI.Texture.fromImage('img/perso.png');

for (var i = 0; i < 25; i++) {
    const perso = new PIXI.Sprite(texture);
    perso.anchor.set(0.5);
    perso.x = (i % 5) * 40;
    perso.scale.set(0.1, 0.1);
    perso.y = Math.floor(i / 5) * 40;
    container.addChild(perso);
}
container.x = app.renderer.width / 2;
container.y = app.renderer.height / 2;
container.pivot.x = container.width / 2;
container.pivot.y = container.height / 2;

app.ticker.add((delta) => {
  container.rotation += 0.01 * delta;
})

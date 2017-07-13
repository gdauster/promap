// editor
let SERVER_READY = false;

const PLANE_WIDTH = 16,
      PLANE_HEIGHT = 8,
      PLANE_SEG_WIDTH = 30,
      PLANE_SEG_HEIGHT = 15,
      CIRCLE_RADIUS = 3;

const PLANE_SEG_WIDTH1 = PLANE_SEG_WIDTH + 1,
      PLANE_SEG_HEIGHT1 = PLANE_SEG_HEIGHT + 1;

const PLANE_SLAB_HEIGHT =  PLANE_HEIGHT / PLANE_SEG_HEIGHT,
      PLANE_SLAB_HEIGHT_HALF = PLANE_SLAB_HEIGHT / 2;

const PLANE_SLAB_WIDTH =  PLANE_WIDTH / PLANE_SEG_WIDTH,
      PLANE_SLAB_WIDTH_HALF = PLANE_SLAB_WIDTH / 2;

const RADIUS_SQUARED = CIRCLE_RADIUS * CIRCLE_RADIUS;

let WS_OPEN = false;

const ws = new WebSocket('ws://127.0.0.1:8090');
ws.addEventListener('open', function (event) {
  WS_OPEN = true;
});

class Editor extends Client {
  constructor() {
    super();
    this.workingSpaceGeometry = new THREE.PlaneGeometry(
      PLANE_WIDTH, PLANE_HEIGHT, PLANE_SEG_WIDTH, PLANE_SEG_HEIGHT);
    this.uniforms = {
      resolution: { type: "f", value: PLANE_WIDTH / PLANE_HEIGHT },
      draw: { type: "f", value: -1 },
      mouse : { type: "v2", value: new THREE.Vector2 },
      control1 : { type: "fv1", value: [0, 0, 0, 0] },
      control2 : { type: "fv1", value: [0, 0, 0, 0] },
      control3 : { type: "fv1", value: [0, 0, 0, 0] },
      control4 : { type: "fv1", value: [0, 0, 0, 0] },
      texture: {type: 't', value: undefined}
    };
    this.workingSpace = undefined;

    // bezier curve manipulation
    this.deform = {
      abs1 : this.deformX(1/3), abs2 : this.deformX(2/3),
      ord1 : this.deformY(1/3), ord2 : this.deformX(2/3)
    }

    // data send
    this.sender = undefined;
    this.createSender();

    // manipulation layer for tools
    this.tools = document.createElement('canvas');
    container.appendChild(this.tools);
    this.tools.width = window.innerWidth;
    this.tools.height = window.innerHeight;
    this.tools.style.position = 'absolute';

    this.loadRessource('img/car.jpg');
    camera.position.z = 6;
  }
  createSender() {
    this.sender = {
      target: new THREE.WebGLRenderTarget(
        renderer.domElement.width, renderer.domElement.height),
      buffer: new Uint8Array(renderer.domElement.width * renderer.domElement.height * 4),
      size: [
        renderer.domElement.width, renderer.domElement.width >> 8,
        renderer.domElement.height, renderer.domElement.height >> 8
      ]
    }
  }
  /**
   * Any ressources loading, mostly for images.
   *
   */
  loadRessource(url) {
    const loader = new THREE.TextureLoader();
    const scope = this;

    loader.load(
      url,
      function (ressource) {
        scope.uniforms.texture.value = ressource;
        scope.workingSpace = new THREE.Mesh(
          scope.workingSpaceGeometry, new THREE.ShaderMaterial({
            uniforms: scope.uniforms,
            vertexShader: document.getElementById('zoomVertexShader').innerHTML,
            fragmentShader: document.getElementById('zoomFragmentShader').innerHTML
          }));
        scene.add(scope.workingSpace);
        scope.drawTools();
      },
      function (xhr) { // Function called when download progresses
        console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
      },
      function (xhr) { // Function called when download errors
        console.log( 'An error happened' );
      }
    );
  }
  deformX(position) {
    return {
      position,
      a: new THREE.Vector2(0, 0),
      b: new THREE.Vector2(0, 1/3),
      c: new THREE.Vector2(0, 2/3),
      d: new THREE.Vector2(0, 0)
    }
  }
  deformY(position) {
    return {
      position,
      a: new THREE.Vector2(0, 0),
      b: new THREE.Vector2(1/3, 0),
      c: new THREE.Vector2(2/3, 0),
      d: new THREE.Vector2(0, 0)
    }
  }
  sendUniforms() {
    const abs1 = this.deform.abs1;
    const abs2 = this.deform.abs2;
    const ord1 = this.deform.ord1;
    const ord2 = this.deform.ord2;
    this.uniforms.control1.value = [abs1.a.x, abs1.b.x, abs1.c.x, abs1.d.x];
    this.uniforms.control2.value = [abs2.a.x, abs2.b.x, abs2.c.x, abs2.d.x];
    this.uniforms.control3.value = [ord1.a.x, ord1.b.x, ord1.c.x, ord1.d.x];
    this.uniforms.control4.value = [ord2.a.x, ord2.b.x, ord2.c.x, ord2.d.x];
  }
  render(time) {
      raycaster.setFromCamera(mouse, camera);
      renderer.render(scene, camera);
  }
  drawTools() {
    const ctx = this.tools.getContext('2d');
    ctx.clearRect(0, 0, this.tools.width, this.tools.height);
    this.drawCornerTool(ctx);
  }
  drawCornerTool(ctx) {
    // draw square at corners
    const cornersIndexes = [
      0, // top left corner
      PLANE_SEG_WIDTH, // top right corner
      (PLANE_SEG_WIDTH + 1) * PLANE_SEG_HEIGHT, // bottom left corner
      this.workingSpace.geometry.vertices.length - 1 // bottom right corner
    ];

    for (var i = 0; i < cornersIndexes.length; i++) {
      // get position on screen
      const pos = this.workingSpace.geometry.vertices[cornersIndexes[i]];
      const vec = this.workingSpace.localToWorld(new THREE.Vector3(pos.x, pos.y,pos.z));
      vec.project(camera);

      // draw
      if (vec.x >= -1 && vec.x <= 1 && vec.y >= -1 && vec.y <= 1) {
        ctx.beginPath();
        ctx.fillStyle = '#00ff00';
        const posx = (vec.x + 1) * 0.5;
        const posy = (vec.y + 1) * 0.5;
        ctx.rect((posx) * this.tools.width - 5, (1 - posy) * this.tools.height - 5, 10, 10);
        ctx.fill();
      }
    }
  }
  sendData(sender) {
    if (WS_OPEN) {
      // render scene into renderTarget
      renderer.render( scene, camera, sender.target );

      // read buffer
      renderer.readRenderTargetPixels(sender.target, 0, 0,
                                      renderer.domElement.width,
                                      renderer.domElement.height, sender.buffer);

      // send data
      var blob = new Blob([sender.size, sender.buffer], {type: 'application/octet-binary'});
      ws.send(blob);
    }
  }
}
const _e = new Editor();

let start, progress, elapsed = 0, oldtime = 0;
//const every_ms = (1000/30);
const every_ms = 300;

function animate(timestamp) {
  if (!start) start = timestamp;
  elapsed = timestamp - start;
  if (elapsed - oldtime > every_ms) {
    //_e.sendData()
    oldtime = timestamp - start;
  }
  progress = timestamp - start;

  requestAnimationFrame(animate);
  // update elements
  // render the sceen on every frames
  _e.render(timestamp);
}
// start animation
animate();

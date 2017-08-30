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

/*const ws = new WebSocket('ws://127.0.0.1:8090');
ws.addEventListener('open', function (event) {
  WS_OPEN = true;
});*/

let currentCamera = camera1;
let camera1Setup = true;
let isClickPressed = false;
  const loader = new THREE.TextureLoader();

let maskToolRadius = 200;

class Editor extends Client {
  constructor() {
    super();
    this.workingSpaceGeometry = new THREE.PlaneGeometry(
      PLANE_WIDTH, PLANE_HEIGHT, PLANE_SEG_WIDTH, PLANE_SEG_HEIGHT);
    this.uniforms = {
      resolution: { type: "f", value: PLANE_WIDTH / PLANE_HEIGHT },
      draw: { type: "f", value: -1 },
      mouse : { type: "v2", value: new THREE.Vector2 },
      gesture : { type: "v2v", value: new Array(1000) },
      gcount : { type: "i", value: 0 },
      gradius : { type: "f", value: maskToolRadius },
      control1 : { type: "fv1", value: [0, 0, 0, 0] },
      control2 : { type: "fv1", value: [0, 0, 0, 0] },
      control3 : { type: "fv1", value: [0, 0, 0, 0] },
      control4 : { type: "fv1", value: [0, 0, 0, 0] },
      texture: {type: 't', value: undefined},
      mask: {type: 't', value: undefined}
    };
    for (var i = 0; i < this.uniforms.gesture.value.length; i++) {
      this.uniforms.gesture.value[i] = new THREE.Vector2();
    }
    this.workingSpace = undefined;

    // bezier curve manipulation
    this.deform = {
      abs1 : this.deformX(1/3), abs2 : this.deformX(2/3),
      ord1 : this.deformY(1/3), ord2 : this.deformX(2/3)
    }
    this.cornersNormalizedPosition = [];

    // data send
    this.sender = undefined;
    this.createSender();

    // manipulation layer for tools
    this.tools = document.createElement('canvas');
    container.appendChild(this.tools);
    this.tools.width = window.innerWidth;
    this.tools.height = window.innerHeight;
    this.tools.style.position = 'absolute';
    this.mask = document.createElement('canvas');
    controls = new THREE.OrbitControls( camera1, this.tools );
    //controls.addEventListener( 'change', render ); // remove when using animation loop
    // enable animation loop when using damping or autorotation
    //controls.enableDamping = true;
    //controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    this.loadRessource('img/car.jpg');
    camera1.position.z = 6;
    camera2.position.z = 6;
    this.createEvents();
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
  createEvents() {
    const scope = this;
    window.addEventListener('mousemove', (event) => {
      mouse3D.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5 );
      mouse3D.unproject(currentCamera);
      const dir = mouse3D.sub( currentCamera.position ).normalize();
      const distance = - currentCamera.position.z / dir.z;
      mouse3D = currentCamera.position.clone().add( dir.multiplyScalar( distance ) );
      mouse.set(
        ( event.clientX / window.innerWidth ),
        ( event.clientY / window.innerHeight ));

      if (mouse.isMousePressed && !camera1Setup) {
        if (!isClickPressed) {
          const deltax = mouse.down.x - mouse.x;
          const deltay = mouse.down.y - mouse.y;
          console.log(deltax, deltay);
          this.moveControlPointsAccordingToMousePosition(deltax, -deltay);
          mouse.down = new THREE.Vector2(mouse.x, mouse.y);
        } else {
          this.drawMaskAccordingToMousePosition();
        }
      }

    }, false);
    window.addEventListener('mousedown', (event) => {
      mouse.isMousePressed = true;
      mouse.down = new THREE.Vector2(mouse.x, mouse.y);
      this.prepareMoveControlPoints();
      if (!camera1Setup && isClickPressed)
        this.drawMaskAccordingToMousePosition();

    }, false);
    window.addEventListener('mouseup', (event) => {
      mouse.isMousePressed = false;
      mouse.down = new THREE.Vector2();
      if (isClickPressed) {
        this.maskNeedsUpdate(true);
      }
    }, false);
    window.addEventListener('keypress', (event) => {
      if (event.ctrlKey)
        isClickPressed = !isClickPressed;
    }, false);
    window.addEventListener('dblclick', (event) => {
      if (camera1Setup) {
        camera1Setup = false;
        currentCamera = camera2;
        controls.enabled = false;
      } else {
        camera1Setup = true;
        currentCamera = camera1;
        controls.enabled = true;
      }
    }, false);

  }
  /**
   * Any ressources loading, mostly for images.
   *
   */
  loadRessource(url) {
    const scope = this;

    loader.load(
      url,
      function (ressource) {
        scope.uniforms.texture.value = ressource;
        scope.uniforms.gradius.value = maskToolRadius / ressource.image.height;
        scope.mask.width = ressource.image.width;
        scope.mask.height = ressource.image.height;
        const ctx = scope.mask.getContext('2d');

        ctx.beginPath();
        ctx.fillStyle = '#ff0000';
        ctx.rect(0, 0, scope.mask.width, scope.mask.height);
        ctx.fill();

         loader.load(
          scope.mask.toDataURL(),
          function (rsc) {
            scope.uniforms.mask.value = rsc;
            scope.workingSpace = new THREE.Mesh(
              scope.workingSpaceGeometry, new THREE.ShaderMaterial({
                uniforms: scope.uniforms,
                vertexShader: document.getElementById('zoomVertexShader').innerHTML,
                fragmentShader: document.getElementById('zoomFragmentShader').innerHTML
              }));
            scene.add(scope.workingSpace);
            scope.workingSpace.material.transparent = true;
            scope.drawTools();
          }
        );
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
      values: [0, 0, 0, 0]
    }
  }
  deformY(position) {
    return {
      position,
      values: [0, 0, 0, 0]
    }
  }
  sendUniforms() {
    const abs1 = this.deform.abs1;
    const abs2 = this.deform.abs2;
    const ord1 = this.deform.ord1;
    const ord2 = this.deform.ord2;
    this.uniforms.control1.value = abs2.values;
    this.uniforms.control2.value = abs1.values;
    this.uniforms.control3.value = ord1.values;
    this.uniforms.control4.value = ord2.values;
  }
  render(time) {
      raycaster.setFromCamera(mouse, currentCamera);
      renderer.render(scene, currentCamera);
  }
  drawTools() {
    const ctx = this.tools.getContext('2d');
    ctx.clearRect(0, 0, this.tools.width, this.tools.height);
    this.cornersNormalizedPosition = this.drawCornerTool(ctx);
    //this.drawDeformTool(ctx, cornersNormalizedPosition);
  }
  drawDeformTool(ctx, cornersNormalizedPosition) {
    const tl_x = cornersNormalizedPosition[0].x;
    const tl_y = cornersNormalizedPosition[0].y;

    const abs_length = Math.abs(cornersNormalizedPosition[1].x - tl_x);
    const ord_length = Math.abs(cornersNormalizedPosition[3].y - tl_y);

    const scope = this;
    const step = 1/3;
    function drawControlPointsX(cp) {
      let posx = 0;
      for (var i = 0; i < cp.values.length; i++) {
        const val = cp.values[i];
        ctx.beginPath();
        ctx.fillStyle = '#0000ff';
        ctx.rect(
          (tl_x + abs_length * posx) * scope.tools.width - 5,
          (1 - tl_y + ord_length * (cp.position + val)) * scope.tools.height - 5, 10, 10);
        ctx.fill();
        posx += step;
      }
    }
    function drawControlPointsY(cp) {

    }
    drawControlPointsX(this.deform.abs1);
    //drawControlPointsX(this.deform.abs2);
    /*drawControlPoints(this.deform.ord1);
    drawControlPoints(this.deform.ord2);*/
  }
  prepareMoveControlPoints() {
    this.toRun = [];
    this.toRunHalf = [];
  }
  maskNeedsUpdate(force) {
    if (force || this.uniforms.gcount.value >= this.uniforms.gesture.value.length) {
      // flush
      const scope = this;
      loader.load(
        this.mask.toDataURL(),
        function (rsc) {
          console.log("mask update");
          scope.uniforms.mask.value = rsc;
          scope.uniforms.gcount.value = 0;
        }
      );
    }
  }
  drawMaskAccordingToMousePosition() {
    if (this.cornersNormalizedPosition.length > 0) {
      const tl_x = this.cornersNormalizedPosition[0].x;
      const tl_y = this.cornersNormalizedPosition[0].y;

      const abs = Math.abs(this.cornersNormalizedPosition[1].x - tl_x);
      const ord = Math.abs(this.cornersNormalizedPosition[3].y - tl_y);

      const px = (mouse.x - tl_x) / abs;
      const py = 1 + (mouse.y - tl_y) / ord;

      if (px < 0 || px > 1 || py < 0 || py > 1) return false;

      const ctx = this.mask.getContext('2d');

      ctx.beginPath();
      ctx.fillStyle = '#000000';
      ctx.arc(px * this.mask.width, py * this.mask.height, maskToolRadius, 0, 2 * Math.PI);
      ctx.fill();

      this.uniforms.gcount.value += 1;
      this.maskNeedsUpdate();
      this.uniforms.gesture.value[this.uniforms.gcount.value].set(px, 1 - py);
      console.log("draw mask", this.uniforms.gcount.value);
    }
  }
  moveControlPointsAccordingToMousePosition(deltax, deltay) {
    // let's consider a square of 9 parts, numbered from top left to bottom right
    if (this.cornersNormalizedPosition.length > 0) {
      if (this.toRun.length === 0) {
        const tl_x = this.cornersNormalizedPosition[0].x;
        const tl_y = this.cornersNormalizedPosition[0].y;

        const abs = Math.abs(this.cornersNormalizedPosition[1].x - tl_x);
        const ord = Math.abs(this.cornersNormalizedPosition[3].y - tl_y);

        const px = (mouse.x - tl_x) / abs;
        const py = 1 + (mouse.y - tl_y) / ord;

        if (px < 0 || px > 1 || py < 0 || py > 1) return false; // out of bound
        const coordx = Math.floor(px / 0.3333);
        const coordy = Math.floor(py / 0.3333);
        const idx = (coordy * 3) + coordx + 1;
        switch (idx) {
          case 1:
            this.toRun = [1];
            this.toRunHalf = [3, 7, 9];
            break;
          case 3:
            this.toRun = [3];
            this.toRunHalf = [1, 7, 9];
            break;
          case 7:
            this.toRun = [7];
            this.toRunHalf = [1, 3, 9];
            break;
          case 9:
            this.toRun = [9];
            this.toRunHalf = [1, 3, 7];
            break;
          case 2:
            this.toRun = [1, 3];
            this.toRunHalf = [7, 9];
            break;
          case 4:
            this.toRun = [1, 7];
            this.toRunHalf = [3, 9];
            break;
          case 6:
            this.toRun = [3, 9];
            this.toRunHalf = [1, 7];
            break;
          case 8:
            this.toRun = [7, 9];
            this.toRunHalf = [1, 3];
            break;
          default:
            this.toRun = [1, 3, 7, 9];
            this.toRunHalf = [];
        }
      }
      for (var i = 0; i < this.toRun.length; i++) {
        switch (this.toRun[i]) {
          case 1:
            this.deform.abs1.values[1] += deltay;
            this.deform.ord1.values[2] += deltax;
            break;
          case 3:
            this.deform.abs1.values[2] += deltay;
            this.deform.ord2.values[2] += deltax;
            break;
          case 7:
            this.deform.abs2.values[1] += deltay;
            this.deform.ord1.values[1] += deltax;
            break;
          case 9:
            this.deform.abs2.values[2] += deltay;
            this.deform.ord2.values[1] += deltax;
            break;
          default:
            break;
        }
      }
      const deltaxHalf = deltax * 0.5;
      const deltayHalf = deltay * 0.5;
      for (var i = 0; i < this.toRunHalf.length; i++) {
        switch (this.toRunHalf[i]) {
          case 1:
            this.deform.abs1.values[1] += deltayHalf;
            this.deform.ord1.values[2] += deltaxHalf;
            break;
          case 3:
            this.deform.abs1.values[2] += deltayHalf;
            this.deform.ord2.values[2] += deltaxHalf;
            break;
          case 7:
            this.deform.abs2.values[1] += deltayHalf;
            this.deform.ord1.values[1] += deltaxHalf;
            break;
          case 9:
            this.deform.abs2.values[2] += deltayHalf;
            this.deform.ord2.values[1] += deltaxHalf;
            break;
          default:
            break;
        }
      }
    }
    return true
  }
  drawCornerTool(ctx) {
    // draw square at corners
    const cornersIndexes = [
      0, // top left corner
      PLANE_SEG_WIDTH, // top right corner
      (PLANE_SEG_WIDTH + 1) * PLANE_SEG_HEIGHT, // bottom left corner
      this.workingSpace.geometry.vertices.length - 1 // bottom right corner
    ];
    const cornersPos = [];
    this.cornersNormalizedPosition = [];

    for (var i = 0; i < cornersIndexes.length; i++) {
      // get position on screen
      const pos = this.workingSpace.geometry.vertices[cornersIndexes[i]];
      const vec = this.workingSpace.localToWorld(new THREE.Vector3(pos.x, pos.y,pos.z));
      vec.project(currentCamera);

      // draw
      if (vec.x >= -1 && vec.x <= 1 && vec.y >= -1 && vec.y <= 1) {
        //ctx.beginPath();
        //ctx.fillStyle = '#00ff00';
        const posx = (vec.x + 1) * 0.5;
        const posy = (vec.y + 1) * 0.5;
        this.cornersNormalizedPosition.push({x : posx, y : posy});
        cornersPos.push({ x: posx, y: posy });
        //ctx.rect((posx) * this.tools.width - 5, (1 - posy) * this.tools.height - 5, 10, 10);
        //ctx.fill();
      }
    }
    return cornersPos;
  }
  sendData(sender) {
    if (WS_OPEN) {
      // render scene into renderTarget
      renderer.render( scene, camera1, sender.target );

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
const every_ms = 1000;

function animate(timestamp) {
  if (!start) start = timestamp;
  elapsed = timestamp - start;
  if (elapsed - oldtime > every_ms) {
    let sin_v = Math.sin(timestamp % 360);
    sin_v = 0.666;
    /*_e.deform.ord1.values[2] = sin_v;
    _e.deform.ord1.values[1] = -sin_v;
    _e.deform.ord2.values[2] = -sin_v;
    _e.deform.ord2.values[1] = sin_v;

    _e.deform.abs1.values[2] = sin_v;
    _e.deform.abs1.values[1] = sin_v;
    _e.deform.abs1.values[0] = 0.1;
    _e.deform.abs1.values[3] = 0.1;*/
    _e.sendUniforms();
    //if (_e.workingSpace)
      //_e.drawTools();
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

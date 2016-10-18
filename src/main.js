class Deformation {
  constructor() {
    // ATTRIBUTES
    this.DtoR = Math.PI / 180.0;
    this.geometry = new THREE.PlaneGeometry(8, 4);
    this.dynamicTexture  = new THREEx.DynamicTexture(2048, 1024)
    this.material = new THREE.MeshBasicMaterial({
      map : this.dynamicTexture.texture,
    });
    this.dynamicTexture.texture.needsUpdate  = true;
    this.material2 = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    this.main = new THREE.Object3D();
    this.window = new THREE.Mesh(this.geometry, this.material);
    this.pivot = new THREE.Object3D();
    this.rotation = new THREE.CircleGeometry(0.5, 16);
    this.rotation.vertices.shift();
  /*  this.pivotXaxis = new THREE.Line(
      this.rotation,
      new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      this.pivotYaxis = new THREE.Line(
        this.rotation,
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        this.pivotZaxis = new THREE.Line(
          this.rotation,
          new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    this.pivotXaxis.rotateOnAxis(new THREE.Vector3(1, 0, 0), this.DtoR * 90);
this.pivotZaxis.rotateOnAxis(new THREE.Vector3(0, 1, 0), this.DtoR * 90);
    this.pivot.add(this.window, this.pivotXaxis, this.pivotYaxis, this.pivotZaxis);*/
    this.main.add(this.window);
    this.downloadingImage = new Image();
    this.draw();

    const geom = new THREE.Geometry();
    geom.vertices = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)];
    this.test = new THREE.Line(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
  }
  draw() {
    const ctx = this.dynamicTexture.context;
    const di = this.downloadingImage;
    const scope = this;
    di.addEventListener('load', (event) => {
      ctx.drawImage(di, 0, 0);
      di.style.display = 'none';
      scope.dynamicTexture.texture.needsUpdate = true;
    });
    di.src = 'img/tesla.jpg';
  }
  invert(ctx, di, dt) {
    const imgdata = ctx.getImageData(0, 0, di.width, di.height);
    const data = imgdata.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i]     = 255 - data[i];     // red
      data[i + 1] = 255 - data[i + 1]; // green
      data[i + 2] = 255 - data[i + 2]; // blue
    }
    ctx.putImageData(imgdata, 0, 0);
    dt.texture.needsUpdate = true;
  }
  movePivot(position) {
    this.pivot.position.copy(position);
    this.window.position.copy(position);
    this.window.position.multiplyScalar(-1);
  }
}

class ProMap {
  constructor(containerId) {
    // ATTRIBUTES
    this.container = document.getElementById(containerId);
    this.callbacks = {};
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
    this.controls = new THREE.TrackballControls( this.camera );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    this.axisHelper = new THREE.AxisHelper(1);
    this.deformation = new Deformation();

    // Initialise 3D elements
    this.camera.position.z = 3;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.controls.rotateSpeed = 2.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    //this.controls.enabled = false;
    this.controls.staticMoving = false;
    this.controls.dynamicDampingFactor = 0.9;
    this.controls.keys = [ 65, 83, 68 ];

    this.renderer.setSize(this.container.offsetWidth,
                          this.container.offsetHeight);
    this.renderer.setClearColor(0xffffff);

    this.container.appendChild(this.renderer.domElement);

    // Add elements to the scene and attach events
    this.scene.add(this.axisHelper, this.deformation.main);
    this.attach(['resize']);
  }
  attach(events) {
    for (let i = 0; i < events.length; i++) {
      switch (events[i]) {
        case 'resize':
          if (!this.callbacks.hasOwnProperty('resize')) {
            this.callbacks.resize = () => {
              const dom = this.container;
              this.renderer.setSize( dom.offsetWidth, dom.offsetHeight );
              this.camera.aspect	= dom.offsetWidth / dom.offsetHeight;
              this.camera.updateProjectionMatrix();
            };
            window.addEventListener('resize', this.callbacks.resize, false);
          }
          break;
        default:

      }
    }
  }
  detach(events) {
    for (let i = 0; i < events.length; i++) {
      switch (events[i]) {
        case 'resize':
          if (this.callbacks.hasOwnProperty('resize')) {
            window.removeEventListener('resize', this.callbacks.resize);
            delete this.callbacks.resize;
          }
          break;
        default:

      }
    }
  }
  render() {
    this.controls.update();
    this.renderer.render( this.scene, this.camera );

  }
}

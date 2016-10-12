class Deformation {
  constructor() {
    // ATTRIBUTES
    this.geometry = new THREE.PlaneGeometry(10, 5);
    this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  }
}

class ProMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.callbacks = {};

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.camera.position.z = 5;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.controls = new THREE.TrackballControls( this.camera );
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = false;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [ 65, 83, 68 ];

    const opts = {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    };
    this.renderer = new THREE.WebGLRenderer(opts);
    this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight );
    this.renderer.setClearColor(0xffffff);

    const axisHelper = new THREE.AxisHelper(15);
    this.scene.add( axisHelper );

    this.container.appendChild(this.renderer.domElement);
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

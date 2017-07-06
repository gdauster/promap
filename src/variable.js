let container, stats;

let camera, controls, scene, renderer;

let targetRotation = 0;
let targetRotationOnMouseDown = 0;

let mouseX = 0;
let mouseXOnMouseDown = 0;

let mouse3D = new THREE.Vector3();
let mouse = new THREE.Vector2();

mouse.isMousePressed = false;

let raycaster = new THREE.Raycaster();

let width = window.innerWidth;
let height = window.innerHeight;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

container = document.createElement('div');
document.body.appendChild(container);

camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);

scene = new THREE.Scene();

renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } );
renderer.setClearColor( 0xf0f0f0 );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( width, height );
renderer.domElement.style.position = 'absolute';
container.appendChild( renderer.domElement );

/*controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;
controls.enableKeys = false;*/

// DEFAULT EVENTS
window.addEventListener( 'resize', (resize) => {
  width = window.innerWidth;
  height = window.innerHeight;

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize( width, height );

}, false );

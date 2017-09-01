let container, stats;

let camera1, camera2, controls, scene, renderer;

let targetRotation = 0;
let targetRotationOnMouseDown = 0;

let mouseX = 0;
let mouseXOnMouseDown = 0;

let mouse3D = new THREE.Vector3();
let mouse = new THREE.Vector2();

mouse.isMousePressed = false;
mouse.down = new THREE.Vector2();

let raycaster = new THREE.Raycaster();

let width = window.innerWidth;
let height = window.innerHeight;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

container = document.createElement('div');
document.body.appendChild(container);

camera1 = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
camera2 = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);

scene = new THREE.Scene();

renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } );
renderer.setClearColor( 0xf0f0f0 );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( width, height );
renderer.domElement.style.position = 'absolute';
container.appendChild( renderer.domElement );


// DEFAULT EVENTS
window.addEventListener( 'resize', (resize) => {
  width = window.innerWidth;
  height = window.innerHeight;

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera1.aspect = width / height;
  camera1.updateProjectionMatrix();

  camera2.aspect = width / height;
  camera2.updateProjectionMatrix();

  renderer.setSize( width, height );

}, false );

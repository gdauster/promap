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

function compareNombres(a, b) {
  return a - b;
}

class Editor extends Client {
  constructor() {
    super();
    this.type = 'editor';


        this.axisHelper = new THREE.AxisHelper( 5 );
        scene.add( this.axisHelper );

    this.menu = document.createElement('button');
    this.menu.setAttribute('type', 'button');
    this.menu.innerHTML = 'Envoyer';
    this.menu.style.position = 'absolute';
    this.menu.style.top = 0;
    document.body.appendChild(this.menu);
    this.menu.addEventListener('click', () => {

    });

    // Cube
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 8;
    camera.lookAt(new THREE.Vector3());
    controls.enabled = false;

    var geometry = new THREE.PlaneGeometry( PLANE_WIDTH, PLANE_HEIGHT,
                                            PLANE_SEG_WIDTH, PLANE_SEG_HEIGHT );
    var geometry2 = new THREE.PlaneGeometry( PLANE_WIDTH, PLANE_HEIGHT,
                                            PLANE_SEG_WIDTH, PLANE_SEG_HEIGHT );

    var material = new THREE.MeshBasicMaterial( { color: 0xe5e5e5, overdraw: 0.5 } );
    var material2 = new THREE.MeshBasicMaterial( { color: 0xe5e5e5, overdraw: 0.5 } );

    var loader = new THREE.OBJLoader2();

    var sphereGeometry = new THREE.SphereBufferGeometry( 5, 32, 32 );
    var sphereMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff} );
    var sphereMaterial1 = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); // left
    var sphereMaterial2 = new THREE.MeshBasicMaterial( {color: 0xff0000} ); // right
    var sphereMaterial3 = new THREE.MeshBasicMaterial( {color: 0x0000ff} ); // top
    var sphereMaterial4 = new THREE.MeshBasicMaterial( {color: 0xdedede} ); // bottom
    this.spheres = [
      new THREE.Mesh( sphereGeometry, sphereMaterial ),
      new THREE.Mesh( sphereGeometry, sphereMaterial ),
      new THREE.Mesh( sphereGeometry, sphereMaterial ),
      new THREE.Mesh( sphereGeometry, sphereMaterial1 ),
      new THREE.Mesh( sphereGeometry, sphereMaterial2 ),
      new THREE.Mesh( sphereGeometry, sphereMaterial3 ),
      new THREE.Mesh( sphereGeometry, sphereMaterial4 )
    ]

    for (var i = 0; i < this.spheres.length; i++) {
      this.spheres[i].scale.set(0.01, 0.01, 0.01);
      scene.add(this.spheres[i]);
    }

    this.plane = new THREE.Mesh( geometry, material );
    this.planeRaycaster = new THREE.Mesh( geometry2, material2 );
    this.planeRaycaster.position.z = -0.001;
    scene.add( this.plane );

    scope = this;
    loader.load("models/cursor.obj", (object) => {
      scope.cursor = object.children[0];
      scope.cursor.material = new THREE.MeshBasicMaterial( { color: 0xbababa } );
      scope.cursor.rotateX(1.5707963268); // rotate 90 degrees;
      scope.cursor.position.z = 1;
      scope.cursor.scale.set(0.25, 0.25, 0.25);
      scene.add(object);
    });


    var loader = new THREE.ImageLoader();
    var scope = this;
    // load a image resource
    loader.load(
    	// resource URL
    	'img/car.jpg',
    	// Function when resource is loaded
      function ( image ) {
    		// do something with it

    		// like drawing a part of it on a canvas
    		var canvas = document.createElement( 'canvas' );
    		var context = canvas.getContext( '2d' ); // 2048
        canvas.width = 2048;
        var ratiow = canvas.width / image.width;
        canvas.height = 1024;
        var ratioh = canvas.height / image.height;
        var ratio = Math.min(ratiow, ratioh);
        var iwidth = image.width * ratio;
        var iheight = image.height * ratio;
        context.fillStyle="#e5e5e5";
        context.fillRect(0,0,canvas.width,canvas.height);
    		context.drawImage(image,
          (canvas.width - iwidth) / 2, (canvas.height - iheight) / 2,
          iwidth, iheight);
        scope.canvas = canvas;

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial({ map: texture });
        scope.plane.material = material;
    	},
    	// Function called when download progresses
    	function ( xhr ) {
    		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    	},
    	// Function called when download errors
    	function ( xhr ) {
    		console.log( 'An error happened' );
    	}
    );
  }
  sendData() {
    if (WS_OPEN) {
      scene.remove(this.axisHelper);

      // render scene into renderTarget
      const renderTarget = new THREE.WebGLRenderTarget(renderer.domElement.width,
                                                       renderer.domElement.height);
      renderer.render( scene, camera, renderTarget );

      // prepare buffers for sending image data and size
      var buffer = new Uint8Array(renderer.domElement.width * renderer.domElement.height * 4);
      var size = new Uint8Array(4);
      size[0] = renderer.domElement.width;
      size[1] = renderer.domElement.width >> 8;
      size[2] = renderer.domElement.height;
      size[3] = renderer.domElement.height >> 8;

      // read buffer
      renderer.readRenderTargetPixels(renderTarget, 0, 0,
                                      renderer.domElement.width,
                                      renderer.domElement.height, buffer);

      // send data
      var blob = new Blob([size, buffer], {type: 'application/octet-binary'});
      ws.send(blob);

      scene.add(this.axisHelper);
    }
  }
  // call when server is ready
  ready() {
    SERVER_READY = true;

    // start listening events
    this.events();
  }
  isInsideRadius(v, w) {
    let a = v.x - w.x;
    let b = v.z - w.z;
    return (a * a + b * b) < RADIUS_SQUARED;
  }
  getVerticesIndexesAroundOneIndex(index) {
    let row = Math.floor(index / PLANE_SEG_WIDTH1), // on x axis
        column = index - row * PLANE_SEG_WIDTH1; // on y axis

    return {
      row, column,
      left   : column - 1 < 0 ? NaN : index - 1,
      right  : column + 1 >= PLANE_SEG_WIDTH1 ? NaN : index + 1,
      top    : row - 1 < 0 ? NaN : (row - 1) * PLANE_SEG_WIDTH1 + column,
      bottom : row + 1 >= PLANE_SEG_HEIGHT1 ? NaN : (row + 1) * PLANE_SEG_WIDTH1 + column,
    }
  }
  // add a coordinate so the triangle face (a, b, c) is now a square (a, b, c, d)
  // faceC is always on the top right corner
  getSquareAroundFace(face) {
    let indexesA = this.getVerticesIndexesAroundOneIndex(face.a),
        indexesB = this.getVerticesIndexesAroundOneIndex(face.b),
        indexesC = this.getVerticesIndexesAroundOneIndex(face.c);
    if (indexesC.left === face.a) // if faceA is on the left of faceC, (a, c, botC, b)
      return { a : face.a, b : face.c, c : indexesC.bottom, d : face.b };
    else (indexesC.bottom === face.b) // if faceB is on the left of faceC, (lefC, c, b, a)
      return { a : indexesC.left, b : face.c, c : face.b, d : face.a };
  }
  getVerticesIndexesAroundFace(face) {
    let indexesA = this.getVerticesIndexesAroundOneIndex(aFace.a),
        indexesB = this.getVerticesIndexesAroundOneIndex(aFace.b),
        indexesC = this.getVerticesIndexesAroundOneIndex(aFace.c);

    // locate the point
  }
  getCoordinatesDistanceToCenter(square) {
  let verticeA = this.plane.geometry.vertices[square.a],
      verticeB = this.plane.geometry.vertices[square.b],
      verticeC = this.plane.geometry.vertices[square.c],
      verticeD = this.plane.geometry.vertices[square.d];

    let squareCentre = new THREE.Vector3( // into 2d space
      verticeA.x + PLANE_SLAB_WIDTH_HALF,
      0,
      verticeA.z + PLANE_SLAB_HEIGHT_HALF
    );

    let listToLocate = [];
    if (this.isInsideRadius(verticeA, squareCentre))
      this.insertDichotomic(square.a, listToLocate);
    if (this.isInsideRadius(verticeB, squareCentre))
      this.insertDichotomic(square.b, listToLocate);
    if (this.isInsideRadius(verticeC, squareCentre))
      this.insertDichotomic(square.c, listToLocate);
    if (this.isInsideRadius(verticeD, squareCentre))
      this.insertDichotomic(square.d, listToLocate);
  }
  containsDichotomic(element, anArray) {
    function rec_dichotomic(imin, imax) {
      if (imax > imin) return -1;
      let m = Math.floor((imin + imax) / 2);
      if (anArray[m] === element)
        return m;
      else if (element > anArray[m])
        return rec_dichotomic(m + 1, imax);
      else
        return rec_dichotomic(imin, m - 1);
    }
    return rec_dichotomic(0, anArray.length);
  }
  insertDichotomic(element, anArray) {
    if (anArray.length === 0)
      anArray.push(element);
    else
      for (var i = anArray.length - 1; i >= 0 ; i--) {
        if (anArray[i] > element) {
          anArray.splice(i + 1, 0, element);
          return;
        }
      }
  }
  _moveFaceAndCursorForward(aFace, hasToMoveFace) {
    const square = this.getSquareAroundFace(aFace);
    let faceA = this.plane.geometry.vertices[square.a],
        faceB = this.plane.geometry.vertices[square.b],
        faceC = this.plane.geometry.vertices[square.c],
        faceD = this.plane.geometry.vertices[square.d];
    this.setCursorToMousePosition(Math.max(faceA.z, faceB.z, faceC.z, faceD.z) + 0.01);

    // compute centroid
    /*let centroid = new THREE.Vector3(
      (faceA.x + faceB.x + faceC.x) / 3,
      (faceA.y + faceB.y + faceC.y) / 3,
      (faceA.z + faceB.z + faceC.z) / 3,
    )*/

    this.getCoordinatesDistanceToCenter(square);


    if (hasToMoveFace) {
      faceA.z += 0.01;
      faceB.z += 0.01;
      faceC.z += 0.01;
      faceD.z += 0.01;
      this.plane.geometry.verticesNeedUpdate = true;
    }

    this.spheres[3].position.set(faceA.x, faceA.y, faceA.z);
    this.spheres[4].position.set(faceB.x, faceB.y, faceB.z);
    this.spheres[5].position.set(faceC.x, faceC.y, faceC.z);
    this.spheres[6].position.set(faceD.x, faceD.y, faceD.z);
  }
  events() {
    document.addEventListener("keydown", (event) => {
      if (event.key === 'Control' && !controls.enabled) {
        controls.enabled = true;
        this.cursor.visible = false;
        document.body.style.cursor = 'default';
      }
    }, false);
    document.addEventListener("keyup", (event) => {
      if (event.key === 'Control' && controls.enabled) {
        controls.enabled = false;
        this.setCursorToMousePosition();
        this.cursor.visible = true;
        document.body.style.cursor = 'none';
      }
    }, false);

    document.addEventListener("mousemove", (event) => {

      // mouse update
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1

      var intersects = raycaster.intersectObject(this.planeRaycaster, false);

      if (intersects.length > 0 && !controls.enabled) {
        this.cursor.visible = true;
        document.body.style.cursor = 'none';
        this._moveFaceAndCursorForward(intersects[0].face, mouse.isMousePressed);
      } else {
        this.cursor.visible = false;
        document.body.style.cursor = 'default';
      }
    }, false);

    document.addEventListener("mousedown", (event) => {
      mouse.isMousePressed = true;
      var intersects = raycaster.intersectObject(this.planeRaycaster, false);
      if (intersects.length > 0 && !controls.enabled) {
        this._moveFaceAndCursorForward(intersects[0].face, mouse.isMousePressed);
      }
    }, false);
    document.addEventListener("mouseup", (event) => {
      mouse.isMousePressed = false;
    }, false);

  }
  setCursorToMousePosition(zforward=0.01) {
    mouse3D.set(mouse.x, mouse.y, 0.5);
    // project mouse coordinates into 3D space (x, y = mouse position, z = 0)
    mouse3D.unproject(camera);
    const dir = mouse3D.sub(camera.position).normalize(),
          distance = - camera.position.z / dir.z,
          position = camera.position.clone().add(dir.multiplyScalar(distance));

   // set cursor position and move it forward (so plane and cursor are not coplanar)
   this.cursor.position.copy(position);
   this.cursor.position.z = zforward;
  }
  render() {
    raycaster.setFromCamera( mouse, camera );
    renderer.render( scene, camera );
  }
}

/*** START HERE ***/
const _e = new Editor();

let start, progress, elapsed = 0, oldtime = 0;
const every_ms = 200;

function animate(timestamp) {
  if (!start) start = timestamp;
  elapsed = timestamp - start;
  if (elapsed - oldtime > every_ms) {
    _e.sendData()
    oldtime = timestamp - start;
  }
  progress = timestamp - start;
  requestAnimationFrame(animate);
  // update elements
  controls.update();
  // render the sceen on every frames
  _e.render();
}
// start animation
animate();

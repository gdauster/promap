// editor
let SERVER_READY = false;

const PLANE_WIDTH = 16,
      PLANE_HEIGHT = 8,
      PLANE_SEG_WIDTH = 30,
      PLANE_SEG_HEIGHT = 15;

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
      scene.remove(this.axisHelper);
        renderer.render( scene, camera );
        this.socket.emit('editor.send_rendered', renderer.domElement.toDataURL());
          scene.add(this.axisHelper);
    });

    // Cube
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 8;
    camera.lookAt(new THREE.Vector3());
    controls.enabled = false;

    var geometry = new THREE.PlaneGeometry( PLANE_WIDTH, PLANE_HEIGHT,
                                            PLANE_SEG_WIDTH, PLANE_SEG_HEIGHT );

    var material = new THREE.MeshBasicMaterial( { color: 0xe5e5e5, overdraw: 0.5 } );

    var loader = new THREE.OBJLoader2();

    scope = this;
    loader.load("models/cursor.obj", (object) => {
      scope.cursor = object.children[0];
      scope.cursor.material = new THREE.MeshBasicMaterial( { color: 0xbababa } );
      scope.cursor.rotateX(1.5707963268); // rotate 90 degrees;
      scope.cursor.position.z = 1;
      scope.cursor.scale.set(0.25, 0.25, 0.25);
      scene.add(object);
    });

    this.plane = new THREE.Mesh( geometry, material );
    scene.add( this.plane );

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
  // call when server is ready
  ready() {
    SERVER_READY = true;

    // start listening events
    this.events();
  }
  getVerticesIndexesAroundOneIndex(index) {
    let row = Math.floor(index / PLANE_SEG_WIDTH),
        column = index - row * PLANE_SEG_WIDTH;
    return {
      left   : index - 1 < 0 ? NaN : index - 1,
      right  : index + 1 > PLANE_SEG_WIDTH ? NaN : index + 1,
      top    : row - 1 < 0 ? NaN : (row - 1) * PLANE_SEG_WIDTH + column,
      bottom : row + 1 > PLANE_SEG_WIDTH ? NaN : (row + 1) * PLANE_SEG_WIDTH + column,
    }
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

      var intersects = raycaster.intersectObject(this.plane, false);

      if (intersects.length > 0 && !controls.enabled) {
        let face = intersects[0].face,
            faceA = this.plane.geometry.vertices[face.a],
            faceB = this.plane.geometry.vertices[face.b],
            faceC = this.plane.geometry.vertices[face.c];

        this.cursor.visible = true;
        document.body.style.cursor = 'none';
        this.setCursorToMousePosition(Math.max(faceA.z, faceB.z, faceC.z) + 0.01);
        if (mouse.isMousePressed) {
          faceA.z += 0.01;
          faceB.z += 0.01;
          faceC.z += 0.01;
          this.plane.geometry.verticesNeedUpdate = true;
        }
      } else {
        this.cursor.visible = false;
        document.body.style.cursor = 'default';
      }
    }, false);
    document.addEventListener("mousedown", (event) => {
      mouse.isMousePressed = true;
      var intersects = raycaster.intersectObject(this.plane, false);
      if (intersects.length > 0 && !controls.enabled) {
        let face = intersects[0].face,
            faceA = this.plane.geometry.vertices[face.a],
            faceB = this.plane.geometry.vertices[face.b],
            faceC = this.plane.geometry.vertices[face.c];
        var face = intersects[0].face;
        this.setCursorToMousePosition(Math.max(faceA.z, faceB.z, faceC.z) + 0.01);
        faceA.z += 0.01;
        faceB.z += 0.01;
        faceC.z += 0.01;
        this.plane.geometry.verticesNeedUpdate = true;
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

function animate() {
  requestAnimationFrame(animate);
  // update elements
  controls.update();
  // render the sceen on every frames
  _e.render();
}
// start animation
animate();

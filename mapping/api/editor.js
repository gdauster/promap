// editor
let SERVER_READY = false;

const PLANE_WIDTH = 16,
      PLANE_HEIGHT = 8,
      PLANE_SEG_WIDTH = 30,
      PLANE_SEG_HEIGHT = 15;

const PLANE_SEG_WIDTH1 = PLANE_SEG_WIDTH + 1,
      PLANE_SEG_HEIGHT1 = PLANE_SEG_HEIGHT + 1;

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
  // call when server is ready
  ready() {
    SERVER_READY = true;

    // start listening events
    this.events();
  }
  _distanceToCentre(v, w, radiusInverseSquared) {
    let a = v.x - w.x;
    let b = v.z - w.z;
    return (a * a + b * b) * radiusInverseSquared;
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
  _moveFaceAndCursorForward(aFace, hasToMoveFace) {
    let faceA = this.plane.geometry.vertices[aFace.a],
        faceB = this.plane.geometry.vertices[aFace.b],
        faceC = this.plane.geometry.vertices[aFace.c];
    this.setCursorToMousePosition(Math.max(faceA.z, faceB.z, faceC.z) + 0.01);

    if (hasToMoveFace) {
      faceA.z += 0.01;
      faceB.z += 0.01;
      faceC.z += 0.01;
      this.plane.geometry.verticesNeedUpdate = true;
    }

    this.spheres[0].position.set(faceA.x, faceA.y, faceA.z);
    /*this.spheres[1].position.set(faceB.x, faceB.y, faceB.z);
    this.spheres[2].position.set(faceC.x, faceC.y, faceC.z);*/
    var indexes = this.getVerticesIndexesAroundOneIndex(aFace.a);
    console.log(indexes);
    if (!isNaN(indexes.left)) {
      var f = this.plane.geometry.vertices[indexes.left];
      this.spheres[3].position.set(f.x, f.y, f.z);
    }
    if (!isNaN(indexes.right)) {
      var f = this.plane.geometry.vertices[indexes.right];
      this.spheres[4].position.set(f.x, f.y, f.z);
    }
    if (!isNaN(indexes.top)) {
      var f = this.plane.geometry.vertices[indexes.top];
      this.spheres[5].position.set(f.x, f.y, f.z);
    }
    if (!isNaN(indexes.bottom)) {
      var f = this.plane.geometry.vertices[indexes.bottom];
      this.spheres[6].position.set(f.x, f.y, f.z);
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

function animate() {
  requestAnimationFrame(animate);
  // update elements
  controls.update();
  // render the sceen on every frames
  _e.render();
}
// start animation
animate();

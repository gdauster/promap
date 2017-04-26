// editor
let SERVER_READY = false;

class Editor extends Client {
  constructor() {
    super();
    this.type = 'editor';

    // Cube
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 8;
    camera.lookAt(new THREE.Vector3());

    var geometry = new THREE.PlaneBufferGeometry( 16, 8 );
    var material = new THREE.MeshBasicMaterial( { color: 0xe0e0e0, overdraw: 0.5 } );

    this.plane = new THREE.Mesh( geometry, material );
    scene.add( this.plane );

    var axisHelper = new THREE.AxisHelper( 5 );
    scene.add( axisHelper );

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
        context.fillStyle="#f0f0f0";
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
  }
  events() {

  }
  render() {
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


class Fragment {
  constructor(width, height, defaultOrder = 0) {
    this.width = width;
    this.height = height;
    this.order = defaultOrder;
    this.zoom = 1;
    this.position = { x : 0, y : 0 };
    this.rotation = 0;

    this.parent = null;

    this.fullyOutside = false;
    this.range = {
      min : { x: 0, y: 0 },
      max : { x: this.width, y: this.height }
    };
    // represent where to write into workingSpace (relative deplacement)
    this.offset = { x : 0, y : 0, width : this.width, height : this.height };

    this.pivot = { x : 0, y : 0, rx : 0.5, ry : 0.5 };

    // image loading
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = "absolute";
    this.context = this.canvas.getContext('2d');
    this.image = new Image();

    this.canvas.width = width;
    this.canvas.height = height;

    this.imgData = this.context.getImageData(0, 0, this.width, this.height);
    this.arrayBuffer = new ArrayBuffer(this.imgData.data.length);
    this.mainBuffer = new Uint8ClampedArray(this.arrayBuffer);
    this.fastBuffer = new Uint32Array(this.arrayBuffer);

    this.hasImage = false;
    this.ratioImage = 1;


    const scope = this;
    this.image.onload = function() {
      // bufferize image
      scope.imgData = scope.context.getImageData(0, 0, scope.width, scope.height);

      scope.arrayBuffer = new ArrayBuffer(scope.imgData.data.length);
      scope.mainBuffer = new Uint8ClampedArray(scope.arrayBuffer);
      scope.fastBuffer = new Uint32Array(scope.arrayBuffer);

      scope.hasImage = true;
      scope.ratioImage = Math.max(scope.width / scope.image.width,
                                  scope.height / scope.image.height);
      scope.pivot.x = scope.image.width * scope.ratioImage * scope.pivot.rx;
      scope.pivot.y = scope.image.height * scope.ratioImage * scope.pivot.ry;
      scope.parent.needsUpdate = true;
      console.log();
    }
  }
  addImage(imgURL) {
    this.image.src = imgURL;
  }
  resize(width, height) {
    // canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // short way to access width and height
    this.width = width;
    this.height = height;

    // drawing buffers
    this.imgData = this.context.getImageData(0, 0, this.width, this.height);
    this.arrayBuffer = new ArrayBuffer(this.imgData.data.length);
    this.mainBuffer = new Uint8ClampedArray(this.arrayBuffer);
    this.fastBuffer = new Uint32Array(this.arrayBuffer);

    if (this.hasImage) {
      this.ratioImage = Math.max(this.width / this.image.width,
                                 this.height / this.image.height);
       this.pivot.x = this.position.x + (this.image.width * this.ratioImage * this.zoom * this.pivot.rx);
       this.pivot.y = this.position.y + (this.image.height * this.ratioImage * this.zoom * this.pivot.ry);
     }

    // draw image
    this.prepareRange();
    this.paint();
  }
  addZoom(value) {
    this.zoom += value;
    if (this.hasImage) {
       this.pivot.x = (this.image.width * this.ratioImage * this.pivot.rx);
       this.pivot.y = (this.image.height * this.ratioImage * this.pivot.ry);
     }
    console.log(this.pivot.x, this.pivot.y);
  }
  // visible range on workingSpace
  prepareRange() {
    this.fullyOutside = -1 * this.position.x > this.image.width || -1 * this.position.y > this.image.height
      || this.position.x > this.width || this.position.y > this.height;

    // compute range is image is visible
    if (!this.fullyOutside) {
      if (this.position.x < 0) {
        this.range.min.x = -1 * this.position.x;
        this.range.max.x = Math.min(this.width, this.image.width + this.position.x);
        this.offset.x = 0;
      } else {
        this.range.min.x = 0;
        this.range.max.x = Math.min(this.image.width, this.width - this.position.x);
        this.offset.x = this.position.x;
      }
      if (this.position.y < 0) {
        this.range.min.y = -1 * this.position.y;
        this.range.max.y = Math.min(this.height, this.image.height + this.position.y);
        this.offset.y = 0;
      } else {
        this.range.min.y = 0;
        this.range.max.y = Math.min(this.image.height, this.height - this.position.y);
        this.offset.y = this.position.y;
      }
      this.offset.width = this.range.max.x;
      this.offset.height = this.range.max.y;
    }
  }
  paint() {
    this.context.clearRect(0, 0, this.width, this.height);
    /*this.context.translate(this.position.x - (this.ratioImage * this.zoom),
                           this.position.y - (this.ratioImage * this.zoom));*/
    let X = ((this.position.x - this.pivot.x) * this.zoom) + this.pivot.x;
    let Y = ((this.position.y - this.pivot.y) * this.zoom) + this.pivot.y;

     this.context.translate(X, Y);
    //this.context.rotate(15 * Math.PI / 180);
    this.context.scale(this.ratioImage * this.zoom, this.ratioImage * this.zoom);
    this.context.drawImage(this.image, 0, 0);
    /*this.context.drawImage(this.image, this.range.min.x, this.range.min.y,
                                       this.range.max.x, this.range.max.y,
                                       this.offset.x, this.offset.y,
                                       this.offset.width, this.offset.height);*/
    this.context.resetTransform();
    /*console.log(
      'Min : [x :', this.range.min.x, ', y :', this.range.min.y, ']\n',
      'Max : [x :', this.range.max.x, ', y :', this.range.max.y, ']\n',
      'Offset : [x :', this.offset.x, ', y :', this.offset.y, ']\n',
      'Offset : [w :', this.offset.width, ', h :', this.offset.height, ']\n',
      'Size : [w :', this.width, ', h :', this.height, ']'
    );*/
  }
  setPixel(x, y, r, g, b, a) {
    var i = (y * this.width * this.zoom + x) * 4;
    this.mainBuffer[i] = r;
    this.mainBuffer[i+1] = g;
    this.mainBuffer[i+2] = b;
    this.mainBuffer[i+3] = a;
  }
  getPixel(x, y) {
    var i = (y * this.width * this.zoom + x) * 4;
    return {
      r: this.transformedBuffer[i],
      g: this.transformedBuffer[i + 1],
      b: this.transformedBuffer[i + 2],
      a: this.transformedBuffer[i + 3]
    };
  }
}

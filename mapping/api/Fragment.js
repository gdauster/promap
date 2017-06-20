
class Fragment {
  constructor(width, height, defaultOrder = 0) {
    this.width = width;
    this.height = height;
    this.order = defaultOrder;
    this.zoom = 1;
    this.position = { x : 0, y : 0 };
    this.beginPos = { x : 0, y : 0 };
    this.zoomPos = { x : 0, y : 0 };
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
    this.rotation = 0;

    // keep actions in mind
    this.history = [];

    this.mouse = { x : 0, y : 0,
      isOverImage : false,
      isPressed : false,
      imagePosition : 'none',
      zone : 'none' // image zone corner, center, edges, ...
    };

    this.isImageSelected = false;


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
      scope.zoom = scope.ratioImage;
      scope.pivot.x = scope.image.width * scope.ratioImage * scope.pivot.rx;
      scope.pivot.y = scope.image.height * scope.ratioImage * scope.pivot.ry;

      scope.beginPos.x = scope.image.width  * 0.5 * (1 - scope.ratioImage);
      scope.beginPos.y = scope.image.height * 0.5 * (1 - scope.ratioImage);

       scope.zoomPos.x = scope.beginPos.x;
       scope.zoomPos.y = scope.beginPos.y;
      scope.parent.needsUpdate = true;
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

       this.zoomPos.x = this.image.width  * 0.5 * (1 - this.zoom);
       this.zoomPos.y = this.image.height * 0.5 * (1 - this.zoom);
     }
  }
  draw
  /**
   *
   * @param mouseEventName mouse event name could be down, up, move
   */
  setMousePosition(mouse_x, mouse_y, mouseEventName) {
    this.mouse.x = mouse_x; this.mouse.y = mouse_y;


    // check if mouse is over the image (if any)
    if (this.hasImage) {
      const w = this.image.width  * this.zoom,
            h = this.image.height * this.zoom,
            x = this.position.x - (this.beginPos.x - this.zoomPos.x),
            y = this.position.y - (this.beginPos.y - this.zoomPos.y);

      let zone_x = 'in';
      const dist_x = (mouse_x - x) / w;
      if (Math.abs(dist_x) < 0.01) zone_x = 'left';
      else if (Math.abs(1 - dist_x) < 0.01) zone_x = 'right';
      else if (dist_x < 0 || dist_x > 1) zone_x = 'out';

      let zone_y = 'in';
      const dist_y = (mouse_y - y) / h;
      if (Math.abs(dist_y) < 0.01) zone_y = 'top';
      else if (Math.abs(1 - dist_y) < 0.01) zone_y = 'bottom';
      else if (dist_y < 0 || dist_y > 1) zone_y = 'out';

      this.mouse.zone = zone_x + '-' + zone_y;
      console.log(this.mouse.zone);

      this.mouse.isOverImage = mouse_x >= x && mouse_x <= x + w
                            && mouse_y >= y && mouse_y <= y + h;

      switch (mouseEventName) {
        case 'down':
          this.mouse.isPressed = true;
          break;
        case 'up' :
          this.mouse.isPressed = false;
          break;
        default:
      }
    }
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
  paintManipulation() {
    const options = {
      size: 50 * Math.max(0.2, 1 - this.zoom),
      color : '#e8e8e8',
      lineWidth : this.zoom > 0.8 ? 1 : this.zoom < 0.2 ? 3 : 2 };
    const w = this.image.width,
          h = this.image.height;

    // draw a square on every image corners;
    this.drawSquare(0, 0, options);
    this.drawSquare(0, h, options);
    this.drawSquare(w, 0, options);
    this.drawSquare(w, h, options);
    this.drawSquare(w * 0.5, h * 0.5, options);

    // draw a square in the middle (for pivot point)
    this.drawLines([
      // diagonals
      { x_from : 0, y_from : 0, x_to : w, y_to : h },
      { x_from : 0, y_from : h, x_to : w, y_to : 0 },
      // outline
      { x_from : 0, y_from : 0, x_to : w, y_to : 0 },
      { x_from : w, y_from : 0, x_to : w, y_to : h },
      { x_from : w, y_from : h, x_to : 0, y_to : h },
      { x_from : 0, y_from : h, x_to : 0, y_to : 0 }

    ], options);
  }
  /**
   * Draw a square stroke, used by paintManipulation
   * @param x_center x coordinates of the center point
   * @param y_center y coordinates of the center point
   * @param options an array with draw options : color, lineWidth, size
   */
  drawSquare(x_center, y_center, options = {}) {
    const ctx = this.context;
    ctx.beginPath();
    ctx.lineWidth = String(options.lineWidth || '1');
    ctx.strokeStyle = options.color || 'black';
    const s = (options.size || 10);
    const s_half = s * 0.5;
    ctx.rect(x_center - s_half, y_center - s_half, s, s);
    ctx.stroke();
  }
  /**
   * Draw lines, used by paintManipulation
   * @param lines an array of {x_from, y_from, x_to, y_to}
   * @param options an array with draw options : color, lineWidth
   */
  drawLines(lines, options = {}) {
    const ctx = this.context;
    ctx.beginPath();
    ctx.lineWidth = String(options.lineWidth || '1');
    ctx.strokeStyle = options.color || 'black';
    for (var i = 0; i < lines.length; i++) {
      const line = lines[i];
      ctx.moveTo(line.x_from, line.y_from);
      ctx.lineTo(line.x_to, line.y_to);
    }
    ctx.stroke();
  }
  addRotation(rotation) {
    this.rotation += rotation;
  }
  squareStroke() {

  }
  paintImage(scale, rotationDeg, hasManipulation = false) {
    const ctx = this.context;
    const w_pivot = this.image.width * this.pivot.rx;
    const h_pivot = this.image.height * this.pivot.rx;
    ctx.save();
    ctx.translate(w_pivot, h_pivot);
    if (scale) ctx.scale(scale, scale);
    if (rotationDeg) ctx.rotate(rotationDeg * Math.PI / 180);
    ctx.translate(-w_pivot, -h_pivot);
    this.context.drawImage(this.image, 0, 0);
    if (hasManipulation) this.paintManipulation();
    ctx.restore();
  }
  paint() {
    const ctx = this.context;
    // draw background into a certain color
    /*ctx.beginPath();
    ctx.fillStyle = '#333333';
    ctx.rect(0, 0, this.width, this.height);
    ctx.fill();*/
    ctx..clearRect(0, 0, this.width, this.height);

    const w_pivot = this.image.width * this.pivot.rx;
    const h_pivot = this.image.height * this.pivot.rx;

    // draw image (if any) centered to the pivot
    if (this.hasImage) {
      ctx.translate(this.position.x - this.beginPos.x, this.position.y - this.beginPos.y);
      this.paintImage(this.zoom, this.rotation, this.mouse.isOverImage && this.mouse.isPressed);
    }
    ctx.resetTransform();

    /*console.log(
      'Min : [x :', this.range.min.x, ', y :', this.range.min.y, ']\n',
      'Max : [x :', this.range.max.x, ', y :', this.range.max.y, ']\n',
      'Offset : [x :', this.offset.x, ', y :', this.offset.y, ']\n',
      'Offset : [w :', this.offset.width, ', h :', this.offset.height, ']\n',
      'Size : [w :', this.width, ', h :', this.height, ']'
    );*/
  }
  setPixel(x, y, r, g, b, a) {
    var i = (y * this.width + x) * 4;
    this.mainBuffer[i] = r;
    this.mainBuffer[i+1] = g;
    this.mainBuffer[i+2] = b;
    this.mainBuffer[i+3] = a;
  }
  getPixel(x, y) {
    var i = (y * this.width + x) * 4;
    return {
      r: this.transformedBuffer[i],
      g: this.transformedBuffer[i + 1],
      b: this.transformedBuffer[i + 2],
      a: this.transformedBuffer[i + 3]
    };
  }
}

// checkerboard dimensions
const CB_SIZE = 10;
const M_SIZE = 20,
      M_SIZE_H = M_SIZE * 0.5;

/**
 * A layer represent a part of the final image composition. Image and/or draw
 * can be added
 * @param {PIXI.Application} parent - hold every content that to be viewed
 */
class Layer {
  constructor(parent, zOrder = 0) {
    // container size is the same as is content
    this.container = new PIXI.Container();
    this.container.promapInstance = this;
    this.parent = parent;

    // attach this layer to the main renderer
    this.parent.stage.addChild(this.container);

    // keep pivot - maybe remove in futur update
    this.pivot = { u : 0, v : 0 };
    //this.setPivot(0.5, 0.5);

    // content
    this.content = undefined;
    this.zoom = 1;
    this.special = undefined;
    this.zOrder = 0;
    this.container.zOrder = 0;
    this.controlPoints = [];
    this.segments = { x : 0, y : 0 };

    // content interaction status
    this.isSelected = false;
    this.isDragging = false;
    this.data = undefined;
    this.downPosition = { x : 0, y : 0 };;

    this.specialLayer = 'content';
  }
  /**
   * Modify image pivot. default is centered
   * @param {float} u - relative position of the pivot point into X axis
   * (between 0 and 1)
   * @param {float} v - relative position of the pivot point into Y axis
   * (between 0 and 1)
   */
  setPivot(u, v) {
    this.container.pivot.x = this.container.width * u;
    this.container.pivot.y = this.container.height * v;
    this.pivot.u = u;
    this.pivot.v = v;
  }
  attachEvents() {

  }
  modifyVertices(i, j, x, y, width) {
    if (this.content != undefined) {
      const position = (j * width + i) * 2;
      this.content.vertices[position    ] += x;
      this.content.vertices[position + 1] += y;

    }
  }
  drawControlPoints(width, height) {
    const test = new PIXI.Graphics();
    this.content.addChild(test);

    test.beginFill(0xFFFFFF, 1);
    const sizeX = this.content.width / (width - 1);
    const sizeY = this.content.height / (height - 1);
    for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
        test.drawRect((i * sizeX) - 10, (j * sizeY) - 10, 20, 20);
      }
    }
    test.endFill();

  }
  selectNeighborsAtDistance(index, distance) {
    // select indexes
    let row = Math.floor(index / (this.segments.x)), // on x axis
        column = index - row * (this.segments.x) ; // on y axis
    const result = {
      row, column,
      left   : column - 1 < 0 ? NaN : index - 1,
      right  : column + 1 >= this.segments.x ? NaN : index + 1,
      top    : row - 1 < 0 ? NaN : (row - 1) * this.segments.x + column,
      bottom : row + 1 >= this.segments.y ? NaN : (row + 1) * this.segments.x + column,
    }

    // control points
    const cps = [this.controlPoints[index]];
    /*if (!Number.isNaN(result.left)) cps.push(this.controlPoints[result.left]);
    if (!Number.isNaN(result.right)) cps.push(this.controlPoints[result.right]);
    if (!Number.isNaN(result.top)) cps.push(this.controlPoints[result.top]);
    if (!Number.isNaN(result.bottom)) cps.push(this.controlPoints[result.bottom]);*/
    for (var i = 0; i < this.controlPoints.length; i++)
      this.controlPoints[i].promapIsMarked = false;
    for (var i = 0; i < cps.length; i++)
      cps[i].promapIsMarked = true;
    this.redrawControlPoints();
    return cps;
  }
  redrawControlPoints() {
    for (var i = 0; i < this.controlPoints.length; i++) {
      const cp = this.controlPoints[i];
      cp.beginFill(cp.promapIsMarked ? 0x0000ff : 0x00ff00, 1);
      cp.drawRect(-25, -25, 50, 50);
      cp.endFill();
    }
  }
  makeControlPoints(width) {
    this.special = new PIXI.Container();
    this.content.addChild(this.special);
    this.special.promapControls = [];
    for (var i = 0; i < this.content.vertices.length; i+=2) {
      const cp = new PIXI.Graphics();
      cp.promapInstance = this;
      this.controlPoints.push(cp);
      cp.beginFill(0x00ff00, 1);
      cp.drawRect(-25, -25, 50, 50);
      cp.endFill();
      cp.interactive = true;
      cp.buttonMode = true;
      this.special.promapControls = cp;
      this.special.addChild(cp);
      cp.x = this.content.vertices[i];
      cp.y = this.content.vertices[i+1];
      const half_i = i * 0.5;
      cp.promapIndex = half_i;
      cp.promapCoord = { x : half_i % width, y : Math.floor((half_i) / width || 0), i };
      cp.promapIsDragging = false;
      cp.promapIsMarked = false;
      cp.on('mousedown', (event) => {
        const controlPoint = event.currentTarget;
        const scope = event.currentTarget.promapInstance;
        controlPoint.promapIsDragging = true;
        const neighbors = this.selectNeighborsAtDistance(controlPoint.promapIndex);

        scope.data = event.data;
        const pos = scope.data.getLocalPosition(scope.special);
        scope.downPosition.x = pos.x - controlPoint.x;
        scope.downPosition.y = pos.y - controlPoint.y;
      });
      cp.on('mousemove', (event) => {
        const controlPoint = event.currentTarget;
        const scope = event.currentTarget.promapInstance;
        if (controlPoint.promapIsDragging) {
          const pos = scope.data.getLocalPosition(scope.special);

          const xcp = pos.x - scope.downPosition.x;
          const ycp = pos.y - scope.downPosition.y;
          const deltax = xcp - controlPoint.x;
          const deltay = ycp - controlPoint.y;
          controlPoint.x = xcp;
          controlPoint.y = ycp;

          const neighbors = this.selectNeighborsAtDistance(controlPoint.promapIndex);
          for (var i = 0; i < neighbors.length; i++) {
            neighbors[i].x += deltax * 0.5;
            neighbors[i].y += deltay * 0.5;
            scope.content.vertices[neighbors[i].promapCoord.i] = neighbors[i].x;
            scope.content.vertices[neighbors[i].promapCoord.i+1] = neighbors[i].y;
          }

          scope.content.vertices[controlPoint.promapCoord.i] = controlPoint.x;
          scope.content.vertices[controlPoint.promapCoord.i+1] = controlPoint.y;
        }
      });
      cp.on('mouseup', (event) => {
        const controlPoint = event.currentTarget;
        controlPoint.promapIsDragging = false;
      });
    }
  }
  /**
   * Add an image to this layer, default anchor point is image middle
   */
  addImage(imgURL) {
    PIXI.loader.add('img', imgURL).load((loader, ressources) => {
      /*this.content = new PIXI.Sprite(ressources.img.texture);*/
      this.segments.x = 2;
      this.segments.y = 2;
      this.content = new PIXI.mesh.Plane(ressources.img.texture, this.segments.x, this.segments.y);

      //Get shader code as a string
      var frag = document.getElementById("fragmentShader").innerHTML;
      var vert = document.getElementById("vertexShader").innerHTML;
      var uniforms = {}
      uniforms.offset = {
        type:"vec4",
        value: { x:0.0, y:0.0, z:0.0, w:0.0 }
      }
      //Create our Pixi filter using our custom shader code
      var simpleShader = new PIXI.AbstractFilter(vert,'', uniforms);
      //Apply it to our object
      this.content.filters = [simpleShader];

      this.container.addChild(this.content);
      this.makeControlPoints(this.segments.x);
      this.content.canvasPadding = 1;
      this.content.interactive = true;
      this.zoom = Math.min(this.parent.renderer.width  / this.content.width,
                           this.parent.renderer.height / this.content.height);
      this.content.scale.set(this.zoom, this.zoom);
      this.content.x = (this.parent.renderer.width - this.content.width) * 0.5;
      this.content.y = (this.parent.renderer.height - this.content.height) * 0.5;

      this.content.promapInstance = this;
      //this.content.skew.x = 10 * Math.PI / 180;
      //this.content.skew.y = 10 * Math.PI / 180;

      // attach events
      /*this.content.on('mousedown', this.onContentMouseDown)
                  .on('mouseup',   this.onContentMouseUp)
                  .on('mousemove', this.onContentMouseMove);*/


    });
  }
  /**
   * Emtyness (i.e. alpha) is represented by a checkerboard
   */
  makeCheckerboardLayer() {
    this.special = new PIXI.Graphics();
    this.container.addChild(this.special);
    this.specialLayer = 'checkerboard';
    this.zOrder = -999;
    this.container.zOrder = -999;
    this.special.interactive = true;
    this.special.beginFill(0xFFFFFF, 1);
    this.special.drawRect(0, 0, this.parent.renderer.width, this.parent.renderer.height);
    this.special.endFill();
    this.special.beginFill(0xCCCCCC, 1);
    for (var x = 0; x < this.parent.renderer.width / CB_SIZE; x += 1) {
      for (var y = x % 2; y < this.parent.renderer.height / CB_SIZE; y += 2) {
        this.special.drawRect(x * CB_SIZE, y * CB_SIZE, CB_SIZE, CB_SIZE);
      }
    }
    this.special.endFill();
    this.special.on('mousedown', () => {
      for (var i = this.parent.stage.children.length - 1; i >= 0; i--) {
        const child = this.parent.stage.children[i].promapInstance;
        if (child.specialLayer === 'content')
          child.notifyMouseEventOutside('mousedown');
      }
    });
  }
  makeManipulationLayer() {
    this.special = new PIXI.Graphics();
    this.container.addChild(this.special);
    this.specialLayer = 'manipulation';
    this.zOrder = 999;
    this.container.zOrder = 999;
    this.special.interactive = true;
  }
  drawManipulation(x, y, width, height) {
    const w = width, h = height;
    this.special.clear();

    // draw a square on every image corners;
    this.special.lineStyle(1, 0xFFFFFF, 0);
    this.special.beginFill(0x888888, 1);
    this.special.drawRect(x     - M_SIZE_H, y     - M_SIZE_H, M_SIZE_H, M_SIZE_H);
    this.special.drawRect(x + w, y     - M_SIZE_H, M_SIZE_H, M_SIZE_H);
    this.special.drawRect(x     - M_SIZE_H, y + h, M_SIZE_H, M_SIZE_H);
    this.special.drawRect(x + w , y + h , M_SIZE_H, M_SIZE_H);
    this.special.endFill();
  }
  onContentMouseDown(event) {
    const scope = event.currentTarget.promapInstance;
    scope.isSelected = true;
    scope.isDragging = true;
    scope.data = event.data;
    const pos = scope.data.getLocalPosition(scope.container);
    scope.downPosition.x = pos.x - scope.content.x;
    scope.downPosition.y = pos.y - scope.content.y;

    // most of the time, manipulation layer is the last children
    for (var i = scope.parent.stage.children.length - 1; i >= 0; i--) {
      const child = scope.parent.stage.children[i].promapInstance;
      if (child.specialLayer === 'manipulation') {
        child.drawManipulation(
          scope.content.x,
          scope.content.y,
          scope.content.width, scope.content.height);
        break;
      }
    }
  }
  onContentMouseUp(event) {
    const scope = event.currentTarget.promapInstance;
    console.log('mouse up');
    scope.isDragging = false;
  }
  onContentMouseMove(event) {
    event.stopPropagation();
    const scope = event.currentTarget.promapInstance;
    console.log('mouse move');
    if (scope.isSelected && scope.isDragging) {
      const pos = scope.data.getLocalPosition(scope.container);
      scope.content.x = pos.x - scope.downPosition.x;
      scope.content.y = pos.y - scope.downPosition.y;
      for (var i = scope.parent.stage.children.length - 1; i >= 0; i--) {
        const child = scope.parent.stage.children[i].promapInstance;
        if (child.specialLayer === 'manipulation') {
          child.drawManipulation(
            scope.content.x,
            scope.content.y,
            scope.content.width, scope.content.height);
          break;
        }
      }
    }
  }
  notifyMouseEventOutside(tag) {
    if (tag === 'mousedown') {
      this.isSelected = true;
      for (var i = this.parent.stage.children.length - 1; i >= 0; i--) {
        const child = this.parent.stage.children[i].promapInstance;
        if (child.specialLayer === 'manipulation') {
          child.special.clear();
          break;
        }
      }
    }
  }
}



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
      scope.ratioImage = Math.min(scope.width / scope.image.width,
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
  drawEmptyBackground(squareSize, options = {}) {
    const ctx = this.context;
    let i = 0;
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.rect(0, 0, this.width, this.height);
    ctx.fill();
    for (var x = 0; x < this.width / squareSize; x += 1) {
      for (var y = x % 2; y < this.height / squareSize; y += 2) {
        ctx.beginPath();
        ctx.rect(x * squareSize, y * squareSize, squareSize, squareSize);
        ctx.fillStyle = options.color || 'black';
        ctx.fill();
      }
    }
  }
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

    // draw image (if any) centered to the pivot
    if (this.hasImage) {
      ctx.clearRect(0, 0, this.width, this.height);

      const w_pivot = this.image.width * this.pivot.rx;
      const h_pivot = this.image.height * this.pivot.rx;

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

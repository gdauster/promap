
/// WARNING : in this version, we only use fragments[0] for render

class WorkingSpace {
  constructor(width, height) {
    this.mainBuffer = new Uint8ClampedArray(width * height * 4 );
    this.width = width;
    this.height = height;

    this.fragments = [];

    // canvas, context and image used to decode incoming images
    this.decodeCanvas = document.createElement('canvas');
    this.decodeContext = this.decodeCanvas.getContext('2d');
    this.decodeImage = new Image();

    this.attachEvents();

  }
  resize(width, height) {
    this.mainBuffer = new Uint8ClampedArray(width * height * 4 );
    this.width = width;
    this.height = height;

    this.render();
  }
  attachEvents() {
    const scope = this;
    // image decode
    this.decodeImage.onload = function() {
      // set image size
      scope.decodeCanvas.width = scope.decodeImage.width;
      scope.decodeCanvas.height = scope.decodeImage.height;

      // draw image inside decode canvas
      scope.decodeContext.drawImage(scope.decodeImage, 0, 0, scope.decodeImage.width, scope.decodeImage.height);

      // bufferize image
      const idata = scope.decodeContext.getImageData(0, 0, scope.decodeImage.width,
                                                           scope.decodeImage.height);
      //this.fragments.push(new Fragment(idata.data, this.fragments.length));
      scope.fragments[0] = new Fragment(idata.data, scope.decodeImage.width,
                                                   scope.decodeImage.height,
                                                   scope.fragments.length);
    }
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
      r: this.mainBuffer[i],
      g: this.mainBuffer[i + 1],
      b: this.mainBuffer[i + 2],
      a: this.mainBuffer[i + 3]
    };
  }
  addImage(imgURL) {
    this.decodeImage.src = imgURL;
  }
  render() {
    for (var i = 0; i < this.mainBuffer.length; i++) {
      this.mainBuffer[i] = 255;
    }
    // working on every fragments, here just one for the current version
    for (var i = 0; i < this.fragments.length; i++) {
      const frag = this.fragments[i];
      for (let x = 0; x < this.width - frag.position.x; x++) {
        for (let y = 0; y < this.height - frag.position.y; y++) {
          const pix = frag.getPixel(x, y);
          this.setPixel(x + frag.position.x, y + frag.position.y, pix.r, pix.g, pix.b, pix.a);
        }
      }
    }
  }
}

class Fragment {
  constructor(buffer_Uint8ClampedArray, width, height, defaultOrder = 0) {
    this.buffer = buffer_Uint8ClampedArray;
    this.transformedBuffer = buffer_Uint8ClampedArray;
    this.width = width;
    this.height = height;
    this.order = defaultOrder;
    this.zoom = 1;
    this.position = { x : 50, y : 50 };
  }
  setZoom(value) {
    this.zoom = value;
    this.transformedBuffer = new Uint8ClampedArray(width * height * 4 * this.zoom );
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.transformedBuffer
      }
    }

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

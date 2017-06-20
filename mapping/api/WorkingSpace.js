
/// WARNING : in this version, we only use fragments[0] for render

class WorkingSpace {
  constructor(canvas) {
    this.fragments = [];

    this.stopRender = false;

    this.width = canvas.width;
    this.height = canvas.height;
    this.virtual = { width : 6000, height : 3000 };
    this.canvas = canvas;

    this.defaultFragmentRatio = 0.8;

    // sort fragments by order
    this.fsort_fragment = (a, b) => { return a.order - b.order };
    this.needsUpdate = false;
    this.visible = true;
    this.renderLoop();
    this.current = undefined;
    this.addFragment();

    this.context = canvas.getContext('2d');
    this.context.beginPath();
    this.context.fillStyle = '#727272';
    this.context.rect(0, 0, this.width, this.height);
    this.context.fill();
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    /*for (var i = 0; i < this.fragments.length; i++) {
      this.fragments[i].resize(width * this.defaultFragmentRatio, height * this.defaultFragmentRatio);
    }*/
    this.needsUpdate = true;
    this.context.beginPath();
    this.context.fillStyle = '#727272';
    this.context.rect(0, 0, this.width, this.height);
    this.context.fill();
  }
  setPixel(x, y, r, g, b, a) {
    var i = (y * this.width + x) * 4;
    this.mainBuffer[i] = r;
    this.mainBuffer[i+1] = g;
    this.mainBuffer[i+2] = b;
    this.mainBuffer[i+3] = a;
  }
  setFastPixel(x, y, r, g, b, a) {
    var i = (y * this.width + x);
    this.fastBuffer[i] =
        (a << 24) |	// alpha
        (b << 16) |	// blue
        (g <<  8) |	// green
         r;		      // red
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
    const fragment = new Fragment(1024, 720);
    document.body.appendChild(fragment.canvas);
    fragment.addImage(imgURL);
    fragment.parent = this;
    this.fragments.push(fragment);
    this.current = fragment;
  }
  addFragment() {
    const fragment = new Fragment(1024, 720);
    document.body.appendChild(fragment.canvas);
    fragment.parent = this;
    this.fragments.push(fragment);
    this.current = fragment;
    fragment.drawEmptyBackground(10, { color : '#dddddd' });
  }
  setMousePosition(mouse_x, mouse_y, mouseEventName) {
    if (this.current) {
      this.current.setMousePosition(mouse_x, mouse_y, mouseEventName);
      let cursorStyle = 'default';
      const zone = this.current.mouse.zone;
      if (zone === 'left-top' || zone === 'right-bottom') cursorStyle = 'nw-resize';
      else if (zone === 'right-top' || zone === 'left-bottom') cursorStyle = 'sw-resize';
      else if (zone.startsWith('left-') || zone.startsWith('right-')) cursorStyle = 'e-resize';
      else if (zone.endsWith('-top') || zone.endsWith('-bottom')) cursorStyle = 'n-resize';
      document.body.style.cursor = cursorStyle;
    }
  }
  renderLoop() {
    const scope = this;
    this.renderID = setInterval(() => {
      this.context.beginPath();
      this.context.fillStyle = '#727272';
      this.context.rect(0, 0, this.width, this.height);
      this.context.fill();
      if (scope.visible && scope.needsUpdate) {
        //console.time("render loop");
        scope.needsUpdate = false;
        for (var i = 0; i < scope.fragments.length; i++) {
          scope.fragments[i].prepareRange();
          scope.fragments[i].paint();
        }
        //console.timeEnd("render loop");
      }
    }, 0);
  }
}

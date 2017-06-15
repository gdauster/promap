
/// WARNING : in this version, we only use fragments[0] for render

class WorkingSpace {
  constructor(canvas) {
    this.fragments = [];

    this.stopRender = false;

    this.width = canvas.width;
    this.height = canvas.height;
    this.canvas = canvas;

    // sort fragments by order
    this.fsort_fragment = (a, b) => { return a.order - b.order };
    this.needsUpdate = false;
    this.visible = true;
    this.renderLoop();
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    for (var i = 0; i < this.fragments.length; i++) {
      this.fragments[i].resize(width, height);
    }
    this.needsUpdate = true;
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
    const fragment = new Fragment(this.width, this.height);
    document.body.appendChild(fragment.canvas);
    fragment.addImage(imgURL);
    fragment.parent = this;
    this.fragments.push(fragment);
  }
  preparePixel() {

  }
  renderLoop() {
    const scope = this;
    this.renderID = setInterval(() => {
      if (scope.visible && scope.needsUpdate) {
        console.time("render loop");
        scope.needsUpdate = false;
        for (var i = 0; i < scope.fragments.length; i++) {
          scope.fragments[i].prepareRange();
          scope.fragments[i].paint();
        }
        console.timeEnd("render loop");
      }
    }, 0);
  }
}

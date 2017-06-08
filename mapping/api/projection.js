// projection

class Projection extends Client {
  constructor() {
    super();
    this.canvas = document.createElement( 'canvas' );
    this.context = this.canvas.getContext( '2d' ); // 2048
    document.body.appendChild(this.canvas);
    this.canvas.width = 2048;
    this.canvas.height = 1024;
    this.truc = undefined;
  }
  ready() {
    console.log('readyyyyyy');
    const ws = new WebSocket('ws://127.0.0.1:8090');
    const scope = this;
    ws.addEventListener('message', function (event) {
      const blob = event.data;

      var reader = new FileReader();
      reader.addEventListener("loadend", function() {
         var buffer = new Uint8Array(reader.result);
        var width = (buffer[0] + (buffer[1] << 8));
        var height = (buffer[2] + (buffer[3] << 8));

        //const buf8 = new Uint8ClampedArray(buffer, 4);

        let imagedata = scope.context.getImageData(0, 0, width, height);
        scope.canvas.width = width;
        scope.canvas.height = height;
        document.mypersonnalbuffer = buffer;
        /*for (var i = buffer.length-1; i > 3 ; i-=4) {
          //imagedata.data[buffer.length - i] = buffer[i];
            const ind = buffer.length-1 - i;
            imagedata.data[i-4-3] = buffer[ind];
            imagedata.data[i-4-2] = buffer[ind+1];
            imagedata.data[i-4-1] = buffer[ind+2];
            imagedata.data[i-4] = buffer[ind+3];
        }*/
        /*for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            // Get the pixel index
            const pixelindex = ((y * width + x) * 4) + 4;
            const pixelindexBuffer = (width * height) - pixelindex;

            // Set the pixel data
            imagedata.data[pixelindex] = buffer[pixelindexBuffer];     // Red
            imagedata.data[pixelindex+1] = buffer[pixelindexBuffer+1]; // Green
            imagedata.data[pixelindex+2] = buffer[pixelindexBuffer+2];  // Blue
            imagedata.data[pixelindex+3] = 255;   // Alpha
          }
        }*/
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            // Get the pixel index
            const pixelindex = ((y * width + x) * 4) + 4;
            const pixelindexBuffer = (((height - y - 1) * width + x) * 4) + 4;

            // Set the pixel data
            imagedata.data[pixelindex] = buffer[pixelindexBuffer];     // Red
            imagedata.data[pixelindex+1] = buffer[pixelindexBuffer+1]; // Green
            imagedata.data[pixelindex+2] = buffer[pixelindexBuffer+2];  // Blue
            imagedata.data[pixelindex+3] = 255;   // Alpha
          }
        }


        // store image data inside the image holder
        scope.context.putImageData(imagedata, 0, 0);
        //scope.image.src = scope.canvas.toDataURL();

      });
      reader.readAsArrayBuffer(blob);
/*
      console.log(event);
      console.time("reception");
      // set the new image buffer to image canvas holder
      const buf8 = new Uint8ClampedArray(data.buffer, 4);
      let imagedata = this.context.getImageData(0, 0, data.width, data.height);
      for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
          // Get the pixel index
          const pixelindex = (y * data.width + x) * 4;

          // Set the pixel data
          imagedata.data[pixelindex] = buf8[pixelindex];     // Red
          imagedata.data[pixelindex+1] = buf8[pixelindex+1]; // Green
          imagedata.data[pixelindex+2] = buf8[pixelindex+2];  // Blue
          imagedata.data[pixelindex+3] = 255;   // Alpha
        }
      }

      // store image data inside the image holder
      this.context.putImageData(imagedata, 0, 0);
      this.image.src = this.canvas.toDataURL();*/
    });
  }
}

const _p = new Projection();

window.addEventListener("click", () => {
  _p.socket.emit('editor.status', 'coucou');
  console.log('proj');
}, false);

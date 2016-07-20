'use strict';

System.register(['lib/DataSet.js', 'lib/util.js', 'node_modules/lzma/src/lzma_worker.js', 'node_modules/lzma/src/lzma.js', 'node_modules/pako/dist/pako.js'], function (_export, _context) {
  var DataSet, util, lzma, LZMA, pako;
  return {
    setters: [function (_libDataSetJs) {
      DataSet = _libDataSetJs.default;
    }, function (_libUtilJs) {
      util = _libUtilJs.default;
    }, function (_node_modulesLzmaSrcLzma_workerJs) {
      lzma = _node_modulesLzmaSrcLzma_workerJs.default;
    }, function (_node_modulesLzmaSrcLzmaJs) {
      LZMA = _node_modulesLzmaSrcLzmaJs.default;
    }, function (_node_modulesPakoDistPakoJs) {
      pako = _node_modulesPakoDistPakoJs.default;
    }],
    execute: function () {

      // const lzma = new LZMA('node_modules/lzma/src/lzma_worker.js')
      // const lzma = new LZMA()

      const modules = { DataSet, util, LZMA, lzma, pako, pps: util.pps }; // Import the lib/ mmodules via relative paths

      util.toWindow(modules);
      // window.pps = util.pps
      console.log(Object.keys(modules).join(' '));

      const imageUrl = 'test/data/redfish128t.png'; // 26k
      // function compress (compressor, uint8Array, level = 9) {
      //   const compressedArray = compressor.compress
      //     ? new Uint8Array(compressor.compress(uint8Array, { level }))
      //     : pako.deflate(uint8Array, level)
      //   return compressedArray
      // }
      // util.toWindow({compress, imageUrl})

      // const array8toUint8 = (array) => new Uint8Array(new Int8Array(array).buffer)
      // const uint8toArray8 = (uint8s) =>
      //   util.convertArray(new Int8Array(uint8s.buffer), Array)

      util.imagePromise(imageUrl).then(img => {
        // debugger
        const pixels = util.imageToPixels(img, true);
        const pixc = lzma.compress(pixels, 9); // sync, returns Array
        util.toWindow({ img, pixels, pixc });
        console.log('lzma: compression pixels/pixc', pixels.length, pixc.length);
        const pixd = lzma.decompress(pixc); // sync, returns Array
        console.log('lzma: pixels = pixd', util.arraysEqual(pixels, pixd));
        util.toWindow({ img, pixels, pixc, pixd });

        // const pixcInt8 = new Int8Array(pixc)
        // console.log('lzma: pixc = pixInt8', util.arraysEqual(pixc, pixcInt8))
        // const pixcUint8 = new Uint8Array(pixc) // Uint & Int same values
        // const pixd8 = lzma.decompress(new Int8Array(pixcUint8.buffer))
        // console.log('lzma: pixels = pixd8', util.arraysEqual(pixels, pixd8))

        const pixcUint8 = new Uint8Array(pixc); // Uint & Int same values
        const pixels64 = util.bufferToBase64(pixels);
        const pixc64 = util.bufferToBase64(pixcUint8);
        console.log('lzma: base64 pixels/pixc size', pixels64.length, pixc64.length);
        util.toWindow({ pixcUint8, pixels64, pixc64 });
        // console.log('img', img, 'pixels', pixels.length)

        const pixels64c = lzma.compress(pixels64, 9);
        const pixc64c = lzma.compress(pixc64, 9);
        console.log('lzma: string compression', pixels64c.length, pixc64c.length);
        util.toWindow({ pixels64c, pixc64c });

        // const pixels64cd = lzma.decompress(pixels64c)
        // const pixc64cd = lzma.decompress(pixc64c)
        // console.log('lzma: string decompression', pixels64cd.length, pixc64cd.length)
        // util.toWindow({ pixels64cd, pixc64cd })
      }).catch(error => console.log(error));

      // const id = new ImageData(10, 5)
      // util.repeat(id.data.length, (i) => { id.data[i] = i })
      // const idpx = util.imageToPixels(id)
      // const idbase64 = util.bufferToBase64(idpx)
      // util.toWindow({ id, idpx, idbase64 })
      //
      // const blob = new Blob([idpx], {type: 'application/octet-binary'})
      // const bloburl = URL.createObjectURL(blob)
      // util.toWindow({ blob, bloburl })
    }
  };
});
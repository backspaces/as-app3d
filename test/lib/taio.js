'use strict';

System.register(['lib/DataSet.js', 'lib/util.js', 'node_modules/lzma/src/lzma_worker.js', 'node_modules/pako/dist/pako.js'], function (_export, _context) {
  var DataSet, util, LZMA, pako;
  return {
    setters: [function (_libDataSetJs) {
      DataSet = _libDataSetJs.default;
    }, function (_libUtilJs) {
      util = _libUtilJs.default;
    }, function (_node_modulesLzmaSrcLzma_workerJs) {
      LZMA = _node_modulesLzmaSrcLzma_workerJs.default;
    }, function (_node_modulesPakoDistPakoJs) {
      pako = _node_modulesPakoDistPakoJs.default;
    }],
    execute: function () {

      // https://github.com/nmrugg/LZMA-JS
      // https://github.com/nodeca/pako

      // Import the lib/ mmodules
      util.toWindow({ DataSet, util, LZMA, pako, pps: util.pps });

      function compress(useLZMA, typedArray, level = 9) {
        console.log('useLZMA', useLZMA, 'length', typedArray.length, 'bytes', typedArray.byteLength, 'type', util.typeOf(typedArray));
        let byteArray = new Uint8Array(typedArray.buffer);
        if (useLZMA) byteArray = util.convertArray(byteArray, Array);
        console.time('compression time');
        const compressedArray = useLZMA ? LZMA.compress(byteArray, { level }) : pako.deflate(byteArray, level);
        console.timeEnd('compression time');
        const percent = 100 * util.fixed(compressedArray.length / byteArray.length);
        console.log(`compression: ${ byteArray.length } -> ${ compressedArray.length } ${ percent }%`);
      }
      util.toWindow({ compress });
      const ta = util.randomArray(256 * 256, 0, 10, Float32Array);
      compress(true, ta);
      // compress(false, ta)

      // const tiler = ds.resample(256, 256, false, Float32Array)
      // https://github.com/nmrugg/LZMA-JS
      // https://github.com/nodeca/pako
      const useLZMA = false;
      // const deflate = new pako.Deflate({ level: 3 })
      // const inflate = new pako.Inflate({ level: 3 })
      const popts = { level: 9 }; // 0-9
      const lmode = 9;
      // let tiler = util.randomArray(256 * 256, 0, 1000, Uint32Array)
      let tiler = util.randomArray(256 * 256, 0, 1000, Float32Array);
      tiler = util.fixedArray(tiler, 2);
      tiler = new DataSet(256, 256, tiler);
      console.log('random 256x256 dataset', util.fixedArray(tiler.data));
      const tilei = new Uint8Array(tiler.data.buffer);
      console.log('.. as Uint8Array', tilei);
      const tc = useLZMA ? LZMA.compress(tilei, lmode) : pako.deflate(tilei, popts);
      // const td = LZMA.decompress(tc)
      const td = useLZMA ? LZMA.decompress(tc) : pako.inflate(tc);
      const percent = 100 * util.fixed(tc.length / td.length);
      console.log(useLZMA ? 'LZMA' : 'Pako', 'compression', td.length, '->', tc.length, percent, '%');
      util.toWindow({ tiler, tilei, tc, td });

      console.log('decompressed ints === int view onto dataset?', util.arraysEqual(tilei, td));
      const tdi = new Uint8Array(td);
      const tdif = new tiler.data.constructor(tdi.buffer);
      console.log('decompressed floats === dataset.data?', util.arraysEqual(tiler.data, tdif));
      const tdifs = util.clone(tdif).sort((a, b) => a - b);
      const tdu = util.uniq(tdifs);
      console.log('sorted floats', util.fixedArray(tdifs, 6));
      console.log('unique?', tdu.length === tdif.length, util.fixedArray(tdu));
      console.log('    ', tdif.length, '->', tdu.length);
      util.toWindow({ tdi, tdif, tdifs, tdu });

      const t64 = tiler.toDataUrl();
      console.log('t64 length', t64.length);
      const t64c = useLZMA ? LZMA.compress(tilei, lmode) : pako.deflate(tilei, popts);
      util.toWindow({ t64, t64c });
    }
  };
});
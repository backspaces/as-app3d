'use strict';

System.register(['lib/DataSet.js', 'lib/util.js'], function (_export, _context) {
  var DataSet, util;
  return {
    setters: [function (_libDataSetJs) {
      DataSet = _libDataSetJs.default;
    }, function (_libUtilJs) {
      util = _libUtilJs.default;
    }],
    execute: function () {
      // Import the lib/ mmodules


      util.toWindow({ DataSet, util, pps: util.pps });

      const ds = new DataSet(2, 3, new Uint8Array([0, 1, 2, 3, 4, 5]));
      console.log('ds', ds, 'data', ds.data);

      const ctx = ds.toContext();
      const id = util.ctxImageData(ctx);
      console.log('to context image data', id.data);

      const du = util.ctxToDataUrl(ctx);
      const ctx1 = util.createCtx(ctx.canvas.width, ctx.canvas.height);
      ctx1.drawImage(ctx.canvas, 0, 0);
      const du1 = util.ctxToDataUrl(ctx1);
      console.log('du === du1', du === du1);

      const ds22 = new DataSet(2, 2, [20, 21, 22, 23]);
      console.log('ds22', ds22.data);
      const ds33 = new DataSet(3, 3, [30, 31, 32, 33, 34, 35, 36, 37, 38]);
      console.log('ds33', ds33.data);
      const [dseast, dssouth] = [ds.concatEast(ds33), ds.concatSouth(ds22)];
      console.log('ds.concatEast(ds33)', dseast);
      console.log('ds.concatSouth(ds22)', dssouth);

      const ds10f = ds.resample(10, 10, false, Float32Array);
      console.log('resample ds 10x10 (floats trimmed)', util.fixedArray(ds10f.data));
      const ds10i = new Uint8Array(ds10f.data.buffer);
      util.toWindow({ ds, du, ctx, ds22, ds33, dseast, dssouth, ds10f, ds10i });

      console.time('convolve');
      let dsLarge = DataSet.emptyDataSet(1000, 1000, Float64Array);
      dsLarge = dsLarge.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6);
      console.timeEnd('convolve');
    }
  };
});
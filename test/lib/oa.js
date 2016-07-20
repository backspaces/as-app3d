'use strict';

System.register(['lib/OofA.js', 'lib/DataSet.js', 'lib/AgentSet.js', 'lib/Color.js', 'lib/ColorMap.js', 'lib/util.js'], function (_export, _context) {
  var OofA, DataSet, AgentSet, Color, ColorMap, util;
  return {
    setters: [function (_libOofAJs) {
      OofA = _libOofAJs.default;
    }, function (_libDataSetJs) {
      DataSet = _libDataSetJs.default;
    }, function (_libAgentSetJs) {
      AgentSet = _libAgentSetJs.default;
    }, function (_libColorJs) {
      Color = _libColorJs.default;
    }, function (_libColorMapJs) {
      ColorMap = _libColorMapJs.default;
    }, function (_libUtilJs) {
      util = _libUtilJs.default;
    }],
    execute: function () {
      // Import the lib/ mmodules via relative paths


      const modules = { DataSet, util, OofA, AgentSet, Color, ColorMap, pps: util.pps };
      util.toWindow(modules);

      console.log('DataSet, util, OofA, AgentSet, Color, ColorMap');
      console.log('ds, u, oofa, aset, color, cmap');

      const oa = new OofA({
        id: Uint32Array,
        color: Uint8Array,
        colorMap: [[1, 2, 3], 0],
        position: [Float32Array, 2] // x, y
      }, 2, 2);

      util.repeat(4, i => {
        oa.push({
          id: i,
          color: i * 10,
          position: [i, i + 2]
        });
      });

      const runs = 1e6;
      const test = new OofA({
        id: Uint32Array,
        color: Uint8Array,
        colorMap: [[1, 2, 3], 0],
        position: [Float32Array, 2] // x, y
      }, runs, 0);
      util.timeit(i => {
        test.push({
          id: i,
          color: i % 25,
          position: [i, i]
        });
      }, runs, 'getterSetter push');

      const test1 = new OofA({
        id: Uint32Array,
        color: Uint8Array,
        colorMap: [[1, 2, 3], 0],
        position: [Float32Array, 2] // x, y
      }, runs, 0);
      util.timeit(i => {
        test1.pushObject({
          id: i,
          color: i % 25,
          position: [i, i]
        });
      }, runs, 'object push');

      const gs = test.createGetterSetter();
      let obj, id, color, position, obj1, id1, color1, position1;
      util.timeit(i => {
        obj = gs;
        obj.ix = i;
        id = obj.id;
        color = obj.color;
        position = obj.position;
      }, runs, 'getterSetter getObject');
      util.timeit(i => {
        obj1 = test1.getObject(i, obj1);
        id1 = obj1.id;
        color1 = obj1.color;
        position1 = obj1.position;
      }, runs, 'object getObject');

      util.toWindow({ oa, runs, test, test1, gs, obj, obj1 });
      util.toWindow({ id, color, position, id1, color1, position1 });
    }
  };
});
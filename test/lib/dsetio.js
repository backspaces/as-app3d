System.register(['lib/util.js', 'lib/DataSet.js', 'lib/DataSetIO.js', 'lib/RGBDataSet.js', 'lib/RGBADataSet.js', 'lib/AscDataSet.js'], function (_export, _context) {
  "use strict";

  var util, DataSet, DataSetIO, RGBDataSet, RGBADataSet, AscDataSet;
  return {
    setters: [function (_libUtilJs) {
      util = _libUtilJs.default;
    }, function (_libDataSetJs) {
      DataSet = _libDataSetJs.default;
    }, function (_libDataSetIOJs) {
      DataSetIO = _libDataSetIOJs.default;
    }, function (_libRGBDataSetJs) {
      RGBDataSet = _libRGBDataSetJs.default;
    }, function (_libRGBADataSetJs) {
      RGBADataSet = _libRGBADataSetJs.default;
    }, function (_libAscDataSetJs) {
      AscDataSet = _libAscDataSetJs.default;
    }],
    execute: function () {
      // Import the lib/ mmodules via relative paths
      const modules = {
        DataSet, DataSetIO, AscDataSet, RGBDataSet, RGBADataSet, util
      };
      util.toWindow(modules);
      console.log('modules:', Object.keys(modules).join(', '));

      const int8s = util.repeat(1e4, (i, a) => {
        a[i] = i;
      }, new Uint8Array(1e4));
      const int16s = util.repeat(1e4, (i, a) => {
        a[i] = i;
      }, new Uint16Array(1e4));

      const rgbUrl = 'test/data/7.15.35.png'; // 112K
      // const rgbUrl = 'test/data/10.20.263.png' // 26k

      // const rgbaUrl = 'test/data/redfish.png' // 26k
      const rgbaUrl = 'test/data/float32.png'; // 160K: rgba version of 7.15.35.png

      const ascUrl = 'test/data/nldroplets.asc'; // 223K
      util.toWindow({ rgbUrl, rgbaUrl, ascUrl, int16s });

      const u2name = url => url.match(/^.*\/(.*)/)[1];

      function* main() {
        const rgbImg = yield util.imagePromise(rgbUrl);
        const rgbDs = new RGBDataSet(rgbImg).setName(u2name(rgbUrl));
        const rgbaImg = yield util.imagePromise(rgbaUrl);
        const rgbaDs = new RGBADataSet(rgbaImg).setName(u2name(rgbaUrl));
        const ascString = yield util.xhrPromise(ascUrl);
        const ascDs = new AscDataSet(ascString, Float32Array).setName(u2name(ascUrl));
        const int8sDS = new DataSet(100, 100, int8s).setName('int8s');
        const int16sDS = new DataSet(100, 100, int16s).setName('int16s');

        const ds = rgbDs; // rgbDs, rgbaDs, ascDs, int8sDS, int16sDS
        const datasets = { rgbDs, rgbaDs, ascDs, int8sDS, int16sDS };
        util.toWindow({ rgbImg, rgbaImg, ascString, datasets, ds });
        util.toWindow(datasets);
        console.log('ds type =', ds.type().name, 'name =', ds.name);

        const json0 = DataSetIO.toJson(ds, 'none');
        const json1 = DataSetIO.toJson(ds, 'base64');
        const json2 = DataSetIO.toJson(ds, 'zip');
        const json3 = yield DataSetIO.toJson(ds, 'lzma');

        util.toWindow({ json0, json1, json2, json3 });
        console.log('json0, json1, json2 json3', json0.length, json1.length, json2.length, json3.length, ds.datatype().name);

        const ds0 = DataSetIO.toDataSet(json0);
        const ds1 = DataSetIO.toDataSet(json1);
        const ds2 = DataSetIO.toDataSet(json2);
        const ds3 = yield DataSetIO.toDataSet(json3);

        util.toWindow({ ds0, ds1, ds2, ds3 });
        console.log('ds, ds0, ds1, ds2, ds3', ds, ds0, ds1, ds2, ds3);
        console.log('ds.data === ds0.data', util.arraysEqual(ds.data, ds0.data));
        console.log('ds0.data === ds1.data', util.arraysEqual(ds0.data, ds1.data));
        console.log('ds1.data === ds2.data', util.arraysEqual(ds1.data, ds2.data));
        console.log('ds2.data === ds3.data', util.arraysEqual(ds2.data, ds3.data));

        testIDB(datasets);
      }
      util.runGenerator(main);

      function testIDB(datasets) {
        var indexedDB = window.indexedDB;
        // Open (or create) the database
        var open = indexedDB.open('DataSets', 1);
        // Create the schema
        open.onupgradeneeded = function () {
          var db = open.result;
          // var store =
          db.createObjectStore('DataSetsStore', { keyPath: 'name' });
        };
        open.onsuccess = function () {
          // Start a new transaction
          var db = open.result;
          var tx = db.transaction('DataSetsStore', 'readwrite');
          var store = tx.objectStore('DataSetsStore');
          util.forEach(datasets, ds => {
            store.put(ds); // Store the dataset
            var get = store.get(ds.name); // Fetch the dataset by its name
            get.onsuccess = () => {
              // Test it is OK
              const ds1 = get.result;
              console.log(ds1);
              console.log('original dataset === stored result:', ds.equals(ds1));
            };
          });
          tx.oncomplete = function () {
            console.log('complete', tx, db);
            db.close();
          };
        };
      }
    }
  };
});
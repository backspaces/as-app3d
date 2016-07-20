'use strict';

System.register(['lib/AgentSet.js', 'lib/Animator.js', 'lib/Color.js', 'lib/ColorMap.js', 'lib/DataSet.js', 'lib/Model.js', 'lib/Mouse.js', 'lib/OofA.js', 'lib/Patch.js', 'lib/Patches.js', 'lib/util.js'], function (_export, _context) {
  var AgentSet, Animator, Color, ColorMap, DataSet, Model, Mouse, OofA, Patch, Patches, util;
  return {
    setters: [function (_libAgentSetJs) {
      AgentSet = _libAgentSetJs.default;
    }, function (_libAnimatorJs) {
      Animator = _libAnimatorJs.default;
    }, function (_libColorJs) {
      Color = _libColorJs.default;
    }, function (_libColorMapJs) {
      ColorMap = _libColorMapJs.default;
    }, function (_libDataSetJs) {
      DataSet = _libDataSetJs.default;
    }, function (_libModelJs) {
      Model = _libModelJs.default;
    }, function (_libMouseJs) {
      Mouse = _libMouseJs.default;
    }, function (_libOofAJs) {
      OofA = _libOofAJs.default;
    }, function (_libPatchJs) {
      Patch = _libPatchJs.default;
    }, function (_libPatchesJs) {
      Patches = _libPatchesJs.default;
    }, function (_libUtilJs) {
      util = _libUtilJs.default;
    }],
    execute: function () {

      const modules = {
        AgentSet, Animator, Color, ColorMap, DataSet,
        Mouse, Model, OofA, Patch, Patches, util,
        pps: util.pps
      }; // Import the lib/ mmodules via relative paths

      util.toWindow(modules);

      // const el = document.getElementById('layers')
      // util.toWindow({el})
      // el.style.width = 400
      // el.style.height = 400
      // const mouse = new Mouse(el, (evt) => { console.log(mouse) })

      const model = new Model('layers');
      const mouse = new Mouse(model, true, evt => {
        console.log(mouse);
      });
      mouse.start();
      util.toWindow({ model, mouse });
    }
  };
});
'use strict';

System.register(['lib/Animator.js', 'lib/AgentSet.js', 'lib/Patch.js', 'lib/Patches.js', 'lib/Color.js', 'lib/ColorMap.js', 'lib/Model.js', 'lib/util.js'], function (_export, _context) {
  var Animator, AgentSet, patchProto, Patches, Color, ColorMap, Model, util;
  return {
    setters: [function (_libAnimatorJs) {
      Animator = _libAnimatorJs.default;
    }, function (_libAgentSetJs) {
      AgentSet = _libAgentSetJs.default;
    }, function (_libPatchJs) {
      patchProto = _libPatchJs.default;
    }, function (_libPatchesJs) {
      Patches = _libPatchesJs.default;
    }, function (_libColorJs) {
      Color = _libColorJs.default;
    }, function (_libColorMapJs) {
      ColorMap = _libColorMapJs.default;
    }, function (_libModelJs) {
      Model = _libModelJs.default;
    }, function (_libUtilJs) {
      util = _libUtilJs.default;
    }],
    execute: function () {
      // Import the lib/ mmodules via relative paths

      window.pps = util.pps;

      const modules = { AgentSet, Patches, patchProto, Color, ColorMap, Model, Animator, util };
      util.toWindow(modules);
      console.log(Object.keys(modules).join(' '));

      // // constructor (model, agentClass, name, baseSet = null) {
      // const foos = new AgentSet({}, {}, 'foos')
      // const a = [{id: 77}, {id: 90}]
      // util.toWindow({ foos, a })
      //
      // util.repeat(4, (i) => foos.add({}))
      // foos.asSet(a)
      //
      // const bars = new AgentSet({}, {}, 'bars', foos)
      // util.repeat(2, (i) => bars.add({}))
      // const zots = new AgentSet({}, {}, 'zots', foos)
      // util.repeat(2, (i) => zots.add({}))
      // const foo = foos[0]
      // const bar = bars[0]
      // const zot = zots[0]
      // util.toWindow({ bars, zots, foo, bar, zot })
      //
      // foos.own('foo1')
      // bars.own('bar1, bar2')
      // zots.own('zot1, zot2')
      // console.log('foos variables', foos.ownVariables)
      // console.log('bars variables', bars.ownVariables)
      // console.log('zots variables', zots.ownVariables)
      //
      // const zot0 = zots[0]
      // bars.setBreed(zot0)
      // console.log('bars.setBreed(zot0)', Object.keys(zot0))
      // const bar0 = bars[0]
      // foos.setBreed(bar0)
      // console.log('foos.setBreed(bar0)', Object.keys(bar0))
      // util.toWindow({ zot0, bar0 })

      Model.prototype.setup = function () {
        this.cmap = ColorMap.rgbColorCube(8, 8, 4);
        // this.patches.forEach((p, i, ps) => { p.neighbors = ps.neighbors(p) })
        // this.patches.forEach((p, i, ps) => { p.neighbors4 = ps.neighbors(p) })
      };
      Model.prototype.step = function () {
        for (const p of this.patches) {
          if (p.agentSet === this.patches) // let breeds be static color
            p.setColor(this.cmap.randomColor());
          // patches.neighbors(p)
          // p.neighbors4 // see if performance degraded by getter function call
        }
        if (this.anim.ticks === 300) {
          console.log(this.anim.toString());
          this.stop();
        }
      };
      // const [size, max, min] = [4, 50, -50]
      const [size, max, min] = [4, 50, -50];
      const opts = { patchSize: size, minX: min, maxX: max, minY: min, maxY: max };
      const model = new Model('layers', opts);
      const world = model.world;
      const patches = model.patches;
      util.toWindow({ model, world, patches });
      if (size !== 1) util.addToDom(patches.pixels.ctx.canvas);
      model.start();
      // patches.importDrawing('./test/data/redfish128t.png')
      // patches.importColors('./test/data/redfish128t.png')

      model.patchBreeds('houses roads');
      const houses = patches.breeds.houses;
      const roads = patches.breeds.roads;
      util.toWindow({ houses, roads, p: patches[0], h: houses[0], r: roads[0] });
      houses.own('address sqfeet');
      roads.own('lanes name');
      houses.setDefault('color', Color.typedColor(0, 255, 0));
      roads.setDefault('color', Color.typedColor(0, 0, 0));

      // util.repeat(Math.round(patches.length/10), (i) =>
      //  roads.setBreed(patches.oneOf())
      // patches.filter((p) => Math.abs(p.x) === Math.abs(p.y))
      //   .forEach((p) => {
      //     roads.setBreed(p)
      //     // p.setColor(p.color) // set default color
      //     p.neighbors.forEach((n) => roads.setBreed(n))
      //   })
      patches.forEach(p => {
        // avoid patches.filter, causes Patches ctor.
        if (Math.abs(p.x) === Math.abs(p.y)) {
          roads.setBreed(p);
          p.neighbors.forEach(n => roads.setBreed(n));
        }
      });
      roads.forEach(r => r.setColor(r.color));
      // roads.setBreed(patches[0])
      // roads.setBreed(patches[1])
      houses.setBreed(patches[10]);
      houses.setBreed(patches[11]);
      houses.setBreed(patches[12]);

      // // const patches = new Patches(model, patchProto, 'patches')
      // const patches = model.patches
      // console.log(patches)
      // // util.repeat(5, (i) => patches.add({}))
      // util.toWindow({ Patches, patches })
      //
      // const cmap = ColorMap.rgbColorCube(8, 8, 4)
      // // const cmap = ColorMap.gradientColorMap(256, ColorMap.jetColors)
      // // const cmap = ColorMap.cssColorMap(ColorMap.basicColorNames)
      // for (const p of patches) p.setColor(cmap.randomColor())
      // // for (const p of patches) p.setColor(Color.randomTypedColor())
      // patches.draw(model.contexts.patches)

      // const ctx = model.contexts.patches
      // const can = ctx.canvas
      // const pixels = patches.pixels
      // const pctx = patches.pixels.ctx
      // const pcan = pctx.canvas
      // util.toWindow({ cmap, ctx, can, pixels, pctx, pcan })
      // util.addToDom(pcan)
      //
      // console.log('gradient: 25 values using the 9 jetColor gradient stops:')
      // console.log(ColorMap.gradientColorMap(25, ColorMap.jetColors).toString())
      //
      // const anim = new Animator(model)
      // util.toWindow({ anim })
    }
  };
});
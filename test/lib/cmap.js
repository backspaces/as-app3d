'use strict';

System.register(['lib/Color.js', 'lib/ColorMap.js', 'lib/util.js'], function (_export, _context) {
  var Color, ColorMap, util;
  return {
    setters: [function (_libColorJs) {
      Color = _libColorJs.default;
    }, function (_libColorMapJs) {
      ColorMap = _libColorMapJs.default;
    }, function (_libUtilJs) {
      util = _libUtilJs.default;
    }],
    execute: function () {

      util.toWindow({ util, Color, ColorMap, pps: util.pps }); // Import the lib/ mmodules via relative paths


      console.log('util, Color, ColorMap');
      console.log('u, c, cmap');

      const tc = Color.typedColor(255, 0, 0);
      console.log('typedColor tc: color', tc.toString(), 'string', tc.getString(), 'pixel', tc.getPixel());

      const tcstr = Color.toTypedColor('red');
      const tcpix = Color.toTypedColor(4278190335); // red
      const tca = Color.toTypedColor([255, 0, 0]);
      const tcta = Color.toTypedColor(new Uint8Array([255, 0, 0, 255]));

      console.log('toTypedColor: tcstr, tcpix, tca, tcta', tcstr.toString(), tcpix.toString(), tca.toString(), tcta.toString());
      util.toWindow({ tc, tcstr, tcpix, tca, tcta });

      // util.step(10, 2, (i) => console.log(i))
      const gid = ColorMap.gradientImageData(10, ['red', 'green']);
      console.log('gradientImageData', gid);

      const gic = ColorMap.typedArrayToTypedColors(gid);
      console.log('gradientImageColors', util.arraysToString(gic));

      const c0 = gic[0];
      console.log('color0', c0, c0.getPixel(), c0.getString());

      const rgbs = ColorMap.permuteRGBColors(2, 2, 3);
      console.log('permuteRGBColors(2,2,3)', util.arraysToString(rgbs));
      console.log('permuteRGBColors length)', rgbs.length);

      const trgbs = ColorMap.arraysToColors(rgbs);
      console.log('arraysToColors', util.arraysToString(trgbs));

      const basicmap = ColorMap.basicColorMap(rgbs);
      console.log('basicmap', basicmap.toString());
      console.log('basicmap prototypes');util.pps(basicmap);
      const basicmap0 = basicmap[0];
      console.log('basicmap[0] prototypes', basicmap0);util.pps(basicmap0);

      console.log('lookup basicmap[5]', basicmap.lookup(basicmap[5]));
      basicmap.createIndex();
      console.log('lookup basicmap[5] w/ index', basicmap.lookup(basicmap[5]));

      console.log('random color', basicmap.randomColor());

      console.log('scaleColor(i, 0, 5) for i in [0, 5]');
      util.repeat(6, i => {
        const c = basicmap.scaleColor(i, 0, 5);
        const ix = basicmap.lookup(c);
        console.log('c', c, 'i', i, 'ix', ix);
      });

      const webglArray = basicmap.webglArray();
      console.log('webglArray', webglArray);

      const graymap = ColorMap.grayColorMap(16);
      console.log('graymap(16)', graymap.toString());

      const rgbcube = ColorMap.rgbColorCube(4, 4, 2);
      console.log('rgbcube(4,4,2)', rgbcube.toString());

      const rgbmap = ColorMap.rgbColorMap([100, 200, 300], [255], [128, 255]);
      console.log('rgbmap([100,200,300],[255],[128,255])', rgbmap.toString());

      const hslmap = ColorMap.hslColorMap(util.aIntRamp(0, 350, 25));
      console.log('hslColorMap(util.aIntRamp(0, 350, 100))', hslmap.toString());

      const gradientmap = ColorMap.gradientColorMap(50, ColorMap.jetColors);
      console.log('cmap.jetColors:', util.arraysToString(ColorMap.jetColors));
      console.log('gradientColorMap(50, ColorMap.jetColors)', gradientmap.toString());

      const redorange = ColorMap.gradientColorMap(11, ['red', 'blue']);
      console.log('red-blue gradient', redorange.toString());
      const nlred = ColorMap.gradientColorMap(11, ['black', 'red', 'white']);
      console.log('NetLogo red ramp', nlred.toString());

      const cssmap = ColorMap.cssColorMap(ColorMap.basicColorNames);
      console.log('cssmap(basicColorNames)', cssmap.toString());

      const cube432 = ColorMap.rgbColorCube(4, 3, 2);
      const arrays432 = cube432.map(a => [a[0], a[1], a[2]]);
      console.log('cube432', cube432.toString());
      console.log('arrays432', util.arraysToString(arrays432));

      util.toWindow({ gid, gic, c0, rgbs, trgbs, basicmap, basicmap0, webglArray, graymap, rgbcube, rgbmap, hslmap, gradientmap, redorange, cssmap, cube432, arrays432 });

      util.repeat(5, i => {
        const r = Color.randomTypedColor();
        const rc = rgbcube.rgbClosestColor(...r);
        const rd = rgbcube.cubeClosestColor(...r);
        console.log(i, r.toString(), rc.toString(), rd.toString());
      });
    }
  };
});
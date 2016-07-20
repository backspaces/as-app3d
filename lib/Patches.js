'use strict';

System.register(['./AgentSet.js', './util.js'], function (_export, _context) {
  var AgentSet, util;
  return {
    setters: [function (_AgentSetJs) {
      AgentSet = _AgentSetJs.default;
    }, function (_utilJs) {
      util = _utilJs.default;
    }],
    execute: function () {

      // Patches are the world other agentsets live on. They create a coord system
      // from Model's world values: size, minX, maxX, minY, maxY
      class Patches extends AgentSet {
        constructor(model, agentProto, name, baseSet = null) {
          super(model, agentProto, name, baseSet);
          // Skip if an basic Array ctor or a breedSet. See AgentSet comments.
          if (typeof model === 'number' || this.isBreedSet()) return;
          this.world = model.world;
          this.populate();
          this.setPixels();
        }
        // Set up all the patches.
        populate() {
          util.repeat(this.world.numX * this.world.numY, i => {
            this.add(Object.create(this.agentProto));
          });
        }
        // Setup pixels used for patch.color: `draw` and `importColors`
        setPixels() {
          const { patchSize, numX, numY } = this.world;
          const ctx = this.model.contexts.patches;
          const pixels = this.pixels = { are1x1: patchSize === 1 };
          pixels.ctx = pixels.are1x1 ? ctx : util.createCtx(numX, numY);
          this.setImageData();
        }
        // Create the pixels object used by `setPixels` and `installColors`
        setImageData() {
          const pixels = this.pixels;
          pixels.imageData = util.ctxImageData(pixels.ctx);
          pixels.data = pixels.imageData.data;
          pixels.data32 = new Uint32Array(pixels.data.buffer);
        }

        // Return the offsets from a patch for its 8 element neighbors.
        // Specialized to be faster than patchRect below.
        neighborsOffsets(x, y) {
          const { minX, maxX, minY, maxY, numX } = this.world;
          if (x === minX) {
            if (y === minY) return [-numX, -numX + 1, 1];
            if (y === maxY) return [1, numX + 1, numX];
            return [-numX, -numX + 1, 1, numX + 1, numX];
          }
          if (x === maxX) {
            if (y === minY) return [-numX - 1, -numX, -1];
            if (y === maxY) return [numX, numX - 1, -1];
            return [-numX - 1, -numX, numX, numX - 1, -1];
          }
          if (y === minY) return [-numX - 1, -numX, -numX + 1, 1, -1];
          if (y === maxY) return [1, numX + 1, numX, numX - 1, -1];
          return [-numX - 1, -numX, -numX + 1, 1, numX + 1, numX, numX - 1, -1];
        }
        // Return the offsets from a patch for its 4 element neighbors (N,S,E,W)
        nighbors4Offsets(x, y) {
          const numX = this.world.numX;
          return this.neighborsOffsets(x, y).filter(n => [1, -1, numX, -numX].indexOf(n) >= 0);
        }
        // Return my 8 patch neighbors
        neighbors(patch) {
          const { id, x, y } = patch;
          const offsets = this.neighborsOffsets(x, y);
          offsets.forEach((o, i, a) => {
            a[i] = this[o + id];
          });
          return this.asSet(offsets);
        }
        // Return my 4 patch neighbors
        neighbors4(patch) {
          const { id, x, y } = patch;
          const offsets = this.nighbors4Offsets(x, y);
          offsets.forEach((o, i, a) => {
            a[i] = this[o + id];
          });
          return this.asSet(offsets);
        }

        // Patches in rectangle dx, dy from p, dx, dy integers.
        patchesInRect(p, dx, dy = dx, meToo = true) {
          // Return cached rect if one exists.
          if (p.pRect && p.pRect.length === dx * dy) return p.pRect;
          const rect = [];
          const { minX, maxX, minY, maxY } = this.world;
          const [xmin, xmax] = [Math.max(minX, p.x - dx), Math.min(maxX, p.x + dx)];
          const [ymin, ymax] = [Math.max(minY, p.y - dy), Math.min(maxY, p.y + dy)];
          for (let y = ymin; y <= ymax; y++) for (let x = xmin; x <= xmax; x++) {
            const pnext = this.patchXY(x, y);
            if (meToo || p !== pnext) rect.push(pnext);
          }
          return this.asSet(rect);
        }
        // Patches in circle r from p, r integer.
        patchesInRadius(p, radius, meToo = true) {
          const rect = this.patchesInRect(p, radius, radius, meToo);
          const rSq = radius * radius;
          const distSq = p1 => util.distanceSq(p1.x, p1.y, p.x, p.y);
          return rect.filter(p1 => distSq(p1) <= rSq);
        }

        // Draw the patches onto the ctx using the pixel image data colors.
        draw(ctx = this.model.contexts.patches) {
          const { pixels } = this;
          pixels.ctx.putImageData(pixels.imageData, 0, 0);
          if (pixels.are1x1) return;
          util.fillCtxWithImage(ctx, pixels.ctx.canvas);
        }
        // Draws, or "imports" an image URL into the drawing layer.
        // The image is scaled to fit the drawing layer.
        // This is an async function, using es6 Promises.
        importDrawing(imageSrc) {
          util.imagePromise(imageSrc).then(img => this.installDrawing(img));
        }
        // Direct install image into the given context, not async.
        installDrawing(img, ctx = this.model.contexts.drawing) {
          util.fillCtxWithImage(ctx, img);
        }
        importColors(imageSrc) {
          util.imagePromise(imageSrc).then(img => this.installColors(img));
        }
        // Direct install image into the patch colors, not async.
        installColors(img) {
          util.fillCtxWithImage(this.pixels.ctx, img);
          this.setImageData();
        }

        // Return true if x,y floats are within patch world.
        isOnWorld(x, y) {
          const { minXcor, maxXcor, minYcor, maxYcor } = this.world;
          return minXcor <= x && x <= maxXcor && minYcor <= y && y <= maxYcor;
        }
        // Return patch at x,y float values according to topology.
        // Return undefined if off-world
        patch(x, y) {
          if (!this.isOnWorld) return undefined;
          return this.patchXY(Math.round(x), Math.round(y));
        }
        // Return the patch id/index given valid integer x,y in patch coords
        patchIndex(x, y) {
          const { minX, maxY, numX } = this.world;
          return x - minX + numX * (maxY - y);
        }
        // Return the patch at x,y where both are valid integer patch coordinates.
        patchXY(x, y) {
          return this[this.patchIndex(x, y)];
        }
        pixelXYtoPatchXY(x, y) {
          const { patchSize, minXcor, maxYcor } = this.world;
          return [minXcor + x / patchSize, maxYcor - y / patchSize];
        }

        // Return a random valid float x,y point in patch space
        randomPt() {
          const { minXcor, maxXcor, minYcor, maxYcor } = this.world;
          return [util.randomFloat2(minXcor, maxXcor), util.randomFloat2(minYcor, maxYcor)];
        }
        // Return a random patch.
        randomPatch() {
          return this.oneOf();
        }

        // Diffuse the value of patch variable `p.v` by distributing `rate` percent
        // of each patch's value of `v` to its neighbors.
        // If a color map is given, scale the patch color via variable's value
        // If the patch has less than 4/8 neighbors, return the extra to the patch.
        diffuse(v, rate, colorMap = null, min = 0, max = 1) {
          this.diffuseN(8, v, rate, colorMap, min, max);
        }
        diffuse4(v, rate, colorMap = null, min = 0, max = 1) {
          this.diffuseN(4, v, rate, colorMap, min, max);
        }
        diffuseN(n, v, rate, colorMap = null, min = 0, max = 1) {
          if (n !== 4 && n !== 8) util.error('diffuseN n != 4 or 8');
          // zero temp variable if not yet set
          if (this[0]._diffuseNext === undefined) for (const p of this) p._diffuseNext = 0;
          // pass 1: calculate contribution of all patches to themselves and neighbors
          for (const p of this) {
            const dv = p[v] * rate;
            const dvn = dv / n;
            const neighbors = n === 8 ? p.neighbors : p.neighbors4;
            const nn = neighbors.length;
            p._diffuseNext += p[v] - dv + (n - nn) * dvn;
            for (const n of neighbors) n._diffuseNext += dvn;
          }
          // pass 2: set new value for all patches, zero temp,
          // modify color if colorMap given
          for (const p of this) {
            p[v] = p._diffuseNext;
            p._diffuseNext = 0;
            if (colorMap) p.setColor(colorMap.scaleColor(p[v], min, max));
          }
        }

      }

      _export('default', Patches);
    }
  };
});
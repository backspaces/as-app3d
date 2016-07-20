'use strict';

System.register(['./Patches.js', './Patch.js', './Animator.js', './util.js'], function (_export, _context) {
  var Patches, patchProto, Animator, util;
  return {
    setters: [function (_PatchesJs) {
      Patches = _PatchesJs.default;
    }, function (_PatchJs) {
      patchProto = _PatchJs.default;
    }, function (_AnimatorJs) {
      Animator = _AnimatorJs.default;
    }, function (_utilJs) {
      util = _utilJs.default;
    }],
    execute: function () {

      // Class Model is the primary interface for modelers, integrating
      // all the parts of a model. It also contains NetLogo's `observer` methods.
      class Model {
        // Static class methods for default settings.
        static defaultWorld() {
          return {
            patchSize: 13,
            minX: -16,
            maxX: 16,
            minY: -16,
            maxY: 16
          };
        }
        static defaultContexts() {
          return { // NOTE: Text Layer?
            patches: { z: 10, ctx: '2d' },
            drawing: { z: 20, ctx: '2d' },
            links: { z: 30, ctx: '2d' },
            turtles: { z: 40, ctx: '2d' }
          };
        }

        // The Model constructor takes a DOM div and overrides for defaults
        constructor(div, worldOptions = {}, contextOptions = {}) {
          // Create this model's `world` object
          this.world = Model.defaultWorld();
          Object.assign(this.world, worldOptions);
          this.setWorld();

          // Store and initialize the model's div and contexts.
          this.div = div;
          this.setDiv();
          if (this.div) {
            // otherwise 'headless'
            if (!this.contexts) {
              const contexts = Model.defaultContexts();
              Object.assign(contexts, contextOptions);
              this.initContexts(contexts);
            }
          }
          // Initialize the model by calling the methods used to reset the model.
          // Similar to calling NetLogo's `clear` methods.
          this.reset();
        }
        // (Re)initialize the model.
        reset(restart = false) {
          if (this.anim) this.anim.stop();
          this.setWorld();
          this.setDiv();
          this.setContexts();

          this.anim = new Animator(this);
          this.refreshLinks = this.refreshTurtles = this.refreshPatches = true;
          this.patches = new Patches(this, patchProto, 'patches');

          this.setup();
          if (restart) this.start();
        }

        // Add additional world variables derived from constructor's `worldOptions`.
        setWorld() {
          const world = this.world;
          world.numX = world.maxX - world.minX + 1;
          world.numY = world.maxY - world.minY + 1;
          world.pxWidth = world.numX * world.patchSize;
          world.pxHeight = world.numY * world.patchSize;
          world.minXcor = world.minX - 0.5;
          world.maxXcor = world.maxX + 0.5;
          world.minYcor = world.minY - 0.5;
          world.maxYcor = world.maxY + 0.5;
        }
        // Adjust the modle's `div` for adding layers of canvases.
        setDiv() {
          let div = this.div;
          div = util.isString(div) ? document.getElementById(div) : div;
          if (div) {
            // can be null for headless
            // Note: el.setAttribute 'style' erases existing style,
            // el.style.xx does not
            div.style.position = 'relative';
            div.style.width = this.world.pxWidth;
            div.style.height = this.world.pxHeight;
          }
          this.div = div;
        }
        // Initialize layers of canvas contexts within `div`.
        initContexts(contexts) {
          util.forAll(contexts, (val, key) => {
            if (val === null) return;
            const ctx = util.createCtx(1, 1, val.ctx);
            Object.assign(ctx.canvas.style, {
              position: 'absolute', top: 0, left: 0, zIndex: val.z
            });
            this.div.appendChild(ctx.canvas);
            contexts[key] = ctx;
          });
          this.contexts = contexts;
        }
        // Adjust contexts to current width/height, setting their transform.
        // Set patches anti-aliasing off so as to have "crisp" pixels.
        setContexts() {
          const { pxWidth: width, pxHeight: height } = this.world;
          util.forAll(this.contexts, (ctx, key) => {
            if (ctx === null) return;
            Object.assign(ctx.canvas, { width, height });
            Object.assign(ctx.canvas.style, { width, height });
            this.setCtxTransform(ctx);
            if (key === 'patches') util.setCtxSmoothing(ctx, false);
          });
        }
        // Set the context transforms to be Patch coordinates.
        setCtxTransform(ctx) {
          ctx.save();
          ctx.scale(this.world.patchSize, -this.world.patchSize);
          ctx.translate(-this.world.minXcor, -this.world.maxYcor);
        }

        // ### User Model Creation
        // A user's model is made by subclassing Model and over-riding these
        // three abstract methods. `super` need not be called.

        // Initialize model resources (images, files) here.
        startup() {} // called by constructor
        // Initialize your model variables and defaults here.
        setup() {} // called by constructor and reset
        // Update/step your model here
        step() {} // called each step of the animation

        // Start/stop the animation
        start() {
          this.anim.start();
        }
        stop() {
          this.anim.stop();
        }
        // Animate once by `step(); draw()`.
        once() {
          this.stop();this.anim.once();
        } // stop is no-op if already stopped

        // Change the patch size, does not require a restart or stop/start
        setPatchSize(size) {
          this.world.patchSize = size;
          this.setWorld();
          this.setDiv();
          this.setContexts();
          this.patches.setPixels();
        }
        // Change the world parameters. Requires a reset.
        // Resets Patches, Turtles, Links & reinitializes canvases.
        // If restart argument is true (default), will restart after resetting.
        resizeWorld(worldOptions, restart = true) {
          Object.assign(this.world, worldOptions);
          this.setWorld(this.world);
          this.reset(restart);
        }

        draw(force = this.anim.stopped || this.anim.draws === 1) {
          if (this.div) {
            if (force || this.refreshPatches) this.patches.draw(this.contexts.patches);
          }
        }

        // Breeds: create subarrays of Patches, Agentss, Links
        patchBreeds(breedNames) {
          for (const breedName of breedNames.split(' ')) {
            this[breedName] = new Patches(this, patchProto, breedName, this.patches);
          }
        }
      }

      _export('default', Model);
    }
  };
});
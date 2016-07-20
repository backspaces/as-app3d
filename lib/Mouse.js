'use strict';

System.register(['lib/util.js'], function (_export, _context) {
  var util;
  return {
    setters: [function (_libUtilJs) {
      util = _libUtilJs.default;
    }],
    execute: function () {
      // A minimal mouse module, defaulting to NetLogo's state based approach:
      // `mouse.down`, `mouse.moved` sampled in Model.step.
      // `mouse.x` and `mouse.y` are in patch coords, float.

      class Mouse {
        // Create a mouse obj. Args: a model, toggleMove bool, and a callback fcn.
        // `toggleMove` set true if move events emitted only when mouse down.
        // If false, mimics NetLogo: move is always enabled.
        // `callback` called with mouse as argument. Generally not needed,
        // model.step can sample mouse state: `down`, `move`, `x`, `y`.
        constructor(model, toggleMove = false, callback = null) {
          Object.assign(this, { model, toggleMove, callback, div: model.div });
          // Note: evt handlers must be unique, for removeEventListener to work right.
          this.downHandler = e => {
            this.mouseDown(e);
          };
          this.upHandler = e => {
            this.mouseUp(e);
          };
          this.moveHandler = e => {
            this.mouseMove(e);
          };
          this.resetParams();
        }
        // Initialize variables to 'off'
        resetParams() {
          this.x = this.y = null;this.moved = this.down = false;
        }

        // Start/stop the mouseListeners.
        start() {
          // Note: multiple calls safe
          const [div, body] = [this.div, document.body];
          div.addEventListener('mousedown', this.downHandler);
          body.addEventListener('mouseup', this.upHandler);
          if (!this.toggleMove) div.addEventListener('mousemove', this.moveHandler);
          this.resetParams();
        }
        stop() {
          // Note: multiple calls safe
          const [div, body] = [this.div, document.body];
          div.removeEventListener('mousedown', this.downHandler);
          body.removeEventListener('mouseup', this.upHandler);
          div.removeEventListener('mousemove', this.moveHandler);
          this.resetParams();
        }

        // Handlers for eventListeners
        mouseDown(e) {
          this.generalHandler(e, true, false);
        }
        mouseUp(e) {
          this.generalHandler(e, false, false);
        }
        mouseMove(e) {
          this.generalHandler(e, this.down, true);
        }
        generalHandler(event, down, moved) {
          Object.assign(this, { down, moved, event });
          this.setXY(event);
          if (this.toggleMove && !moved) if (down) this.div.addEventListener('mousemove', this.moveHandler);else this.div.removeEventListener('mousemove', this.moveHandler);
          if (this.callback) this.callback(this);
        }

        // set x, y to be event location in patch coordinates.
        setXY(e) {
          const [pixX, pixY] = util.getEventXY(this.div, e);[this.x, this.y] = this.model.patches.pixelXYtoPatchXY(pixX, pixY);
        }

      }

      _export('default', Mouse);
    }
  };
});
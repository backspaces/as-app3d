'use strict';

System.register(['./Color.js'], function (_export, _context) {
  var Color;
  return {
    setters: [function (_ColorJs) {
      Color = _ColorJs.default;
    }],
    execute: function () {

      // Objects within AgentSets use "prototypal inheritance".
      // The PatchProto is given to Patches for use creating Patch objects.
      const PatchProto = {
        // Initialize a Patch given its Patches AgentSet.
        init(agentSet) {
          const defaults = this.baseVariables();
          defaults.world = agentSet.world;
          Object.setPrototypeOf(defaults, this);
          return defaults;
        },
        // Return an object that will initially be the "default" variables
        // layer in a patch prototype stack.
        baseVariables() {
          // Core variables for patches. Not 'own' variables.
          return {
            id: null, // unique id, set by agentset's add() method
            agentSet: null, // my agentset, set by the constructor owning me
            label: null, // text for this patch, if any
            labelOffset: [0, 0], // text offset from the patch center
            labelColor: Color.typedColor(0, 0, 0), // the label color
            color: Color.typedColor(0, 0, 0) // the patch color
          };
        },

        // Getter/setter for x,y derived from patch id.
        get x() {
          return this.id % this.world.numX + this.world.minX;
        },
        get y() {
          return this.world.maxY - Math.floor(this.id / this.world.numX);
        },

        // Getter/setter for neighbors of this patch.
        // Uses lazy evaluation to promote neighbors to instance variables.
        get neighbors() {
          // lazy promote neighbors from getter to instance prop.
          const n = this.agentSet.baseSet.neighbors(this);
          Object.defineProperty(this, 'neighbors', { value: n, enumerable: true });
          return n;
        },
        get neighbors4() {
          const n = this.agentSet.baseSet.neighbors4(this);
          Object.defineProperty(this, 'neighbors4', { value: n, enumerable: true });
          return n;
        },

        // Manage colors by directly setting pixels in Patches pixels object
        setColor(typedColor) {
          this.agentSet.baseSet.pixels.data32[this.id] = typedColor.getPixel();
        },
        getColor(typedColor) {
          return this.agentSet.baseSet.pixels.data32[this.id];
        },

        // Return patch dx, dy from my position. Return undefined if off-world.
        patchAt(dx, dy) {
          return this.agentSet.baseSet.patch(this.x + dx, this.y + dy);
        }
      };

      _export('default', PatchProto);
    }
  };
});
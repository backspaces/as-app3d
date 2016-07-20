'use strict';

System.register(['./util.js'], function (_export, _context) {
  var util;
  return {
    setters: [function (_utilJs) {
      util = _utilJs.default;
    }],
    execute: function () {

      // AgentSets are arrays that are factories for their own agents/objects.
      // They are the base for Patches, Turtles and Links.

      // Vocab: AgentSets are NetLogo collections: Patches, Turtles, and Links.
      // Agent is an object in an AgentSet: Patch, Turtle, Link.

      class AgentSet extends Array {
        // Create an empty `AgentSet` and initialize the `ID` counter for add().
        // If baseSet is supplied, the new agentset is a subarray of baseSet.
        // This sub-array feature is how breeds are managed, see class `Model`
        constructor(model, agentProto, name, baseSet = null) {
          console.log('AgentSet ctor', arguments);
          // Because es6 JavaScript Array itself calls the Array ctor
          // (ex: slice() returning a new array), skip if not AgentSet ctor.
          if (typeof model === 'number') {
            super(model); // model is a number, return Array of that size
          } else {
              super(0); // create empty array
              baseSet = baseSet || this; // if not a breed, set baseSet to this
              // AgentSets know their model, name, baseSet, world.
              Object.assign(this, { model, name, baseSet, world: model.world });
              // Create a proto for our agents by having a defaults and instance layer
              this.agentProto = agentProto.init(this);
              // Link our agents to us
              this.agentProto.agentSet = this;
              // BaseSets know their breeds and keep the ID global
              if (this.isBaseSet()) {
                this.breeds = {}; // will contain breedname: breed entries
                this.ID = 0;
                // Breeds add themselves to baseSet.
              } else {
                  this.baseSet.breeds[name] = this;
                }
              // Keep a list of this set's variables; see `own` below
              this.ownVariables = ['id'];
            }
        }

        // Is this a baseSet or a derived "breed"
        isBreedSet() {
          return this.baseSet !== this;
        }
        isBaseSet() {
          return this.baseSet === this;
        }

        // Abstract method used by subclasses to create and add their instances.
        create() {}
        // Add an agent to the list.  Only used by agentset factory methods. Adds
        // the `id` property to all agents. Increment `ID`.
        // Returns the object for chaining. The set will be sorted by `id`.
        add(o) {
          if (this.isBreedSet()) this.baseSet.add(o);else o.id = this.ID++;
          this.push(o);
          return o;
        }
        // Remove an agent from the agentset, returning the agentset for chaining.
        remove(o) {
          // Remove me from my baseSet
          if (this.isBreedSet()) util.removeItem(this.baseSet, o, 'id');
          // Remove me from my set.
          util.removeItem(this, o, 'id');
          return this;
        }

        // Get/Set default values for this agentset's agents.
        setDefault(name, value) {
          this.agentProto[name] = value;
        }
        getDefault(name) {
          this.agentProto[name];
        }
        // Declare variables of an agent class.
        // `varnames` is a string of space separated names
        own(varnames) {
          if (this.isBreedSet()) this.ownVariables = util.clone(this.baseSet.ownVariables);
          for (const name of varnames.split(' ')) {
            this.ownVariables.push(name);
          }
        }

        // Move an agent from its AgentSet/breed to be in this AgentSet/breed.
        // REMIND: match NetLogo sematics in terms of own variables.
        setBreed(a) {
          // change agent a to be in this breed
          // Return if `a` is already of my breed
          if (a.agentSet === this) return;
          // Remove/insert breeds (not baseSets) from their agentsets
          if (a.agentSet.isBreedSet()) util.removeItem(a.agentSet, a, 'id');
          if (this.isBreedSet()) util.insertItem(this, a, 'id');

          // Make list of `a`'s vars and my ownvars.
          const avars = a.agentSet.ownVariables;
          // First remove `a`'s vars not in my ownVariables
          for (const avar of avars) if (!this.ownVariables.includes(avar)) delete a[avar];
          // Now add ownVariables to `a`'s vars, default to 0.
          // If ownvar already in avars, it is not modified.
          for (const ownvar of this.ownVariables) if (!avars.includes(ownvar)) a[ownvar] = 0; // NOTE: NL uses 0, maybe we should use null?

          // Give `a` my defaults/statics
          return Object.setPrototypeOf(a, this.agentProto);
        }

        // Method to convert an array to the same AgentSet type as this.
        asSet(array) {
          return Object.setPrototypeOf(array, Object.getPrototypeOf(this));
        }

        // ### General Array of Objects methods

        // Return true if there are no items in this set, false if not empty.
        empty() {
          return this.length === 0;
        }
        // Return !empty()
        any() {
          return this.length !== 0;
        }
        // Return last item in this array. Returns undefined if empty.
        last() {
          return this[this.length - 1];
        }
        // Return true if reporter true for all of this set's objects
        all(reporter) {
          return this.every(reporter);
        }
        // Return property values for key from this array's objects
        props(key) {
          return this.map(a => a[key]);
        }

        // Return shallow copy of a protion of this agentset
        // [See Array.slice](https://goo.gl/Ilgsok)
        // Default is to clone entire agentset
        clone(begin = 0, end = this.length) {
          return this.slice(begin, end); // Wow, returns an agentset rather than Array!
        }
        // Return this agentset sorted by the reporter in ascending/descending order.
        // If reporter is a string, convert to a fcn returning that property.
        // Use clone if you don't want to mutate this array.
        sortBy(reporter, ascending = true) {
          util.sortObjs(this, reporter, ascending);
          return this;
        }

        // Return a random agent. Return undefined if empty.
        oneOf() {
          return this[util.randomInt(this.length)];
        }
        // Return the first agent having the min/max of given value of f(agent).
        // If reporter is a string, convert to a fcn returning that property
        minOrMaxOf(min, reporter) {
          if (this.empty()) util.error('min/max OneOf: empty array');
          if (typeof reporter === 'string') reporter = util.propFcn(reporter);
          let o = null;
          let val = min ? Infinity : -Infinity;
          for (let i = 0; i < this.length; i++) {
            const a = this[i];
            const aval = reporter(a);
            if (min && aval < val || !min && aval > val) [o, val] = [a, aval];
          }
          return o;
        }
        // The min version of the above
        minOneOf(reporter) {
          return this.minOrMaxOf(true, reporter);
        }
        // The max version of the above
        maxOneOf(reporter) {
          return this.minOrMaxOf(false, reporter);
        }

        // Return n random agents as agentset.
        // See [Fisher-Yates-Knuth shuffle](https://goo.gl/fWNFf)
        // for better approach for large n.
        nOf(n) {
          // I realize this is a bit silly, lets hope random doesn't repeat!
          if (n > this.length) util.error('nOf: n larger than agentset');
          if (n === this.length) return this;
          const result = [];
          while (result.length < n) {
            const o = this.oneOf();
            if (!(o in result)) result.push(o);
          }
          return this.asSet(result);
        }
        // Return a new agentset of the n min/max agents of the value of reporter,
        // in ascending order.
        // If reporter is a string, convert to a fcn returning that property
        // NOTE: we do not manage ties, see NetLogo docs.
        minOrMaxNOf(min, n, reporter) {
          if (n > this.length) util.error('min/max nOf: n larger than agentset');
          const as = this.clone().sortBy(reporter);
          return min ? as.clone(0, n) : as.clone(as.length - n);
        }
        minNOf(n, reporter) {
          return this.minOrMaxNOf(true, n, reporter);
        }
        maxNOf(n, reporter) {
          return this.minOrMaxNOf(false, n, reporter);
        }

      }

      _export('default', AgentSet);
    }
  };
});
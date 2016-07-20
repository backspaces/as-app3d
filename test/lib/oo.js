'use strict';

System.register(['lib/util.js'], function (_export, _context) {
  var util;
  return {
    setters: [function (_libUtilJs) {
      util = _libUtilJs.default;
    }],
    execute: function () {
      window.pps = util.pps;

      class Agent {
        constructor(myAgentSet) {
          this.myAgentSet = myAgentSet;
        }
        getDefaultable(name) {
          return this[name] || this.myAgentSet.defaults[name];
        }
        getColor() {
          return this.getDefaultable('color');
        }
        setColor(color) {
          this.color = color;
        }
      }

      class AgentSet extends Array {
        constructor() {
          super();
          this.defaults = {};
        }
        create() {
          this.push(new Agent(this));return this[this.length - 1];
        }
        setDefault(name, value) {
          this.defaults[name] = value;
        }

      }

      // let p = { x: 1 }
      // if (p.x / 4 % 2) {
      //   p.color = [255, 0, 255] }
      // else {
      //   p.color = [Math.random() * 255, Math.random() * 255, Math.random() * 255] }

      util.toWindow({ Agent, AgentSet, util });

      const as = window.as = new AgentSet();
      as.setDefault('color', 'red');
      const a = window.a = as.create();

      util.toWindow({ as, a });

      console.log('a.color', a.getColor());
      util.pps(as, 'as');
      util.pps(a, 'a');
    }
  };
});
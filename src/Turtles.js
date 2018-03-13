import {util, Turtles as CoreTurtles} from '../agentscript/agentscript.esm.js'

// See CoreTurtles for architecture
class Turtles extends CoreTurtles {
  // Use CoreTurtle's ctor:
  // constructor (model, AgentClass, name) {
  create (num = 1, initFcn = (turtle) => {}) {
    return util.repeat(num, (i, a) => {
      const turtle = this.addAgent()
      // REMIND: not if default exists
      turtle.theta = util.randomFloat(Math.PI * 2)
      initFcn(turtle)
      if (!turtle.color) turtle.color = this.model.randomColor()
      a.push(turtle) // Return array of new agents. REMIND: should be agentarray?
    })
  }
  test () { console.log(this.map(turtle => turtle.id)) }
}

export default Turtles

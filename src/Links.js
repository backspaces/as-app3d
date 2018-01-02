// import AgentSet from './core/AgentSet.js'
import CoreLinks from './core/Links.js'

// Links are a collection of all the Link objects between turtles.
// class Links extends AgentSet {
class Links extends CoreLinks {
  // Use AgentSeet ctor: constructor (model, AgentClass, name)

  create (from, to, initFcn) {
    const links = super.create(from, to, initFcn)
    links.forEach((link) => {
      if (!link.color) link.color = this.model.randomColor()
    })
    return links
  }

  // REMIND: Test that agentarray returned.
  test () { console.log(this.map(link => link.id)) }
}

export default Links

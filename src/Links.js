// import AgentSet from './core/AgentSet.js'
import CoreLinks from './core/Links.js'

// Links are a collection of all the Link objects between turtles.
// class Links extends AgentSet {
class Links extends CoreLinks {
  // Use AgentSeet ctor: constructor (model, AgentClass, name)

  // Factory: Add 1 or more links from the from turtle to the to turtle(s) which
  // can be a single turtle or an array of turtles. The optional init
  // proc is called on the new link after inserting in the agentSet.
  // create (from, to, initFcn = (link) => {}) {
  create (from, to, initFcn) {
    const links = super.create(from, to, initFcn)
    links.forEach((link) => {
      if (!link.color) link.color = this.model.randomColor()
    })
    return links
    // if (!Array.isArray(to)) to = [to]
    // return to.map((t) => { // REMIND: skip dups
    //   const link = this.addAgent()
    //   link.init(from, t)
    //   initFcn(link)
    //   if (!link.color) link.color = this.model.randomColor()
    //   return link
    // }) // REMIND: return single link if to not an array?
  }
}

export default Links

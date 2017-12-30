import ColorMap from '../src/ColorMap.js'
import Model from '../src/Model.js'
import util from '../src/core/util.js'

util.toWindow({ ColorMap, Model, util })

// A few variables to configure the model:
const transparentPatches = true
const layoutCircle = true

class LinkTravelModel extends Model {
  setup () {
    this.turtleBreeds('nodes drivers')
    this.nodes.setDefault('shape', 'circle')
    this.nodes.setDefault('size', 0.3)
    this.drivers.setDefault('size', 1.5)

    this.refreshPatches = this.refreshLinks = false

    const numNodes = 30
    const numDrivers = 100
    const baseVelocity = 0.1
    const velocityDelta = 0.1

    if (!transparentPatches) {
      this.patches.ask(p => {
        p.color = ColorMap.LightGray.randomColor()
      })
    }

    // Create the graph node turtles
    this.patches.nOf(numNodes).ask(p => {
      p.sprout(1, this.nodes, t => {
        if (this.nodes.length > 2)
          this.links.create(t, this.turtles.otherNOf(2, t))
      })
    })

    if (layoutCircle) {
      this.nodes.layoutCircle(this.world.maxX - 1)
    }

    util.repeat(numDrivers, () => {
      const node = this.nodes.oneOf()
      console.log(node)
      node.hatch(1, this.drivers, (driver) => {
        driver.fromNode = node
        // note: linkNeighbors is a vanilla Array, not an AgentArray.
        driver.toNode = util.oneOf(node.linkNeighbors())
        driver.face(driver.toNode)
        driver.speed = baseVelocity + util.randomFloat(velocityDelta)
      })
    })
  }
  step () {
    this.drivers.ask((driver) => {
      const moveBy = Math.min(driver.speed, driver.distance(driver.toNode))
      driver.face(driver.toNode)
      driver.forward(moveBy)
      if (moveBy < driver.speed) {
        driver.fromNode = driver.toNode
        driver.toNode = util.oneOf(driver.toNode.linkNeighbors())
      }
    })
  }
}

const model = new LinkTravelModel()
model.setup()

//  Debugging
const {world, patches, turtles, links, nodes, drivers} = model
console.log('patches:', patches.length)
console.log('turtles:', turtles.length)
console.log('links:', links.length)
console.log('nodes:', nodes.length)
console.log('drivers:', drivers.length)
util.toWindow({ world, patches, turtles, links, nodes, drivers, model })

model.start()

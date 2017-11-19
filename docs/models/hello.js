import ColorMap from '../src/ColorMap.js'
import Model from '../src/Model.js'
import util from '../src/core/util.js'

class Hello extends Model {
  // Inherit default constructor.
  setup () {
    this.patches.ask(p => {
      p.color = ColorMap.LightGray.randomColor()
    })

    this.turtles.setDefault('atEdge', 'bounce')

    this.turtles.create(10, t => {
      const patch = this.patches.oneOf()
      t.setxy(patch.x, patch.y)
      // If we don't set color, a random color will be used
    })
  }
  step () {
    this.turtles.ask(t => {
      t.direction += util.randomCentered(0.1)
      t.forward(0.1)
    })
  }
}

const model = new Hello()
model.setup()
model.start()
util.toWindow({ ColorMap, Model, util, model })

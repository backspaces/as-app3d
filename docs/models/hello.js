import {ColorMap, Model, util} from '../dist/AS.module.js'

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
      t.size = 2
      // If we don't set color, a random color will be used
    })

    this.turtles.ask(t => {
      this.links.create(t, this.turtles.otherOneOf(t), (link) => {
        link.color = this.randomColor() // Uses Model's colormap
      })
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

// Debugging
util.toWindow({ ColorMap, Model, util })
const { patches, turtles, links } = model
util.toWindow({ patches, turtles, links, model })



import {ColorMap, Model,  util } from '../dist/as-app3d.esm.min.js'

util.toWindow({ ColorMap, Model, util })

class DiffuseModel extends Model {
    setup() {
        // this.patches.own('ran ds')
        this.turtles.setDefault('speed', 0.5)
        this.turtles.setDefault('atEdge', 'wrap')
        this.turtles.setDefault('size', 5)
        this.population = 2
        this.radius = 6

        // this.cmap = ColorMap.Jet
        this.cmap = ColorMap.Rgb256
        // REMIND: Three mouse picking: this.mouse = new Mouse(this, true).start()
        this.patches.ask(p => {
            p.ran = util.randomFloat(1.0)
            // p.ds = 0
        })

        this.patches.nOf(this.population).ask(p => {
            p.sprout(1, this.turtles, t => {
                t.setSize(5)
            })
        })
    }
    step() {
        this.turtles.ask(t => {
            t.theta += util.randomCentered(0.1)
            t.forward(t.speed)
            this.patches.inRadius(t.patch, this.radius, true).ask(p => {
                p.ran = Math.min(p.ran + 0.1, 0.8)
            })
        })

        // this.patches.diffuse('ran', 0.05, this.cmap)
        this.patches.diffuse('ran', 0.05)
        this.patches.scaleColors(this.cmap, 'ran', 0, 1)
    }
}

const options = Model.defaultWorld(200, 100)
const model = new DiffuseModel(document.body, options)
model.setup()
model.start()

//  Debugging
console.log('patches:', model.patches.length)
console.log('turtles:', model.turtles.length)
const { world, patches, turtles, links } = model
util.toWindow({ world, patches, turtles, links, model })



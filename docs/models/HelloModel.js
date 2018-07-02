import {ColorMap, Model,  util } from '../dist/as-app3d.esm.js'

export default class HelloModel extends Model {
    // Inherit default constructor when constructor not provided.
    // Have ctor here to initialize UI variables.
    // Change them after "new HelloModel()"
    constructor(div, world) {
        super(div, world)
        this.population = 10
        this.speed = 0.1
        this.atEdge = 'bounce'
        this.size = 2
    }

    setup() {
        this.patches.ask(p => {
            p.color = ColorMap.LightGray.randomColor()
            // If we don't set color, patches are transparent.
        })

        this.turtles.setDefault('atEdge', this.atEdge)
        this.turtles.setDefault('speed', this.speed)
        this.turtles.setDefault('size', this.size)

        this.turtles.create(this.population, t => {
            const patch = this.patches.oneOf()
            t.setxy(patch.x, patch.y)
            // t.size = this.size
            // If we don't set color, a random color will be used
        })

        this.turtles.ask(t => {
            this.links.create(t, this.turtles.otherOneOf(t))
            // If we don't set color, a random color will be used
        })
    }

    step() {
        this.turtles.ask(t => {
            t.direction += util.randomCentered(0.1)
            t.forward(t.speed)
        })
    }
}



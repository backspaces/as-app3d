import {ColorMap, Model,  util } from '../dist/as-app3d.esm.js'

util.toWindow({ ColorMap, Model, util })

class ButtonsModel extends Model {
    setup() {
        this.refreshPatches = false

        this.turtles.setDefault('shape', 'circle')
        this.turtles.setDefault('size', 1.5)
        this.turtles.setDefault('heading', 0) // override promotion to random angle

        const population = 200 // number of buttons
        this.clusterSize = 0

        // const cmap = ColorMap.grayColorMap(0, 100)
        const cmap = ColorMap.grayColorMap(150, 200)
        this.patches.ask(p => {
            p.setColor(cmap.randomColor())
        })

        this.turtles.create(population, t =>
            t.setxy(...this.patches.randomPt())
        )
    }

    step() {
        if (this.clusterSize === this.turtles.length) return // done, idleing

        const b1 = this.turtles.oneOf()
        const b2 = this.turtles.otherOneOf(b1)

        this.links.create(b1, b2)

        const vertices = this.graphOf(b1)
        for (const v of vertices) v.color = b1.color

        if (vertices.size > this.clusterSize) {
            this.clusterSize = vertices.size
            console.log(
                'New largest cluster: size:' +
                    vertices.size +
                    ' tick:' +
                    this.anim.ticks +
                    ' fps:' +
                    this.anim.fps
            )
            if (this.clusterSize === this.turtles.length) {
                this.anim.setRate(30)
                console.log('done')
            }
        }
    }

    graphOf(t) {
        const vertices = new Set()
        this.addNeighbors(t, vertices)
        return vertices
    }
    addNeighbors(t, vertices) {
        vertices.add(t)
        t.linkNeighbors().ask(n => {
            if (!vertices.has(n)) this.addNeighbors(n, vertices)
        })
    }
}

const model = new ButtonsModel(document.body)
model.setup()
model.start()

// Debugging:
const { patches, turtles, links } = model
console.log('patches:', patches.length)
console.log('turtles:', turtles.length)
console.log('links:', links.length)
util.toWindow({ patches, turtles, links, model })



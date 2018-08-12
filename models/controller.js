import ColorMap from '../src/ColorMap.js'
import Model from '../src/Model.js'
import Controller from '../src/Controller.js'
import { util } from '../agentscript/agentscript.esm.js'

const controls = {
    fps: {
        value: 20,
        extent: { low: 5, medium: 20, high: 60 },
        cmd: fps => model.anim.setRate(fps),
    },
    speed: { value: 0.1, extent: [0, 2, 0.1] },
    wiggle: { value: true },
    toggleRun: {},
    once: {},
    population: {
        value: 10,
        extent: [10, 1000, 10],
        cmd: pop => model.changePopulation(pop),
    },
    fileName: { value: './controller.js' },
    runState: { value: 'running', cmd: 'listen' },
}

class Hello extends Model {
    // Globals set by controls
    // this.runState
    // this.wiggle

    setup() {
        this.turtles.setDefault('size', 2)
        this.turtles.setDefault('atEdge', 'bounce')

        this.patches.ask(p => {
            p.color = ColorMap.LightGray.randomColor()
        })

        this.createTurtles(this.population)
    }
    createTurtles(num) {
        this.turtles.create(num, t => {
            const patch = this.patches.oneOf()
            t.setxy(patch.x, patch.y)
            if (this.turtles.length > 1) {
                this.links.create(t, this.turtles.otherOneOf(t))
            }
        })
    }

    step() {
        this.turtles.ask(t => {
            if (this.wiggle) t.direction += util.randomCentered(0.3)
            t.forward(this.speed)
        })
    }

    once() {
        super.once()
        this.runState = 'stepping'
    }
    toggleRun() {
        this.anim.stopped ? this.start() : this.stop()
        this.runState = this.anim.stopped ? 'stopped' : 'running'
    }
    changePopulation(population) {
        const delta = population - turtles.length
        if (delta === 0) return
        if (delta < 0) {
            while (turtles.length !== population) this.turtles.oneOf().die()
            this.turtles.ask(t => {
                if (t.links.length === 0) {
                    this.links.create(t, this.turtles.otherOneOf(t))
                }
            })
        }
        if (delta > 0) this.createTurtles(delta)
    }
}

const model = new Hello()
const UI = new Controller(model, controls)

model.setup()
model.start()

// Debugging
util.toWindow({ ColorMap, Model, util, UI })
const { patches, turtles, links } = model
util.toWindow({ patches, turtles, links, model })

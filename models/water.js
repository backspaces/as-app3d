import ColorMap from '../src/ColorMap.js'
import Model from '../src/Model.js'
import { util } from '../agentscript/agentscript.esm.js'

util.toWindow({ ColorMap, Model, util })

class WaterModel extends Model {
    setup() {
        this.strength = 57
        this.surfaceTension = 56
        this.friction = 0.99

        this.cmap = ColorMap.gradientColorMap(256, ['navy', 'aqua'])

        this.patches.ask(p => {
            p.zpos = 0
            p.deltaZ = 0
        })
        this.colorPatches()
    }

    step() {
        this.patches.ask(p => this.computeDeltaZ(p))
        this.patches.ask(p => this.updateZ(p))
        this.colorPatches()
        if (this.anim.ticks % 50 === 0) this.createWave(this.patches.oneOf())
    }

    createWave(p) {
        p.zpos = this.strength
    }
    colorPatches() {
        const maxWater = 10
        this.patches.ask(p => {
            p.color = this.cmap.scaleColor(p.zpos, -maxWater, maxWater)
        })
    }
    computeDeltaZ(p) {
        const k = 1 - 0.01 * this.surfaceTension
        const n4 = p.neighbors4
        p.deltaZ = p.deltaZ + k * (n4.sum('zpos') - n4.length * p.zpos)
    }
    updateZ(p) {
        p.zpos = (p.zpos + p.deltaZ) * this.friction
    }
}

const options = Model.defaultWorld(50)
const model = new WaterModel(document.body, options)
model.setup()
model.start()

// Debugging:
const { patches, turtles, links } = model
console.log('patches:', patches.length)
console.log('turtles:', turtles.length)
console.log('links:', links.length)
util.toWindow({ patches, turtles, links, model })

// REMIND: Color.js add scaleColor
// // Scale the color a-la NetLogo:
// // NL: scale-color color number range1 range2
// scale(number, range0, range1) {
//     let [r, g, b] = this
// }

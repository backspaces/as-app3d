import HelloModel from './HelloModel.js'
import Mouse from '../src/Mouse.js'
import { util } from '../agentscript/agentscript.esm.js'

const model = new HelloModel()
model.population = 50
model.size = 1
model.speed = 0.006
model.view.toggleCamera()
model.links.setDefault('color', 'black')

function linkDistance(link, x, y) {
    // const t0 = link.end0
    // const t1 = link.end1
    const d0 = link.end0.distanceXY(x, y)
    const d1 = link.end1.distanceXY(x, y)
    return d0 + d1 - link.length()
}
function closestLink() {
    const dist = l => linkDistance(l, mouse.x, mouse.y)
    return links.minValOf(dist)
}

const can = model.view.renderer.domElement
let turtle = null
let link = null
const cb = e => {
    // console.log(mouse.x, mouse.y, mouse.action, mouse.down, mouse.moved)

    if (['down', 'drag'].includes(mouse.action)) {
        const patch = model.patches.patch(mouse.x, mouse.y)
        if (mouse.action === 'down') {
            const ps = model.patches.inRadius(patch, 2)
            const ts = model.turtles.inPatches(ps)
            turtle = ts.isEmpty() ? null : ts.oneOf()
        }
        if (turtle) {
            turtle.setxy(mouse.x, mouse.y)
        } else {
            patch.color = 'red'
        }
    }
    if (mouse.action === 'move') {
        const [closest, dist] = closestLink()
        // console.log('closest link, dist', closest, dist)
        if (dist < 0.5 && link !== closest) {
            if (link) link.color = 'black'
            link = closest
            link.color = 'red'
        }
    }
    if (mouse.action === 'up') turtle = null
}
const mouse = new Mouse(can, model.world, cb).start()

model.setup()
model.start()

// Debugging
// util.toWindow({ Model, Mouse, util })
const { patches, turtles, links } = model
util.toWindow({
    util,
    patches,
    turtles,
    links,
    model,
    can,
    mouse,
    linkDistance,
    closestLink,
})

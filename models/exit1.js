// /* eslint-disable */
import ColorMap from '../src/ColorMap.js'
import Model from '../src/Model.js'
import { util } from '../agentscript/agentscript.esm.js'
import dat from 'https://unpkg.com/dat.gui/build/dat.gui.module.js'

util.toWindow({ ColorMap, Model, util, dat })

const UI = {
    NumExits: 10, // 10
    Obstacles: 0.1, // percent of inside are obstacles
    Population: 0.2, // 0.75 // percent of inside populated
    NeighborType: 'neighbors',
    StartAt: 'closest',
    Reset: () => {
        model.reset()
        model.setup()
        model.start()
        UI.Log = ''
    },
    UseFlood: !true,
    Squeeze: !true,
    Randomize: () => {
        model.turtles.ask(t => {
            t.exit = model.exits.oneOf()
        })
    },
    ToggleView: () => {
        UI.toggleView()
    },
    TurtleSize: 1.5,
    FPS: 60,
    Log: '',

    setRate() {
        model.anim.setRate(UI.FPS)
    },
    setSize() {
        model.turtles.setDefault('size', UI.TurtleSize)
    },
    currentFlood: 0,
    toggleView() {
        UI.currentFlood = (UI.currentFlood + 1) % (UI.NumExits + 1)
        UI.showInside()
    },
    showInside() {
        if (UI.currentFlood === 0) model.showPatchColors()
        else model.showFlood(model.exits[UI.currentFlood - 1])
    },
}
util.toWindow({ UI })

class ExitModel extends Model {
    constructor(div, options) {
        super(div, options)
        // this.gui = this.view.gui
        this.gui = new dat.GUI()
        this.gui.add(UI, 'NumExits', 1, 12).step(1)
        this.gui.add(UI, 'Obstacles', 0.0, 0.95).step(0.05)
        this.gui.add(UI, 'Population', 0.05, 0.95).step(0.05)
        this.gui.add(UI, 'NeighborType', ['neighbors', 'neighbors4'])
        this.gui.add(UI, 'StartAt', ['closest', 'random'])
        this.gui.add(UI, 'Reset')
        this.gui.add(UI, 'UseFlood')
        this.gui.add(UI, 'Squeeze')
        this.gui.add(UI, 'Randomize')
        this.gui
            .add(UI, 'TurtleSize', 1, 4)
            .step(0.5)
            .onChange(UI.setSize)
        this.gui
            .add(UI, 'FPS', 1, 60)
            .step(1)
            .onChange(UI.setRate)
        this.gui.add(UI, 'ToggleView')
        this.gui.add(UI, 'Log').listen()

        // this.numMoves = 0
        // this.resets = 0
        // this.maxSqueezes = 250
    }
    setup() {
        this.patchBreeds('exits inside wall obstacles')
        this.turtles.setDefault('shape', 'circle')
        // this.turtles.setDefault('size', UI.TurtleSize)
        this.turtles.setDefault('atEdge', turtle => turtle.die())
        UI.setRate()
        UI.setSize()
        this.setupPatches()
        this.setupTurtles()

        // this.done = false
    }
    setupPatches() {
        const { maxX, maxY } = this.world
        this.patches.ask(p => {
            if (Math.abs(p.x) < 0.7 * maxX && Math.abs(p.y) < 0.7 * maxY) {
                p.setBreed(this.inside)
            }
        })
        this.inside.ask(p => {
            p.neighbors4.ask(n => {
                if (n.breed !== this.inside) n.setBreed(this.wall)
            })
        })
        this.wall.nOf(UI.NumExits).ask((p, i) => {
            p.setBreed(this.exits)
            p.floodVar = 'flood' + i
        })
        this.inside.nOf(UI.Obstacles * this.inside.length).ask(p => {
            p.setBreed(this.obstacles)
        })

        // Fix obstacles: no singletons, remove unreachable
        this.obstacles.ask(p => {
            const n = p[UI.NeighborType].filter(p => p.breed === this.inside)
            if (UI.NeighborType === 'neighbors' && n.length >= 7) {
                // 7-8 nieghbors
                const p = n.oneOf() // nOf(9 - n.length)?
                p.setBreed(this.obstacles)
            }
        })
        this.exits.ask(p => {
            p.neighbors4.filter(p => p.breed === this.obstacles).ask(p => {
                p.setBreed(this.inside)
                console.log('blocked', p)
            })
        })

        this.exits.ask(exit => {
            this.floodFill(exit)
        })

        const b4 = this.obstacles.length
        this.inside.filter(p => p.flood0 === -1).ask(p => {
            p.setBreed(this.obstacles)
        })
        console.log('fixed unreachable:', this.obstacles.length - b4)
        this.showPatchColors()
        UI.showInside()
    }
    showPatchColors() {
        const grays = ColorMap.LightGray
        const colors = ColorMap.Basic16
        // const colors = ColorMap.Bright27
        this.patches.ask(p => {
            p.color = grays.randomColor()
        })
        this.obstacles.ask(p => {
            p.color = colors.closestColor(127, 127, 127)
        })
        this.inside.ask(p => {
            p.color = colors.closestColor(0, 0, 0)
        })
        this.wall.ask(p => {
            p.color = colors.closestColor(127, 127, 127)
        })
        this.exits.ask((p, i) => {
            p.setColor(colors[i + 4])
        })
    }
    setupTurtles() {
        const ss = this.spriteSheet

        this.exits.ask(e => {
            e.turtleSprite = ss.newSprite('circle', e.color)
        })

        const turtlePatches = this.inside.nOf(
            UI.Population * this.inside.length
        )
        turtlePatches.ask(p => {
            p.sprout(1, this.turtles, t => {
                if (UI.StartAt === 'closest') {
                    t.exit = this.exits.minOneOf(e => t.distance(e))
                } else {
                    t.exit = this.exits.oneOf()
                }
                t.sprite = t.exit.turtleSprite
                t.squeezes = 0
            })
        })
    }

    floodFill(exit) {
        let pset = new Set([exit])
        const flood = exit.floodVar
        this.inside.ask(p => {
            p[flood] = -1
        })
        let distance = 0

        while (pset.size > 0) {
            const pnext = new Set()
            for (const p of pset) {
                p[flood] = distance
            }
            for (const p of pset) {
                const next = p[UI.NeighborType].filter(p => p[flood] === -1)
                for (const p of next) {
                    pnext.add(p)
                }
            }

            pset = pnext
            distance += 1
        }
    }
    showFlood(exit) {
        const flood = exit.floodVar
        const max = this.inside.maxOneOf(flood)[flood]
        const cmap = ColorMap.Basic16 // Jet or Basic16
        this.inside.ask(p => {
            p.color = cmap.scaleColor(p[flood], 0, max)
        })
    }

    // Return the neighbors of this turtle that are "empty"
    insideNeighbors(turtle) {
        return turtle.patch[UI.NeighborType].filter(
            n => n.breed !== this.wall && n.breed !== this.obstacles
        )
    }
    availablePatches(turtle) {
        return this.insideNeighbors(turtle).filter(
            n => n.turtlesHere().length === 0
        )
    }
    availableTurtles(turtle) {
        return this.turtles.inPatches(this.insideNeighbors(turtle))
    }
    bestPatch(turtle) {
        const available = this.availablePatches(turtle)
        if (available.length === 0) return null
        if (UI.UseFlood) {
            const flood = turtle.exit.floodVar
            const turtleFlood = turtle.patch[flood]
            const minSet = available.filter(n => turtleFlood > n[flood])
            if (minSet.length > 0) return minSet.oneOf()
        } else {
            const min = available.minOneOf(n => n.distance(turtle.exit))
            if (turtle.distance(turtle.exit) > min.distance(turtle.exit)) {
                return min
            }
        }
        return null
    }
    bestTurtle(turtle) {
        // if (!UI.UseFlood) return null
        // if (!UI.Squeeze || turtle.squeezes > this.maxSqueezes) return null
        if (!UI.Squeeze) return null
        const available = this.availableTurtles(turtle)
        if (available.length === 0) return null
        const best = available.filter(
            t =>
                t.exit !== turtle.exit &&
                this.toExitAt(turtle, t.patch) < this.toExit(turtle) &&
                this.toExitAt(t, turtle.patch) < this.toExit(t)
        )
        return best.length === 0 ? null : best.oneOf()
    }
    toExit(turtle) {
        return UI.UseFlood
            ? turtle.patch[turtle.exit.floodVar]
            : turtle.distance(turtle.exit)
    }
    toExitAt(turtle, patch) {
        return UI.UseFlood
            ? patch[turtle.exit.floodVar]
            : patch.distance(turtle.exit)
    }
    // distance (turtle, patch) {
    //   return UI.UseFlood
    //     ? turtle.patch[turtle.exit.floodVar]
    //     : turtle.distance(turtle.exit)
    // }

    step() {
        let numMoves = 0
        // this.numMoves = 0
        this.turtles.ask(turtle => {
            if (turtle.patch.breed === this.inside) {
                const best = this.bestPatch(turtle) || this.bestTurtle(turtle)
                if (best) {
                    const { x, y } = turtle
                    turtle.face(best)
                    turtle.setxy(best.x, best.y)
                    if (best.isBreed(this.turtles)) {
                        best.faceXY(x, y)
                        best.setxy(x, y)
                    }
                    numMoves++
                }
            } else {
                turtle.forward(1)
                numMoves++
            }
        })
        if (numMoves === 0) {
            const msg = `No moves: turtles = ${this.turtles.length}`
            if (UI.Log !== msg) {
                UI.Log = msg
                console.log(msg)
            }
        }
    }
}

const options = Model.defaultWorld(70)
const model = new ExitModel(document.body, options)
model.setup()
model.start()

// Debugging:
const { world, patches, turtles, links, exits, inside, wall, obstacles } = model
util.toWindow({
    world,
    patches,
    turtles,
    links,
    exits,
    inside,
    wall,
    obstacles,
    model,
})

console.log('patches:', patches.length)
console.log('turtles:', turtles.length)
console.log(
    `exits: ${exits.length},`,
    `wall: ${wall.length},`,
    `inside: ${inside.length},`,
    `obstacles: ${obstacles.length}`
)

// model.floodFill(0)
// exits.ask(exit => { model.showFlood(exit) })
// model.showAllFloods()

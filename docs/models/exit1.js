/* eslint-disable */
import ColorMap from '../src/ColorMap.js'
import Model from '../src/Model.js'
import util from '../src/core/util.js'
// import {ColorMap, Model, util} from '../dist/AS.module.js'

util.toWindow({ ColorMap, Model, util })

const UI = {
  NumExits: 5, // 10
  Obstacles: 0.10, // percent of inside are obstacles
  Population: 0.20, // 0.75 // percent of inside populated
  NeighborType: 'neighbors',
  StartAt: 'closest',
  Reset: () => {
    model.reset(); model.setup(); model.start(); model.resets++
  },
  UseFlood: !true,
  ToggleView: toggleView,
  TurtleSize: 1.5,
  FPS: 30
}
let currentFlood = 0
function toggleView () {
  // currentFlood = util.mod(currentFlood++, UI.NumExits)
  if (currentFlood === UI.NumExits) {
    currentFlood = 0
  } else {
    currentFlood++
  }
  showInside()
  // if (currentFlood === UI.NumExits) {
  //   model.showPatchColors()
  //   currentFlood = 0
  // } else {
  //   model.showFlood(model.exits[currentFlood++])
  // }
}
function showInside () {
  if (currentFlood === 0)
    model.showPatchColors()
  else
    model.showFlood(model.exits[currentFlood - 1])
}
function setRate () { model.anim.setRate(UI.FPS) }
function setSize () { model.turtles.setDefault('size', UI.TurtleSize) }

util.toWindow({ UI })

class ExitModel extends Model {
  constructor (div, options) {
    super(div, options)
    this.gui = this.view.gui
    this.gui.add(UI, 'NumExits', 1, 10).step(1)
    this.gui.add(UI, 'Obstacles', 0.0, 0.95).step(0.05)
    this.gui.add(UI, 'Population', 0.05, 0.95).step(0.05)
    this.gui.add(UI, 'NeighborType', ['neighbors', 'neighbors4'])
    this.gui.add(UI, 'StartAt', ['closest', 'random'])
    this.gui.add(UI, 'Reset')
    // this.gui.add(UI, 'ToggleView')
    this.gui.add(UI, 'ToggleView')
    this.gui.add(UI, 'UseFlood')
    this.gui.add(UI, 'TurtleSize', 1, 4).step(0.5).onChange(setSize)
    this.gui.add(UI, 'FPS', 1, 60).step(1).onChange(setRate)

    this.numMoves = 0
    this.resets = 0
  }
  setup () {
    this.patchBreeds('exits inside wall obstacles')
    this.turtles.setDefault('shape', 'circle')
    // this.turtles.setDefault('size', UI.TurtleSize)
    this.turtles.setDefault('atEdge', (turtle) => turtle.die())
    setRate()
    setSize()
    this.setupPatches()
    this.setupTurtles()

    // this.done = false
  }
  setupPatches () {
    const {maxX, maxY} = this.world
    this.patches.ask(p => {
      if ((Math.abs(p.x) < 0.7 * maxX) && (Math.abs(p.y) < 0.7 * maxY))
        p.setBreed(this.inside)
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
      const n = p[UI.NeighborType].with(p => p.breed === this.inside)
      if (UI.NeighborType === 'neighbors' && n.length >= 7) { // 7-8 nieghbors
        const p = n.oneOf() // nOf(9 - n.length)?
        p.setBreed(this.obstacles)
      }
    })
    this.exits.ask(p => {
      p.neighbors4
        .with(p => p.breed === this.obstacles)
        .ask(p => { p.setBreed(this.inside); console.log('blocked', p) })
    })

    this.exits.ask(exit => { this.floodFill(exit) })

    const b4 = this.obstacles.length
    this.inside.with(p => p.flood0 === -1).ask(p => {
      p.setBreed(this.obstacles)
    })
    console.log('fixed unreachable:', this.obstacles.length - b4)
    this.showPatchColors()
    showInside()
  }
  showPatchColors () {
    const grays = ColorMap.LightGray
    const basic16 = ColorMap.Basic16
    this.patches.ask(p => { p.color = grays.randomColor() })
    this.obstacles.ask(p => { p.color = basic16.closestColor(127, 127, 127) })
    this.inside.ask(p => { p.color = basic16.closestColor(0, 0, 0) })
    this.wall.ask(p => { p.color = basic16.closestColor(127, 127, 127) })
    this.exits.ask((p, i) => { p.setColor(basic16[i + 4]) })
  }
  setupTurtles () {
    const ss = this.spriteSheet

    this.exits.ask(e => {
      e.turtleSprite = ss.newSprite('circle', e.color)
    })

    const turtlePatches = this.inside.nOf(UI.Population * this.inside.length)
    turtlePatches.ask(p => {
      p.sprout(1, this.turtles, (t) => {
        if (UI.StartAt === 'closest') {
          t.exit = this.exits.minOneOf(e => t.distance(e))
        } else {
          t.exit = this.exits.oneOf()
        }
        t.sprite = t.exit.turtleSprite
      })
    })
  }

  floodFill (exit) {
    let pset = new Set([exit])
    const flood = exit.floodVar
    this.inside.ask(p => { p[flood] = -1 })
    let distance = 0

    while (pset.size > 0) {
      const pnext = new Set()
      for (const p of pset) { p[flood] = distance }
      for (const p of pset) {
        const next = p[UI.NeighborType].with(p => p[flood] === -1)
        for (const p of next) { pnext.add(p) }
      }

      pset = pnext
      distance += 1
    }
  }
  showFlood (exit) {
    const flood = exit.floodVar
    const max = this.inside.maxOneOf(flood)[flood]
    const cmap = ColorMap.Basic16 // Jet or Basic16
    this.inside.ask(p => {
      p.color = cmap.scaleColor(p[flood], 0, max)
    })
  }

  // Return the neighbors of this turtle that are "empty"
  availableNeighbors (turtle, checkTurtles = true) {
    return turtle.patch[UI.NeighborType].with(n =>
      n.breed !== this.wall &&
      n.breed !== this.obstacles &&
      (!checkTurtles || n.turtlesHere().length === 0)
    )
  }
  bestNeighbor (turtle, available) {
    if (available.length === 0) return null
    if (UI.UseFlood) {
      const flood = turtle.exit.floodVar
      const turtleFlood = turtle.patch[flood]
      const minSet = available.with(n => turtleFlood > n[flood])
      if (minSet.length > 0) return minSet.oneOf()
    } else {
      const min = available.minOneOf(n => n.distance(turtle.exit))
      if (turtle.distance(turtle.exit) > min.distance(turtle.exit)) return min
    }
    return null
  }

  step () {
    this.numMoves = 0
    this.turtles.ask(t => {
      if (t.patch.breed === this.inside) {
        const available = this.availableNeighbors(t)
        const best = this.bestNeighbor(t, available)
        if (best) {
          t.face(best)
          t.setxy(best.x, best.y)
          this.numMoves++
        }
      } else {
        t.forward(1)
        this.numMoves++
      }
    })
    if (this.numMoves === 0) {
      util.logOnce(
        `${this.resets} - No moves: turtles = ${this.turtles.length}`
      )
    }
  }
}

const options = Model.defaultWorld(70)
const model = new ExitModel(document.body, options)
model.setup()
model.start()

// Debugging:
const { world, patches, turtles, links, exits, inside, wall, obstacles } = model
util.toWindow({ world, patches, turtles, links, exits, inside, wall, obstacles, model })

console.log('patches:', patches.length)
console.log('turtles:', turtles.length)
console.log(`exits: ${exits.length},`,
  `wall: ${wall.length},`,
  `inside: ${inside.length},`,
  `obstacles: ${obstacles.length}`)

// model.floodFill(0)
// exits.ask(exit => { model.showFlood(exit) })
// model.showAllFloods()

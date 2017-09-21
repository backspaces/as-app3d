// import ColorMap from '../../dist/AS/ColorMap.js'
// import Model from '../../dist/AS/Model.js'
// import util from '../../dist/AS/util.js'
const {ColorMap, Model, util} = AS

util.toWindow({ ColorMap, Model, util })

class FlockModel extends Model {
  setVision (vision) {
    this.vision = vision
    this.patches.cacheRect(vision)
  }
  setMaxTurn (maxTurnDegrees) {
    this.maxTurn = util.radians(maxTurnDegrees)
  }
  setup () {
    // this.turtles.own('vision')

    this.turtles.setDefault('atEdge', 'wrap')
    this.turtles.setDefault('z', 0.1)
    this.turtles.setDefault('size', 1)
    this.turtles.setDefault('speed', 0.25)

    const cmap = ColorMap.grayColorMap(0, 100)
    this.patches.ask(p => { p.setColor(cmap.randomColor()) })

    this.refreshPatches = false
    this.setMaxTurn(3.0)
    this.setVision(3)
    this.minSeparation = 0.75
    // this.anim.setRate(30)
    this.population = 1000 // 300 // 1e4 this.patches.length

    util.repeat(this.population, () => {
      this.patches.oneOf().sprout()
    })
  }

  step () {
    this.turtles.ask((t) => { this.flock(t) })
  }
  flock (a) { // a is turtle
    // flockmates = this.turtles.inRadius(a, this.vision).other(a)
    const flockmates = this.turtles.inRadius(a, this.vision, false)
    // flockmates = a.inRadius(this.turtles, this.vision, false)
    if (flockmates.length !== 0) {
      // REMIND: distanceSq or manhattan distance
      const nearest = flockmates.minOneOf((f) => f.distance(a))
      if (a.distance(nearest) < this.minSeparation) {
        this.separate(a, nearest)
      } else {
        this.align(a, flockmates)
        this.cohere(a, flockmates)
      }
    }
    a.forward(a.speed)
  }
  separate (a, nearest) {
    const theta = nearest.towards(a)
    this.turnTowards(a, theta)
  }
  align (a, flockmates) {
    this.turnTowards(a, this.averageHeading(flockmates))
  }
  cohere (a, flockmates) {
    this.turnTowards(a, this.averageHeadingTowards(a, flockmates))
  }

  turnTowards (a, theta) {
    let turn = util.subtractRadians(theta, a.theta) // angle from h to a
    turn = util.clamp(turn, -this.maxTurn, this.maxTurn) // limit the turn
    a.rotate(turn)
  }
  averageHeading (flockmates) {
    const thetas = flockmates.map(f => f.theta)
    const dx = thetas.map(t => Math.cos(t)).reduce((x, y) => x + y)
    const dy = thetas.map(t => Math.sin(t)).reduce((x, y) => x + y)
    // const dx = flockmates
    //   .map((f) => Math.cos(f.theta))
    //   .reduce((x, y) => x + y)
    // const dy = flockmates
    //   .map((f) => Math.sin(f.theta))
    //   .reduce((x, y) => x + y)
    return Math.atan2(dy, dx)
  }
  averageHeadingTowards (a, flockmates) {
    const towards = flockmates.map(f => f.towards(a))
    const dx = towards.map(t => Math.cos(t)).reduce((x, y) => x + y)
    const dy = towards.map(t => Math.sin(t)).reduce((x, y) => x + y)
    // const dx = flockmates // remind: share f.towards in an initial array
    //   .map((f) => Math.sin(f.towards(a)))
    //   .reduce((x, y) => x + y)
    // const dy = flockmates
    //   .map((f) => Math.cos(f.towards(a)))
    //   .reduce((x, y) => x + y)
    // dx = (Math.sin f.towards a for f in flockmates).reduce (x,y) -> x+y
    // dy = (Math.cos f.towards a for f in flockmates).reduce (x,y) -> x+y
    return Math.atan2(dy, dx)
  }

  // headingsOf (boids) { return boids.map((t) => t.theta) }
  reportFlockVectorSize () {
    const headings = this.turtles.map((t) => t.theta)
    const dx = headings.map((theta) => Math.cos(theta)).reduce((x, y) => x + y)
    const dy = headings.map((theta) => Math.sin(theta)).reduce((x, y) => x + y)
    return Math.sqrt(dx * dx + dy * dy) / this.population
  }
}

const model = new FlockModel(document.body).start()
model.whenReady(() => {
  console.log('patches:', model.patches.length)
  console.log('turtles:', model.turtles.length)

  // debugging
  const {world, patches, turtles} = model
  util.toWindow({ world, patches, turtles, model })
})

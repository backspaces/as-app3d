import {ColorMap, Model, AgentArray,} from '../dist/as-app3d.esm.js'
// import {AgentArray, ColorMap, DataSet, Model, RGBDataSet, World, util}
//  from '../dist/as-app3d.esm.js'

util.toWindow({ AgentArray, ColorMap, Model, RGBDataSet, util })

class DropletsModel extends Model {
  // logHist (name, ds = this[name]) {
  //   const hist = AgentArray.fromArray(ds.data).histogram()
  //   const {min, max} = hist.parameters
  //   console.log(`${name}:`, hist.toString(), 'min/max:', min.toFixed(3), max.toFixed(3))
  // }
  async startup () {
    this.url =
      'http://s3.amazonaws.com/elevation-tiles-prod/terrarium/13/1594/3339.png'
    this.png = await util.imagePromise(this.url)
    const elevation = new RGBDataSet(this.png, -32768, 1 / 256, AgentArray)
    const slopeAndAspect = elevation.slopeAndAspect()
    const {dzdx, dzdy, slope, aspect} = slopeAndAspect
    Object.assign(this, {elevation, dzdx, dzdy, slope, aspect})
    util.toWindow({elevation, dzdx, dzdy, slope, aspect})

    const logHist = (name, ds = this[name]) => {
      const hist = AgentArray.fromArray(ds.data).histogram()
      const {min, max} = hist.parameters
      console.log(`${name}:`, hist.toString(), 'min/max:', min.toFixed(3), max.toFixed(3))
    }
    logHist('elevation')
    logHist('aspect')
    logHist('slope')
    logHist('dzdx')
    logHist('dzdy')

    this.patches.importDataSet(elevation, 'elevation', true)
    this.patches.importDataSet(aspect, 'aspect', true)
  }
  setup () {
    // REMIND: Use fixed agentscript code
    const patchElevations = this.patches.exportDataSet('elevation', AgentArray)
    const cmap = ColorMap.Gray
    // const cmap = ColorMap.Jet
    // const DEMrgbs = [
    //   [ 0, 97, 71],
    //   [ 16, 122, 47],
    //   [232, 215, 125],
    //   [161, 67, 0],
    //   [158, 0, 0],
    //   [110, 110, 110],
    //   [255, 255, 255]
    // ]
    // const cmap = ColorMap.gradientColorMap(256, DEMrgbs) //, DEMstops)

    // const {numX, numY} = this.world
    // const patchElevations = this.elevation.resample(numX, numY)
    // const gray = scaleDataSet(patchElevations, 0, 255)
    const gray = patchElevations.scale(0, 255)
    util.toWindow({patchElevations, gray})

    this.speed = 0.2
    // this.turtles.setDefault('atEdge', 'bounce')
    this.turtles.setDefault('atEdge', turtle => turtle.die())
    this.turtles.setDefault('shape', 'circle')
    this.turtles.setDefault('size', '0.3')
    this.turtles.setDefault('color', 'yellow')
    this.anim.setRate(15)

    let localMins = 0
    this.patches.ask(p => {
      const g = Math.round(gray.data[p.id])
      p.color = cmap[g]

      if (p.neighbors.minOneOf('elevation').elevation > p.elevation) {
        p.color = 'red'
        localMins++
      }
      p.sprout(1, this.turtles)
    })
    console.log('localMins', localMins)

    // this.turtles.ask(t => {
    //   t.color = 'blue'
    //   // If we don't set color, a random color will be used
    // })
  }

  // onEdge () {
  //   const {minX, minY, maxX, maxY} = this.world
  //   return this.turtles.with(t => {
  //     const p = t.patch
  //     return p.x === minX || p.x === maxX || p.y === minY || p.y == maxY
  //   })
  // }

  step () {
    this.turtles.ask(t => {
      const move = true

      // Move toward/to neighbor w/ least elevation:
      // const n = t.patch.neighbors.minOneOf('elevation')
      // const toPatch = true
      // if (t.patch.elevation > n.elevation) {
      //   t.face(n)
      // } else {
      //   if (toPatch) t.setxy(t.patch.x, t.patch.y)
      //   move = false
      // }

      // Move in direction of patch aspect:
      t.theta = t.patch.aspect

      // Move in direction of aspect DataSet:
      // const {minXcor, maxYcor, numX, numY} = this.world
      // const nearest = true // false many more minima
      // t.theta = this.aspect.coordSample(t.x, t.y, minXcor, maxYcor, numX, numY, nearest)

      if (move) t.forward(this.speed)
    })
  }
}

const options = Model.defaultWorld(50, 50)
const model = new DropletsModel(document.body, options)
const {world, patches, turtles, links} = model
util.toWindow({ world, patches, turtles, links, model })

model.startup().then(() => {
  model.setup()
  console.log('patches:', model.patches.length)
  console.log('turtles:', model.turtles.length)
  model.start()
})

// const {world, patches, turtles, links} = model
// util.toWindow({ world, patches, turtles, links, model })
//
// util.repeat(500, () => model.step())

// const data = turtles.props



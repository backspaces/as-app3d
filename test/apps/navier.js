// Import the lib/ mmodules via relative paths
import ColorMap from 'lib/ColorMap.js'
import Model from 'lib/Model.js'
import util from 'lib/util.js'
import DataSet from 'lib/DataSet.js'
window.pps = util.pps

const modules = { ColorMap, Model, util, pps: util.pps }
util.toWindow(modules)
console.log(Object.keys(modules).join(' '))

class PatchModel extends Model {

  setup () {
    util.error = console.warn
    this.anim.setRate(60)
    this.cmap = ColorMap.Rgb256
    this.dt = 1
    this.dens = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float64Array)
    this.dens_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float64Array)
    this.u = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float64Array)
    this.v = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float64Array)
    this.u_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float64Array)
    this.v_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float64Array)
    for (var i = 0; i < this.dens.data.length; i++) {
      this.dens.data[i] = Math.random()
      this.dens_prev.data[i] = this.dens.data[i]
      this.u.data[i] = Math.random() * 5 - 2.5
      this.v.data[i] = Math.random() * 2 
    }
    // this.cmap = ColorMap.Jet
    for (const p of this.patches) {
      p.dens = 1.0
    }
  }

  // do this is order to draw them.
  putDataSetOnPatches (ds, key) {
    for (var p of this.patches) {
      var {minX, minY, maxY} = this.world
      const val = ds.getXY(p.x - minX, maxY - p.y)
      p.dens = val
    }
  }

  step () {
    console.log('.')
    //
    this.densityStep()
    // goes at end
    // update prev values
    this.putDataSetOnPatches(this.dens, 'dens')
    for (const p of this.patches) {
      p.setColor(this.cmap.scaleColor(p.dens, 0, 1))
    }
    // this.patches.diffuse4('ran', 0.1, this.cmap)
    if (this.anim.ticks === 30) {
      console.log(this.anim.toString())
      this.stop()
    }
  }

  densityStep () {
    this.swapDensity()
    this.dens = this.dens_prev.convolve([0,1,0, 1,2,1, 0,1,0], 1/6)
    this.swapDensity()
    this.advect()
  }

  diffuseStamMethod (diff = 1) {
    const d = this.dens
    const d0 = this.dens_prev
    const a = this.dt * d.width * d.height * diff
    for (var k = 0; k < 20; k++) {
      for (var i = 1; i < d.width - 1; i++) {
        for (var j = 1; j < d.height - 1; j++) {
          const val = (d0.getXY(i, j) + a * (d.getXY(i - 1, j) +
                  d.getXY(i + 1, j) + d.getXY(i, j - 1) +
                  d.getXY(i, j + 1))) / (1 + 4 * a)
          d.setXY(i, j, val)
        }
      }
    }
  }

  setBounds (ds) {
    for (var i = 0; i < this.dens.width; i++) {
      ds.setXY(i, 0, ds.sample(i, 1))
      ds.setXY(i, ds.height - 1, ds.sample(i, ds.height - 2))
    }
    for (var j = 0; j < this.dens.height; j++) {
      ds.setXY(0, j, ds.sample(1, j))
      ds.setXY(ds.width - 1, j, ds.sample(ds.width - 2, j))
    }
  }

  swapDensity () {
    const tmp = this.dens_prev
    this.dens_prev = this.dens
    this.dens = tmp
  }

  advect () {
    for (var i = 0; i < this.dens.width; i++) {
      for (var j = 0; j < this.dens.height; j++) {
        const [dudt, dvdt] = [this.u.getXY(i, j) * (-this.dt), this.v.getXY(i, j) * (-this.dt)]
        const [x2, y2] = [dudt + i, dvdt + j]
        if (this.dens.inBounds(x2, y2)) {
          const val = this.dens_prev.sample(x2, y2)
          this.dens.setXY(i, j, val)
        } else {
          this.dens.setXY(i,j, 0)
        }
      }
    }
  }
}

// const [div, size, max, min] = ['layers', 4, 50, -50]
const [div, size, max, min] = ['layers', 2, 100, -100]
const opts =
  {patchSize: size, minX: min, maxX: max, minY: min, maxY: max}
const model = new PatchModel(div, opts)
model.start()

// debugging
const world = model.world
const patches = model.patches
util.toWindow({ model, world, patches, p: patches.oneOf() })
if (size !== 1) util.addToDom(patches.pixels.ctx.canvas)

// const jetColorMap = ColorMap.Jet
// const jetCtx = util.createCtx()
// class JetModel extends Model {
//   setup () {
//
//
//     this.cmap = ColorMap.rgbColorCube(8, 8, 4)
//     for (const p of this.patches) {
//       p.ran = util.randomFloat(1.0)
//     }
//   }
// }
// jetModel = new JetModel({patchSize: 1, minX: 1, maxX: 256, minY: 0, maxY: 0})

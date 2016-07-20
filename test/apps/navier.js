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
    this.BOUNDS_TYPES = {DENSITY: 'DENSITY', 'V': 'V', 'U': 'U'}
    util.error = console.warn
    this.anim.setRate(24)
    this.cmap = ColorMap.Jet
    this.dt = 1
    this.solverIterations = 12
    this.windHeading = Math.PI/2
    this.dens = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.dens_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.u = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.v = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.u_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.v_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.P = DataSet.emptyDataSet(this.u.width, this.u.height, Float32Array)
    this.DIV = DataSet.emptyDataSet(this.u.width, this.u.height, Float32Array)
    for (const p of this.patches) {
      p.dens = 0
    }
    //
    // for testing mouse
    var la = document.getElementById('layers')
    la.getBoundingClientRect()
    la.onclick = (ev)=>{
      var bnd = la.getBoundingClientRect(la)
      var dx =  ev.x - bnd.width/2 - bnd.left
      var dy = ev.y - bnd.height/2 - bnd.top
      this.windHeading = Math.atan2(dy,dx)
    }
  }

  indx (x,y) {
    return x + y * this.u.width
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
    //
    this.addForces()
    this.addDensity()
    this.velocityStep()
    this.densityStep()
    setTimeout(this.drawStep.bind(this),1)
  }

  drawStep () {
    this.putDataSetOnPatches(this.dens, 'dens')
    for (const p of this.patches) {
      p.setColor(this.cmap.scaleColor(p.dens, 0, 1))
    }
    // this.patches.diffuse4('ran', 0.1, this.cmap)
    if (this.anim.ticks >= 90) {
      console.log(this.anim.toString())
      this.stop()
    }
  }

  addDensity () {

  }

  addForces () {
    var w = this.world.maxX - this.world.minX
    var h = this.world.maxY - this.world.minY
    for (let i = 0; i <= 6; i += 2) {
      for (let j = 0; j <= 6; j += 2) {
        this.dens.setXY(w/2 + i, h/2 + j, 1)
        this.u.setXY(w/2 + i , h/2 + j, 30 * Math.cos(this.windHeading) )
        this.v.setXY(w/2 + i , h/2 + j, 30 * Math.sin(this.windHeading) )
      }
    }
  }

  densityStep () {
    this.addSource(this.dens, this.dens_prev)
    this.swapDensity()
    //this.diffusionStamMethod(this.dens_prev, this.dens)
    this.dens = this.dens_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.swapDensity()
    this.advect(this.dens_prev, this.dens)
  }

  velocityStep () {
    this.addSource(this.u, this.u_prev)
    this.addSource(this.v, this.v_prev)
    this.swap('u', 'u_prev')
    //this.u = this.u_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.diffusionStamMethod(this.u_prev, this.u)
    this.swap('v', 'v_prev')
    //this.v = this.v_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.diffusionStamMethod(this.v_prev, this.v)
    this.project()
    this.swap('u', 'u_prev')
    this.swap('v', 'v_prev')
    this.advect(this.u_prev, this.u)
    this.advect(this.v_prev, this.v)
    this.project()
  }

  setBoundary (ds, type) {
    //return
    if (type == this.BOUNDS_TYPES.DENSITY) {
      for (let i = 0; i < this.dens.width; i++) {
        ds.setXY(i, 0, ds.bilinear(i, 1))
        ds.setXY(i, ds.height - 1, ds.bilinear(i, ds.height - 2))
      }
      for (let j = 0; j < this.dens.height; j++) {
        ds.setXY(0, j, ds.bilinear(1, j))
        ds.setXY(ds.width - 1, j, ds.bilinear(ds.width - 2, j))
      }
    } else if (type === this.BOUNDS_TYPES.V) {
      for (let i = 0; i < this.dens.width; i++) {
        ds.setXY(i, 0, 0)
        ds.setXY(i, ds.height - 1, 0)
      }
    } else if (type === this.BOUNDS_TYPES.U) {
      for (let j = 0; j < this.dens.height; j++) {
        ds.setXY(0, j, 0)
        ds.setXY(ds.width - 1, j, 0)
      }
    }
  }

  addSource (x0, x) {
    for (var i = 0; i < x0.data.length; i++) {
      x.data[i] += x0.data[i] * this.dt
    }
  }

  swapDensity () {
    this.swap('dens', 'dens_prev')
  }

  swap (key1, key2) {
    const tmp = this[key1]
    this[key1] = this[key2]
    this[key2] = tmp
  }

  advect (X0, X) {
    for (var i = 0; i < X.width; i++) {
      for (var j = 0; j < X.height; j++) {
        var dudt = this.u.getXY(i, j) * (-this.dt)
        var dvdt = this.v.getXY(i, j) * (-this.dt)
        var x2 = dudt + i
        var y2 = dvdt + j
        if (X.inBounds(x2, y2)) {
          var val = X0.bilinear(x2, y2)
          X.setXY(i, j, val)
        } else {
          X.setXY(i, j, 0)
        }
      }
    }
  }


  project () {
    this.projectStep1()
    this.projectStep2()
    this.projectStep3()
  }

  projectStep1 () {
    var p = this.P
    var div = this.DIV
    var U = this.u
    var V = this.v
    var h = -0.5 * Math.hypot(U.width, U.height)
    for (var i = 0; i < U.width; i++) {
      for (var j = 0; j < U.height; j++) {
        var gradX = U.data[this.indx(i + 1, j)] - U.data[this.indx(i - 1, j)]
        var gradY = V.data[this.indx(i, j + 1)] - V.data[this.indx(i, j - 1)]
        div.setXY(i, j, h * (gradX + gradY))
        p.setXY(i, j, 0)
      }
    }
    this.setBoundary(div, this.BOUNDS_TYPES.V)
    this.setBoundary(p, this.BOUNDS_TYPES.U)
  }

  projectStep2 () {
    var p = this.P
    var div = this.DIV
    //
    for (var k = 0; k < this.solverIterations; k++) {
      for (var i = 1; i < p.width - 1; i++) {
        for (var j = 1; j < p.height - 1; j++) {
          var indx = this.indx(i,j)
          var val = div.data[indx]
          val = val + p.data[indx + 1] + p.data[indx - 1]
          val = val + p.data[indx - p.width] + p.data[indx + p.width]
          //var val = div.getXY(i, j) + p.getXY(i - 1, j) + p.getXY(i + 1, j) + p.getXY(i, j - 1) + p.getXY(i, j + 1)
          val = val / 4
          p.data[indx] = val
        }
      }
    }
    this.setBoundary(p, this.BOUNDS_TYPES.U)
    this.setBoundary(div, this.BOUNDS_TYPES.V)
  }

  projectStep3 () {
    var p = this.P
    var U = this.u
    var V = this.v
    var pdx, pdy, v1, v2
    var wScale = 0.5 / U.width
    var hScale = 0.5 / U.height
    for (var i = 1; i < U.width - 1; i++) {
      for (var j = 1; j < U.height - 1; j++) {
        var indx = this.indx(i,j)
        pdx = p.data[this.indx(i + 1, j)] - p.data[this.indx(i - 1, j)]
        pdy = p.data[this.indx(i, j + 1)] - p.data[this.indx(i, j - 1)]
        v1 = U.data[this.indx(i, j)] - wScale * pdx
        v2 = V.data[this.indx(i, j)] - hScale * pdy
        U.data[indx] = v1
        V.data[indx] = v2
      }
    }
    this.setBoundary(U, this.BOUNDS_TYPES.U)
    this.setBoundary(V, this.BOUNDS_TYPES.V)
  }

  //
  // this is the diffuse step from the paper. Stam, Jos
  //
  diffusionStamMethod (D0, D, diff = 1) {
    const a = this.dt * diff
    for (var k = 0; k < this.solverIterations; k++) {
      for (var i = 1; i < D.width - 1; i++) {
        for (var j = 1; j < D.height - 1; j++) {
          const val = (D0.data[this.indx(i, j)] +
                  a * (
                    D.data[this.indx(i - 1, j)] +
                    D.data[this.indx(i + 1, j)] +
                    D.data[this.indx(i, j - 1)] +
                    D.data[this.indx(i, j + 1)]
                  )) / (1 + 4 * a)
          D.data[this.indx(i, j)] = val
        }
      }
    }
    this.setBoundary(D, this.BOUNDS_TYPES.DENSITY)
  }

}

// const [div, size, max, min] = ['layers', 4, 50, -50]
const [div, size, max, min] = ['layers', 4, 64, -64]
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

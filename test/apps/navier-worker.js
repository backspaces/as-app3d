importScripts('../../etc/system.js')

var DataSet, util, ColorMap, Model, navierInstance

Promise.all([
  System.import('../../lib/DataSet'),
  System.import('../../lib/util'),
  System.import('../../lib/ColorMap.js'),
  System.import('../../lib/Model.js')
]).then(function (modules) {
  DataSet = modules[0].default
  util = modules[1].default
  ColorMap = modules[2].default
  Model = modules[3].default
  console.log('modules', modules)
  //
  //
  //
  class NavierModel extends Model {
    setup () {
      console.log(' main setup called', this)
      util.error = console.warn
      this.anim.setRate(24)
      this.cmap = ColorMap.Jet
      this.sim = new NavierSim(this.world.numX, this.world.numY)
    }

    step () {
      this.sim.step()
      this.putTypedArrayOnPatches()
      this.drawStep()
      this.stepCount ++
      if (this.stepCount % 30 === 0) {
        const now = new Date().getTime()
        const elapsed = (now - this.startTime) / 1000
        console.log(`model in worker steps/sec: ${this.stepCount / elapsed}, queue length: ${messageQueue.length}`)
      }
    }

    // do this is order to draw them.
    putTypedArrayOnPatches () {
      for (let p of this.patches) {
        p.dens = this.sim.dens.data[p.id]
        if (this.sim.boundaries.data[p.id] > 0.0) {
          p.dens = 4.0
        }
      }
    }

    drawStep () {
      for (const p of this.patches) {
        p.setColor(this.cmap.scaleColor(p.dens || 0, 0, 1))
      }
    }
  }
  //
  // worker messaging
  //
  var messageQueue = []
  var queueProcessing = false
  var MAX_QUEUE_LENGTH = 120

  self.onmessage = function (e) {
    if (messageQueue.length < MAX_QUEUE_LENGTH) messageQueue.push(e.data)
    if (!queueProcessing) setTimeout(processQueue, 1)
  }

  function processQueue () {
    queueProcessing = true
    const msg = messageQueue.shift()
    if (msg && typeof msg === 'object') {
      if (msg.type && msg.type === 'eval') {
        const value = Function(msg.value)()
        self.postMessage({type: 'eval', value: value})
      } else if (msg.type === 'getImgData') {
        self.postMessage({type: 'imgData', value: navierInstance.patches.pixels.imageData})
      } else if (msg.type === 'step') {
        navierInstance.step()
        self.postMessage({type: 'step', value: 'done'})
      } else if (msg.type === 'setup') {
        navierInstance = new NavierModel(undefined, msg.value)
      } else {
        console.warn('dont undrstand message', msg)
      }
    }
    if (messageQueue.length > 0) setTimeout(processQueue, 1)
    else queueProcessing = false
  }

  self.onerror = function (message) {
    console.error('worker error', message)
  };
  //
  self.postMessage({type:'ready'})
})

//
// simulation
//
class NavierSim {

  constructor (width, height) {
    this.width = width
    this.height = height
    this.setup()
    console.log(width, height)
  }

  setup () {
    this.BOUNDS_TYPES = {DENSITY: 'DENSITY', 'V': 'V', 'U': 'U'}
    util.error = console.warn
    this.dt = 1
    this.solverIterations = 12
    this.boundaryElasticity = 1
    this.windHeading = Math.PI / 2
    this.dens = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    this.dens_prev = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    this.u = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    this.v = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    this.u_prev = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    this.v_prev = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    this.P = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    this.DIV = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    this.boundaries = DataSet.emptyDataSet(this.width, this.height, Float32Array)
    //
    this.makeFakeBoundaries()
    this.startTime = new Date().getTime()
    this.stepCount = 0
    // navier sim created
  }

  makeFakeBoundaries () {
    for (var i=0; i < this.width; i++) {
      for (var j=0; j< this.height; j++) {
        const y = Math.cos(i / 9) * 34 + 1 + Math.sin(i) * 4
        const diff = j - y
        if (diff > 0 && diff < 20) this.boundaries.setXY(i, this.height - j, 1.0)
        if (i <= 0 || i >= this.width || j <= 0 || j >= this.height) {
          this.boundaries.setXY(i, this.height - j, 1.0)
        }
      }
    }
  }

  indx (x, y) {
    return Math.floor(x) + Math.floor(y) * this.u.width
  }

  getXY (ds, x, y) {
    return ds.data[Math.floor(x) + Math.floor(y) * this.u.width]
  }

  step () {
    this.addForces()
    this.addDensity()
    this.velocityStep()
    this.densityStep()
  }

  addDensity () {

  }

  addForces () {
    var w = this.width
    var h = this.height
    for (let i = 0; i <= 6; i += 2) {
      for (let j = 0; j <= 6; j += 2) {
        this.dens.setXY(w / 2 + i, h / 2 + j, 1)
        this.u.setXY(w / 2 + i, h / 2 + j, 10 * Math.cos(this.windHeading))
        this.v.setXY(w / 2 + i, h / 2 + j, 10 * Math.sin(this.windHeading))
      }
    }
  }

  densityStep () {
    this.addSource(this.dens, this.dens_prev)
    this.swapDensity()
    // this.diffusionStamMethod(this.dens_prev, this.dens)
    this.dens = this.dens_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.swapDensity()
    this.advect(this.dens_prev, this.dens)
  }

  velocityStep () {
    this.addSource(this.u, this.u_prev)
    this.addSource(this.v, this.v_prev)
    this.swap('u', 'u_prev')
    // this.u = this.u_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.diffusionStamMethod(this.u_prev, this.u)
    this.swap('v', 'v_prev')
    // this.v = this.v_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.diffusionStamMethod(this.v_prev, this.v)
    this.project()
    this.swap('u', 'u_prev')
    this.swap('v', 'v_prev')
    this.advect(this.u_prev, this.u)
    this.advect(this.v_prev, this.v)
    this.project()
  }

  setBoundary (ds, type) {
    const B = this.boundaries
    if (type === this.BOUNDS_TYPES.V) {
      for (let i = 0; i < ds.width; i++) {
        for (let j = 0; j < ds.height; j++) {
          const me = this.getXY(B, i, j) // this.boundaries.getXY(i,j)
          const up = this.getXY(B, i, j + 1) // this.boundaries.getXY(i,j+1)
          const dn = this.getXY(B, i, j - 1) // this.boundaries.getXY(i,j-1)
          if (up > 0.0 || dn > 0.0) {
            ds.setXY(i, j, -this.boundaryElasticity * ds.getXY(i, j))
          }
          if (me > 0.0) {
            ds.setXY(i, j, 0)
          }
        }
      }
    } else if (type === this.BOUNDS_TYPES.U) {
      for (let i = 0; i < ds.width; i++) {
        for (let j = 0; j < ds.height; j++) {
          const me = this.getXY(B, i, j)
          const lf = this.getXY(B, i - 1, j) // this.boundaries.getXY(i-1,j)
          const rt = this.getXY(B, i + 1, j) // this.boundaries.getXY(i+1,j)
          if (lf > 0.0 || rt > 0.0) {
            ds.setXY(i, j, -this.boundaryElasticity * ds.getXY(i, j))
          }
          if (me > 0.0) {
            ds.setXY(i, j, 0)
          }
        }
      }
    } else if (type === this.BOUNDS_TYPES.DENSITY) {
      for (let i = 0; i < ds.width; i++) {
        for (let j = 0; j < ds.height; j++) {
          var isb = (this.getXY(B, i, j) > 0)
          if (isb) ds.setXY(i, j, 0)
        }
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
        var dudt = this.getXY(this.u, i, j) * (-this.dt) // this.u.getXY(i, j) * (-this.dt)
        var dvdt = this.getXY(this.v, i, j) * (-this.dt) // this.v.getXY(i, j) * (-this.dt)
        var x2 = dudt + i
        var y2 = dvdt + j
        if (X.inBounds(x2, y2)) {
          var val = X0.bilinear(x2, y2)
          if (this.getXY(this.boundaries, i, j) !== 0.0) {
            X.data[this.indx(x2, y2)] = val
          } else {
            X.data[this.indx(i, j)] = val
          }
          // X.setXY(i, j, val)
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
      }
    }
    for (i = 0; i < p.data.length; i++) p.data[i] = 0
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
          var indx = this.indx(i, j)
          var val = div.data[indx]
          val = val + p.data[indx + 1] + p.data[indx - 1]
          val = val + p.data[indx - p.width] + p.data[indx + p.width]
          // var val = div.getXY(i, j) + p.getXY(i - 1, j) + p.getXY(i + 1, j) + p.getXY(i, j - 1) + p.getXY(i, j + 1)
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
        var indx = this.indx(i, j)
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

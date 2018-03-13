// import util from '../node_modules/as-core/src/util.js'
// import CorePatches from '../node_modules/as-core/src/Patches.js'
import {util, Patches as CorePatches} from '../agentscript/agentscript.esm.js'

// See CorePatches for the patches architecture
class Patches extends CorePatches {
  constructor (model, AgentClass, name) {
    super(model, AgentClass, name)

    // Skip if a breedSet (don't rebuild patches!).
    if (this.isBreedSet()) return

    this.setPixels()
  }
  // Setup pixels ctx used for patch.color: `draw` and `importColors`
  setPixels () {
    const {numX, numY} = this.model.world
    this.pixels = {
      ctx: util.createCtx(numX, numY)
    }
    this.setImageData()
  }
  // Create the pixels object used by `setPixels` and `installColors`
  setImageData () {
    const pixels = this.pixels
    pixels.imageData = util.ctxImageData(pixels.ctx)
    pixels.data8 = pixels.imageData.data
    pixels.data = new Uint32Array(pixels.data8.buffer)
  }

  setDefault (name, value) {
    if (name === 'color') {
      this.ask(p => { p.setColor(value) })
      util.logOnce(`patches.setDefault(color, value): color default not supported. Clearing to value`)
    } else {
      super.setDefault(name, value)
    }
  }

  installPixels () {
    const pixels = this.pixels
    pixels.ctx.putImageData(pixels.imageData, 0, 0)
    return pixels
  }
  importColors (imageSrc) {
    util.imagePromise(imageSrc)
      .then((img) => this.installColors(img))
  }
  // Direct install image into the patch colors, not async.
  installColors (img) {
    util.fillCtxWithImage(this.pixels.ctx, img)
    this.setImageData()
  }

  scaleColors (colorMap, variable, min, max) {
    this.ask(p => {
      p.setColor(colorMap.scaleColor(p[variable], min, max))
    })
  }

  // REMIND: Test that agentarray returned.
  test () { console.log(this.map(patch => patch.id)) }
}

export default Patches

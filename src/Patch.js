import Color from './Color.js'
import CorePatch from './core/Patch.js'

// See CorePatch for how patches are "flyweight" patterns.
class Patch extends CorePatch {
  // No ctor, use super.

  // Manage colors by directly setting pixels in Patches pixels object.
  // With getter/setters, slight performance hit but worth it!
  setColor (color) {
    this.patches.pixels.data[this.id] = Color.toColor(color).getPixel()
  }
  // Optimization: If shared color provided, sharedColor is modified and
  // returned. Otherwise new color returned.
  getColor (sharedColor = null) {
    const pixel = this.patches.pixels.data[this.id]
    if (sharedColor) {
      sharedColor.pixel = pixel
      return sharedColor
    }
    return Color.toColor(pixel)
  }
  get color () { return this.getColor() }
  set color (color) { this.setColor(color) }
}

export default Patch

// import util from '../node_modules/as-core/src/util.js'
import {util, Link as CoreLink} from '../agentscript/agentscript.esm.js'
import Color from './Color.js'
// import CoreLink from '../node_modules/as-core/src/Link.js'

class Link extends CoreLink {
  static defaultVariables () { // Instance variables.
    return {
      typedColor: null // A Color.color, converted by getter/setters below
    }
  }
  // Initialize a Link
  constructor () {
    super()
    Object.assign(this, Link.defaultVariables())
  }

  // Use typedColor as the real color. Amazingly enough, setdefaults
  // of 'color' ends up calling setter, thus making typedColor the default name.
  // Whew!
  setColor (color) {
    const typedColor = Color.toColor(color) // Convert to Color.color
    const fixedColor = this.links.renderer.fixedColor // Model set to Color.color
    if (fixedColor && !typedColor.equals(fixedColor)) {
      util.warn(`links.setColor: fixedColor != color ${fixedColor.toString()}`)
    } else {
      this.typedColor = typedColor
    }
  }
  getColor () { return this.typedColor }
  set color (color) { this.setColor(color) }
  get color () { return this.getColor() }
  // color prop can be used by *must* be Color.colors
}

export default Link

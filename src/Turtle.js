// import util from '../node_modules/as-core/src/util.js'
// import CoreTurtle from '../node_modules/as-core/src/Turtle.js'
import Color from './Color.js'
import {util, Turtle as CoreTurtle} from '../agentscript/agentscript.esm.js'

// Flyweight object creation, see Patch/Patches.

// Class Turtle instances represent the dynamic, behavioral element of modeling.
// Each turtle knows the patch it is on, and interacts with that and other
// patches, as well as other turtles.

// class Turtle {
class Turtle extends CoreTurtle {
  static defaultVariables () {
    return { // Core variables for turtles. Not 'own' variables.
      size: 1,
      sprite: null,
      typedColor: null,
      typedStrokeColor: null,
      shapeFcn: `default`
    }
  }
  // Initialize a Turtle given its Turtles AgentSet.
  constructor () {
    super()
    Object.assign(this, Turtle.defaultVariables())
  }

  // Create my sprite via shape: sprite, fcn, string, or image/canvas
  setSprite (sprite = null) {
    if (sprite) {
      this.sprite = sprite
    } else {
      let {shape, color, strokeColor} = this
      const needsStroke = shape.slice(-1) === '2'
      shape = shape || 'default'
      color = color || this.model.randomColor()
      strokeColor = needsStroke
        ? strokeColor || this.model.randomColor()
        : null
      this.sprite = this.model.spriteSheet.newSprite(shape, color, strokeColor)
    }
    return this.sprite
  }
  checkSprite () {
    if (!this.turtles.renderer.useSprites) return
    if (this.turtles.settingDefault(this)) {
      const {shape, typedColor: color, typedStrokeColor: strokeColor} = this
      const needsStroke = shape.slice(-1) === '2'
      const ready = shape && color && (!needsStroke || strokeColor)
      if (ready)
        this.sprite = this.model.spriteSheet.newSprite(shape, color, strokeColor)
    } else {
      this.sprite = null
    }
  }
  setSize (size) { this.size = size } // * this.model.world.patchSize }

  setColor (color) {
    const typedColor = Color.toColor(color) // Convert to Color.color
    const fixedColor = this.turtles.renderer.fixedColor // Is a Color.color
    if (fixedColor) {
      util.warn(`turtle.setColor: fixedColor ${fixedColor.toString()}`)
    } else { // will set default color or instance color (if not fixed etc)
      this.typedColor = typedColor
    }
    this.checkSprite()
  }
  getColor () { return this.sprite ? this.sprite.color : this.typedColor }
  set color (color) { this.setColor(color) }
  get color () { return this.getColor() }

  setStrokeColor (color) {
    const typedColor = Color.toColor(color) // Convert to Color.color
    const fixedColor = this.turtles.renderer.fixedColor // Model set to Color.color
    if (fixedColor) {
      util.warn(`turtle.setStrokeColor: fixedColor ${fixedColor.toString()}`)
    } else { // will set default color or instance color
      this.typedStrokeColor = typedColor
    }
    this.checkSprite()
  }
  getStrokeColor () {
    return this.sprite ? this.sprite.strokeColor : this.typedStrokeColor
  }
  set strokdColor (color) { this.setStrokeColor(color) }
  get strokdColor () { return this.getStrokeColor() }

  setShape (shape) {
    const fixedShape = this.turtles.renderer.fixedShape
    if (fixedShape)
      util.warn(`turtle.setShape: fixedShape ${fixedShape}`)
    else
      this.shapeFcn = shape
    this.checkSprite()
  }
  getShape () { return this.sprite ? this.sprite.src : this.shapeFcn }
  set shape (shape) { this.setShape(shape) }
  get shape () { return this.getShape() }
}

export default Turtle

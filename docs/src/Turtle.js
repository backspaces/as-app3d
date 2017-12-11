import util from './core/util.js'
import Color from './Color.js'
import CoreTurtle from './core/Turtle.js'

// Flyweight object creation, see Patch/Patches.

// Class Turtle instances represent the dynamic, behavioral element of modeling.
// Each turtle knows the patch it is on, and interacts with that and other
// patches, as well as other turtles.

// class Turtle {
class Turtle extends CoreTurtle {
  static defaultVariables () {
    return { // Core variables for turtles. Not 'own' variables.
      // x: 0,             // x, y, z in patchSize units.
      // y: 0,             // Use turtles.setDefault('z', num) to change default height
      // z: 0,
      // theta: 0,         // my euclidean direction, radians from x axis, counter-clockwise
      size: 1,          // size in patches, default to one patch

      // patch: null,   // the patch I'm on .. uses getter below
      // links: null,   // the links having me as an end point .. lazy promoted below
      // atEdge: 'clamp',  // What to do if I wander off world. Can be 'clamp', 'wrap'
                        // 'bounce', or a function, see handleEdge() method
      sprite: null,
      typedColor: null,
      typedStrokeColor: null,
      shapeFcn: `default`

      // spriteFcn: 'default',
      // spriteColor: Color.color(255, 0, 0),

      // labelOffset: [0, 0],  // text pixel offset from the turtle center
      // labelColor: Color.color(0, 0, 0) // the label color
    }
  }
  // Initialize a Turtle given its Turtles AgentSet.
  constructor () {
    super()
    Object.assign(this, Turtle.defaultVariables())
  }

  // Create my sprite via shape: sprite, fcn, string, or image/canvas
  // setSprite (shape = this.shape, color = this.color, strokeColor = this.strokeColor) {
  setSprite (sprite = null) {
    if (sprite) {
      this.sprite = sprite
    } else {
      let {shape, color, strokeColor} = this
      // const needsStroke = shape.charAt(shape.length - 1) === '2'
      const needsStroke = shape.slice(-1) === '2'
      // if (shape.sheet) { this.sprite = shape; return } // src is a sprite
      // const ss = this.model.spriteSheet
      // color = color || this.turtles.randomColor()
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
      // const ready = shape && color && (needsStroke && strokeColor)
      if (ready)
        this.sprite = this.model.spriteSheet.newSprite(shape, color, strokeColor)
    } else {
      this.sprite = null
    }
  }
  setSize (size) { this.size = size } // * this.model.world.patchSize }

  setColor (color) {
    // if (this.turtles.settingDefault(this))
    //   console.log(`setting default color ${color}`)
    // if (!this.id) console.log(`setting default color ${color}`)
    const typedColor = Color.toColor(color) // Convert to Color.color
    const fixedColor = this.turtles.renderer.fixedColor // Is a Color.color
    // if (fixedColor && !typedColor.equals(fixedColor)) {
    if (fixedColor) {
      util.warn(`turtle.setColor: fixedColor ${fixedColor.toString()}`)
    // } else if (this.sprite && !settingDefault) {
    // } else if (this.sprite) { // default sprite should always be null
    //   this.sprite.color = typedColor
    //   this.sprite.needsUpdate = true
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
    // } else if (this.sprite) { // default sprite should always be null
    //   this.sprite.strokeColor = typedColor
    //   this.sprite.needsUpdate = true
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
    if (fixedShape) {
      util.warn(`turtle.setShape: fixedShape ${fixedShape}`)
    // } else if (this.sprite) {
    //   this.sprite.src = shape
    //   this.sprite.needsUpdate = true
    } else {
      this.shapeFcn = shape
    }
    this.checkSprite()
  }
  getShape () { return this.sprite ? this.sprite.src : this.shapeFcn }
  set shape (shape) { this.setShape(shape) }
  get shape () { return this.getShape() }
}

export default Turtle

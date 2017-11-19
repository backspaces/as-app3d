import World from './core/World.js'
import Color from './Color.js'
import ColorMap from './ColorMap.js'
import Patches from './Patches.js'
import Patch from './Patch.js'
import Turtles from './Turtles.js'
import Turtle from './Turtle.js'
import Links from './Links.js'
import Link from './Link.js'
import Animator from './Animator.js'
import SpriteSheet from './SpriteSheet.js'
import ThreeView from './ThreeView.js'
import ThreeMeshes from './ThreeMeshes.js'
import util from './core/util.js'
import CoreModel from './core/Model.js'

// Class Model is the primary interface for modelers, integrating
// all the parts of a model. It also contains NetLogo's `observer` methods.
// class Model {
class Model extends CoreModel {
  // Static class methods for default settings.
  // Default world is centered, patchSize = 13, min/max = 16
  static defaultWorld (maxX, maxY) {
    return super.defaultWorld(maxX, maxY)
  }
  // Default renderer is ThreeView.js
  static defaultRenderer () {
    return ThreeView.defaultOptions()
  }
  static printDefaultViewOptions () {
    ThreeView.printMeshOptions()
  }

  // The Model constructor takes a DOM div and model and renderer options.
  // Default values are given for all constructor arguments.
  constructor (div = document.body,
               worldOptions = Model.defaultWorld(),
               rendererOptions = Model.defaultRenderer()) {
    // Super ctor sets worldOptions, world, patches, turtles, links
    // Tricky: dependes on resetModel duplicated in this name space.
    super(worldOptions)
    this.div = util.isString(div) ? document.getElementById(div) : div
    this.renderOptions = rendererOptions
    this.anim = new Animator(this)

    // Default colormap. Change this to another if you'd prefer.
    this.colorMap = ColorMap.Basic16

    // View setup.
    this.spriteSheet = new SpriteSheet()
    // Initialize view
    this.view = new rendererOptions.Renderer(this, rendererOptions)
    // Initialize meshes.
    this.meshes = {}
    util.forEach(rendererOptions, (val, key) => {
      if (val.meshClass) {
        const Mesh = ThreeMeshes[val.meshClass]
        const options = Mesh.options() // default options
        Object.assign(options, val.options) // override by user's
        if (options.color) // convert options.color rgb array to Color.
          options.color = Color.toColor(new Float32Array(options.color))
        this.meshes[key] = new ThreeMeshes[val.meshClass](this.view, options)
      }
    })

    // Initialize model calling `startup`, `reset` .. which calls `setup`.
    // this.modelReady = false
    // this.startup().then(() => {
    //   // this.reset(); this.setup(); this.modelReady = true
    //   this.reset(); this.modelReady = true
    // })
    this.resetView() // REMIND: Temporary
  }
  // Call fcn(this) when any async
  // whenReady (fcn) {
  //   // util.waitPromise(() => this.modelReady).then(fcn())
  //   util.waitOn(() => this.modelReady, () => fcn(this))
  // }
  // Add additional world variables derived from constructor's `modelOptions`.
  // setWorld () {
  //   const world = this.world
  //   // REMIND: change to xPatches, yPatches?
  //   world.numX = world.maxX - world.minX + 1
  //   world.numY = world.maxY - world.minY + 1
  //   world.width = world.numX * world.patchSize
  //   world.height = world.numY * world.patchSize
  //   world.minXcor = world.minX - 0.5
  //   world.maxXcor = world.maxX + 0.5
  //   world.minYcor = world.minY - 0.5
  //   world.maxYcor = world.maxY + 0.5
  //   world.isOnWorld = (x, y) => // No braces, is lambda expression
  //     (world.minXcor <= x) && (x <= world.maxXcor) &&
  //     (world.minYcor <= y) && (y <= world.maxYcor)
  // }
  // createQuad (r, z = 0) { // r is radius of xy quad: [-r,+r], z is quad z
  //   const vertices = [-r, -r, z, r, -r, z, r, r, z, -r, r, z]
  //   const indices = [0, 1, 2, 0, 2, 3]
  //   return {vertices, indices}
  // }
  // (Re)initialize the model. REMIND: not quite right
  // setAgentSetViewProps (agentSet, mesh) {
  //   agentSet.isMonochrome = mesh.isMonochrome()
  //   agentSet.useSprites = mesh.useSprites()
  // }
  // initAgentSet (name, AgentsetClass, AgentClass) {
  //   const agentset = new AgentsetClass(this, AgentClass, name)
  //   const mesh = this.meshes[name]
  //   // const meshName = mesh.constructor.name
  //   this[name] = agentset
  //   // agentset.setDefault('renderer', mesh)
  //   agentset.renderer = mesh
  //   if (mesh.fixedColor) agentset.setDefault('color', mesh.fixedColor)
  //   // REMIND: Turtles only?
  //   if (mesh.fixedShape) agentset.setDefault('shape', mesh.fixedShape)
  //   // this.agentset.fixedColor = agentset.renderer.options.color
  //   // agentset.useSprites = meshName in ['PointSpritesMesh', 'QuadSpritesMesh']
  //   // agentset.fixedColor = agentset.renderer.options.color
  //   // agentset.useSprites = meshName in ['PointSpritesMesh', 'QuadSpritesMesh']
  //   // agentset.fixedShape =
  //   mesh.init(agentset)
  // }
  initAgentRenderer (agentset) {
    // const agentset = new AgentsetClass(this, AgentClass, name)
    const mesh = this.meshes[agentset.name]
    // const meshName = mesh.constructor.name
    // this[name] = agentset
    // agentset.setDefault('renderer', mesh)
    agentset.renderer = mesh
    if (mesh.fixedColor) agentset.setDefault('color', mesh.fixedColor)
    // REMIND: Turtles only?
    if (mesh.fixedShape) agentset.setDefault('shape', mesh.fixedShape)
    // this.agentset.fixedColor = agentset.renderer.options.color
    // agentset.useSprites = meshName in ['PointSpritesMesh', 'QuadSpritesMesh']
    // agentset.fixedColor = agentset.renderer.options.color
    // agentset.useSprites = meshName in ['PointSpritesMesh', 'QuadSpritesMesh']
    // agentset.fixedShape =
    mesh.init(agentset)
  }
  // Duplicate core.resetModel. Called by core's ctor.
  // Can't use core's because imported Patches etc, are view versions
  // thus need to be in this module's scope. A bit odd.
  resetModel () {
    this.world = new World(this.worldOptions)
    // Base AgentSets setup here. Breeds handled by setup
    this.initAgentSet('patches', Patches, Patch)
    this.initAgentSet('turtles', Turtles, Turtle)
    this.initAgentSet('links', Links, Link)
  }
  resetView () {
    this.anim.reset()
    this.refreshLinks = this.refreshTurtles = this.refreshPatches = true

    // Breeds handled by setup
    this.initAgentRenderer(this.patches)
    this.initAgentRenderer(this.turtles)
    this.initAgentRenderer(this.links)
    // this.patches = new Patches(this, Patch, 'patches')
    // this.patches.renderer = this.meshes.patches
    // this.meshes.patches.init(this.patches)
    // this.setAgentSetViewProps(this.patches, this.meshes.patches)
    //
    // this.turtles = new Turtles(this, Turtle, 'turtles')
    // this.turtles.renderer = this.meshes.turtles
    // this.meshes.turtles.init(this.turtles)
    // this.setAgentSetViewProps(this.turtles, this.meshes.turtles)
    //
    // this.links = new Links(this, Link, 'links')
    // this.turtles.links = this.meshes.links
    // this.meshes.links.init(this.links)
    // this.setAgentSetViewProps(this.links, this.meshes.links)

    // this.setup()
    // if (restart) this.start()
  }
  reset () {
    this.resetModel()
    this.resetView()
  }

  randomColor () { return this.colorMap.randomColor() }

// ### User Model Creation
  // A user's model is made by subclassing Model and over-riding
  // 2 CoreAS abstract methods: setup, step.
  // start, stop, once required: CoreAS has no animator.

  // setup () {} // Your initialization code goes here
  // // Update/step your model here
  // step () {} // called each step of the animation

  // Start/stop the animation. Return model for chaining.
  start () {
    // util.waitOn(() => this.modelReady, () => {
    //   this.anim.start()
    // })
    this.anim.start()
    return this
  }
  stop () { this.anim.stop() }
  // Animate once by `step(); draw()`.
  once () { this.stop(); this.anim.once() } // stop is no-op if already stopped

  // Change the world parameters. Requires a reset.
  // Resets Patches, Turtles, Links & reinitializes canvases.
  // If restart argument is true (default), will restart after resetting.
  // resizeWorld (modelOptions, restart = true) {
  //   Object.assign(this.world, modelOptions)
  //   this.setWorld(this.world)
  //   this.reset(restart)
  // }

  draw (force = this.anim.stopped || this.anim.draws === 1) {
    // const {scene, camera} = this.view
    if (this.div) {
      if (force || this.refreshPatches) {
        if (this.patches.length > 0)
          this.patches.renderer.update(this.patches)
      }
      if (force || this.refreshTurtles) {
        if (this.turtles.length > 0)
          this.turtles.renderer.update(this.turtles)
      }
      if (force || this.refreshLinks) {
        if (this.links.length > 0)
          this.links.renderer.update(this.links)
      }

      // REMIND: generalize.
      this.view.renderer.render(this.view.scene, this.view.camera)
    }
    if (this.view.stats) this.view.stats.update()
  }

  // Breeds: create breeds/subarrays of Patches, Agents, Links
  // Unlike resetModel(), it can use CoreAS's; the baseSets
  // have used this module's Patch, Patches, ...
  // patchBreeds (breedNames) {
  //   for (const breedName of breedNames.split(' ')) {
  //     this[breedName] = this.patches.newBreed(breedName)
  //   }
  // }
  // turtleBreeds (breedNames) {
  //   for (const breedName of breedNames.split(' ')) {
  //     this[breedName] = this.turtles.newBreed(breedName)
  //   }
  // }
  // linkBreeds (breedNames) {
  //   for (const breedName of breedNames.split(' ')) {
  //     this[breedName] = this.links.newBreed(breedName)
  //   }
  // }
}

export default Model
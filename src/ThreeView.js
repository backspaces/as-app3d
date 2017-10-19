// import SpriteSheet from './SpriteSheet.js'
import util from './util.js'
import ThreeMeshes from './ThreeMeshes.js'

import THREE from '../dist/three.wrapper.js'
import '../dist/OrbitControls.wrapper.js'
import Stats from '../dist/stats.wrapper.js'
import dat from '../dist/dat.gui.wrapper.js'

// window.Meshes = Meshes // REMIND

class ThreeView {
  static defaultOptions (useThreeHelpers = true, useUIHelpers = true) {
    const options = {
    // include me in options so Model can instanciate me!
      Renderer: ThreeView, // REMIND: use string.
      orthoView: false,             // 'Perspective', 'Orthographic'
      clearColor: 0x000000,         // clear to black
      useAxes: useThreeHelpers,     // show x,y,z axes
      useGrid: useThreeHelpers,     // show x,y plane
      useControls: useThreeHelpers, // navigation. REMIND: control name?
      useStats: useUIHelpers,       // show fps widget
      useGUI: useUIHelpers,         // activate dat.gui UI
      // meshes: {
      patches: {
        meshClass: 'PatchesMesh'
      },
      turtles: {
        meshClass: 'QuadSpritesMesh'
        // meshClass: 'PointsMesh'
      },
      links: {
        meshClass: 'LinksMesh'
      }
      // }
    }
    // util.forEach(options.meshes, (val, key) => {
    //   const Mesh = ThreeMeshes[val.meshClass]
    //   const meshOptions = Mesh.options()
    //   val.options = meshOptions
    // })
    util.forEach(options, (val, key) => {
      if (val.meshClass) {
        const Mesh = ThreeMeshes[val.meshClass]
        const meshOptions = Mesh.options()
        val.options = meshOptions
      }
    })

    return options
  }
  static printMeshOptions () {
    const obj = {}
    for (const MeshName in ThreeMeshes) {
      const optionsFcn = ThreeMeshes[MeshName].options
      if (optionsFcn) {
        obj[MeshName] = {
          options: ThreeMeshes[MeshName].options()
        }
      }
    }
    const str = util.objectToString(obj)
    console.log(str)
  }

  constructor (model, options = {}) {
    this.model = model
    // this.spriteSheet = model.spriteSheet // REMIND: Temp

    // Initialize options
    Object.assign(this, ThreeMeshes.defaultOptions) // install defaults
    Object.assign(this, options) // override defaults
    if (this.Renderer !== ThreeView)
      throw Error('ThreeView ctor: Renderer not ThreeView', this.renderer)

    // Initialize Three.js
    this.initThree()
    this.initThreeHelpers()
  }
  // Init Three.js core: scene, camera, renderer
  initThree () {
    const {clientWidth, clientHeight} = this.model.div
    const {orthoView, clearColor} = this
    // const {width, height, centerX, centerY} = this.model.world
    const {width, height} = this.model.world
    const [halfW, halfH] = [width / 2, height / 2]

    // this.spriteSheet.texture = new THREE.CanvasTexture(this.spriteSheet.ctx)
    // this.spriteSheet.setTexture(THREE.CanvasTexture)

    // REMIND: need world.minZ/maxZ
    const orthographicCam =
      new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 1, 20 * width)
    orthographicCam.position.set(0, 0, 10 * width)
    orthographicCam.up.set(0, 0, 1)

    const perspectiveCam =
      new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 1, 10000)
    // perspectiveCam.position.set(width + centerX, -width - centerY, width)
    perspectiveCam.position.set(width, -width, width)
    // perspectiveCam.lookAt(new THREE.Vector3(centerX, centerY, 0))
    perspectiveCam.up.set(0, 0, 1)

    const scene = new THREE.Scene()
    // scene.position = new THREE.Vector3(centerX, centerY, 0)
    const camera = orthoView ? orthographicCam : perspectiveCam

    // if (orthoView)
    //   camera.position.set(0, 0, 100 * width)
    // else
    //   camera.position.set(width, -width, width)
    // camera.up.set(0, 0, 1)

    const renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(clientWidth, clientHeight)
    renderer.setClearColor(clearColor)
    this.model.div.appendChild(renderer.domElement)

    // window.addEventListener('resize', () => {
    //   const {clientWidth, clientHeight} = this.model.div
    //   camera.aspect = clientWidth / clientHeight
    //   camera.updateProjectionMatrix()
    //   renderer.setSize(clientWidth, clientHeight)
    // })
    window.addEventListener('resize', () => { this.resize() })

    Object.assign(this, {scene, camera, renderer, orthographicCam, perspectiveCam})
  }
  resize () {
    const {clientWidth, clientHeight} = this.model.div
    const {width, height} = this.model.world

    if (this.orthoView) {
      const zoom = Math.min(clientWidth / width, clientHeight / height)
      this.renderer.setSize(zoom * width, zoom * height)
    } else {
      this.camera.aspect = clientWidth / clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(clientWidth, clientHeight)
    }
  }
  toggleCamera () {
    this.orthoView = !this.orthoView
    if (this.orthoView) {
      this.camera = this.orthographicCam
    } else {
      this.camera = this.perspectiveCam
    }
    this.resize()
  }
  // Return a dataURL for the current model step.
  snapshot (useOrtho = true) {
    // Don't set camera, can change w/ toggle below
    const {scene, renderer, model} = this
    const toggle = useOrtho && this.camera === this.perspectiveCam

    if (toggle) { this.toggleCamera(); model.draw(true) }
    renderer.render(scene, this.camera)
    const durl = renderer.domElement.toDataURL()
    if (toggle) this.toggleCamera()
    return durl
  }
  initThreeHelpers () {
    const {scene, renderer, camera} = this
    const {useAxes, useGrid, useControls, useStats, useGUI} = this
    const {width} = this.model.world
    const helpers = {}

    if (useAxes) {
      helpers.axes = new THREE.AxisHelper(1.5 * width / 2)
      scene.add(helpers.axes)
    }
    if (useGrid) {
      helpers.grid = new THREE.GridHelper(1.25 * width, 10)
      helpers.grid.rotation.x = THREE.Math.degToRad(90)
      scene.add(helpers.grid)
    }
    if (useControls) {
      helpers.controls = new THREE.OrbitControls(camera, renderer.domElement)
    }
    if (useStats) {
      helpers.stats = new Stats()
      // This does not work: helpers.stats.dom.style.position = 'absolute'
      document.body.appendChild(helpers.stats.dom)
    }
    if (useGUI) {
      helpers.gui = new dat.GUI() // auto adds to body, appendChild not needed
    }

    Object.assign(this, helpers)
  }
}

export default ThreeView

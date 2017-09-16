const {ColorMap, Model, util} = AS

util.toWindow({ ColorMap, Model, util })

class AntModel extends Model {
  setup () {
    // UI globals:
    this.population = 255
    this.maxPheromone = 35
    this.diffusionRate = 0.30
    this.evaporationRate = 0.01
    this.wiggleAngle = util.radians(30)

    this.nestColor = 'yellow'
    this.foodColor = 'blue'

    // const ss = this.renderer.spriteSheet
    const ss = this.spriteSheet
    this.nestSprite = ss.newSprite('bug', this.nestColor, 'blue')
    this.foodSprite = ss.newSprite('bug', this.foodColor, 'yellow')

    this.nestColorMap = ColorMap.gradientColorMap()

    this.setupPatches()
    this.setupTurtles()
  }
  setupPatches () {
  }
  setupTurtles () {
  }

  step () {
  }
}

const options = Model.defaultWorld(6, 40)
const model = new AntModel(document.body, options).start()
// note that start above also uses so is safe. fine to include below too.
model.whenReady(() => {
  // model.start()
  console.log('patches:', model.patches.length)
  console.log('turtles:', model.turtles.length)
  const {world, patches, turtles, links} = model
  util.toWindow({ world, patches, turtles, links, model })
  document.body.appendChild(model.view.spriteSheet.ctx.canvas)
})

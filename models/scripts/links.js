// import ColorMap from '../../dist/AS/ColorMap.js'
// import Model from '../../dist/AS/Model.js'
// import util from '../../dist/AS/util.js'
const {ColorMap, Model, util} = AS

util.toWindow({ ColorMap, Model, util })

class LinksModel extends Model {
  setup () {
    this.turtles.own('speed')
    this.turtles.setDefault('atEdge', 'bounce')
    // this.turtles.setDefault('z', 0.1)

    this.patchesCmap = ColorMap.grayColorMap(200, 255) // light gray map
    this.patches.ask(p => {
      p.color = this.patchesCmap.randomColor()
    })

    this.turtles.create(1000, (t) => {
      t.size = util.randomFloat2(0.2, 0.5) // + Math.random()
      t.speed = util.randomFloat2(0.01, 0.05) // 0.5 + Math.random()
    })

    this.turtles.ask(turtle => {
      const other = this.turtles.otherOneOf(turtle)
      if (turtle.links.length === 0 || other.links.length === 0)
        this.links.create(turtle, other, (link) => {
          link.color = this.links.randomColor()
        })
    })

    // util.repeat(100, (i, a) => {
    //   const turtles = this.turtles.nOf(2)
    //   this.links.create(turtles[0], turtles[1], (link) => {
    //     link.color = this.links.randomColor()
    //   })
    // })
  }
  step () {
    // REMIND: Three mouse picking
    this.turtles.ask((t) => {
      t.theta += util.randomCentered(0.1)
      t.forward(t.speed)
    })
  }
}
const model = new LinksModel(document.body).start()
model.whenReady(() => {
  // debugging
  console.log('patches:', model.patches.length)
  console.log('turtles:', model.turtles.length)
  console.log('links:', model.links.length)
  const {world, patches, turtles, links} = model
  util.toWindow({ world, patches, turtles, links, model })
})

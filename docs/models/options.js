import {ColorMap, Model, util} from '../dist/as-app3d.esm.min.js'
// This model demonstrates use of Three.js meshes.
// Generally the default QuadSprites needs no setup.
// This is for users wanting to use Points and monochrome meshes.


util.toWindow({ ColorMap, Model, util })

// To see all the Three mesh options, use Model.printDefaultViewOptions()
// {
//   PatchesMesh: {
//     options: {
//       textureOptions: {
//         minFilter: "NearestFilter",
//         magFilter: "NearestFilter"
//       },
//       z: 1
//     }
//   },
//   QuadSpritesMesh: {
//     options: {
//       z: 2
//     }
//   },
//   PointsMesh: {
//     options: {
//       pointSize: 1,
//       color: null,
//       z: 2
//     }
//   },
//   LinksMesh: {
//     options: {
//       color: null,
//       z: 1.5
//     }
//   }
// }

// Here is a set of the turtle and link options.
// Patches need no options, a simple canvas texture.
// The two links options w/ three turtles options is 6 possibilities.
const optionSet = {
  links: {
    mono: {
      meshClass: 'LinksMesh',
      options: {color: [1, 0, 0]}
    },
    multi: {
      meshClass: 'LinksMesh',
      options: {}
    }
  },
  turtles: {
    monoPoints: {
      meshClass: 'PointsMesh',
      options: {color: [0, 0, 1]}
    },
    multiPoints: {
      meshClass: 'PointsMesh',
      options: {}
    },
    sprites: {
      meshClass: 'QuadSpritesMesh',
      options: {}
    }
  }
}

// Choose one of the 6 possible option sets
const linksOptionName = util.oneKeyOf(optionSet.links)
const linksOption = optionSet.links[linksOptionName]
const turtlesOptionName = util.oneKeyOf(optionSet.turtles)
const turtlesOption = optionSet.turtles[turtlesOptionName]

// Print the options:
console.log('\nOptions: (no color = random colors)')
console.log('TurtleOption', turtlesOptionName, util.objectToString1(turtlesOption))
console.log('LinksOption', linksOptionName, util.objectToString1(linksOption))
console.log('Warnings are fine. Mainly fixed color/shape amongst the 6 options.')
console.log('')

// Build a "hello world" random-walker model with patches, turtles, and links.
class OptionsModel extends Model {
  setup () {
    this.turtles.own('speed')
    this.turtles.setDefault('atEdge', 'bounce')

    // Color the patches.
    this.patches.ask(p => {
      p.color = ColorMap.LightGray.randomColor()
    })

    // Create turtles and set properties.
    this.turtles.create(1000, (t) => {
      t.size = 0.5 // half a patch in size
      t.speed = util.randomFloat2(0.01, 0.05) // 0.5 + Math.random()
    })

    // Create links.
    util.repeat(100, (i, a) => {
      const turtles = this.turtles.nOf(2)
      this.links.create(turtles[0], turtles[1])
    })
  }
  step () {
    // Random walk.
    this.turtles.ask((t) => {
      t.theta += util.randomCentered(0.1)
      t.forward(t.speed)
    })
  }
}

// Create the model "instance" using our own custom renderer options:
// First get the default options:
const options = Model.defaultRenderer()
// Replace the default options with ours:
options.turtles = turtlesOption
options.links = linksOption

// Create the model. The "undefinded" says to use the default world options.
const model = new OptionsModel(document.body, undefined, options)
model.setup()
model.start()

// Debugging
// - print number of patches, turtles, links
// - place several variables in the global scope.
console.log('patches:', model.patches.length)
console.log('turtles:', model.turtles.length)
console.log('links:', model.links.length)
const {world, patches, turtles, links} = model
util.toWindow({ world, patches, turtles, links, options, model })



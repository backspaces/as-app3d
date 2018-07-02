import { util } from '../dist/as-app3d.esm.js'
import HelloModel from './HelloModel.js'

const model = new HelloModel()
model.setup()
model.start()

// Debugging
// util.toWindow({ Model, Mouse, util })
const { patches, turtles, links } = model
util.toWindow({ util, patches, turtles, links, model })



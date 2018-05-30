import {ColorMap, Model,  AgentArray, RGBDataSet, util } from '../dist/as-app3d.esm.js'

util.toWindow({ AgentArray, ColorMap, Model, RGBDataSet, util })

class DropletsModel extends Model {
    static stepTypes() {
        return {
            minNeighbor: 'minNeighbor',
            patchAspect: 'patchAspect',
            dataSetAspectNearest: 'dataSetAspectNearest',
            dataSetAspectBilinear: 'dataSetAspectBilinear',
        }
    }
    async startup() {
        // These are options for the step() behavior:
        this.stepType = DropletsModel.stepTypes().dataSetAspectNearest
        this.killOffworld = false // Kill or clamp turtles when offworld.
        console.log(
            'StepType:',
            this.stepType,
            'killOffworld:',
            this.killOffworld
        )

        this.url =
            'http://s3.amazonaws.com/elevation-tiles-prod/terrarium/13/1594/3339.png'
        this.png = await util.imagePromise(this.url)

        const elevation = new RGBDataSet(this.png, -32768, 1 / 256, AgentArray)
        const slopeAndAspect = elevation.slopeAndAspect()
        const { dzdx, dzdy, slope, aspect } = slopeAndAspect
        Object.assign(this, { elevation, dzdx, dzdy, slope, aspect })
        util.toWindow({ elevation, dzdx, dzdy, slope, aspect })

        const logHist = (name, ds = this[name]) => {
            const hist = AgentArray.fromArray(ds.data).histogram()
            const { min, max } = hist.parameters
            console.log(
                `${name}:`,
                hist.toString(),
                'min/max:',
                min.toFixed(3),
                max.toFixed(3)
            )
        }
        logHist('elevation')
        logHist('aspect')
        logHist('slope')
        logHist('dzdx')
        logHist('dzdy')

        this.patches.importDataSet(elevation, 'elevation', true)
        this.patches.importDataSet(aspect, 'aspect', true)
    }
    // setup () {
    //   const patchElevations = this.patches.exportDataSet('elevation', AgentArray)
    //   const cmap = ColorMap.Gray
    //
    //   const gray = patchElevations.scale(0, 255)
    //   util.toWindow({patchElevations, gray})
    //
    //   // Kill if droplet moves off world/tile.
    //   // Otherwise default 'clamp' (bunch up on edge)
    //   if (this.killOffworld)
    //     this.turtles.setDefault('atEdge', turtle => turtle.die())
    //   this.turtles.setDefault('shape', 'circle')
    //   this.turtles.setDefault('size', '0.3')
    //   // this.turtles.setDefault('color', 'yellow')
    //   this.speed = 0.2
    //   this.anim.setRate(15)
    //   // this.sampleType = ''
    //
    //   let localMins = 0
    //   this.patches.ask(p => {
    //     const g = Math.round(gray.data[p.id])
    //     p.color = cmap[g]
    //
    //     if (p.neighbors.minOneOf('elevation').elevation > p.elevation) {
    //       p.color = 'red'
    //       localMins++
    //     }
    //     p.sprout(1, this.turtles)
    //   })
    //   console.log('localMins', localMins)
    // }

    setup() {
        const patchElevations = this.patches.exportDataSet(
            'elevation',
            AgentArray
        )
        const cmap = ColorMap.Gray

        const gray = patchElevations.scale(0, 255)

        // Kill if droplet moves off world/tile.
        // Otherwise default 'clamp' (bunch up on edge)
        if (this.killOffworld) {
            this.turtles.setDefault('atEdge', turtle => turtle.die())
        }
        this.turtles.setDefault('shape', 'circle')
        this.turtles.setDefault('size', '0.3')
        this.turtles.setDefault('color', 'yellow')
        this.speed = 0.2
        this.anim.setRate(15)

        // Could be a breed, but this is useful as well
        this.localMins = new AgentArray()
        // let localMins = 0
        this.patches.ask(p => {
            const g = Math.round(gray.data[p.id])
            p.color = cmap[g]
            // p.isLocalMin = false
            if (p.neighbors.minOneOf('elevation').elevation > p.elevation) {
                p.color = 'red'
                // localMins++
                this.localMins.push(p)
            }
            p.sprout(1, this.turtles)
        })
        console.log('localMins', this.localMins.length)
        util.toWindow({ patchElevations, gray, localMins: this.localMins })
    }

    step() {
        // if (this.anim.ticks % 50 === 1)
        //   console.log('turtlesOnMin:', this.turtlesOnLocalMins())

        this.turtles.ask(t => {
            let move = true
            const stepType = this.stepType

            if (stepType === 'minNeighbor') {
                const n = t.patch.neighbors.minOneOf('elevation')
                if (t.patch.elevation > n.elevation) {
                    // Face the best neighbor if better than me
                    t.face(n)
                } else {
                    // Otherwise place myself at my patch center
                    t.setxy(t.patch.x, t.patch.y)
                    move = false
                }
            } else if (stepType === 'patchAspect') {
                t.theta = t.patch.aspect
            } else if (stepType.includes('dataSet')) {
                // Move in direction of aspect DataSet:
                const { minXcor, maxYcor, numX, numY } = this.world
                // bilinear many more minima
                const nearest = stepType === 'dataSetAspectNearest'
                t.theta = this.aspect.coordSample(
                    t.x,
                    t.y,
                    minXcor,
                    maxYcor,
                    numX,
                    numY,
                    nearest
                )
            } else {
                throw Error('bad stepType: ' + stepType)
            }

            if (move) t.forward(this.speed)
        })
    }

    turtlesOnLocalMins() {
        return this.localMins.reduce(
            (acc, p) => acc + p.turtlesHere().length,
            0
        )
    }
}

const options = Model.defaultWorld(50)
const model = new DropletsModel(document.body, options)
const { world, patches, turtles, links } = model
util.toWindow({ world, patches, turtles, links, model })

model.startup().then(() => {
    model.setup()
    console.log('patches:', model.patches.length)
    console.log('turtles:', model.turtles.length)
    console.log('localMins', model.localMins.length)
    model.start()
})

// A GIS dem colormap could be useful. Grey better contrast tho.
// const cmap = ColorMap.Jet
// const DEMrgbs = [
//   [ 0, 97, 71],
//   [ 16, 122, 47],
//   [232, 215, 125],
//   [161, 67, 0],
//   [158, 0, 0],
//   [110, 110, 110],
//   [255, 255, 255]
// ]
// const cmap = ColorMap.gradientColorMap(256, DEMrgbs) //, DEMstops)



import Model from '../src/Model.js'
import { util } from '../agentscript/agentscript.esm.js'

class TSPModel extends Model {
    // Use default ctor

    setup() {
        this.turtleBreeds('nodes travelers')

        this.refreshPatches = false // for static patches
        // @refreshTurtles = false # for static turtles

        // globals
        this.nodeCount = 50
        this.travelersCount = 100
        this.growPopulation = true
        this.useInversion = true
        this.bestTourNodes = []
        this.bestTourLength = 0
        this.bestTourTick = 0
        this.stopTickDifference = 500
        this.done = false

        this.anim.setRate(10, true)

        // defaults
        this.patches.setDefault('color', [250, 250, 0]) // REMIND
        // p.color = [250, 250, 0] for p in @patches

        this.nodes.setDefault('shape', 'circle')
        this.nodes.setDefault('color', [255, 0, 0])
        this.nodes.setDefault('heading', 0) // override promotion to random angle
        // this.travelers.setDefault('hidden', true) // REMIND
        this.travelers.setDefault('size', 0) // REMIND
        this.links.setDefault('color', [255, 0, 0])

        this.nodes.create(this.nodeCount, node => {
            this.setupNode(node)
        })

        this.createTourLinks(this.nodes) //()
        this.bestTourLength = this.links.reduce((sum, l) => sum + l.length(), 0)

        this.travelers.create(this.travelersCount, t => this.setupTraveler(t))
    }

    setupNode(node) {
        // REMIND: space the nodes away from each other
        node.moveTo(this.patches.oneOf())
    }
    setupTraveler(t) {
        t.tourNodes = this.nodes.clone().shuffle()
        t.tourLength = this.lengthFromNodes(t.tourNodes)
    }

    step() {
        if (this.done) return
        this.travelers.ask(t => this.makeTour(t))
        this.installBestTour()
        this.stopIfDone()
    }

    createTourLinks(nodeList) {
        this.links.clear()
        nodeList.ask((node, i) => {
            const nextNode = nodeList[(i + 1) % nodeList.length]
            this.links.create(node, nextNode)
        })
    }
    lengthFromNodes(nodeList) {
        let len = 0
        nodeList.ask((node, i) => {
            const nextNode = nodeList[(i + 1) % nodeList.length]
            len += node.distance(nextNode)
        })
        return len
    }

    installBestTour() {
        while (this.travelers.length > this.travelersCount) {
            this.travelers.maxOneOf('tourLength').die()
        }
        const a = this.travelers.minOneOf('tourLength')
        if (a.tourLength < this.bestTourLength) {
            this.bestTourLength = a.tourLength
            this.bestTourNodes = a.tourNodes
            this.bestTourTick = this.ticks
            this.reportNewTour()
            this.createTourLinks(this.bestTourNodes)
        }
    }

    makeTour(a) {
        const nlist = this.useInversion
            ? this.inversionStrategy(a)
            : this.randomStrategy(a)
        const len = this.lengthFromNodes(nlist)
        if (this.growPopulation) {
            a.hatch(1, this.travelers, a => {
                a.tourNodes = nlist
                a.tourLength = len
            })
        } else if (len < a.tourLength) {
            a.tourNodes = nlist
            a.tourLength = len
        }
    }
    randomStrategy(a) {
        return a.tourNodes.clone().shuffle()
    }
    inversionStrategy(a) {
        return this.newInversion(a.tourNodes)
    }

    newInversion(nlist) {
        let len = nlist.length
        const i = util.randomInt(len - 1)
        len = 2 + util.randomInt(len - i - 2)
        return nlist // result will be agentarray
            .slice(0, i)
            .concat(nlist.slice(i, i + len).reverse())
            .concat(nlist.slice(i + len))
    }

    stopIfDone() {
        if (this.ticks - this.bestTourTick === this.stopTickDifference) {
            console.log(
                `Stop: no change after ${this.stopTickDifference} ticks`,
                `Best tour: ${this.bestTourLength} at tick ${this.bestTourTick}`
            )
            this.done = true
            // this.stop() // REMIND: let 3d keep running after done
        }
    }
    reportNewTour() {
        console.log(
            `new best tour at tick ${this.bestTourTick}: ${this.bestTourLength}`
        )
    }
}

const model = new TSPModel()
model.setup()
model.start()

const { patches, turtles, links, nodes, travelers } = model
util.toWindow({ util, patches, turtles, links, nodes, travelers, model })

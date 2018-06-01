import {ColorMap, Model,  util } from '../dist/as-app3d.esm.js'

util.toWindow({ ColorMap, Model, util })

class FlockModel extends Model {
    setVision(vision) {
        this.vision = vision
        this.patches.cacheRect(vision)
    }
    setMaxTurn(maxTurnDegrees) {
        this.maxTurn = util.radians(maxTurnDegrees)
    }
    setup() {
        // console.log('firebase', firebase)
        this.turtles.setDefault('atEdge', 'wrap')
        this.turtles.setDefault('z', 0.6)
        this.turtles.setDefault('size', 1)
        this.turtles.setDefault('speed', 0.1)

        const cmap = ColorMap.grayColorMap(0, 100)
        this.patches.ask(p => {
            p.setColor(cmap.randomColor())
        })

        this.refreshPatches = false
        this.setMaxTurn(3.0)
        this.setVision(3)
        this.minSeparation = 0.75
        // this.anim.setRate(30)
        this.population = 200 // 300 // 1e4 this.patches.length

        util.repeat(this.population, () => {
            this.patches.oneOf().sprout()
        })
    }

    step() {
        this.turtles.ask(t => {
            this.flock(t)
        })
    }
    flock(a) {
        // a is turtle
        // flockmates = this.turtles.inRadius(a, this.vision).other(a)
        const flockmates = this.turtles.inRadius(a, this.vision, false)
        // flockmates = a.inRadius(this.turtles, this.vision, false)
        if (this.inBounds(a)) {
            const theta = a.towards({ x: 0, y: 0 })
            this.turnTowards(a, theta, Math.PI / 10)
        } else if (flockmates.length !== 0) {
            // REMIND: distanceSq or manhattan distance
            const nearest = flockmates.minOneOf(f => f.distance(a))
            if (a.distance(nearest) < this.minSeparation) {
                this.separate(a, nearest)
            } else {
                this.align(a, flockmates)
                this.cohere(a, flockmates)
            }
        }
        a.forward(a.speed)
    }
    separate(a, nearest) {
        const theta = nearest.towards(a)
        this.turnTowards(a, theta)
    }
    inBounds(a) {
        return (
            a.x < this.world.minX + 1 ||
            a.x > this.world.maxX - 1 ||
            a.y < this.world.minY + 1 ||
            a.y > this.world.maxY - 1
        )
    }
    align(a, flockmates) {
        this.turnTowards(a, this.averageHeading(flockmates))
    }
    cohere(a, flockmates) {
        this.turnTowards(a, this.averageHeadingTowards(a, flockmates))
    }
    turnTowards(a, theta, max = this.maxTurn) {
        let turn = util.subtractRadians(theta, a.theta) // angle from h to a
        turn = util.clamp(turn, -max, max) // limit the turn
        a.rotate(turn)
    }
    averageHeading(flockmates) {
        const thetas = flockmates.map(f => f.theta)
        const dx = thetas.map(t => Math.cos(t)).reduce((x, y) => x + y)
        const dy = thetas.map(t => Math.sin(t)).reduce((x, y) => x + y)
        return Math.atan2(dy, dx)
    }
    averageHeadingTowards(a, flockmates) {
        const towards = flockmates.map(f => f.towards(a))
        const dx = towards.map(t => Math.cos(t)).reduce((x, y) => x + y)
        const dy = towards.map(t => Math.sin(t)).reduce((x, y) => x + y)
        return Math.atan2(dy, dx)
    }

    // headingsOf (boids) { return boids.map((t) => t.theta) }
    reportFlockVectorSize() {
        const headings = this.turtles.map(t => t.theta)
        const dx = headings
            .map(theta => Math.cos(theta))
            .reduce((x, y) => x + y)
        const dy = headings
            .map(theta => Math.sin(theta))
            .reduce((x, y) => x + y)
        return Math.sqrt(dx * dx + dy * dy) / this.population
    }
}

const model = new FlockModel()
model.setup()
model.start()

// Debugging
console.log('patches:', model.patches.length)
console.log('turtles:', model.turtles.length)
const { world, patches, turtles } = model
util.toWindow({ world, patches, turtles, model })



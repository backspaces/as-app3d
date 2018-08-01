/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// A NetLogo-like mouse handler. See Mouse for a sophisticated delegation mouse
//
// Event locations, clientX/Y, screenX/Y, offsetX/Y, pageX/Y can be confusing.
// https://stackoverflow.com/questions/21064101/understanding-offsetwidth-clientwidth-scrollwidth-and-height-respectively
// See: [this gist](https://gist.github.com/branneman/fc66785c082099298955)
// and [this post](http://www.jacklmoore.com/notes/mouse-position/) and others.
export default class Mouse {
    // Create and start mouse obj, args: a model, and a callback method.
    constructor(element, world, callback = null) {
        // this.handleMouseDown = this.handleMouseDown.bind(this)
        // this.handleMouseUp = this.handleMouseUp.bind(this)
        // this.handleMouseMove = this.handleMouseMove.bind(this)
        // this.model = model
        // [this.minXcor, this.maxYcor] = model.world
        // this.callback = callback
        // this.div = this.model.div

        Object.assign(this, { element, world, callback })

        // instance event handlers: arrow fcns to insure "this" is us.
        this.mouseDown = e => this.handleMouseDown(e)
        this.mouseUp = e => this.handleMouseUp(e)
        this.mouseMove = e => this.handleMouseMove(e)

        // this.start()
    }

    // Start/stop the mouseListeners.  Note that NetLogo's model is to have
    // mouse move events always on, rather than starting/stopping them
    // on mouse down/up.  We may want do make that optional, using the
    // more standard down/up enabling move events.
    resetParams() {
        this.xCor = this.yCor = NaN
        this.moved = this.down = false
    }
    start() {
        // Note: multiple calls safe
        this.element.addEventListener('mousedown', this.mouseDown)
        document.body.addEventListener('mouseup', this.mouseUp)
        this.element.addEventListener('mousemove', this.mouseMove)
        this.resetParams()
        return this // chaining
    }
    stop() {
        // Note: multiple calls safe
        this.element.removeEventListener('mousedown', this.mouseDown)
        document.body.removeEventListener('mouseup', this.mouseUp)
        this.element.removeEventListener('mousemove', this.mouseMove)
        this.resetParams()
        return this // chaining
    }

    // Handlers for eventListeners
    generalHandler(e, down, moved) {
        this.down = down
        this.moved = moved
        this.setXY(e)
        if (this.callback != null) {
            this.callback(e)
        }
    }
    handleMouseDown(e) {
        this.action = 'down'
        this.generalHandler(e, true, false)
    }
    handleMouseUp(e) {
        this.action = 'up'
        this.generalHandler(e, false, false)
    }
    handleMouseMove(e) {
        this.action = this.down ? 'drag' : 'move'
        this.generalHandler(e, this.down, true)
    }

    // set x, y to be event location in patch coordinates.
    setXY(e) {
        const rect = this.element.getBoundingClientRect()
        const pixX = e.clientX - rect.left
        const pixY = e.clientY - rect.top
        // return this.pixelXYtoPatchXY(pixX, pixY)
        // const xy = this.pixelXYtoPatchXY(pixX, pixY)
        // [this.xCor, this.yCor] = xy // this.pixelXYtoPatchXY(pixX, pixY)
        Object.assign(this, this.pixelXYtoPatchXY(pixX, pixY))
    }

    patchSize() {
        const { numX, numY } = this.world
        const { clientWidth: width, clientHeight: height } = this.element
        const xSize = width / numX
        const ySize = height / numY
        if (xSize !== ySize) {
            throw Error(
                `Mouse patchSize: xSize, ySize differ ${xSize}, ${ySize}`
            )
        }
        return xSize
    }
    // Convert pixel location (top/left offset i.e. mouse)
    // to patch coords(float)
    pixelXYtoPatchXY(x, y) {
        const patchSize = this.patchSize()
        const { minXcor, maxYcor } = this.world
        return {
            x: minXcor + x / patchSize,
            y: maxYcor - y / patchSize,
        }
    }
    // Convert patch coords (float) to pixel location
    // (top / left offset i.e.mouse)
    // patchXYtoPixelXY(x, y) {
    //     return [(x - this.minXcor) * this.size, (this.maxYcor - y) * this.size]
    // }
}

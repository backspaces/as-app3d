import { util } from '../agentscript/agentscript.esm.js'
import dat from 'https://unpkg.com/dat.gui/build/dat.gui.module.js'

class Controller {
    constructor(model, controlList) {
        this.model = model
        this.controlList = controlList
        this.gui = new dat.GUI()
        util.forEach(this.controlList, (obj, key) => {
            this.addControl(key, obj)
            console.log(key, obj)
            this.addUI(this.model, key, obj)
        })
    }
    addControl(name, options) {
        let functionType = null
        const extentType = util.typeOf(options.extent)
        const valueType = util.typeOf(options.value)

        if (valueType !== 'undefined') this.model[name] = options.value

        if (extentType === 'undefined') {
            if (valueType === 'boolean') functionType = 'toggle'
            if (valueType === 'string' || valueType === 'number') {
                functionType = options.cmd === 'listen' ? 'monitor' : 'input'
            }
            // if (valueType === 'number') functionType = 'numberFcn'
            if (valueType === 'undefined') functionType = 'button'
        } else if (extentType === 'array') {
            const itemType = util.typeOf(options.extent[0])
            if (itemType === 'number') functionType = 'slider' // REMIND: step default to 1?
            if (itemType === 'string') functionType = 'chooser'
        } else if (extentType === 'object') {
            functionType = 'chooser' // name/number pairs
        }

        if (!functionType) throw Error('Controls.addControl, no functionType')
        options.type = functionType
    }
    addUI(target, name, options) {
        const { extent, type, cmd } = options
        let control

        switch (type) {
        case 'slider':
            const [min, max, step = 1] = extent
            control = this.gui.add(target, name, min, max).step(step)
            break

        case 'chooser':
            control = this.gui.add(target, name, extent)
            break

        case 'button':
            control = this.gui.add(target, name)
            break

        case 'toggle':
            control = this.gui.add(target, name)
            break

        case 'input':
        case 'monitor':
            control = this.gui.add(target, name)
            break

        default:
            throw Error(`Controller.addUI: bad type: ${type}`)
        }

        if (cmd) {
            if (cmd === 'listen') control.listen()
            else control.onChange(cmd)
        }
        options.control = control
    }
}

export default Controller

/*
    NetLogoUIs.pdf
    https://ccl.northwestern.edu/netlogo/docs/interfacetab.html#working-with-interface-elements
*/

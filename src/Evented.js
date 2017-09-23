
class CallbackReference {
  constructor (cb, eventName) {
    this.keepMe = true
    this.eventName = eventName
    this.cb = cb
  }
  off () {
    this.keepMe = false
    this.cb = undefined
  }
}

export default class Evented {
  constructor () {
    this.events = {}
  }
  onEvent (eventName, callback = () => {}) {
    if (typeof callback !== 'function') return
    if (!this.events.hasOwnProperty(eventName)) {
      this.events[eventName] = []
    }
    var evtRef = new CallbackReference(callback, eventName)
    this.events[eventName].push(evtRef)
    return evtRef
  }
  fire (eventName, argument) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter((eh) => eh.keepMe)
      this.events[eventName].forEach((eh) => {
        setTimeout(() => eh.cb(argument, eventName))
      })
    }
  }
  fireAll (argument) {
    for (var k in this.events) {
      this.fire(k, argument)
    }
  }
}

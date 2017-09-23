
export default class FirebaseInterface {
  constructor (model, uri='thefirsttest') {
    const FBConfig = {
      databaseURL: 'https://acequia.firebaseio.com'
    }
    firebase.initializeApp(FBConfig)
    const db = new firebase.database()
    this.minTimeBetweenUpdates = 100
    this._lastUpdate = 0
    this.rootRef = db.ref().child('testofasx').child(uri)
    this.turtleRef = this.rootRef.child('turtles')
    this.model = model
    this.model.anim.onEvent('start', (arg, ev) => this.updateFB(arg, ev))
    this.model.anim.onEvent('stop', (arg, ev) => this.updateFB(arg, ev))
    this.model.anim.onEvent('step', (arg, ev) => this.updateFB(arg, ev))
  }
  updateFB (fu, evname) {
    const now = new Date().getTime()
    if (now - this._lastUpdate > this.minTimeBetweenUpdates || evname !== 'step') {
      console.log('updateFB')
      this._lastUpdate = now
      this.turtleRef.set(this.turtlesToGeoJson())
    }
  }
  turtlesToGeoJson () {
    var result = {
      'type': 'FeatureCollection',
      'features': []
    }
    this.model.turtles.forEach((crush) => { // crush is the name of the turtle in Finding Nemo.
      let size = 'small'
      if (crush.size > 1) size = 'medium'
      if (crush.size > 2) size = 'large'
      let color = crush.color.string || '#00ff00'
      // console.log('crush', crush)
      result.features.push({
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [crush.x, crush.y]
        },
        'properties': {
          'marker-size': size,
          'marker-color': color,
          'marker-symbol': 'bus' // should have standard agent script icons
        }
      })
    })
    return result
  }
}

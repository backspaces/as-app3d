import TileDataSet from 'lib/TileDataSet.js'
import util from 'lib/util.js'
import ColorMap from 'lib/ColorMap.js'
import Model from 'lib/Model.js'

function main () {
  testTileDS()
}

function testTileDS () {
  var ds = new TileDataSet({ north: 36.097,
    south: 35.658,
    west: -106.93,
    east: -106.055,
    debug: true,
    callback:(err, val) => {
      console.log(ds, err, val)
      // put colors onto a model
      model.patches.importDataSet(ds, 'elev', true)
      const cmap = ColorMap.Jet
      const [min, max] = [ds.min(), ds.max()]
      console.log('min:', min, 'max:', max)
      for (const p of model.patches) {
        p.setColor(cmap.scaleColor(p.elev, min, max))
      }
      model.once()
      console.log(ds)
    }
  })

}



const model = new Model('layers', {
  patchSize: 1,
  minX: -100,
  maxX: 355,
  minY: 0,
  maxY: 255
})

util.toWindow({ model })

main()

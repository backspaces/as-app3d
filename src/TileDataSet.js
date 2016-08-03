import util from 'lib/util.js'
import DataSet from 'lib/DataSet.js'
import RgbImageDataSet from 'lib/RgbImageDataSet.js'
//
// Load tiled data into a dataset
//
class TileDataSet extends DataSet {

  constructor (options = {}) {
    const width = 1280 || options.width
    const height = 800 || options.height
    super(width, height, new Float32Array(width * height))
    // defaults values
    this.url = 'http://node.redfish.com/elevation/{z}/{x}/{y}.png'
    this.north = 35
    this.south = 34.5
    this.west = -106
    this.east = -105.5
    this.debug = false
    this.tileWidth = 256 // pixels
    this.tileHeight = 256 // pixels
    this.maxZoom = 14
    this.minZoom = 10
    this.useFailImage = true // if this is false then the the error callback is called when a tile is not found
    this.callback = function (err, v) {
      if (err) {
        console.error('default Error Callback', err)
      } else {
        if (this.debug) console.log('default success callback', v)
      }
    }
    Object.assign(this, options)
    this.tileLocations = undefined
    this.start()
  }

  start () {
    const zoom = this.zoom || this.calculateGoodZoom()
    if (this.debug) console.log('zoom for tiles:', zoom)
    this.tileLocations = this.calculateTilesNeeded(zoom)
    if (this.debug) console.log('calculated tiles', this.tileLocations)
    // download the tiles
    this.downloadTiles(this.tileLocations, (err, ev) => {
      if (err) {
        this.callback(err)
        return
      }
      // ... then do the stitching, cropping, and finally resizing.
      const mosaic = this.stitchTiles(ev)
      const cropped = this.crop(mosaic)
      const resized = cropped.resample(this.width, this.height, true)
      console.assert(resized.width === this.width && resized.height === this.height, 'Dimensions are wrong', resized)
      this.data = resized.data
      this.callback(undefined, this)
    })
  }

  // calculate good zoom level to use.
  calculateGoodZoom () {
    // How many tile subdivisions in the longitude width
    const bW = Math.abs(this.east - this.west)
    const z1 = Math.log(360 / bW) / Math.log(2)
    // calc how many tile subdivisisions it will take to make the width pixels
    const z2 = Math.log(this.width / this.tileWidth) / Math.log(2)
    // add them together ad round
    const z3 = Math.round(z1 + z2)
    // clamp
    const z4 = Math.min(this.maxZoom, Math.max(this.minZoom, z3))
    return z4
  }

  calculateTilesNeeded (zoom) {
    const ulTile = [this.long2tile(this.west, zoom), this.lat2tile(this.north, zoom)]
    const lrTile = [this.long2tile(this.east, zoom), this.lat2tile(this.south, zoom)]
    const count = [0, 0]
    const tileUL = [this.tile2lat(ulTile[0], ulTile[1], zoom), this.tile2long(ulTile[0], ulTile[1], zoom)]
    const tileLR = [this.tile2lat(lrTile[0] + 1, lrTile[1] + 1, zoom), this.tile2long(lrTile[0] + 1, lrTile[1] + 1, zoom)]
    const result = {width: lrTile[0] - ulTile[0] + 1,
            height: lrTile[1] - ulTile[1] + 1,
            UL: tileUL,
            LR: tileLR,
            tiles: []}
    //
    // loop from upperleft tile to lower right tile and put results into list called result.tiles
    for (let x = ulTile[0]; x <= lrTile[0]; x++) {
      for (let y = ulTile[1]; y <= lrTile[1]; y++) {
        let url = String(this.url)
        url = url.replace('{x}', x).replace('{y}', y).replace('{z}', zoom)
        const res = { imgX: count[0], imgY: count[1], x: x, y: y, url: url }
        result.tiles.push(res)
        //
        count[1]++
      }
      count[1] = 0
      count[0]++
    }
    return result
  }

  // DOWNLOAD
  //
  downloadTiles (tileLocs, successCallback) {
    if (this.debug) console.time('downloadTiles')
    const promises = []
    for (const i of this.tileLocations.tiles) {
      const pr = util.imagePromise(i.url) // this.LFwrapPromiseFactory(i.url, i)
      promises.push(pr)
    }
    Promise.all(promises).then((ev) => {
      if (this.debug) console.timeEnd('downloadTiles')
      successCallback(null, ev)
    }).catch((err) => {
      this.callback(err)
    })
  }

  // if the download fails this makes the data
  //
  makeFailDataSet () {
    var ds = new DataSet(this.tileWidth, this.tileHeight, new Float32Array(this.tileWidth * this.tileHeight))
    ds.useNearest = this.useNearest
    return ds
  }

  // STITCH
  //
  stitchTiles (tiles) {
    if (this.debug) console.time('stitching')
    // Stitch all tiles into a mosaic
    const wid = this.tileLocations.width * this.tileWidth
    const hei = this.tileLocations.height * this.tileHeight
    const stitched = new DataSet(wid, hei, new Float32Array(wid * hei))
    for (const im of tiles) {
      const md = this.tileLocations.tiles.find((a) => {
        return im.src === a.url
      })
      console.assert(md, 'image metadata not found')
      let ds
      if (!im.naturalWidth) { // happens when image fails to load
        ds = this.makeFailDataSet()
      } else {
        ds = new RgbImageDataSet(im)
      }
      stitched.paste(ds, md.imgX * this.tileWidth, md.imgY * this.tileHeight)
    }
    if (this.debug) console.timeEnd('stitching')
    return stitched
  }

  // Extract area of iterest from stitched image
  //
  crop (stitched) {
    if (this.debug) console.time('cropping')
    const wid = stitched.width
    const hei = stitched.height
    const tl = this.tileLocations
    const bindUL = [(this.west - tl.UL[1]), -(this.north - tl.UL[0])]
    const bndLR = [(this.east - tl.UL[1]), -(this.south - tl.UL[0])]
    const dimT = [tl.LR[1] - tl.UL[1], -(tl.LR[0] - tl.UL[0])]
    let pxUL = [wid * (bindUL[0] / dimT[0]), hei * (bindUL[1] / dimT[1])]
    let pxLR = [wid * (bndLR[0] / dimT[0]), hei * (bndLR[1] / dimT[1])]
    pxUL = [Math.round(pxUL[0]), Math.round(pxUL[1])]
    pxLR = [Math.round(pxLR[0]), Math.round(pxLR[1])]
    const extraction = stitched.subset(pxUL[0], pxUL[1], pxLR[0] - pxUL[0], pxLR[1] - pxUL[1])
    if (this.debug) console.timeEnd('cropping')
    return extraction
  }

  //
  //  Slippy Tile Helpers
  //   http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
  //
  long2tile (lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)))
  }
  lat2tile (lat, zoom) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)))
  }

  tile2long (x, y, z) {
    return (x / Math.pow(2, z) * 360 - 180)
  }

  tile2lat (x, y, z) {
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z)
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))))
  }
}

export default TileDataSet

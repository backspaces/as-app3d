import util from 'lib/util.js'
import DataSet from 'lib/DataSet.js'

class RGBDataSet extends DataSet {

  constructor (img, options = {}) {
    super(img.width, img.height, new Float32Array(img.width * img.height))
    Object.assign(this, options)
    const ctx = util.createCtx(img.width, img.height)
    util.fillCtxWithImage(ctx, img)
    const imgData = util.ctxImageData(ctx)
    const convertedData = new Float32Array(img.width * img.height)
    for (var i = 0; i < convertedData.length; i++) {
      let r = imgData.data[4 * i], g = imgData.data[4 * i + 1], b = imgData.data[4 * i + 2]
      convertedData[i] = this.rgb2Number(r, g, b)
    }
    var mydata = new DataSet(img.width, img.height, convertedData)
    return mydata
  }

  // Convert RGB to a number.
  // by default this assumes the values are in decimeters, but it can be overwritten.
  //  This funnction gets called in a tight loop for every pixel.
  rgb2Number (r,g,b) {
      var negative = 1
      if( r > 63 ){
         negative = -1
         r = 0;
      }
      var n = negative * (r*256*256 + g*256 + b);
      n=n/10;
      return n;
  }
}

export default RGBDataSet

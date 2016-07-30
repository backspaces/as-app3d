// A set of useful misc utils which will eventually move to individual modules.
const util = {

// ### Types

  // Fixing the javascript [typeof operator](https://goo.gl/Efdzk5)
  typeOf: (obj) => ({}).toString.call(obj).match(/\s(\w+)/)[1].toLowerCase(),
  // Is obj Array or Object (but not typed array)?
  isAorO: (obj) => ['array', 'object'].indexOf(util.typeOf(obj)) >= 0,
  // Is obj TypedArray? If obj.buffer not present, works, type is 'undefined'
  isTypedArray: (obj) => util.typeOf(obj.buffer) === 'arraybuffer',
  // Is a number an integer (rather than a float w/ non-zero fractional part)
  isInteger: Number.isInteger || ((num) => Math.floor(num) === num),
  // Is obj a string?
  isString: (obj) => typeof obj === 'string',
  // Check [big/little endian](https://en.wikipedia.org/wiki/Endianness)
  isLittleEndian () {
    const d32 = new Uint32Array([0x01020304])
    return (new Uint8ClampedArray(d32.buffer))[0] === 4
  },

  // Throw an error with string.
  // Use instead of `throw message` for better debugging
  error: (message) => { throw new Error(message) },

  // Return identity fcn, returning its argument unchanged. Used in callbacks
  identity: (o) => o,
  // Return function returning an object's property.  Property in fcn closure.
  propFcn: (prop) => (o) => o[prop],

  // Convert Array or TypedArray to given Type (Array or TypedArray).
  // If array is already of correct type, return it unmodified
  convertArray (array, Type) {
    const Type0 = array.constructor
    if (Type0 === Type) return array // return array if already same Type
    if (Type !== Array) return new Type(array) // TypedArray: universal ctor
    // return new Array(...array) // Convert TypedArray to Array
    return Array.prototype.slice.call(array)
  },

  // Convert between Uint8Array "buffer" and base64 string.
  // https://coolaj86.com/articles/typedarray-buffer-to-base64-in-javascript/
  bufferToBase64 (uint8Array) {
    const binstr = Array.prototype.map.call(uint8Array, (ch) =>
      String.fromCharCode(ch) // note uint8Array.map fails due to char data
    ).join('')
    return btoa(binstr)
  },
  base64ToBuffer (base64) {
    const binstr = atob(base64)
    const uint8Array = new Uint8Array(binstr.length)
    Array.prototype.forEach.call(binstr, (ch, i) => {
      uint8Array[i] = ch.charCodeAt(0)
    })
    return uint8Array
  },
  // Convert between Uint8Array "buffer" and utf8 8bit char strings (0-255).
  escapeByteString (byteString) {
    const chars = '\'"\\\0\n\r\v\t\b\f'
    const regex = /['"\\\0\n\r\v\t\b\f]/g
    const esc =
      ["\\'", '\\"', '\\\\', '\\0', '\\n', '\\r', '\\v', '\\t', '\\b', '\\f']
    const f = (match) => esc[chars.indexOf(match)]
    return byteString.replace(regex, f)
  },
  bufferToByteString (uint8Array, chunkSize = 32768) { // 2**15
    // See [MDN apply array size limit](https://goo.gl/zBGub)
    // and StackOverflow Buffer to/from String [here](http://goo.gl/vyEkIL)
    // and [here](http://goo.gl/79RlVc)
    let result = ''
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const subArray = uint8Array.subarray(i, i + chunkSize) // subarray clamps
      result += String.fromCharCode.apply(null, subArray)
    }
    return result
  },
  byteStringToBuffer (utf8) {
    const result = new Uint8Array(utf8.length)
    for (var i = 0; i < utf8.length; i++) result[i] = utf8.codePointAt(i)
    return result
  },

// ### Debug

  // Use chrome/ffox/ie console.time()/timeEnd() performance functions
  timeit (f, runs = 1e5, name = 'test') {
    console.time(name)
    for (let i = 0; i < runs; i++) f(i)
    console.timeEnd(name)
  },

  pps (obj, title = '') {
    if (title) console.log(title)   // eslint-disable-line
    let count = 1
    let str = ''
    while (obj) {
      if (typeof obj === 'function') {
        str = obj.constructor.toString()
      } else {
        const okeys = Object.keys(obj)
        str = okeys.length > 0 ? // eslint-disable-line
          `[${okeys.join(', ')}]` : `[${obj.constructor.name}]`
      }
      console.log(`[${count++}]: ${str}`)
      obj = Object.getPrototypeOf(obj)
    }
  },

  // addToDom: add an element to the doeument body
  addToDom (src, type) {
    if (type) {
      type = document.createElement(type)
      src = type.textContent = src
    }
    document.body.appendChild(src)
  },

  // Return a string representation of an array of arrays
  // arraysToString (arrays) { return arrays.map(a => `[${a}]`).join(',') },
  arraysToString: (arrays) => arrays.map(a => `[${a}]`).join(','),

  // Return array of strings of fixed floats to given precision
  fixedStrings (array, digits = 4) {
    array = this.convertArray(array, Array) // Only Array stores strings.
    return array.map((n) => n.toFixed(digits))
  },

  // Merge from's key/val pairs into to the global window namespace
  toWindow (fromObj) {
    Object.assign(window, fromObj)
  },

// ### HTML, CSS, DOM

  // REST: Parse the query, returning an object of key/val pairs.
  parseQueryString () {
    const results = {}
    const query = document.location.search.substring(1)
    query.split('&').forEach((s) => {
      const param = s.split('=')
      // If just key, no val, set val to true
      results[param[0]] = (param.length === 1) ? true : param[1]
    })
    return results
  },

  // Create dynamic `<script>` tag, appending to `<head>`
  setScript (path) {
    const scriptTag = document.createElement('script')
    scriptTag.src = path
    document.querySelector('head').appendChild(scriptTag)
  },

  // Get element (i.e. canvas) relative x,y position from event/mouse position.
  getEventXY (element, evt) { // http://goo.gl/356S91
    const rect = element.getBoundingClientRect()
    return [ evt.clientX - rect.left, evt.clientY - rect.top ]
  },

  // Set the text font, align and baseline drawing parameters.
  // Obj can be either a canvas context or a DOM element
  // See [reference](http://goo.gl/AvEAq) for details.
  // * font is a HTML/CSS string like: "9px sans-serif"
  // * align is left right center start end
  // * baseline is top hanging middle alphabetic ideographic bottom
  setTextParams (obj, font, align = 'center', baseline = 'middle') {
    obj.font = font; obj.textAlign = align; obj.textBaseline = baseline
  },

// ### Math

  // Return random int/float in [0,max) or [min,max) or [-r/2,r/2)
  randomInt: (max) => Math.floor(Math.random() * max),
  randomInt2: (min, max) => min + Math.floor(Math.random() * (max - min)),
  randomFloat: (max) => Math.random() * max,
  randomFloat2: (min, max) => min + Math.random() * (max - min),
  randomCentered: (r) => util.randomFloat2(-r / 2, r / 2),

  // Return float Gaussian normal with given mean, std deviation.
  randomNormal (mean = 0.0, sigma = 1.0) { // Box-Muller
    const [u1, u2] = [1.0 - Math.random(), Math.random()] // ui in 0,1
    const norm = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return norm * sigma + mean
  },

  // Return whether num is [Power of Two](http://goo.gl/tCfg5). Very clever!
  isPowerOf2: (num) => (num & (num - 1)) === 0, // twgl library

  // Degrees & Radians
  radians: (degrees) => degrees * Math.PI / 180,
  degrees: (radians) => radians * 180 / Math.PI,

  // Hypotenuse/distance from origin of point x,y
  distanceSq: (x, y, x0 = 0, y0 = 0) =>
    (x - x0) * (x - x0) + (y - y0) * (y - y0),
  // distanceSq: (x, y, x0 = 0, y0 = 0) => (x - x0) ** 2 + (x - x0) ** 2,
  distance: (x, y, x0 = 0, y0 = 0) => Math.sqrt(util.distanceSq(x, y, x0, y0)),

  // Trims decimal digits of float to reduce size.
  fixed (n, digits = 4) {
    const p = Math.pow(10, digits)
    return Math.round(n * p) / p
  },

  // Clamp a number to be between min/max.
  // Much faster than Math.max(Math.min(v, max), min)
  clamp (v, min, max) {
    if (v < min) return min
    if (v > max) return max
    return v
  },

  // Return true is val in [min, max] enclusive
  between: (val, min, max) => min <= val && val <= max,

  // Return a linear interpolation between lo and hi.
  // Scale is in [0-1], a percentage, and the result is in [lo,hi]
  // If lo>hi, scaling is from hi end of range.
  // [Why the name `lerp`?](http://goo.gl/QrzMc)
  lerp: (lo, hi, scale) =>
    lo <= hi ? lo + (hi - lo) * scale : lo - (lo - hi) * scale,
  // Calculate the lerp scale given lo/hi pair and a number between them.
  lerpScale: (number, lo, hi) => (number - lo) / (hi - lo),

// ### Arrays, Objects and Iteration

  // Repeat function f(i) n times, n in 0, i-1.
  repeat (n, f, o) { for (let i = 0; i < n; i++) f(i, o); return o },
  // Repeat function n/step times, incrementing i by step each step.
  step (n, step, f) { for (let i = 0; i < n; i += step) f(i) },
  // Return range [0, length-1]. Note: 6x faster than Array.from!
  // * range: (length) => Array.from({ length: length }, (x, i) => i),
  range (length) {
    return this.repeat(length, (i, a) => { a[i] = i }, [])
  },

  // Return a new copy of array, with correct type.
  // Execute fcn for all own member of an obj or array (typed OK).
  // - Unlike forEach, does not skip undefines.
  // - Like map, forEach, etc, fcn = fcn(item, key/index, obj).
  // - Prefer `for..of`, array map, reduce, filter etc
  forAll (arrayOrObj, fcn) {
    if (arrayOrObj.slice) // typed & std arrays
      for (let i = 0, len = arrayOrObj.length; i < len; i++)
        fcn(arrayOrObj[i], i, arrayOrObj)
    else
      Object.keys(arrayOrObj).forEach((k) => fcn(arrayOrObj[k], k, arrayOrObj))
    return arrayOrObj
  },

  // Return a new shallow of array, either Array or TypedArray
  copyArray (array) {
    if (array.constructor === Array) return array.slice(0)
    return new array.constructor(array)
  },

  // Return a new array that is the concatination two arrays.
  // The resulting Type is that of the first array.
  concatArrays (array1, array2) {
    const Type = array1.constructor
    if (Type === Array)
      return array1.concat(this.convertArray(array2, Array))
    const array = new Type(array1.length + array2.length)
    // NOTE: typedArray.set() allows any Array or TypedArray arg
    array.set(array1); array.set(array2, array1.length)
    return array
  },

  // Return array's type (Array or TypedArray variant)
  arrayType (array) { return array.constructor },

  // Return a new JavaScript Array of floats/strings to a given precision.
  // Fails for Float32Array due to float64->32 artifiacts, thus Array conversion
  fixedArray (array, digits = 4) {
    array = this.convertArray(array, Array) // 64 bit rounding
    return array.map((n) => this.fixed(n, digits))
  },

  // Shallow clone of obj or array
  clone (obj) {
    if (obj.slice) return obj.slice(0) // ok for TypedArrays
    const result = {}
    Object.keys(obj).forEach((k) => { result[k] = obj[k] })
    return result
  },

  // [Deep clone](http://goo.gl/MIaTxU) an obj or array. Clever!
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
  // Compare Objects or Arrays via JSON string. TypedArrays !== Arrays
  objectsEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  // Use JSON to return printable string of an object, array, other
  objectToString: (obj) => JSON.stringify(obj),

  // Create random array of floats between min/max.
  // Array Type allows conversion to Float32Array or integers (Int32Array etc)
  randomArray (length, min = 0, max = 1, Type = Array) {
    const a = new Type(length)
    for (let i = 0; i < length; i++) { a[i] = this.randomFloat2(min, max) }
    return a
  },

  // Create a histogram, given an array, a bin size, and a
  // min bin defaulting to min of of the array.
  // Return an object with:
  // - min/maxBin: the first/last bin with data
  // - min/maxVal: the min/max values in the array
  // - bins: the number of bins
  // - hist: the array of bins
  histogram (array, bin = 1, min = Math.floor(this.aMin(array))) {
    const hist = []
    let [minBin, maxBin] = [Number.MAX_VALUE, Number.MIN_VALUE]
    let [minVal, maxVal] = [Number.MAX_VALUE, Number.MIN_VALUE]
    for (const a of array) {
      const i = Math.floor(a / bin) - min
      hist[i] = (hist[i] === undefined) ? 1 : hist[i] + 1
      minBin = Math.min(minBin, i)
      maxBin = Math.max(maxBin, i)
      minVal = Math.min(minVal, a)
      maxVal = Math.max(maxVal, a)
    }
    for (const i in hist)
      if (hist[i] === undefined) { hist[i] = 0 }
    const bins = maxBin - minBin + 1
    return { bins, minBin, maxBin, minVal, maxVal, hist }
  },

  // Return scalar max/min/sum/avg of numeric array.
  // Works with TypedArrays
  aMax: (array) => array.reduce((a, b) => Math.max(a, b)),
  aMin: (array) => array.reduce((a, b) => Math.min(a, b)),
  aSum: (array) => array.reduce((a, b) => a + b),
  aAvg: (array) => util.aSum(array) / array.length,
  oneOf: (array) => array[util.randomInt(array.length)],
  // Create an array of properties from an array of objects
  aProps: (array, propName) => array.map((a) => a[propName]),

  // You'd think this wasn't necessary, but I always forget. Damn.
  // NOTE: this, like sort, sorts in place. Clone array if needed.
  sortNums (array, ascending = true) {
    return array.sort((a, b) => ascending ? a - b : b - a)
  },
  // Sort an array of objects w/ fcn(obj) as compareFunction.
  // If fcn is a string, convert to propFcn.
  sortObjs (array, fcn, ascending = true) {
    if (typeof fcn === 'string') fcn = this.propFcn(fcn)
    const comp = (a, b) => fcn(a) - fcn(b)
    return array.sort((a, b) => ascending ? comp(a, b) : -comp(a, b))
  },
  // Randomize array in-place. Use clone() first if new array needed
  // The array is returned for chaining; same as input array.
  // See [Fisher-Yates-Knuth shuffle](https://goo.gl/fWNFf)
  // for better approach, thanks Nick!
  shuffle (array) { array.sort((a, b) => Math.random() < 0.5); return array },
  // Returns new array (of this type) of unique elements in this *sorted* array.
  // Sort or clone & sort if needed.
  uniq (array, f = this.identity) {
    if (this.isString(f)) f = this.propFcn(f)
    return array.filter((ai, i, a) => (i === 0) || (f(ai) !== f(a[i - 1])))
  },

  // Binary search:
  // Return array index of item, where array is sorted.
  // If item not found, return index for item for array to remain sorted.
  // f is used to return an integer for sorting, defaults to identity.
  // If f is a string, it is the object property to sort by.
  // Adapted from underscore's _.sortedIndex.
  sortedIndex (array, item, f = this.identity) {
    if (this.isString(f)) f = this.propFcn(f)
    const value = f(item)
    // Why not array.length - 1? Because we can insert 1 after end of array.
    let [low, high] = [0, array.length]
    while (low < high) {
      const mid = (low + high) >>> 1 // floor (low+high)/2
      if (f(array[mid]) < value) { low = mid + 1 } else { high = mid }
    }
    return low
  },
  // Return index of value in array with given property or -1 if not found.
  // Binary search if f isnt null
  // Property can be string or function.
  // Use property = identity to compare objs directly.
  indexOf (array, item, property) {
    if (!property) return array.indexOf(item)
    const i = this.sortedIndex(array, item, property)
    return array[i] === item ? i : -1
  },
  // True if item is in array. Binary search if f given
  contains (array, item, f) { return this.indexOf(array, item, f) >= 0 },
  // Remove an item from an array. Binary search if f given
  // Array unchanged if item not found.
  removeItem (array, item, f) {
    const i = this.indexOf(array, item, f)
    if (i >= 0) array.splice(i, 1)
  },
  // Insert an item in a sorted array
  insertItem (array, item, f) {
    const i = this.sortedIndex(array, item, f)
    if (array[i] === item) this.error('insertItem: item already in array')
    array.splice(i, 0, item)
  },

  // Return array composed of f(a1i, a2i) called pairwise on both arrays
  aPairwise: (a1, a2, f) => a1.map((val, i) => f(val, a2[i])),
  arraysAdd: (a1, a2) => util.aPairwise(a1, a2, (a, b) => a + b),
  arraysSub: (a1, a2) => util.aPairwise(a1, a2, (a, b) => a - b),
  arraysMul: (a1, a2) => util.aPairwise(a1, a2, (a, b) => a * b),
  arraysEqual: (a1, a2) => util.arraysSub(a1, a2).every((a) => a === 0),

  // Return a "ramp" (array of uniformly ascending/descending floats)
  // in [start,stop] with numItems (positive integer > 1).
  // OK for start>stop. Will always include start/stop w/in float accuracy.
  aRamp (start, stop, numItems) {
    // NOTE: start + step*i, where step is (stop-start)/(numItems-1),
    // has float accuracy problems, must recalc step each iteration.
    if (numItems <= 1) this.error('aRamp: numItems must be > 1')
    const a = []
    for (let i = 0; i < numItems; i++)
      a.push(start + (stop - start) * (i / (numItems - 1)))
    return a
  },
  // Integer version of aRamp, start & stop integers, rounding each element.
  // Default numItems yields unit step between start & stop.
  aIntRamp (start, stop, numItems = (Math.abs(stop - start) + 1)) {
    return this.aRamp(start, stop, numItems).map((a) => Math.round(a))
  },

  // Return an array normalized (lerp) between lo/hi values
  normalize (array, lo = 0, hi = 1) {
    const [min, max] = [this.aMin(array), this.aMax(array)]
    const scale = 1 / (max - min)
    return array.map((n) => this.lerp(lo, hi, scale * ((n) - min)))
  },
  // Return Uint8ClampedArray normalized in 0-255
  normalize8 (array) {
    return new Uint8ClampedArray(this.normalize(array, -0.5, 255.5))
  },
  // Return Array normalized to integers in lo-hi
  normalizeInt (array, lo, hi) {
    return this.normalize(array, lo, hi).map((n) => Math.round(n))
  },

// ### Async

  // Return Promise for getting an image.
  // - use: imagePromise('./path/to/img').then(img => imageFcn(img))
  imagePromise (url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(this.error(`Could not load image ${url}`))
      img.src = url
    })
  },
  // Return Promise for ajax/xhr data.
  // - type: 'arraybuffer', 'blob', 'document', 'json', 'text'.
  // - method: 'GET', 'POST'
  // - use: xhrPromise('./path/to/data').then(data => dataFcn(data))
  xhrPromise (url, type = 'text', method = 'GET') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url) // POST mainly for security and large files
      xhr.responseType = type
      window.xhr = xhr
      xhr.onload = () => resolve(xhr.response)
      xhr.onerror = () => reject(this.error(xhr.responseText))
      xhr.send()
    })
  },

  // An [async/await](https://davidwalsh.name/async-generators)
  // implementation using generators returning promises.
  //
  // runGenerator runs a generator which yields promises,
  // returning the promise results when they complete.
  // Amazingly enough, the returned promise result replaces the
  // promise initially yielded by the generator function.
  runGenerator (g) {
    const it = g()
    ;(function iterate (val) { // asynchronously iterate over generator
      const ret = it.next(val)
      if (!ret.done) // wait on promise, `then` calls iterate w/ a value
        ret.value.then(iterate)
    }())
  },
  // Used like this, main() is entirely sync:
  // ```
  // function* main() {
  //   var path = 'http://s3.amazonaws.com/backspaces/'
  //   var val1 = yield util.xhrPromise(path + 'lorem1.txt')
  //   console.log( 'val1', val1 )
  //   var val2 = yield util.xhrPromise(path + 'lorem2.txt')
  //   console.log( 'val2', val2 )
  // }
  // util.runGenerator( main )
  // ```

// ### Canvas/Image

  // Get an image in this page by its ID
  getCanvasByID: (id) => document.getElementById(id),
  // Create a blank canvas of a given width/height
  createCanvas (width, height) {
    let can
    if (this.inWebWorker()) {
      can = new OffscreenCanvas(width, height)
    } else {
      can = document.createElement('canvas')
    }
    Object.assign(can, {width, height})
    return can
  },
  inWebWorker () {
    return (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
  },
  // As above, but returing the context object.
  // NOTE: ctx.canvas is the canvas for the ctx, and can be use as an image.
  createCtx (width, height, ctxType = '2d') {
    const can = this.createCanvas(width, height) // this.createCanvas(width, height)
    return can.getContext(ctxType === '2d' ? '2d' : 'webgl')
  },
  // Return the (complete) ImageData object for this context object
  ctxImageData (ctx) {
    const canvas = ctx.canvas || ctx.offscreenCanvas
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  },
  // Fill this context with the given image. Will scale image to fit ctx size.
  fillCtxWithImage (ctx, img) {
    this.setIdentity(ctx) // set/restore identity
    console.assert(img, 'img undefined')
    const canvas = ctx.canvas || ctx.offscreenCanvas
    if (img.transferToImageBitmap) img = img.transferToImageBitmap()
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    ctx.restore()
  },
  // Return an image/png base64 [dataUrl](https://goo.gl/fyBPnL)
  // string for this ctx object.
  ctxToDataUrl: (ctx) => {
    const canvas = ctx.canvas || ctx.offscreenCanvas
    canvas.toDataURL('image/png')
  },

  // Convert a dataUrl back into am image.
  dataUrlToImage (dataUrl) { // async in some browsers?? http://goo.gl/kIk2U
    const img = new Image()
    img.src = dataUrl
    return img
  },
  // Return a ctx object for this base64 data url
  dataUrlToCtx (dataUrl) { // async in some browsers?? http://goo.gl/kIk2U
    const img = this.dataUrlToImage(dataUrl)
    const ctx = this.createCtx(img.width, img.height)
    ctx.drawImage(img, 0, 0)
    return ctx
  },

  setCtxSmoothing (ctx, smoothing) {
    // Don'cha love  standards!
    const aliases = ['imageSmoothingEnabled', 'mozImageSmoothingEnabled', 'oImageSmoothingEnabled', 'webkitImageSmoothingEnabled', 'msImageSmoothingEnabled']
    for (const name of aliases)
      if (ctx[name])
        return (ctx[name] = smoothing) // lets hope the first one works. Sheesh!
  },

  // Install identity transform for this context.
  // Call ctx.restore() to revert to previous transform.
  setIdentity (ctx) {
    ctx.save() // NOTE: Does not change state, only saves current state.
    ctx.setTransform(1, 0, 0, 1, 0, 0) // or ctx.resetTransform()
  },

// ### Canvas 2D Context Text Drawing

  // Draw string of the given color at the xy location, in ctx pixel coords.
  // Push/pop identity transform.
  ctxDrawText (ctx, string, x, y, cssColor) {
    // console.log(string, x, y, cssColor)
    this.setIdentity(ctx)
    ctx.fillStyle = cssColor
    ctx.fillText(string, x, y)
    ctx.restore()
  },
  // Set the element text align and baseline drawing parameters
  //
  // * font is a HTML/CSS string like: "9px sans-serif"
  // * align is left right center start end
  // * baseline is top hanging middle alphabetic ideographic bottom
  //
  // See [reference](http://goo.gl/AvEAq) and
  // [web-safe fonts](http://goo.gl/unmCw)
  ctxTextParams (ctx, font, align = 'center', baseline = 'middle') {
    ctx.font = font; ctx.textAlign = align; ctx.textBaseline = baseline
  },

  // Convert an image, or part of an image, to a context.
  // img may be another canvas.
  // * x, y are top/left in image, default to 0, 0.
  // * width, height are size of context, default to image's width, height
  // * thus default is entire image
  //
  // NOTE: to convert a ctx to an "image" (drawImage) use ctx.canvas.
  // [See MDN drawImage, third form](https://goo.gl/a5b87N)
  // NOTE: this will distort the origional image, due to browser assumptions.
  // Use imageToPixels for undistorted image content.
  //
  // Not used yet.
  // imageToCtx (img, x = 0, y = 0, width = img.width, height = img.height) {
  //   if ((x + width > img.width) || (y + height > img.height))
  //     this.error('imageToCtx: parameters outside of image')
  //   const ctx = this.createCtx(width, height)
  //   ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
  //   return ctx
  // },

// ### WebGL

  // Convert a canvas to a gl context, with given attributes.
  // Attributes [listed here](
  // https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.2).
  // For images, attribute `premultipliedAlpha: false` useful.
  createGLContext (canvas, attributes = {}) {
    const gl = canvas.getContext('webgl', attributes)
    if (!gl) util.error('webgl getContext error')
    return gl
  },

  // Use webgl texture to convert img to Uint8Array w/o alpha premultiply
  // or color profile modification.
  // Img can be Image, ImageData, Canvas: [See MDN](https://goo.gl/a3oyRA).
  // `flipY` is used to invert image to "upright".
  imageToPixels (img, flipY = false) {
    // Create the gl context using the image width and height
    const {width, height} = img
    const gl = this.createGLContext(this.createCanvas(width, height), {
      premultipliedAlpha: false
    })

    // Create and initialize the texture.
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    if (flipY) // Mainly used for "pictures" rather than "data"
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    // Insure [no color profile applied](https://goo.gl/BzBVJ9):
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
    // Insure no [alpha premultiply](http://goo.gl/mejNCK).
    // False is the default, but lets make sure!
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

    // Create the framebuffer used for the texture
    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    // See if it all worked. Apparently not async.
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE)
      this.error(`imageToPixels: status not FRAMEBUFFER_COMPLETE: ${status}`)

    // If all OK, create the pixels buffer and read data.
    const pixels = new Uint8Array(4 * width * height)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

    // Unbind the framebuffer and return pixels
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return pixels
  }

}

export default util

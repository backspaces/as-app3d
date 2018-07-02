/* eslint-disable */
import THREE from '../dist/three.wrapper.js';
import '../dist/OrbitControls.wrapper.js';

/* eslint-disable */
// A set of useful misc utils which will eventually move to individual files.
// Note we use arrow functions one-liners, more likely to be optimized.
// REMIND: Test optimization, if none, remove arrow one-liners.

const util = {
    // ### Types

    // Fix the javascript typeof operator https://goo.gl/Efdzk5
    typeOf: obj =>
        ({}.toString
            .call(obj)
            .match(/\s(\w+)/)[1]
            .toLowerCase()),
    isOneOfTypes: (obj, array) => array.includes(util.typeOf(obj)),
    // isUintArray: (obj) => util.typeOf(obj).match(/uint.*array/),
    isUintArray: obj => /^uint.*array$/.test(util.typeOf(obj)),
    isIntArray: obj => /^int.*array$/.test(util.typeOf(obj)),
    isFloatArray: obj => /^float.*array$/.test(util.typeOf(obj)),
    isImage: obj => util.typeOf(obj) === 'image',
    isImageable: obj =>
        util.isOneOfTypes(obj, [
            'image',
            'htmlimageelement',
            'htmlcanvaselement',
        ]),
    // Is obj TypedArray? If obj.buffer not present, works, type is 'undefined'
    isTypedArray: obj => util.typeOf(obj.buffer) === 'arraybuffer',
    // Is a number an integer (rather than a float w/ non-zero fractional part)
    isInteger: Number.isInteger || (num => Math.floor(num) === num),
    // Is obj a string?
    isString: obj => util.typeOf(obj) === 'string',
    isObject: obj => util.typeOf(obj) === 'object',
    // Return array's type (Array or TypedArray variant)
    typeName: obj => obj.constructor.name,

    // Check [big/little endian](https://en.wikipedia.org/wiki/Endianness)
    isLittleEndian() {
        const d32 = new Uint32Array([0x01020304]);
        return new Uint8ClampedArray(d32.buffer)[0] === 4
    },

    inNode: () =>
        typeof window === 'undefined' && typeof global !== 'undefined',
    inBrowser: () => !util.inNode(),
    globalObject: () => (util.inNode() ? global : window),

    // Identity fcn, returning its argument unchanged. Used in callbacks
    identity: o => o,
    // No-op function, does nothing. Used for default callback.
    noop: () => {},
    // Return function returning an object's property.  Property in fcn closure.
    propFcn: prop => o => o[prop],

    // Convert Array or TypedArray to given Type (Array or TypedArray).
    // Result same length as array, precision may be lost.
    convertArray(array, Type) {
        const Type0 = array.constructor;
        if (Type0 === Type) return array // return array if already same Type
        return Type.from(array) // Use .from (both TypedArrays and Arrays)
    },
    // Convert to/from new Uint8Array view onto an Array or TypedArray.
    // Arrays converted to ArrayType, default Float64Array.
    // Return will in general be a different length than array
    arrayToBuffer(array, ArrayType = Float64Array) {
        if (array.constructor === Array) array = new ArrayType(array);
        return new Uint8Array(array.buffer)
    },
    bufferToArray(uint8array, Type, ArrayType = Float64Array) {
        if (Type === Array) Type = ArrayType;
        return Type === Array
            ? Array.from(new ArrayType(uint8array.buffer))
            : new Type(uint8array.buffer)
        // return new Type(uint8array.buffer)
    },

    // Convert between Uint8Array buffer and base64 string.
    // https://coolaj86.com/articles/typedarray-buffer-to-base64-in-javascript/
    // Stack Overflow: https://goo.gl/xscs8T
    bufferToBase64(uint8Array) {
        const binstr = Array.prototype.map
            .call(uint8Array, ch => String.fromCharCode(ch))
            .join('');
        return btoa(binstr)
    },
    base64ToBuffer(base64) {
        const binstr = atob(base64);
        const uint8Array = new Uint8Array(binstr.length);
        Array.prototype.forEach.call(binstr, (ch, i) => {
            uint8Array[i] = ch.charCodeAt(0);
        });
        return uint8Array
    },

    // ### Debug

    // Two PRNGs.
    randomSeedSin(seed = Math.PI / 4) {
        // ~3.4 million b4 repeat.
        // https://stackoverflow.com/a/19303725/1791917
        return () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x)
        }
    },
    randomSeedParkMiller(seed = 123456) {
        // doesn't repeat b4 JS dies.
        // https://gist.github.com/blixt/f17b47c62508be59987b
        seed = seed % 2147483647;
        return () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646
        }
    },
    // Replace Math.random with one of these
    randomSeed(seed, useParkMiller = true) {
        Math.random = useParkMiller
            ? this.randomSeedParkMiller(seed)
            : this.randomSeedSin(seed);
    },

    // Print a message just once.
    logOnce(msg) {
        if (!this.logOnceMsgSet) this.logOnceMsgSet = new Set();
        if (!this.logOnceMsgSet.has(msg)) {
            console.log(msg);
            this.logOnceMsgSet.add(msg);
        }
    },
    warn(msg) {
        this.logOnce('Warning: ' + msg);
    },
    // Print a message to an html element or to console.
    // Default to document.body if in browser.
    // Default to console.log if in node.
    // If msg is an object, convert to JSON
    print(msg, element = null) {
        if (this.isObject(msg)) msg = JSON.stringify(msg);
        if (!element && this.inBrowser()) element = document.body;

        if (element) {
            element.style.fontFamily = 'monospace';
            element.innerHTML += msg + '<br />';
        } else {
            console.log(msg);
        }
    },

    // Use chrome/ffox/ie console.time()/timeEnd() performance functions
    timeit(f, runs = 1e5, name = 'test') {
        console.time(name);
        for (let i = 0; i < runs; i++) f(i);
        console.timeEnd(name);
    },

    pps(obj, title = '') {
        if (title) console.log(title); // eslint-disable-line
        let count = 1;
        let str = '';
        while (obj) {
            if (typeof obj === 'function') {
                str = obj.constructor.toString();
            } else {
                const okeys = Object.keys(obj);
                str =
                    okeys.length > 0
                        ? `[${okeys.join(', ')}]`
                        : `[${obj.constructor.name}]`;
            }
            console.log(`[${count++}]: ${str}`);
            obj = Object.getPrototypeOf(obj);
        }
    },

    // Return a string representation of an array of arrays
    arraysToString: arrays => arrays.map(a => `[${a}]`).join(','),

    // Merge from's key/val pairs into to the global window namespace
    toWindow(obj) {
        Object.assign(this.globalObject(), obj);
        console.log('toWindow:', Object.keys(obj).join(', '));
    },

    // Use JSON to return pretty, printable string of an object, array, other
    // Remove ""s around keys.
    objectToString(obj) {
        return JSON.stringify(obj, null, '  ')
            .replace(/ {2}"/g, '  ')
            .replace(/": /g, ': ')
    },
    // Like above, but a single line for small objects.
    objectToString1(obj) {
        return JSON.stringify(obj)
            .replace(/{"/g, '{')
            .replace(/,"/g, ',')
            .replace(/":/g, ':')
    },

    // ### HTML, CSS, DOM

    // REST: Parse the query, returning an object of key/val pairs.
    parseQueryString() {
        const results = {};
        const query = document.location.search.substring(1);
        query.split('&').forEach(s => {
            const param = s.split('=');
            // If just key, no val, set val to true
            results[param[0]] = param.length === 1 ? true : param[1];
        });
        return results
    },

    // Create dynamic `<script>` tag, appending to `<head>`
    //   <script src="./test/src/three0.js" type="module"></script>
    setScript(path, props = {}) {
        const scriptTag = document.createElement('script');
        scriptTag.src = path;
        // this.forEach(props, (val, key) => { scriptTag[key] = val })
        Object.assign(scriptTag, props);
        document.querySelector('head').appendChild(scriptTag);
    },

    // Get element (i.e. canvas) relative x,y position from event/mouse position.
    getEventXY(element, evt) {
        // http://goo.gl/356S91
        const rect = element.getBoundingClientRect();
        return [evt.clientX - rect.left, evt.clientY - rect.top]
    },

    // ### Math

    // Return random int/float in [0,max) or [min,max) or [-r/2,r/2)
    randomInt: max => Math.floor(Math.random() * max),
    randomInt2: (min, max) => min + Math.floor(Math.random() * (max - min)),
    randomFloat: max => Math.random() * max,
    randomFloat2: (min, max) => min + Math.random() * (max - min),
    randomCentered: r => util.randomFloat2(-r / 2, r / 2),
    // min: (a, b) => (a < b) ? a : b, // Math.max/min now faster, yay!
    // max: (a, b) => (a < b) ? b : a,

    // Return float Gaussian normal with given mean, std deviation.
    randomNormal(mean = 0.0, sigma = 1.0) {
        // Box-Muller
        const [u1, u2] = [1.0 - Math.random(), Math.random()]; // ui in 0,1
        const norm =
            Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return norm * sigma + mean
    },

    // Return whether num is [Power of Two](http://goo.gl/tCfg5). Very clever!
    isPowerOf2: num => (num & (num - 1)) === 0, // twgl library
    // Return next greater power of two. There are faster, see:
    // [Stack Overflow](https://goo.gl/zvD78e)
    nextPowerOf2: num => Math.pow(2, Math.ceil(Math.log2(num))),

    // A [modulus](http://mathjs.org/docs/reference/functions/mod.html)
    // function rather than %, the remainder function.
    // [`((v % n) + n) % n`](http://goo.gl/spr24) also works.
    mod: (v, n) => (v % n + n) % n, // v - n * Math.floor(v / n),
    // Wrap v around min, max values if v outside min, max
    wrap: (v, min, max) => min + util.mod(v - min, max - min),
    // Clamp a number to be between min/max.
    // Much faster than Math.max(Math.min(v, max), min)
    clamp(v, min, max) {
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

    // ### Geometry

    // Degrees & Radians
    // radians: (degrees) => util.mod(degrees * Math.PI / 180, Math.PI * 2),
    // degrees: (radians) => util.mod(radians * 180 / Math.PI, 360),
    radians: degrees => degrees * Math.PI / 180,
    degrees: radians => radians * 180 / Math.PI,
    // Heading & Angles:
    // * Heading is 0-up (y-axis), clockwise angle measured in degrees.
    // * Angle is euclidean: 0-right (x-axis), counterclockwise in radians
    heading(radians) {
        // angleToHeading?
        const degrees = this.degrees(radians);
        return this.mod(90 - degrees, 360)
    },
    angle(heading) {
        // headingToAngle?
        const degrees = this.mod(360 - heading, 360);
        return this.radians(degrees)
    },
    // Return angle (radians) in (-pi,pi] that added to rad0 = rad1
    // See NetLogo's [subtract-headings](http://goo.gl/CjoHuV) for explanation
    subtractRadians(rad1, rad0) {
        let dr = this.mod(rad1 - rad0, 2 * Math.PI);
        if (dr > Math.PI) dr = dr - 2 * Math.PI;
        return dr
    },
    // Above using headings (degrees) returning degrees in (-180, 180]
    subtractHeadings(deg1, deg0) {
        let dAngle = this.mod(deg1 - deg0, 360);
        if (dAngle > 180) dAngle = dAngle - 360;
        return dAngle
    },
    // Return angle in [-pi,pi] radians from (x,y) to (x1,y1)
    // [See: Math.atan2](http://goo.gl/JS8DF)
    radiansToward: (x, y, x1, y1) => Math.atan2(y1 - y, x1 - x),
    // Above using headings (degrees) returning degrees in [-90, 90]
    headingToward(x, y, x1, y1) {
        return this.heading(this.radiansToward(x, y, x1, y1))
    },

    // Return distance between (x, y), (x1, y1)
    distance: (x, y, x1, y1) => Math.sqrt(util.sqDistance(x, y, x1, y1)),
    // Return squared distance .. i.e. avoid Math.sqrt. Faster comparisons
    sqDistance: (x, y, x1, y1) => (x - x1) * (x - x1) + (y - y1) * (y - y1),
    // Return true if x,y is within cone.
    // Cone: origin x0,y0 in given direction, with coneAngle width in radians.
    // All angles in radians
    inCone(x, y, radius, coneAngle, direction, x0, y0) {
        if (this.sqDistance(x0, y0, x, y) > radius * radius) return false
        const angle12 = this.radiansToward(x0, y0, x, y); // angle from 1 to 2
        return (
            coneAngle / 2 >= Math.abs(this.subtractRadians(direction, angle12))
        )
    },

    // ### Arrays, Objects and Iteration

    // Repeat function f(i, a) n times, i in 0, n-1, a is optional array
    repeat(n, f, a = []) {
        for (let i = 0; i < n; i++) f(i, a);
        return a
    },
    // Repeat function n/step times, incrementing i by step each step.
    step(n, step, f) {
        for (let i = 0; i < n; i += step) f(i);
    },
    // Return range [0, length-1]. Note: 6x faster than Array.from!
    range(length) {
        return this.repeat(length, (i, a) => {
            a[i] = i;
        })
    },
    // range (length) { return this.repeat(length, (i, a) => { a[i] = i }, []) },

    arrayMax: array => array.reduce((a, b) => Math.max(a, b)),
    arrayMin: array => array.reduce((a, b) => Math.min(a, b)),
    arraySum: array => array.reduce((a, b) => a + b),
    arraysEqual(a1, a2) {
        if (a1.length !== a2.length) return false
        for (let i = 0; i < a1.length; i++) {
            if (a1[i] !== a2[i]) return false
        }
        return true
    },
    removeArrayItem(array, item) {
        const ix = array.indexOf(item);
        if (ix !== -1) array.splice(ix, 1);
        else this.warn(`removeArrayItem: ${item} not in array`);
        return array // for chaining
    },

    // Execute fcn for all own member of an obj or array (typed OK).
    // Return input arrayOrObj, transformed by fcn.
    // - Unlike forEach, does not skip undefines.
    // - Like map, forEach, etc, fcn = fcn(item, key/index, obj).
    // - Alternatives are: `for..of`, array map, reduce, filter etc
    forEach(arrayOrObj, fcn) {
        if (arrayOrObj.slice) {
            // typed & std arrays
            for (let i = 0, len = arrayOrObj.length; i < len; i++) {
                fcn(arrayOrObj[i], i, arrayOrObj);
            }
        }
        // obj
        else {
            Object.keys(arrayOrObj).forEach(k =>
                fcn(arrayOrObj[k], k, arrayOrObj)
            );
        }
        return arrayOrObj
    },

    // Return a new shallow of array, either Array or TypedArray
    clone(array) {
        return array.slice(0)
    },

    // Return a new array that is the concatination two arrays.
    // The resulting Type is that of the first array.
    concatArrays(array1, array2) {
        const Type = array1.constructor;
        if (Type === Array) {
            return array1.concat(this.convertArray(array2, Array))
        }
        const array = new Type(array1.length + array2.length);
        // NOTE: typedArray.set() allows any Array or TypedArray arg
        array.set(array1);
        array.set(array2, array1.length);
        return array
    },

    // Compare Objects or Arrays via JSON string. Note: TypedArrays !== Arrays
    objectsEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),

    // Create a histogram, given an array, a bin size, and a
    // min bin defaulting to min of of the array.
    // Return an object with:
    // - min/maxBin: the first/last bin with data
    // - min/maxVal: the min/max values in the array
    // - bins: the number of bins
    // - hist: the array of bins
    histogram(array, bin = 1, min = Math.floor(this.arrayMin(array))) {
        const hist = [];
        let [minBin, maxBin] = [Number.MAX_VALUE, Number.MIN_VALUE];
        let [minVal, maxVal] = [Number.MAX_VALUE, Number.MIN_VALUE];
        for (const a of array) {
            const i = Math.floor(a / bin) - min;
            hist[i] = hist[i] === undefined ? 1 : hist[i] + 1;
            minBin = Math.min(minBin, i);
            maxBin = Math.max(maxBin, i);
            minVal = Math.min(minVal, a);
            maxVal = Math.max(maxVal, a);
        }
        for (const i in hist) {
            if (hist[i] === undefined) {
                hist[i] = 0;
            }
        }
        const bins = maxBin - minBin + 1;
        return { bins, minBin, maxBin, minVal, maxVal, hist }
    },

    // Return random one of array items.
    oneOf: array => array[util.randomInt(array.length)],
    otherOneOf(array, item) {
        if (array.length < 2) throw Error('util.otherOneOf: array.length < 2')
        do {
            var other = this.oneOf(array);
        } while (item === other) // note var use
        return other
    },

    // Random key/val of object
    oneKeyOf: obj => util.oneOf(Object.keys(obj)),
    oneValOf: obj => obj[util.oneKeyOf(obj)],

    // You'd think this wasn't necessary, but I always forget. Damn.
    // NOTE: this, like sort, sorts in place. Clone array if needed.
    sortNums(array, ascending = true) {
        return array.sort((a, b) => (ascending ? a - b : b - a))
    },
    // Sort an array of objects w/ fcn(obj) as compareFunction.
    // If fcn is a string, convert to propFcn.
    sortObjs(array, fcn, ascending = true) {
        if (typeof fcn === 'string') fcn = this.propFcn(fcn);
        const comp = (a, b) => fcn(a) - fcn(b);
        return array.sort((a, b) => (ascending ? comp(a, b) : -comp(a, b)))
    },
    // Randomize array in-place. Use clone() first if new array needed
    // The array is returned for chaining; same as input array.
    // See [Durstenfeld / Fisher-Yates-Knuth shuffle](https://goo.gl/mfbdPh)
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array
    },
    // Returns new array (of this type) of unique elements in this *sorted* array.
    // Sort or clone & sort if needed.
    uniq(array, f = this.identity) {
        if (this.isString(f)) f = this.propFcn(f);
        return array.filter((ai, i, a) => i === 0 || f(ai) !== f(a[i - 1]))
    },
    // unique = (array) => [...new Set(array)],

    // Return a "ramp" (array of uniformly ascending/descending floats)
    // in [start,stop] with numItems (positive integer > 1).
    // OK for start>stop. Will always include start/stop w/in float accuracy.
    aRamp(start, stop, numItems) {
        // NOTE: start + step*i, where step is (stop-start)/(numItems-1),
        // has float accuracy problems, must recalc step each iteration.
        if (numItems <= 1) throw Error('aRamp: numItems must be > 1')
        const a = [];
        for (let i = 0; i < numItems; i++) {
            a.push(start + (stop - start) * (i / (numItems - 1)));
        }
        return a
    },
    // Integer version of aRamp, start & stop integers, rounding each element.
    // Default numItems yields unit step between start & stop.
    aIntRamp(start, stop, numItems = Math.abs(stop - start) + 1) {
        return this.aRamp(start, stop, numItems).map(a => Math.round(a))
    },

    // Return an array normalized (lerp) between lo/hi values
    normalize(array, lo = 0, hi = 1) {
        const [min, max] = [this.arrayMin(array), this.arrayMax(array)];
        const scale = 1 / (max - min);
        return array.map(n => this.lerp(lo, hi, scale * (n - min)))
    },
    // Return Uint8ClampedArray normalized in 0-255
    normalize8(array) {
        return new Uint8ClampedArray(this.normalize(array, -0.5, 255.5))
    },
    // Return Array normalized to integers in lo-hi
    normalizeInt(array, lo, hi) {
        return this.normalize(array, lo, hi).map(n => Math.round(n))
    },

    // ### Async

    // Return Promise for getting an image.
    // - use: imagePromise('./path/to/img').then(img => imageFcn(img))
    imagePromise(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(Error(`Could not load image ${url}`));
            img.src = url;
        })
    },
    // Return Promise for ajax/xhr data.
    // - type: 'arraybuffer', 'blob', 'document', 'json', 'text'.
    // - method: 'GET', 'POST'
    // - use: xhrPromise('./path/to/data').then(data => dataFcn(data))
    xhrPromise(url, type = 'text', method = 'GET') {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url); // POST mainly for security and large files
            xhr.responseType = type;
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () =>
                reject(Error(`Could not load ${url}: ${xhr.status}`));
            xhr.send();
        })
    },

    // Return promise for pause of ms. Use:
    // timeoutPromise(2000).then(()=>console.log('foo'))
    timeoutPromise(ms = 1000) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        })
    },
    // Use above for an animation loop.
    // steps < 0: forever (default), steps === 0 is no-op
    // Returns a promise for when done. If forever, no need to use it.
    async timeoutLoop(fcn, steps = -1, ms = 0) {
        while (steps-- !== 0) {
            // Note decr occurs *after* comparison
            fcn();
            await this.timeoutPromise(ms);
        }
    },

    yieldLoop(fcn, steps = -1) {
        function* gen() {
            while (steps-- !== 0) {
                // Note decr occurs *after* comparison
                yield fcn();
            }
        }
        const iterator = gen();
        while (!iterator.next().done) {}
    },

    // Similar pair for requestAnimationFrame
    rafPromise() {
        return new Promise(resolve => requestAnimationFrame(resolve))
    },
    async rafLoop(fcn, steps = -1) {
        while (steps-- !== 0) {
            // Note decr occurs *after* comparison
            fcn();
            await this.rafPromise();
        }
    },

    // // Imports a script, waits 'till loaded, then resolves. Use:
    // // scriptPromise('../lib/pako.js', 'pako')
    // //   .then((script) => console.log(script))
    // scriptPromise (path, name, f = () => window[name], props = {}) {
    //   if (window[name] == null) this.setScript(path, props)
    //   return this.waitPromise(() => window[name] != null, f)
    // },
    // // Promise: Wait until done(), then resolve with f()'s value, default to noop
    // // Ex: This waits until window.foo is defined, then reports:
    // // waitPromise(()=>window.foo).then(()=>console.log('foo defined'))
    // waitPromise (done, f = this.noop, ms = 10) {
    //   return new Promise((resolve, reject) => {
    //     this.waitOn(done, () => resolve(f()), ms)
    //   })
    // },
    waitPromise(done, ms = 10) {
        return new Promise(resolve => {
            function waitOn() {
                if (done()) return resolve()
                else setTimeout(waitOn, ms);
            }
            waitOn();
        })
    },
    // // Callback: Wait (setTimeout) until done() true, then call f()
    // waitOn (done, f, ms = 10) {
    //   if (done())
    //     f()
    //   else
    //     setTimeout(() => { this.waitOn(done, f, ms) }, ms)
    // },

    // ### Canvas utilities

    // Create a blank 2D canvas of a given width/height
    createCanvas(width, height) {
        const can = document.createElement('canvas');
        Object.assign(can, { width, height });
        return can
    },
    // As above, but returing the 2D context object.
    // NOTE: ctx.canvas is the canvas for the ctx, and can be use as an image.
    createCtx(width, height) {
        const can = this.createCanvas(width, height);
        return can.getContext('2d')
    },

    // Duplicate a ctx's image. Returns the new ctx (who's canvas is ctx.caanvas)
    cloneCtx(ctx0) {
        const ctx = this.createCtx(ctx0.canvas.width, ctx0.canvas.height);
        ctx.drawImage(ctx0.canvas, 0, 0);
        return ctx
    },
    // Resize a ctx/canvas and preserve data.
    resizeCtx(ctx, width, height) {
        const copy = this.cloneCtx(ctx);
        ctx.canvas.width = width;
        ctx.canvas.height = height;
        ctx.drawImage(copy.canvas, 0, 0);
    },

    // Install identity transform for this context.
    // Call ctx.restore() to revert to previous transform.
    setIdentity(ctx) {
        ctx.save(); // NOTE: Does not change state, only saves current state.
        ctx.setTransform(1, 0, 0, 1, 0, 0); // or ctx.resetTransform()
    },
    // Set the text font, align and baseline drawing parameters.
    // Ctx can be either a canvas context or a DOM element
    // See [reference](http://goo.gl/AvEAq) for details.
    // * font is a HTML/CSS string like: "9px sans-serif"
    // * align is left right center start end
    // * baseline is top hanging middle alphabetic ideographic bottom
    setTextParams(ctx, font, textAlign = 'center', textBaseline = 'middle') {
        // ctx.font = font; ctx.textAlign = align; ctx.textBaseline = baseline
        Object.assign(ctx, { font, textAlign, textBaseline });
    },

    // Return the (complete) ImageData object for this context object
    ctxImageData(ctx) {
        return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    },
    // Fill this context with the given image. Will scale image to fit ctx size.
    fillCtxWithImage(ctx, img) {
        this.setIdentity(ctx); // set/restore identity
        ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    },
};

// An Array superclass with convenience methods used by NetLogo.
// Tipically the items in the array are Objects, NetLogo Agents,
// but generally useful as an ArrayPlus

class AgentArray extends Array {
    // Convert an Array to an AgentArray "in place".
    // Use array.slice() if a new array is wanted
    static fromArray(array) {
        Object.setPrototypeOf(array, AgentArray.prototype);
        return array
    }

    // constructor not needed, JS passes on if ctor same as super's
    // constructor () { super() }

    // Convert between AgentArrays and Arrays
    toArray() {
        Object.setPrototypeOf(this, Array.prototype);
        return this
    }

    // NL: Return true if reporter true for all of this set's objects
    // Use Array.every(). Also Array.some()
    // all (reporter) { return this.every(reporter) }
    // // Return !isEmpty()
    // any () { return this.length !== 0 }
    // NL: Return AgentArray with reporter(agent) true. Use Array.filter()
    // with (reporter) { return this.filter(reporter) }

    // Return true if there are no items in this set, false if not empty.
    // NL: uses "empty", confusing. Also uses any() .. use !isEmpty()
    isEmpty() {
        return this.length === 0
    }
    // Return first item in this array. Returns undefined if empty.
    first() {
        return this[0]
    }
    // Return last item in this array. Returns undefined if empty.
    last() {
        return this[this.length - 1]
    }
    // Return AgentArray of property values for key from this array's objects
    // props (key) { return this.map((a) => a[key]).toArray() }
    props(key) {
        return this.map(a => a[key])
    }
    // Return AgentArray of values of the function fcn
    values(fcn) {
        return this.map(a => fcn(a))
    }
    // Returns AgentArray of unique elements in this *sorted* AgentArray.
    // Use sortBy or clone & sortBy if needed.
    uniq(f = util.identity) {
        if (util.isString(f)) f = o => o[f];
        return this.filter((ai, i, a) => i === 0 || f(ai) !== f(a[i - 1]))
    }
    // Call fcn(agent, index, array) for each agent in AgentArray.
    // Return the AgentArray for chaining.
    // Note: 5x+ faster than this.forEach(fcn) !!
    // each(fcn) {
    //     for (let i = 0, len = this.length; i < len; i++) {
    //         fcn(this[i], i, this)
    //     }
    //     return this
    // }

    // Call fcn(agent, index, array) for each item in AgentArray.
    // Return the AgentArray for chaining.
    // Note: 5x+ faster than this.forEach(fcn) !!
    // Warns on array mutation (length change)
    ask(fcn) {
        const length = this.length;
        for (let i = 0; i < this.length; i++) {
            fcn(this[i], i, this);
            if (length != this.length) {
                const name = this.name || this.constructor.name;
                const direction =
                    this.length < length ? 'decreasing' : 'increasing';
                util.warn(
                    `AgentArray.ask array mutation: ${name}: ${direction}`
                );
            }
        }
        return this
    }
    // ask(fcn) {
    //     if (this.length === 0) return
    //     const lastID = this.last().id
    //     let obj = this[0]
    //     for (let i = 0; obj && obj.id <= lastID; i++) {
    //         // const lastObj = obj
    //         fcn(obj, i, this)
    //         obj = this[i++]
    //         // if (!obj || obj === lastObj) continue
    //         // if (!obj || obj === lastObj) continue
    //     }
    //     return this
    // }

    // Return count of agents with reporter(agent) true
    count(reporter) {
        return this.reduce((prev, o) => prev + (reporter(o) ? 1 : 0), 0)
    }

    sum(key) {
        return this.reduce((prev, o) => prev + (key ? o[key] : o), 0)
    }
    avg(key) {
        return this.sum(key) / this.length
    }
    min(key) {
        return this.reduce(
            (prev, o) => Math.min(prev, key ? o[key] : o),
            Infinity
        )
    }
    max(key) {
        return this.reduce(
            (prev, o) => Math.max(prev, key ? o[key] : o),
            -Infinity
        )
    }
    histogram(key, bins = 10, min = this.min(key), max = this.max(key)) {
        const binSize = (max - min) / bins;
        const aa = new AgentArray(bins);
        aa.fill(0);
        this.ask(a => {
            const val = key ? a[key] : a;
            if (val < min || val > max) {
                util.warn(`histogram bounds error: ${val}: ${min}-${max}`);
            } else {
                let bin = Math.floor((val - min) / binSize);
                if (bin === bins) bin--; // val is max, round down
                aa[bin]++;
            }
        });
        // Object.assign(aa, {bins, min, max, binSize, key})
        aa.parameters = { key, bins, min, max, binSize, arraySize: this.length };
        // console.log(key, bins, min, max, binSize, aa)
        return aa
    }

    // Return shallow copy of a portion of this AgentArray
    // [See Array.slice](https://goo.gl/Ilgsok)
    // Default is to clone entire AgentArray
    clone(begin = 0, end = this.length) {
        return this.slice(begin, end) // Returns an AgentArray rather than Array!
    }
    // Randomize the AgentArray in place. Use clone first if new AgentArray needed.
    // Return "this" for chaining.
    shuffle() {
        return util.shuffle(this)
    }
    // Return this AgentArray sorted by the reporter in ascending/descending order.
    // If reporter is a string, convert to a fcn returning that property.
    // Use clone if you don't want to mutate this array.
    sortBy(reporter, ascending = true) {
        util.sortObjs(this, reporter, ascending);
        return this
    }

    // Remove an item from an array. Binary search if f given
    // Array unchanged if item not found.
    remove(o, f) {
        const i = this.agentIndex(o, f);
        if (i !== -1) this.splice(i, 1);
        else util.warn(`remove: ${o} not in AgentArray`);
        return this // chaining
    }
    insert(o, f) {
        const i = this.sortedIndex(o, f);
        if (this[i] === o) throw Error('insert: item already in AgentArray')
        this.splice(i, 0, o); // copyWithin?
    }

    // Binary search:
    // Return array index of item, where array is sorted.
    // If item not found, return index for item for array to remain sorted.
    // f is used to return an integer for sorting, defaults to identity.
    // If f is a string, it is the object property to sort by.
    // Adapted from underscore's _.sortedIndex.
    sortedIndex(item, f = util.identity) {
        if (util.isString(f)) f = util.propFcn(f);
        const value = f(item);
        // Why not array.length - 1? Because we can insert 1 after end of array.
        // let [low, high] = [0, array.length]
        let low = 0;
        let high = this.length;
        while (low < high) {
            const mid = (low + high) >>> 1; // floor (low+high)/2
            if (f(this[mid]) < value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low
    }
    // Return index of value in array with given property or -1 if not found.
    // Binary search if property isnt null
    // Property can be string or function.
    // Use property = identity to compare objs directly.
    agentIndex(item, property) {
        if (!property) return this.indexOf(item)
        const i = this.sortedIndex(item, property);
        return this[i] === item ? i : -1
    }
    // True if item is in array. Binary search if f given
    contains(item, f) {
        return this.agentIndex(item, f) >= 0
    }

    // Return a random agent. Return undefined if empty.
    oneOf() {
        return util.oneOf(this)
    }
    // Return a random agent, not equal to agent
    otherOneOf(agent) {
        return util.otherOneOf(this, agent)
    }
    // Return n other random agents from this array
    // otherNOf (n, agent) { return util.otherNOf(n, this, agent) }
    otherNOf(n, item) {
        if (this.length < n) throw Error('AgentArray: otherNOf: length < N')
        return this.clone()
            .remove(item)
            .shuffle()
            .slice(0, n)
    }

    // Return the first agent having the min/max of given value of f(agent).
    // If reporter is a string, convert to a fcn returning that property
    minOrMaxOf(min, reporter, valueToo = false) {
        if (this.isEmpty()) throw Error('min/max OneOf: empty array')
        if (typeof reporter === 'string') reporter = util.propFcn(reporter);
        let o = null;
        let val = min ? Infinity : -Infinity;
        for (let i = 0; i < this.length; i++) {
            const a = this[i];
            const aval = reporter(a);
            if ((min && aval < val) || (!min && aval > val)) {
                [o, val] = [a, aval];
            }
        }
        return valueToo ? [o, val] : o
    }
    // The min version of the above
    minOneOf(reporter) {
        return this.minOrMaxOf(true, reporter)
    }
    // The max version of the above
    maxOneOf(reporter) {
        return this.minOrMaxOf(false, reporter)
    }
    // Like the pair above, but return both the object and its value in an array.
    // const [obj, value] = minValOf(...)
    minValOf(reporter) {
        return this.minOrMaxOf(true, reporter, true)
    }
    maxValOf(reporter) {
        return this.minOrMaxOf(false, reporter, true)
    }

    // Return n random agents as AgentArray.
    // See [Fisher-Yates-Knuth shuffle](https://goo.gl/fWNFf)
    // for better approach for large n.
    nOf(n) {
        if (n > this.length) throw Error('nOf: n larger than AgentArray')
        if (n === this.length) return this
        const result = new AgentArray();
        while (result.length < n) {
            const o = this.oneOf();
            if (!(o in result)) result.push(o);
        }
        return result
    }
    // Return a new AgentArray of the n min/max agents of the value of reporter,
    // in ascending order.
    // If reporter is a string, convert to a fcn returning that property
    // NOTE: we do not manage ties, see NetLogo docs.
    minOrMaxNOf(min, n, reporter) {
        if (n > this.length) {
            throw Error('min/max nOf: n larger than AgentArray')
        }
        const as = this.clone().sortBy(reporter);
        return min ? as.clone(0, n) : as.clone(as.length - n)
    }
    minNOf(n, reporter) {
        return this.minOrMaxNOf(true, n, reporter)
    }
    maxNOf(n, reporter) {
        return this.minOrMaxNOf(false, n, reporter)
    }

    // Geometry methods for patches, turtles, and other AgentArrays which have x,y.
    // Return all agents within rect, radius, cone from given agent o.
    // If meToo, include given object, default excludes it
    // Typically the AgentArray is a subset of larger sets, reducing
    // the size, then uses these inRect, inRadius or inCone methods

    // Return all agents within rectangle from given agent o.
    // dx & dy are (float) half width/height of rect
    inRect(o, dx, dy = dx, meToo = false) {
        const agents = new AgentArray();
        const minX = o.x - dx; // ok if max/min off-world, o, a are in-world
        const maxX = o.x + dx;
        const minY = o.y - dy;
        const maxY = o.y + dy;
        this.ask(a => {
            if (minX <= a.x && a.x <= maxX && minY <= a.y && a.y <= maxY) {
                if (meToo || o !== a) agents.push(a);
            }
        });
        return agents
    }

    // Return all agents in AgentArray within d distance from given object.
    inRadius(o, radius, meToo = false) {
        const agents = new AgentArray();
        // const {x, y} = o // perf?
        const d2 = radius * radius;
        const sqDistance = util.sqDistance; // Local function 2-3x faster, inlined?
        this.ask(a => {
            if (sqDistance(o.x, o.y, a.x, a.y) <= d2) {
                if (meToo || o !== a) agents.push(a);
            }
        });
        return agents
    }

    // As above, but also limited to the angle `coneAngle` around
    // a `direction` from object `o`.
    inCone(o, radius, coneAngle, direction, meToo = false) {
        const agents = new AgentArray();
        this.ask(a => {
            if (util.inCone(a.x, a.y, radius, coneAngle, direction, o.x, o.y)) {
                if (meToo || o !== a) agents.push(a);
            }
        });
        return agents
    }
}

// AgentSets are arrays that are factories for their own agents/objects.
// They are the base for Patches, Turtles and Links.

// Vocab: AgentSets are NetLogo collections: Patches, Turtles, and Links.
// Agent is an object in an AgentSet: Patch, Turtle, Link.

class AgentSet extends AgentArray {
    // Magic to return AgentArray's rather than AgentSets
    // Symbol.species: https://goo.gl/Zsxwxd
    static get [Symbol.species]() {
        return AgentArray
    }

    // Create an empty `AgentSet` and initialize the `ID` counter for add().
    // If baseSet is supplied, the new agentset is a subarray of baseSet.
    // This sub-array feature is how breeds are managed, see class `Model`
    constructor(model, AgentClass, name, baseSet = null) {
        super(); // create empty AgentArray
        baseSet = baseSet || this; // if not a breed, set baseSet to this
        Object.assign(this, { model, name, baseSet, AgentClass });
        // BaseSets know their breeds and keep the ID global
        if (this.isBaseSet()) {
            this.breeds = {}; // will contain breedname: breed entries
            this.ID = 0;
            // Breeds inherit frm their baseSet and add themselves to baseSet
        } else {
            Object.setPrototypeOf(this, Object.getPrototypeOf(baseSet));
            this.baseSet.breeds[name] = this;
        }
        // Keep a list of this set's variables; see `own` below
        this.ownVariables = [];
        // Create a proto for our agents by having a defaults and instance layer
        // this.AgentClass = AgentClass
        this.agentProto = new AgentClass(this);
        this.protoMixin(this.agentProto, AgentClass);
        // }
    }
    // All agents have:
    // vars: id, agentSet, model, world, breed (getter)
    //   baseSet by name: turtles/patches/links
    // methods: setBreed, getBreed, isBreed
    // getter/setter: breed
    protoMixin(agentProto, AgentClass) {
        Object.assign(agentProto, {
            agentSet: this,
            model: this.model,
            // world: this.world
        });
        agentProto[this.baseSet.name] = this.baseSet;

        // if (this.isBaseSet()) {
        // Model.reset should not redefine these.
        if (!AgentClass.prototype.setBreed) {
            Object.assign(AgentClass.prototype, {
                setBreed(breed) {
                    breed.setBreed(this);
                },
                getBreed() {
                    return this.agentSet
                },
                isBreed(breed) {
                    return this.agentSet === breed
                },
            });
            Object.defineProperty(AgentClass.prototype, 'breed', {
                get: function() {
                    return this.agentSet
                },
            });
        }
    }

    // Create a subarray of this AgentSet. Example: create a people breed of turtles:
    // `people = turtles.newBreed('people')`
    newBreed(name) {
        return new AgentSet(this.model, this.AgentClass, name, this)
    }

    // Is this a baseSet or a derived "breed"
    isBreedSet() {
        return this.baseSet !== this
    }
    isBaseSet() {
        return this.baseSet === this
    }

    // Return breeds in a subset of an AgentSet.
    // Ex: patches.inRect(5).withBreed(houses)
    withBreed(breed) {
        return this.filter(a => a.agentSet === breed)
    }

    // Abstract method used by subclasses to create and add their instances.
    create() {
        console.log(`AgentSet: Abstract method called: ${this}`);
    }

    // Add an agent to the list.  Only used by agentset factory methods. Adds
    // the `id` property to all agents. Increment `ID`.
    // Returns the object for chaining. The set will be sorted by `id`.
    addAgent(o) {
        // o only for breeds adding themselves to their baseSet
        o = o || Object.create(this.agentProto); // REMIND: Simplify! Too slick.
        if (this.isBreedSet()) this.baseSet.addAgent(o);
        else o.id = this.ID++;
        this.push(o);
        return o
    }
    clear() {
        while (!this.isEmpty()) this.last().die();
    } // die() is an agent method
    // Remove an agent from the agentset, returning the agentset for chaining.
    // Note removeAgent(agent) different than remove(agent) which simply removes
    // the agent from it's array
    removeAgent(o) {
        // Remove me from my baseSet
        if (this.isBreedSet()) this.baseSet.remove(o, 'id');
        // Remove me from my set.
        this.remove(o, 'id');
        return this
    }

    // AgentSets often need a random color. We use a standard shared ColorMap map.
    // randomColor () { return ColorMap.Basic16.randomColor() }

    // Get/Set default values for this agentset's agents.
    // Return this for chaining
    setDefault(name, value) {
        this.agentProto[name] = value;
        return this
    }
    getDefault(name) {
        return this.agentProto[name]
    }
    // Used when getter/setter's need to know if get/set default
    settingDefault(agent) {
        return agent.id == null
    }

    // Declare variables of an agent class. May deprecate if not needed.
    // `varnames` is a string of space separated names
    own(varnames) {
        // if (this.isBreedSet())
        //   this.ownVariables = util.clone(this.baseSet.ownVariables)
        for (const name of varnames.split(' ')) {
            this.setDefault(name, null);
            this.ownVariables.push(name);
        }
    }

    // Move an agent from its AgentSet/breed to be in this AgentSet/breed.
    setBreed(a) {
        // change agent a to be in this breed
        // Return if `a` is already of my breed
        if (a.agentSet === this) return
        // Remove/insert breeds (not baseSets) from their agentsets
        if (a.agentSet.isBreedSet()) a.agentSet.remove(a, 'id');
        if (this.isBreedSet()) this.insert(a, 'id');

        // Make list of `a`'s vars and my ownvars.
        const avars = a.agentSet.ownVariables;
        // First remove `a`'s vars not in my ownVariables
        for (const avar of avars) {
            if (!this.ownVariables.includes(avar)) delete a[avar];
        }
        // Now add ownVariables to `a`'s vars, default to 0.
        // If ownvar already in avars, it is not modified.
        for (const ownvar of this.ownVariables) {
            if (!avars.includes(ownvar)) a[ownvar] = 0;
        } // NOTE: NL uses 0, maybe we should use null?

        // Give `a` my defaults/statics
        return Object.setPrototypeOf(a, this.agentProto)
    }

    // Call fcn(agent, index, array) for each item in AgentArray.
    // Return the AgentArray for chaining.
    // Note: 5x+ faster than this.forEach(fcn) !!
    // Manages immutability reasonably well.
    askSet(fcn) {
        if (this.name === 'patches') super.ask(fcn); // Patches are static
        if (this.isBaseSet()) this.baseSetAsk(fcn);
        if (this.isBreedSet()) this.cloneAsk(fcn);
    }

    // An ask function for mutable baseSets.
    // BaseSets can only add past the end of the array.
    // This allows us to manage mutations by allowing length change,
    // and managing deletions only within the original length.
    baseSetAsk(fcn) {
        if (this.length === 0) return this
        // const length = this.length
        const lastID = this.last().id;

        // Added obj's have id > lastID. Just check for deletions.
        // There Be Dragons:
        // - AgentSet can become length 0 if all deleted
        // - While loop tricky:
        //   - i can beocme negative w/in while loop:
        //   - i can beocme bigger than current AgentSet:
        //   - Guard w/ i<len & i>=0
        for (let i = 0; i < this.length && this[i].id <= lastID; i++) {
            const id = this[i].id;
            fcn(this[i], i, this);
            while (i < this.length && i >= 0 && this[i].id > id) {
                i--;
            }
        }
    }

    // For breeds, mutations can occur in many ways.
    // This solves this by cloning the initial array and
    // managing agents that have died or changed breed.
    // In other words, we can be concerned only with mutations
    // of the agents themselves.
    cloneAsk(fcn) {
        const clone = this.clone();
        for (let i = 0; i < clone.length; i++) {
            const obj = clone[i];
            if (obj.breed == this && obj.id > 0) {
                fcn(obj, i, clone);
            }
        }
        return this
    }
}

// A **DataSet** is an object with width/height and an array
// whose length = width * height
//
// The data array can be a TypedArray or a javascript Array
// Notice that it is very much like an ImageData object!

class DataSet {
    // **Static methods:** called via DataSet.foo(), similar to Math.foo().
    // Generally useful utilities for use with TypedArrays & JS Arrays

    // Return an empty dataset of given width, height, dataType
    static emptyDataSet(width, height, Type) {
        return new DataSet(width, height, new Type(width * height))
    }

    // The **DataSet Class** constructor and methods

    // constructor: Stores the three DataSet components.
    // Checks data is right size, throws an error if not.
    constructor(width, height, data) {
        if (data.length !== width * height) {
            throw Error(
                `new DataSet length: ${data.length} !== ${width} * ${height}`
            )
        }
        Object.assign(this, { width, height, data });
    }

    // Get/Set name, useful for storage key.
    setName(string) {
        this.name = string;
        return this
    }
    getName() {
        return this.name ? this.name : this.makeName()
    }
    makeName() {
        const { width, height } = this;
        const sum = util.arraySum(this.data).toFixed(2);
        return `${this.dataType().name}-${width}-${height}-${sum}`
    }

    // Checks x,y are within DataSet. Throw error if not.
    checkXY(x, y) {
        if (!this.inBounds(x, y)) {
            throw Error(`DataSet: x,y out of range: ${x}, ${y}`)
        }
    }
    // true if x,y in dataset bounds
    inBounds(x, y) {
        return (
            util.between(x, 0, this.width - 1) &&
            util.between(y, 0, this.height - 1)
        )
    }

    dataType() {
        return this.data.constructor
    }
    type() {
        return this.constructor
    }

    // Given x,y in data space, return index into data
    toIndex(x, y) {
        return x + y * this.width
    }

    // Given index into data, return dataset [x, y] position
    toXY(i) {
        return [i % this.width, Math.floor(i / this.width)]
    }

    // Get dataset value at x,y, assuming that x,y valididated previously
    // getXY (x, y) { return this.data[this.toIndex(Math.floor(x), Math.floor(y))] }
    getXY(x, y) {
        return this.data[this.toIndex(x, y)]
    }

    // Set the data value at x,y to num. assume x,y valid
    // setXY (x, y, num) { this.data[this.toIndex(Math.floor(x), Math.floor(y))] = num }
    setXY(x, y, num) {
        this.data[this.toIndex(x, y)] = num;
    }

    // Wrapper for sampling, defaults to "nearest". Checks x,y valid as well.
    // Use this for individual sampling.
    sample(x, y, useNearest = true) {
        this.checkXY(x, y);
        return useNearest ? this.nearest(x, y) : this.bilinear(x, y)
    }

    // Nearest neighbor sampling, w/o x,y validity check, i.e. our inner loops
    nearest(x, y) {
        return this.getXY(Math.round(x), Math.round(y))
    }

    // Billinear sampling w/o x,y validity check, i.e. our inner loops
    bilinear(x, y) {
        // Billinear sampling works by making two linear interpolations (lerps)
        // in the x direction, and a third in the y direction, between the
        // two x results. See wikipedia:
        // [bilinear sampling](http://en.wikipedia.org/wiki/Bilinear_interpolation)
        // The diagram shows the three lerps

        // const [x0, y0] = [Math.floor(x), Math.floor(y)] // replaced by next line for speed
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const i = this.toIndex(x0, y0);
        const w = this.width;
        const dx = x - x0;
        const dy = y - y0;
        const dx1 = 1 - dx;
        const dy1 = 1 - dy;
        const f00 = this.data[i];
        // Edge case: fij is 0 if beyond data array; undefined -> 0.
        // This cancels the given component's factor in the result.
        const f10 = this.data[i + 1] || 0; // 0 at bottom right corner
        const f01 = this.data[i + w] || 0; // 0 at all bottom row
        const f11 = this.data[i + 1 + w] || 0; // 0 at end of next to bottom row
        // This is a bit involved but:
        // ```
        // If dx = 0; dx1 = 1, dy != 0
        // -> vertical linear interpolation
        // fxy = f00(1-dy) + f01(dy) i.e. y-lerp
        //
        // If dx != 0; dy = 0, dx !=0
        // -> horizontal linear interpolation
        // fxy = f00(1-dx) + f10(dx) i.e. x-lerp
        // ```
        return f00 * dx1 * dy1 + f10 * dx * dy1 + f01 * dx1 * dy + f11 * dx * dy
    }

    // Return a copy of this, with new data array
    copy() {
        return new DataSet(this.width, this.height, util.clone(this.data))
    }

    // Return new (empty) dataset, defaulting to this type
    emptyDataSet(width, height, type = this.dataType()) {
        return DataSet.emptyDataSet(width, height, type) // see static above
    }

    // Return new (empty) array of this type
    emptyArray(length) {
        const Type = this.type();
        return new Type(length)
    }

    // Create new dataset of size width/height/type by resampling each point.
    // Type is not this.type() due to integer/float differences. Default Array.
    // If same size, return a copy of this.
    resample(width, height, useNearest = true, Type = Array) {
        if (width === this.width && height === this.height) return this.copy()
        const ds = DataSet.emptyDataSet(width, height, Type);
        const xScale = (this.width - 1) / (width - 1);
        const yScale = (this.height - 1) / (height - 1);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                ds.setXY(x, y, this.sample(x * xScale, y * yScale, useNearest));
            }
        }
        return ds
    }

    // Scale each data element to be between min/max
    // This is a linear scale from this dataset's min/max
    // y = mx + b
    // scale (ds, min, max) {
    scale(min, max) {
        // const data = ds.data
        const dsMin = this.min();
        const dsMax = this.max();
        const dsDelta = dsMax - dsMin;
        const delta = max - min;
        const m = delta / dsDelta;
        const b = min - m * dsMin;
        // const scaledData = data.map((x) => m * x + b)
        // return new DataSet(ds.width, ds.height, scaledData)
        return this.map(x => m * x + b)
    }

    // Return a rectangular subset of the dataset.
    // Returned dataset is of same array type as this.
    subset(x, y, width, height) {
        if (x + width > this.width || y + height > this.height) {
            throw Error('DataSet.subSet: params out of range')
        }
        const ds = this.emptyDataSet(width, height);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                ds.setXY(i, j, this.getXY(i + x, j + y));
            }
        }
        return ds
    }

    // Return maped dataset by applying f to each dataset element
    map(f) {
        return new DataSet(this.width, this.height, this.data.map(f))
    }

    // Return the column of data at position x as this array's type
    col(x) {
        const [w, h, data] = [this.width, this.height, this.data];
        if (x >= w) throw Error(`col: x out of range width: ${w} x: ${x}`)
        const colData = this.emptyArray(h);
        for (let i = 0; i < h; i++) colData[i] = data[x + i * w];
        return colData
    }

    // Return the row of data at position y as this array's type
    row(y) {
        const [w, h] = [this.width, this.height];
        if (y >= h) throw Error(`row: y out of range height: ${h} x: ${y}`)
        return this.data.slice(y * w, (y + 1) * w)
    }

    // Convert this dataset's data to new type. Precision may be lost.
    // Does nothing if current data is already of this Type.
    convertType(type) {
        this.data = util.convertArray(this.data, type);
    }

    // Concatinate a dataset of equal height to my right to my east.
    // New DataSet is of same type as this.
    //
    // NOTE: concatWest is dataset.concatEast(this)
    concatEast(ds) {
        const [w, h] = [this.width, this.height];
        const [w1, h1] = [ds.width, ds.height];
        if (h !== h1) throw Error(`concatEast: heights not equal ${h}, ${h1}`)
        const ds1 = this.emptyDataSet(w + w1, h);
        // copy this into new dataset
        for (let x = 0; x < h; x++) {
            for (let y = 0; y < w; y++) {
                ds1.setXY(x, y, this.getXY(x, y));
            }
        }
        // copy ds to the left side
        for (let x = 0; x < h1; x++) {
            for (let y = 0; y < w1; y++) {
                ds1.setXY(x + w, y, ds.getXY(x, y));
            }
        }
        return ds1
    }

    // Concatinate a dataset of equal width to my south, returning new DataSet.
    // New DataSet is of same type as this.
    //
    // NOTE: concatNorth is dataset.concatSouth(this)
    concatSouth(dataset) {
        const [w, h, data] = [this.width, this.height, this.data];
        if (w !== dataset.width) {
            throw Error(`concatSouth: widths not equal ${w}, ${dataset.width}`)
        }
        const data1 = util.concatArrays(data, dataset.data);
        return new DataSet(w, h + dataset.height, data1)
    }

    // return dataset x,y given x,y in a euclidean space defined by tlx, tly, w, h
    // x,y is in topleft-bottomright box: [tlx,tly,tlx+w,tly-h], y positive util.
    // Ex: NetLogo's coords: x, y, minXcor, maxYcor, numX, numY
    transformCoords(x, y, tlx, tly, w, h) {
        const xs = (x - tlx) * (this.width - 1) / w;
        const ys = (tly - y) * (this.height - 1) / h;
        return [xs, ys]
    }

    // get a sample using a transformed euclidean coord system; see above
    coordSample(x, y, tlx, tly, w, h, useNearest = true) {
        const [xs, ys] = this.transformCoords(x, y, tlx, tly, w, h);
        return this.sample(xs, ys, useNearest)
    }

    // Return Array 3x3 neighbor values of the given x,y of the dataset.
    // Off-edge neighbors revert to nearest edge value.
    neighborhood(x, y, array = []) {
        array.length = 0; // in case user supplied an array to reduce GC
        const clampNeeded =
            x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
        for (let dy = -1; dy <= +1; dy++) {
            for (let dx = -1; dx <= +1; dx++) {
                let x0 = x + dx;
                let y0 = y + dy;
                if (clampNeeded) {
                    x0 = util.clamp(x0, 0, this.width - 1);
                    y0 = util.clamp(y0, 0, this.height - 1);
                }
                array.push(this.data[this.toIndex(x0, y0)]);
            }
        }
        return array
    }

    // Return a new dataset of this array type convolved with the
    // given kernel 3x3 matrix.
    // See [Convolution](https://en.wikipedia.org/wiki/Kernel_(image_processing))
    //
    // If cropped, do not convolve the edges, returning a smaller dataset.
    // If not, convolve the edges by extending edge values, returning
    // dataset of same size.
    convolve(kernel, factor = 1, crop = false) {
        const [x0, y0, h, w] = crop // optimization not needed, only called once
            ? [1, 1, this.height - 1, this.width - 1]
            : [0, 0, this.height, this.width];
        const newDS = this.emptyDataSet(w, h);
        const newData = newDS.data;
        let i = 0;
        for (let y = y0; y < h; y++) {
            for (let x = x0; x < w; x++) {
                const nei = this.neighborhood(x, y);
                // remind: use reduce if performant
                let sum2 = 0;
                for (let i2 = 0; i2 < kernel.length; i2++) {
                    // sum2 += kernel[i2] * nei[i2] // Chrome can't optimize compound let
                    sum2 = sum2 + kernel[i2] * nei[i2];
                }
                newData[i++] = sum2 * factor; // newDS.data[newDS.toIndex(x, y)] = sum2 * factor
            }
        }
        return newDS
    }

    // A few common convolutions.  dzdx/y are also called horiz/vert Sobel
    dzdx(n = 2, factor = 1 / 8) {
        return this.convolve([-1, 0, 1, -n, 0, n, -1, 0, 1], factor)
    }
    dzdy(n = 2, factor = 1 / 8) {
        return this.convolve([1, n, 1, 0, 0, 0, -1, -n, -1], factor)
    }
    laplace8() {
        return this.convolve([-1, -1, -1, -1, 8, -1, -1, -1, -1])
    }
    laplace4() {
        return this.convolve([0, -1, 0, -1, 4, -1, 0, -1, 0])
    }
    blur(factor = 0.0625) {
        // 1/16 = 0.0625
        return this.convolve([1, 2, 1, 2, 4, 2, 1, 2, 1], factor)
    }
    edge() {
        return this.convolve([1, 1, 1, 1, -7, 1, 1, 1, 1])
    }

    // Create two new Array convolved datasets, slope and aspect, common in
    // the use of an elevation data set. See Esri tutorials for
    // [slope](http://goo.gl/ZcOl08) and [aspect](http://goo.gl/KoI4y5)
    //
    // It also returns the two derivitive DataSets, dzdx, dzdy for
    // those wanting to use the results of the two convolutions.
    //
    // Use this.convertType to convert to typed array
    slopeAndAspect(cellSize = 1, posAngle = true) {
        const dzdx = this.dzdx(); // sub left z from right
        const dzdy = this.dzdy(); // sub bottom z from top
        let [aspect, slope] = [[], []];
        const [h, w] = [dzdx.height, dzdx.width];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const [gx, gy] = [dzdx.getXY(x, y), dzdy.getXY(x, y)];
                // slope.push(Math.atan(util.distance(gx, gy)) / cellSize) // radians
                slope.push(Math.atan(util.distance(0, 0, gx, gy)) / cellSize);
                // if (noNaNs)
                //   while (gx === gy) {
                //     gx += util.randomNormal(0, 0.0001)
                //     gy += util.randomNormal(0, 0.0001)
                //   }
                // radians in [-PI,PI], downhill
                // let rad = (gx === gy && gy === 0) ? NaN : Math.atan2(-gy, -gx)
                let rad = Math.atan2(-gy, -gx);
                // positive radians in [0,2PI] if desired
                if (posAngle && rad < 0) rad += 2 * Math.PI;
                aspect.push(rad);
            }
        }
        slope = new DataSet(w, h, slope);
        aspect = new DataSet(w, h, aspect);
        return { slope, aspect, dzdx, dzdy }
    }

    // REMIND: limit to data that can be 24 bit. Error otherwise.
    // DataType of Int8, 16, Int24 OK, others need testing.
    // Possibly use precision to minimize byte size to 3, rgb?
    //
    // Convert dataset to an image context object.
    //
    // This can be used to "visualize" the data by normalizing
    // which will scale the data to use the entire RGB space.
    // It can also be used to create tiles or image-as-data if
    // the defaults are used.
    //
    // Due to
    // [alpha-premultiply](https://en.wikipedia.org/wiki/Alpha_compositing),
    // the best we can do as data is 24 bit ints.
    // You can simulate floats/fixed by multiplying the dataset
    // the dividing on conversion back.
    //
    // Our preferred transport is in the works, likely in the
    // tile datasets via blobs or arraybuffers. Sigh.
    // toContext (normalize = false, gray = false, alpha = 255) {
    //   const [w, h, data] = [this.width, this.height, this.data]
    //   let idata
    //   if (normalize) {
    //     idata = gray
    //       ? util.normalize8(data) : util.normalizeInt(data, 0, Math.pow(2, 24) - 1)
    //   } else {
    //     idata = data.map((a) => Math.round(a))
    //   }
    //   const ctx = util.createCtx(w, h)
    //   const id = ctx.getImageData(0, 0, w, h)
    //   const ta = id.data // ta short for typed array
    //   for (let i = 0; i < idata.length; i++) {
    //     const [num, j] = [idata[i], 4 * i] // j = byte index into ta
    //     if (gray) {
    //       ta[j] = ta[j + 1] = ta[j + 2] = Math.floor(num); ta[j + 3] = alpha
    //     } else {
    //       ta[j] = (num >> 16) & 0xff
    //       ta[j + 1] = (num >> 8) & 0xff
    //       ta[j + 2] = num & 0xff
    //       ta[j + 3] = alpha // if not 255, image will be premultiplied.
    //     }
    //   }
    //   ctx.putImageData(id, 0, 0)
    //   return ctx
    // }
    //
    // // Convert dataset to a canvas, which can be used as an image
    // toCanvas (normalize = false, gray = false, alpha = 255) {
    //   return this.toContext(gray, normalize, alpha).canvas
    // }
    // // Convert dataset to a base64 string
    // toDataUrl (normalize = false, gray = false, alpha = 255) {
    //   return util.ctxToDataUrl(this.toContext(gray, normalize, alpha))
    // }

    // Return max/min of data
    max() {
        return util.arrayMax(this.data)
    }
    min() {
        return util.arrayMin(this.data)
    }
    // Test that this has same width, height, data as dataset.
    // Note: does not require equal array type (Array or TypedArray)
    equals(dataset) {
        return (
            this.width === dataset.width &&
            this.height === dataset.height &&
            util.arraysEqual(this.data, dataset.data)
        )
    }
}

// import Color from './Color.js'

// Class Link instances form a link between two turtles, forming a graph.
// Flyweight object creation, see Patch/Patches.
// https://medium.com/dailyjs/two-headed-es6-classes-fe369c50b24

class Link {
    // The core default variables needed by a Link.
    // Use links.setDefault(name, val) to change
    // Modelers add additional "own variables" as needed.
    static defaultVariables() {
        // Core variables for patches. Not 'own' variables.
        return {
            end0: null, // Turtles: end0 & 1 are turtle ends of the link
            end1: null,
            width: 1, // THREE: must be 1. Canvas2D (unsupported) has widths.
        }
    }
    // Initialize a Link
    constructor() {
        Object.assign(this, Link.defaultVariables());
    }
    init(from, to) {
        this.end0 = from;
        this.end1 = to;
        from.links.push(this);
        to.links.push(this);
    }
    // Remove this link from its agentset
    die() {
        this.agentSet.removeAgent(this);
        util.removeArrayItem(this.end0.links, this);
        util.removeArrayItem(this.end1.links, this);
        // Set id to -1, indicates that I've died.
        this.id = -1;
    }

    bothEnds() {
        return [this.end0, this.end1]
    }
    length() {
        return this.end0.distance(this.end1)
    }
    otherEnd(turtle) {
        if (turtle === this.end0) return this.end1
        if (turtle === this.end1) return this.end0
        throw Error(`Link.otherEnd: turtle not a link turtle: ${turtle}`)
    }
}

// Links are a collection of all the Link objects between turtles.
class Links extends AgentSet {
    // Use AgentSeet ctor: constructor (model, AgentClass, name)

    // Factory: Add 1 or more links from the from turtle to the to turtle(s) which
    // can be a single turtle or an array of turtles. The optional init
    // proc is called on the new link after inserting in the agentSet.
    create(from, to, initFcn = link => {}) {
        if (!Array.isArray(to)) to = [to];
        return to.map(t => {
            // REMIND: skip dups
            const link = this.addAgent();
            link.init(from, t);
            initFcn(link);
            return link
        }) // REMIND: return single link if to not an array?
    }
}

// class World defines the coordinate system for the model.
// It will be upgraded with methods converting from other
// transforms like GIS and DataSets.

class World {
    static defaultOptions(maxX = 16, maxY = maxX) {
        return {
            minX: -maxX,
            maxX: maxX,
            minY: -maxY,
            maxY: maxY,
        }
    }
    // Initialize the world w/ defaults overridden w/ options.
    constructor(options = {}) {
        Object.assign(this, World.defaultOptions()); // initial this w/ defaults
        Object.assign(this, options); // override defaults with options
        this.setWorld();
    }
    // Complete properties derived from minX/Y, maxX/Y (patchSize === 1)
    setWorld() {
        this.numX = this.maxX - this.minX + 1;
        this.numY = this.maxY - this.minY + 1;
        this.width = this.numX; // REMIND: remove?
        this.height = this.numY;
        this.minXcor = this.minX - 0.5;
        this.maxXcor = this.maxX + 0.5;
        this.minYcor = this.minY - 0.5;
        this.maxYcor = this.maxY + 0.5;
        this.centerX = (this.minX + this.maxX) / 2;
        this.centerY = (this.minY + this.maxY) / 2;
    }
    // Test x,y for being on-world.
    isOnWorld(x, y) {
        return (
            this.minXcor <= x &&
            x <= this.maxXcor &&
            this.minYcor <= y &&
            y <= this.maxYcor
        )
    }
    // Convert a canvas to world coordinates.
    // The size is determined by patchSize.
    setCtxTransform(ctx, patchSize) {
        ctx.canvas.width = this.width * patchSize;
        ctx.canvas.height = this.height * patchSize;
        ctx.save();
        ctx.scale(patchSize, -patchSize);
        ctx.translate(-(this.minXcor * patchSize), -(this.maxYcor * patchSize));
    }
}

// Patches are the world other agentsets live on. They create a coord system
// from Model's world values: minX, maxX, minY, maxY
class Patches extends AgentSet {
    constructor(model, AgentClass, name) {
        // AgentSet sets these variables:
        // model, name, baseSet, world: model.world, agentProto: new AgentClass
        // REMIND: agentProto: defaults, agentSet, world, [name]=agentSet.baseSet
        super(model, AgentClass, name);

        // Skip if a breedSet (don't rebuild patches!).
        if (this.isBreedSet()) return

        this.populate();
        // this.setPixels()
        this.labels = []; // sparse array for labels
    }
    // Set up all the patches.
    populate() {
        util.repeat(this.model.world.numX * this.model.world.numY, i => {
            this.addAgent(); // Object.create(this.agentProto))
        });
    }

    setDefault(name, value) {
        if (name === 'color') {
            this.ask(p => {
                p.setColor(value);
            });
            util.logOnce(
                'patches.setDefault(color, value): color default not supported. Clearing to value'
            );
        } else {
            super.setDefault(name, value);
        }
    }
    // Get/Set label. REMIND: not implemented.
    // Set removes label if label is null or undefined.
    // Get returns undefined if no label.
    setLabel(patch, label) {
        // REMIND: does this work for breeds?
        // null or undefined
        if (label == null) {
            delete this.labels[patch.id];
        } else {
            this.labels[patch.id] = label;
        }
    }
    getLabel(patch) {
        return this.labels[patch.id]
    }

    // Return the offsets from a patch for its 8 element neighbors.
    // Specialized to be faster than inRect below.
    neighborsOffsets(x, y) {
        const { minX, maxX, minY, maxY, numX } = this.model.world;
        if (x === minX) {
            if (y === minY) return [-numX, -numX + 1, 1]
            if (y === maxY) return [1, numX + 1, numX]
            return [-numX, -numX + 1, 1, numX + 1, numX]
        }
        if (x === maxX) {
            if (y === minY) return [-numX - 1, -numX, -1]
            if (y === maxY) return [numX, numX - 1, -1]
            return [-numX - 1, -numX, numX, numX - 1, -1]
        }
        if (y === minY) return [-numX - 1, -numX, -numX + 1, 1, -1]
        if (y === maxY) return [1, numX + 1, numX, numX - 1, -1]
        return [-numX - 1, -numX, -numX + 1, 1, numX + 1, numX, numX - 1, -1]
    }
    // Return the offsets from a patch for its 4 element neighbors (N,S,E,W)
    neighbors4Offsets(x, y) {
        const numX = this.model.world.numX;
        return this.neighborsOffsets(x, y).filter(
            n => Math.abs(n) === 1 || Math.abs(n) === numX
        ) // slightly faster
        // .filter((n) => [1, -1, numX, -numX].indexOf(n) >= 0)
        // .filter((n) => [1, -1, numX, -numX].includes(n)) // slower than indexOf
    }
    // Return my 8 patch neighbors
    neighbors(patch) {
        const { id, x, y } = patch;
        const offsets = this.neighborsOffsets(x, y);
        const as = new AgentArray(offsets.length);
        offsets.forEach((o, i) => {
            as[i] = this[o + id];
        });
        return as
    }
    // Return my 4 patch neighbors
    neighbors4(patch) {
        const { id, x, y } = patch;
        const offsets = this.neighbors4Offsets(x, y);
        const as = new AgentArray(offsets.length);
        offsets.forEach((o, i) => {
            as[i] = this[o + id];
        });
        return as
    }

    // Return a random valid int x,y point in patch space
    randomPt() {
        const { minX, maxX, minY, maxY } = this.model.world;
        return [util.randomInt2(minX, maxX), util.randomInt2(minY, maxY)]
    }

    // Import/export DataSet to/from patch variable `patchVar`.
    // `useNearest`: true for fast rounding to nearest; false for bi-linear.
    importDataSet(dataSet, patchVar, useNearest = false) {
        if (this.isBreedSet()) {
            // REMIND: error
            util.warn('Patches: exportDataSet called with breed, using patches');
            this.baseSet.importDataSet(dataSet, patchVar, useNearest);
            return
        }
        const { numX, numY } = this.model.world;
        const dataset = dataSet.resample(numX, numY, useNearest);
        this.ask(p => {
            p[patchVar] = dataset.data[p.id];
        });
    }
    exportDataSet(patchVar, Type = Array) {
        if (this.isBreedSet()) {
            util.warn('Patches: exportDataSet called with breed, using patches');
            return this.baseSet.exportDataSet(patchVar, Type)
        }
        const { numX, numY } = this.model.world;
        // let data = util.arrayProps(this, patchVar)
        let data = this.props(patchVar);
        data = util.convertArray(data, Type);
        return new DataSet(numX, numY, data)
    }

    // Return id/index given valid x,y integers
    patchIndex(x, y) {
        const { minX, maxY, numX } = this.model.world;
        return x - minX + numX * (maxY - y)
    }

    // Return patch at x,y float values
    // Return undefined if off-world
    patch(x, y) {
        if (!this.model.world.isOnWorld(x, y)) return undefined
        const intX =
            x === this.model.world.maxXcor
                ? this.model.world.maxX
                : Math.round(x); // handle n.5 round up to n + 1
        const intY =
            y === this.model.world.maxYcor
                ? this.model.world.maxY
                : Math.round(y);
        return this.patchXY(intX, intY)
    }
    // Return the patch at x,y where both are valid integer patch coordinates.
    patchXY(x, y) {
        return this[this.patchIndex(x, y)]
    }

    // Patches in rectangle dx, dy from p, dx, dy integers.
    // Both dx & dy are half width/height of rect
    patchRect(p, dx, dy = dx, meToo = true) {
        // Return cached rect if one exists.
        if (p.rectCache) {
            const index = this.cacheIndex(dx, dy, meToo);
            const rect = p.rectCache[index];
            if (rect) return rect
        }
        const rect = new AgentArray();
        let { minX, maxX, minY, maxY } = this.model.world;
        minX = Math.max(minX, p.x - dx);
        maxX = Math.min(maxX, p.x + dx);
        minY = Math.max(minY, p.y - dy);
        maxY = Math.min(maxY, p.y + dy);
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const pnext = this.patchXY(x, y);
                if (p !== pnext || meToo) rect.push(pnext);
            }
        }
        return rect
    }
    // Return patchRect given legal x, y values
    patchRectXY(x, y, dx, dy = dx, meToo = true) {
        return this.patchRect(this.patch(x, y), dx, dy, meToo)
    }

    // Performance: create a cached rect of this size in sparse array.
    // Index of cached rect is dx * dy + meToo ? 0 : -1.
    // This works for edge rects that are not that full size.
    // patchRect will use this if matches dx, dy, meToo.
    cacheIndex(dx, dy = dx, meToo = true) {
        return (2 * dx + 1) * (2 * dy + 1) + (meToo ? 0 : -1)
    }
    cacheRect(dx, dy = dx, meToo = true, clear = true) {
        const index = this.cacheIndex(dx, dy, meToo);
        this.ask(p => {
            if (!p.rectCache || clear) p.rectCache = [];
            const rect = this.inRect(p, dx, dy, meToo);
            p.rectCache[index] = rect;
        });
    }

    // Return patches within the patch rect, dx, dy integers
    // default is square & meToo
    inRect(patch, dx, dy = dx, meToo = true) {
        const pRect = this.patchRect(patch, dx, dy, meToo);
        if (this.isBaseSet()) return pRect
        return pRect.withBreed(this)
    }
    // Return patches within float radius distance of patch
    inRadius(patch, radius, meToo = true) {
        const dxy = Math.ceil(radius);
        const pRect = this.inRect(patch, dxy, dxy, meToo);
        return pRect.inRadius(patch, radius, meToo)
    }
    // Patches in cone from p in direction `angle`,
    // with `coneAngle` and float `radius`
    inCone(patch, radius, coneAngle, direction, meToo = true) {
        const dxy = Math.ceil(radius);
        const pRect = this.inRect(patch, dxy, dxy, meToo);
        return pRect.inCone(patch, radius, coneAngle, direction, meToo)
    }

    // Return patch at distance and angle from obj's (patch or turtle)
    // x, y (floats). If off world, return undefined.
    // To use heading: patchAtAngleAndDistance(obj, util.angle(heading), distance)
    // Does not take into account the angle of the obj .. turtle.theta for example.
    patchAtAngleAndDistance(obj, angle, distance) {
        let { x, y } = obj;
        x = x + distance * Math.cos(angle);
        y = y + distance * Math.sin(angle);
        return this.patch(x, y)
    }
    // patchLeftAndAhead (dTheta, distance) {
    //   return this.patchAtAngleAndDistance(dTheta, distance)
    // }
    // patchRightAndAhead (dTheta, distance) {
    //   return this.patchAtAngleAndDistance(-dTheta, distance)
    // }

    // Return true if patch on edge of world
    isOnEdge(patch) {
        const { x, y } = patch;
        const { minX, maxX, minY, maxY } = this.model.world;
        return x === minX || x === maxX || y === minY || y === maxY
    }
    // returns the edge patches for this breed.
    // generally called with patches.baseSet/model.patches.
    edgePatches() {
        return this.filter(p => this.isOnEdge(p))
    }

    // Diffuse the value of patch variable `p.v` by distributing `rate` percent
    // of each patch's value of `v` to its neighbors.
    // If the patch has less than 4/8 neighbors, return the extra to the patch.
    diffuse(v, rate) {
        this.diffuseN(8, v, rate);
    }
    diffuse4(v, rate) {
        this.diffuseN(4, v, rate);
    }
    diffuseN(n, v, rate) {
        // Note: for-of loops removed: chrome can't optimize them
        // test/apps/patches.js 22fps -> 60fps
        // zero temp variable if not yet set
        if (this[0]._diffuseNext === undefined) {
            // for (const p of this) p._diffuseNext = 0
            for (let i = 0; i < this.length; i++) this[i]._diffuseNext = 0;
        }

        // pass 1: calculate contribution of all patches to themselves and neighbors
        // for (const p of this) {
        for (let i = 0; i < this.length; i++) {
            const p = this[i];
            const dv = p[v] * rate;
            const dvn = dv / n;
            const neighbors = n === 8 ? p.neighbors : p.neighbors4;
            const nn = neighbors.length;
            p._diffuseNext += p[v] - dv + (n - nn) * dvn;
            // for (const n of neighbors) n._diffuseNext += dvn
            for (let i = 0; i < neighbors.length; i++) {
                neighbors[i]._diffuseNext += dvn;
            }
        }
        // pass 2: set new value for all patches, zero temp,
        // for (const p of this) {
        for (let i = 0; i < this.length; i++) {
            const p = this[i];
            p[v] = p._diffuseNext;
            p._diffuseNext = 0;
        }
    }
}

// Class Patch instances represent a rectangle on a grid.  They hold variables
// that are in the patches the turtles live on.  The set of all patches
// is the world on which the turtles live and the model runs.

// Flyweight object creation:
// Objects within AgentSets use "prototypal inheritance" via Object.create().
// Here, the Patch class is given to Patches for use creating Proto objects
// (new Patch(agentSet)), but only once per model/breed.
// The flyweight Patch objects are created via Object.create(protoObject),
// This lets the new Patch(agentset) object be "defaults".
// https://medium.com/dailyjs/two-headed-es6-classes-fe369c50b24
class Patch {
    static defaultVariables() {
        // Core variables for patches.
        return {
            turtles: undefined, // the turtles on me. Lazy evalued, see turtlesHere
        }
    }
    // Initialize a Patch given its Patches AgentSet.
    constructor() {
        Object.assign(this, Patch.defaultVariables());
    }
    // Getter for x,y derived from patch id, thus no setter.
    get x() {
        return this.id % this.model.world.numX + this.model.world.minX
    }
    get y() {
        return (
            this.model.world.maxY - Math.floor(this.id / this.model.world.numX)
        )
    }
    isOnEdge() {
        return this.patches.isOnEdge(this)
    }

    // Getter for neighbors of this patch.
    // Uses lazy evaluation to promote neighbors to instance variables.
    // To avoid promotion, use `patches.neighbors(this)`.
    // Promotion makes getters accessed only once.
    // defineProperty required: can't set this.neighbors when getter defined.
    get neighbors() {
        // lazy promote neighbors from getter to instance prop.
        const n = this.patches.neighbors(this);
        Object.defineProperty(this, 'neighbors', { value: n, enumerable: true });
        return n
    }
    get neighbors4() {
        const n = this.patches.neighbors4(this);
        Object.defineProperty(this, 'neighbors4', {
            value: n,
            enumerable: true,
        });
        return n
    }

    // Promote this.turtles on first call to turtlesHere.
    turtlesHere() {
        if (this.turtles == null) {
            this.patches.ask(p => {
                p.turtles = [];
            });
            this.model.turtles.ask(t => {
                t.patch.turtles.push(t);
            });
        }
        return this.turtles
    }
    // Returns above but returning only turtles of this breed.
    breedsHere(breed) {
        const turtles = this.turtlesHere();
        return turtles.withBreed(breed)
    }

    // 6 methods in both Patch & Turtle modules
    // Distance from me to x, y. REMIND: No off-world test done
    distanceXY(x, y) {
        return util.distance(this.x, this.y, x, y)
    }
    // Return distance from me to object having an x,y pair (turtle, patch, ...)
    distance(agent) {
        return this.distanceXY(agent.x, agent.y)
    }
    // Return angle towards agent/x,y
    // Use util.heading to convert to heading
    towards(agent) {
        return this.towardsXY(agent.x, agent.y)
    }
    towardsXY(x, y) {
        return util.radiansToward(this.x, this.y, x, y)
    }
    // Return patch w/ given parameters. Return undefined if off-world.
    // Return patch dx, dy from my position.
    patchAt(dx, dy) {
        return this.patches.patch(this.x + dx, this.y + dy)
    }
    patchAtAngleAndDistance(direction, distance) {
        return this.patches.patchAtAngleAndDistance(this, direction, distance)
    }

    sprout(num = 1, breed = this.model.turtles, initFcn = turtle => {}) {
        return breed.create(num, turtle => {
            turtle.setxy(this.x, this.y);
            initFcn(turtle);
        })
    }
}

// Turtles are the world other agentsets live on. They create a coord system
// from Model's world values: size, minX, maxX, minY, maxY
class Turtles extends AgentSet {
    // Use AgentSet ctr: constructor (model, AgentClass, name)
    create(num = 1, initFcn = turtle => {}) {
        return util.repeat(num, (i, a) => {
            const turtle = this.addAgent();
            turtle.theta = util.randomFloat(Math.PI * 2);
            initFcn(turtle);
            a.push(turtle); // Return array of new agents. REMIND: should be agentarray?
        })
    }

    // Return a random valid float x,y point in turtle coord space.
    randomPt() {
        const { minXcor, maxXcor, minYcor, maxYcor } = this.model.world;
        return [
            util.randomFloat2(minXcor, maxXcor),
            util.randomFloat2(minYcor, maxYcor),
        ]
    }

    // Return an array of this breed within the array of patchs
    inPatches(patches) {
        let array = new AgentArray(); // []
        for (const p of patches) array.push(...p.turtlesHere());
        // REMIND: can't use withBreed .. its not an AgentSet. Move to AgentArray?
        if (this.isBreedSet()) array = array.filter(a => a.agentSet === this);
        return array
    }
    // Return an array of turtles/breeds within the patchRect, dx/y integers
    // Note: will return turtle too. Also slightly inaccurate due to being
    // patch based, not turtle based.
    inPatchRect(turtle, dx, dy = dx, meToo = false) {
        // meToo: true for patches, could have several turtles on patch
        const patches = this.model.patches.inRect(turtle.patch, dx, dy, true);
        const agents = this.inPatches(patches);
        // don't use agents.removeAgent: breeds
        if (!meToo) util.removeArrayItem(agents, turtle);
        // if (!meToo) util.removeItem(agents, turtle)
        return agents // this.inPatches(patches)
    }
    // Return the members of this agentset that are within radius distance
    // from me, using a patch rect.
    inRadius(turtle, radius, meToo = false) {
        const agents = this.inPatchRect(turtle, radius, radius, true);
        return agents.inRadius(turtle, radius, meToo)
    }
    inCone(turtle, radius, coneAngle, meToo = false) {
        const agents = this.inPatchRect(turtle, radius, radius, true);
        return agents.inCone(turtle, radius, coneAngle, turtle.theta, meToo)
    }

    // Circle Layout: position the turtles in this breed in an equally
    // spaced circle of the given radius, with the initial turtle
    // at the given start angle (default to pi/2 or "up") and in the
    // +1 or -1 direction (counter clockwise or clockwise)
    // defaulting to -1 (clockwise).
    layoutCircle(
        radius,
        center = [0, 0],
        startAngle = Math.PI / 2,
        direction = -1
    ) {
        const dTheta = 2 * Math.PI / this.length;
        const [x0, y0] = center;
        this.ask((turtle, i) => {
            turtle.setxy(x0, y0);
            turtle.theta = startAngle + direction * dTheta * i;
            turtle.forward(radius);
        });
    }
}

// import Color from './Color.js'
// Flyweight object creation, see Patch/Patches.

// Class Turtle instances represent the dynamic, behavioral element of modeling.
// Each turtle knows the patch it is on, and interacts with that and other
// patches, as well as other turtles.

class Turtle {
    static defaultVariables() {
        return {
            // Core variables for turtles.
            // turtle's position: x, y, z.
            // Generally z set to constant via turtles.setDefault('z', num)
            x: 0,
            y: 0,
            z: 0,
            // my euclidean direction, radians from x axis, counter-clockwise
            theta: 0,
            // What to do if I wander off world. Can be 'clamp', 'wrap'
            // 'bounce', or a function, see handleEdge() method
            atEdge: 'clamp',
        }
    }
    // Initialize a Turtle given its Turtles AgentSet.
    constructor() {
        Object.assign(this, Turtle.defaultVariables());
    }
    die() {
        this.agentSet.removeAgent(this); // remove me from my baseSet and breed
        // Remove my links if any exist.
        // Careful: don't promote links
        if (this.hasOwnProperty('links')) {
            while (this.links.length > 0) this.links[0].die();
        }
        // Remove me from patch.turtles cache if patch.turtles array exists
        if (this.patch.turtles != null) {
            util.removeArrayItem(this.patch.turtles, this);
        }
        // Set id to -1, indicates that I've died.
        this.id = -1;
    }

    // Factory: create num new turtles at this turtle's location. The optional init
    // proc is called on the new turtle after inserting in its agentSet.
    hatch(num = 1, breed = this.agentSet, init = turtle => {}) {
        return breed.create(num, turtle => {
            turtle.setxy(this.x, this.y);
            // hatched turtle inherits parents' ownVariables
            for (const key of breed.ownVariables) {
                if (turtle[key] == null) turtle[key] = this[key];
            }
            init(turtle);
        })
    }
    // Getter for links for this turtle. REMIND: use new AgentSet(0)?
    // Uses lazy evaluation to promote links to instance variables.
    // REMIND: Let links create the array as needed, less "tricky"
    get links() {
        // lazy promote links from getter to instance prop.
        Object.defineProperty(this, 'links', {
            value: new AgentArray(0),
            enumerable: true,
        });
        return this.links
    }
    // Getter for the patch I'm on. Return null if off-world.
    get patch() {
        return this.model.patches.patch(this.x, this.y)
    }

    // Heading vs Euclidean Angles. Direction for clarity when ambiguity.
    get heading() {
        return util.heading(this.theta)
    }
    set heading(heading) {
        this.theta = util.angle(heading);
    }
    get direction() {
        return this.theta
    }
    set direction(theta) {
        this.theta = theta;
    }

    // Set x, y position. If z given, override default z.
    // Call handleEdge(x, y) if x, y off-world.
    setxy(x, y, z = null) {
        const p0 = this.patch;
        if (z != null) this.z = z; // don't promote z if null, use default z instead.
        if (this.model.world.isOnWorld(x, y)) {
            this.x = x;
            this.y = y;
        } else {
            this.handleEdge(x, y);
        }
        const p = this.patch;
        if (p.turtles != null && p !== p0) {
            // util.removeItem(p0.turtles, this)
            util.removeArrayItem(p0.turtles, this);
            p.turtles.push(this);
        }
    }
    // Handle turtle if x,y off-world
    handleEdge(x, y) {
        if (util.isString(this.atEdge)) {
            const { minXcor, maxXcor, minYcor, maxYcor } = this.model.world;
            if (this.atEdge === 'wrap') {
                this.x = util.wrap(x, minXcor, maxXcor);
                this.y = util.wrap(y, minYcor, maxYcor);
            } else if (this.atEdge === 'clamp' || this.atEdge === 'bounce') {
                this.x = util.clamp(x, minXcor, maxXcor);
                this.y = util.clamp(y, minYcor, maxYcor);
                if (this.atEdge === 'bounce') {
                    if (this.x === minXcor || this.x === maxXcor) {
                        this.theta = Math.PI - this.theta;
                    } else {
                        this.theta = -this.theta;
                    }
                }
            } else {
                throw Error(`turtle.handleEdge: bad atEdge: ${this.atEdge}`)
            }
        } else {
            this.atEdge(this);
        }
    }
    // Place the turtle at the given patch/turtle location
    moveTo(agent) {
        this.setxy(agent.x, agent.y);
    }
    // Move forward (along theta) d units (patch coords),
    forward(d) {
        this.setxy(
            this.x + d * Math.cos(this.theta),
            this.y + d * Math.sin(this.theta)
        );
    }
    // Change current direction by rad radians which can be + (left) or - (right).
    rotate(rad) {
        this.theta = util.mod(this.theta + rad, Math.PI * 2);
    }
    right(rad) {
        this.rotate(-rad);
    }
    left(rad) {
        this.rotate(rad);
    }

    // Set my direction towards turtle/patch or x,y.
    // "direction" is euclidean radians.
    face(agent) {
        this.theta = this.towards(agent);
    }
    faceXY(x, y) {
        this.theta = this.towardsXY(x, y);
    }

    // Return the patch ahead of this turtle by distance (patchSize units).
    // Return undefined if off-world.
    patchAhead(distance) {
        return this.patchAtAngleAndDistance(this.theta, distance)
    }
    // Use patchAhead to determine if this turtle can move forward by distance.
    canMove(distance) {
        return this.patchAhead(distance) != null
    } // null / undefined
    patchLeftAndAhead(angle, distance) {
        return this.patchAtAngleAndDistance(angle + this.theta, distance)
    }
    patchRightAndAhead(angle, distance) {
        return this.patchAtAngleAndDistance(angle - this.theta, distance)
    }

    // 6 methods in both Patch & Turtle modules
    // Distance from me to x, y. REMIND: No off-world test done
    distanceXY(x, y) {
        return util.distance(this.x, this.y, x, y)
    }
    // Return distance from me to object having an x,y pair (turtle, patch, ...)
    // distance (agent) { this.distanceXY(agent.x, agent.y) }
    distance(agent) {
        return util.distance(this.x, this.y, agent.x, agent.y)
    }
    // Return angle towards agent/x,y
    // Use util.heading to convert to heading
    towards(agent) {
        return this.towardsXY(agent.x, agent.y)
    }
    towardsXY(x, y) {
        return util.radiansToward(this.x, this.y, x, y)
    }
    // Return patch w/ given parameters. Return undefined if off-world.
    // Return patch dx, dy from my position.
    patchAt(dx, dy) {
        return this.model.patches.patch(this.x + dx, this.y + dy)
    }
    // Note: angle is absolute, w/o regard to existing angle of turtle.
    // Use Left/Right versions for angle-relative.
    patchAtAngleAndDistance(direction, distance) {
        return this.model.patches.patchAtAngleAndDistance(
            this,
            direction,
            distance
        )
    }

    // Link methods. Note: this.links returns all links linked to me.
    // See links getter above.

    // Return other end of link from me. Link must include me!
    otherEnd(l) {
        return l.end0 === this ? l.end1 : l.end0
    }
    // Return all turtles linked to me
    linkNeighbors() {
        return this.links.map(l => this.otherEnd(l))
    }
}

// Class Model is the primary interface for modelers, integrating
// all the parts of a model. It also contains NetLogo's `observer` methods.
class Model {
    // Static class method for default setting.
    // Default world is centered, min/max = 16
    static defaultWorld(maxX = 16, maxY = maxX) {
        return World.defaultOptions(maxX, maxY)
    }

    // The Model constructor takes a World object.
    constructor(worldOptions = Model.defaultWorld()) {
        this.worldOptions = worldOptions;
        this.resetModel(); // REMIND: Temporary. Inline?
    }
    initAgentSet(name, AgentsetClass, AgentClass) {
        const agentset = new AgentsetClass(this, AgentClass, name);
        this[name] = agentset;
    }
    resetModel() {
        this.world = new World(this.worldOptions);
        // Base AgentSets setup here. Breeds handled by setup
        this.initAgentSet('patches', Patches, Patch);
        this.initAgentSet('turtles', Turtles, Turtle);
        this.initAgentSet('links', Links, Link);
    }
    reset() {
        this.resetModel();
    }

    // ### User Model Creation

    // A user's model is made by subclassing Model and over-riding these
    // 2 abstract methods. `super` need not be called.

    setup() {} // Your initialization code goes here
    // Update/step your model here
    step() {} // called each step of the model

    // Breeds: create breeds/subarrays of Patches, Agents, Links
    patchBreeds(breedNames) {
        for (const breedName of breedNames.split(' ')) {
            this[breedName] = this.patches.newBreed(breedName);
        }
    }
    turtleBreeds(breedNames) {
        for (const breedName of breedNames.split(' ')) {
            this[breedName] = this.turtles.newBreed(breedName);
        }
    }
    linkBreeds(breedNames) {
        for (const breedName of breedNames.split(' ')) {
            this[breedName] = this.links.newBreed(breedName);
        }
    }
}

// Based on the mapbox elevation formula:
// https://blog.mapbox.com/global-elevation-data-6689f1d0ba65

class RGBDataSet extends DataSet {
    static scaleFromMinMax(min, max) {
        // 255*256*256 + 255*256 + 255 === 2 ** 24 - 1 i.e. 16777215
        return (max - min) / (2 ** 24 - 1)
    }

    constructor(img, min = 0, scale = 1, ArrayType = Float32Array) {
        super(img.width, img.height, new ArrayType(img.width * img.height));
        const ctx = util.createCtx(img.width, img.height);
        util.fillCtxWithImage(ctx, img);
        const imgData = util.ctxImageData(ctx);
        const convertedData = this.data;
        for (var i = 0; i < convertedData.length; i++) {
            const r = imgData.data[4 * i];
            const g = imgData.data[4 * i + 1];
            const b = imgData.data[4 * i + 2];
            convertedData[i] = min + (r * 256 * 256 + g * 256 + b) * scale;
        }
        // this.src = img.src // Might be useful? Flags as image data set.
    }
}

// See stack overflow Ramda fcn: https://goo.gl/VNb362
// REMIND: util.isObject(msg)

function type(val) {
    return val === null
        ? 'Null'
        : val === undefined
            ? 'Undefined'
            : Object.prototype.toString.call(val).slice(8, -1)
}

function toJSON(obj, indent = 0, topLevelArrayOK = true) {
    let firstCall = topLevelArrayOK;
    const blackList = ['rectCache'];
    const json = JSON.stringify(
        obj,
        (key, val) => {
            if (blackList.includes(key)) return undefined
            const isAgentArray =
                Array.isArray(val) &&
                val.length > 0 &&
                Number.isInteger(val[0].id);

            if (isAgentArray && !firstCall) {
                return val.map(v => v.id)
            }

            firstCall = false;
            return val
        },
        indent
    );
    return json
}

function sampleObj(model) {
    const obj = {
        model: Object.keys(model),
        patches: model.patches.length,
        patch: model.patches.oneOf(),
        turtles: model.turtles.length,
        turtle: model.turtles.oneOf(),
        links: model.links.length,
        link: model.links.oneOf(),
    };
    const json = toJSON(obj);
    return JSON.parse(json)
}

function sampleJSON(model, indent = 0) {
    return toJSON(sampleObj(model), indent)
}
// export function samplePrettyJSON (model) {
//   return toJSON(sampleObj(model), 2)
// }

// Print a message to an html element.
// If msg is an object, convert to JSON.
function printToPage(msg, element = document.body) {
    // if (this.isObject(msg)) msg = JSON.stringify(msg, null, 2)
    if (type(msg) === 'Object') {
        msg = JSON.stringify(msg, null, 2);
        msg = '<pre>' + msg + '</pre>';
    }
    // const isObj = type(msg) === 'Object'

    element.style.fontFamily = 'monospace';
    element.innerHTML += msg + '<br />';
}


var modelIO = Object.freeze({
	toJSON: toJSON,
	sampleObj: sampleObj,
	sampleJSON: sampleJSON,
	printToPage: printToPage
});

// The Animator runs the Model's step() and draw() methods.

// Because not all models have the same animator requirements, we build a class
// for customization by the programmer.  See these URLs for more info:
// * [JavaScript timers docs](
//    https://developer.mozilla.org/en-US/docs/JavaScript/Timers)
// * [Using timers & requestAnimationFrame together](http://goo.gl/ymEEX)

class Animator {
    // Create initial animator for the model, specifying rate (fps) and
    // multiStep. Called by Model during initialization, use setRate to modify.
    // If multiStep, run the draw() and step() methods separately by
    // draw() using requestAnimationFrame and step() using setTimeout.
    constructor(model, rate = 60, multiStep = false) {
        Object.assign(this, { model, rate, multiStep });
        this.reset();
    }
    // Adjust animator. Call before model.start()
    // in setup() to change default settings
    setRate(rate, multiStep = false) {
        Object.assign(this, { rate, multiStep });
        this.resetTimes();
    }
    // start/stop model, called by Model.
    // Often used for debugging and resetting model.
    start() {
        if (!this.stopped) return // avoid multiple starts
        this.resetTimes();
        this.stopped = false;
        this.animate();
    }
    stop() {
        this.stopped = true;
        if (this.animHandle) cancelAnimationFrame(this.animHandle);
        if (this.timeoutHandle) clearTimeout(this.timeoutHandle);
        this.animHandle = this.timeoutHandle = null;
    }
    // Internal utility: reset time instance variables
    resetTimes() {
        this.startMS = this.now();
        this.startTick = this.ticks;
        this.startDraw = this.draws;
    }
    // Reset used by model.reset when resetting model.
    reset() {
        this.stop();
        this.ticks = this.draws = 0;
    }
    // Two handlers used by animation loop
    step() {
        this.ticks++;
        this.model.step();
    }
    draw() {
        this.draws++;
        this.model.draw();
    }
    // step and draw the model once
    once() {
        this.step();
        this.draw();
    }
    // Get current time, with high resolution timer if available
    now() {
        return performance.now()
    }
    // Time in ms since starting animator
    ms() {
        return this.now() - this.startMS
    }
    // Get ticks/draws per second. They will differ if multiStep.
    ticksPerSec() {
        const dt = this.ticks - this.startTick;
        return dt === 0 ? 0 : Math.round(dt * 1000 / this.ms()) // avoid divide by 0
    }
    drawsPerSec() {
        const dt = this.draws - this.startDraw;
        return dt === 0 ? 0 : Math.round(dt * 1000 / this.ms())
    }
    get fps() {
        return Math.max(this.drawsPerSec(), this.ticksPerSec())
    }
    // Return a status string for debugging and logging performance
    toString() {
        return `ticks: ${this.ticks}, draws: ${this.draws}, rate: ${
            this.rate
        } tps/dps: ${this.ticksPerSec()}/${this.drawsPerSec()}`
    }
    // Animation via setTimeout and requestAnimationFrame.
    // Arrow functions are required for callbacks for lexical scope.
    animateSteps() {
        this.step();
        if (!this.stopped) {
            this.timeoutHandle = setTimeout(() => this.animateSteps(), 10);
        }
    }
    animateDraws() {
        if (this.drawsPerSec() < this.rate) {
            // throttle drawing to @rate
            if (!this.multiStep) this.step();
            this.draw();
        }
        if (!this.stopped) {
            this.animHandle = requestAnimationFrame(() => this.animateDraws());
        }
    }
    // Called once by start() to get animateSteps & animateDraws iterating.
    animate() {
        if (this.multiStep) this.animateSteps();
        this.animateDraws();
    }
}

// A general color module, supporting css string colors, canvas2d pixel
// colors, webgl and canvas2d Uint8ClampedArray r,g,b,a arrays.
// Notice a JavaScript Array is **not** a color!

// import util from '../node_modules/as-core/src/util.js'
const Color = {
    // ### CSS Color Strings.

    // CSS colors in HTML are strings, see [Mozillas Color Reference](
    // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value),
    // taking one of 7 forms:
    //
    // * Names: over 140 color case-insensitive names like
    //   Red, Green, CadetBlue, etc.
    // * Hex, short and long form: #0f0, #ff10a0
    // * RGB: rgb(255, 0, 0), rgba(255, 0, 0, 0.5)
    // * HSL: hsl(120, 100%, 50%), hsla(120, 100%, 50%, 0.8)
    //
    // See [this wikipedia article](https://goo.gl/ev8Kw0)
    // on differences between HSL and HSB/HSV.

    // Convert 4 r,g,b,a ints in [0-255] ("a" defaulted to 255) to a
    // css color string. Alpha "a" is converted to float in 0-1 for css string.
    // We use alpha in [0-255] to be compatible with TypedArray conventions.
    rgbaString(r, g, b, a = 255) {
        a = a / 255;
        const a2 = a.toPrecision(2);
        return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a2})`
    },

    // Convert 4 ints, h,s,l,a, h in [0-360], s,l in [0-100]% a in [0-255] to a
    // css color string. Alpha "a" is converted to float in 0-1 for css string.
    //
    // NOTE: h=0 and h=360 are the same, use h in 0-359 for unique colors.
    hslString(h, s, l, a = 255) {
        a = a / 255;
        const a4 = a.toPrecision(4);
        return a === 1
            ? `hsl(${h},${s}%,${l}%)`
            : `hsla(${h},${s}%,${l}%,${a4})`
    },

    // Return a html/css hex color string for an r,g,b opaque color (a=255).
    // Hex strings do not support alpha.
    //
    // Both #nnn and #nnnnnn forms supported.
    // Default is to check for the short hex form.
    hexString(r, g, b, shortOK = true) {
        if (shortOK) {
            const [r0, g0, b0] = [r / 17, g / 17, b / 17];
            if (
                util.isInteger(r0) &&
                util.isInteger(g0) &&
                util.isInteger(b0)
            ) {
                return this.hexShortString(r0, g0, b0)
            }
        }
        return `#${(0x1000000 | (b | (g << 8) | (r << 16)))
            .toString(16)
            .slice(-6)}`
    },
    // Return the 4 char short version of a hex color.  Each of the r,g,b values
    // must be in [0-15].  The resulting color will be equivalent
    // to `r*17`, `g*17`, `b*17`, resulting in the 16 values:
    //
    //     0, 17, 34, 51, 68, 85, 102, 119, 136, 153, 170, 187, 204, 221, 238, 255
    //
    // This is equivalent util.aIntRamp(0,255,16), i.e. 16 values per rgb channel.
    hexShortString(r, g, b) {
        if (r > 15 || g > 15 || b > 15) {
            throw Error(`hexShortString: one of ${[r, g, b]} > 15`)
        }
        return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
    },

    // Tristring is a hybrid string and is our standard.  It returns:
    //
    // * rgbaString if a not 255 (i.e. not opaque)
    // * hexString otherwise
    // * with the hexShortString if appropriate
    triString(r, g, b, a = 255) {
        return a === 255
            ? this.hexString(r, g, b, true)
            : this.rgbaString(r, g, b, a)
    },

    // ### CSS String Conversions

    // Return 4 element array given any legal CSS string color.
    //
    // Because strings vary widely: CadetBlue, #0f0, rgb(255,0,0),
    // hsl(120,100%,50%), we do not parse strings, instead we let
    // the browser do our work: we fill a 1x1 canvas with the css string color,
    // returning the r,g,b,a canvas ImageData TypedArray.

    // The shared 1x1 canvas 2D context.
    sharedCtx1x1: util.createCtx(1, 1), // share across calls.
    // Convert any css string to 4 element Uint8ClampedArray TypedArray.
    // If you need a JavaScript Array, use `new Array(...TypedArray)`
    stringToUint8s(string) {
        this.sharedCtx1x1.clearRect(0, 0, 1, 1);
        this.sharedCtx1x1.fillStyle = string;
        this.sharedCtx1x1.fillRect(0, 0, 1, 1);
        return this.sharedCtx1x1.getImageData(0, 0, 1, 1).data
    },

    // ### Typed Color
    // A Color is a 4 element Uint8ClampedArray, with two properties:
    //
    // * pixelArray: A single element Uint32Array view on the Uint8ClampedArray
    // * string: an optional, lazy evaluated, css color string.
    //
    // This provides a universal color, good for canvas2d pixels, webgl & image
    // TypedArrays, and css/canvas2d strings.

    // Create Color from r,g,b,a. Use `toColor()` below for strings etc.
    color(r, g, b, a = 255) {
        const u8array = new Uint8ClampedArray([r, g, b, a]);
        u8array.pixelArray = new Uint32Array(u8array.buffer); // one element array
        // Make this an instance of ColorProto
        Object.setPrototypeOf(u8array, ColorProto);
        return u8array
    },
    isColor(color) {
        return (
            color && color.constructor === Uint8ClampedArray && color.pixelArray
        )
    },
    // Create a Color from a css string, pixel, JavaScript or Typed Array.
    // Returns `any` if is Color already. Useful for
    // ```
    // css: `toColor('#ff0a00')`
    // hsl: `toColor('hsl(200,100%,50%)')`
    // named colors: `toColor('CadetBlue')`
    // pixels: `toColor(4294945280)`
    // JavaScript Arrays: `toColor([255,0,0])`
    // ```
    toColor(any) {
        if (this.isColor(any)) return any
        const tc = this.color(0, 0, 0, 0);
        if (util.isInteger(any)) {
            tc.setPixel(any);
        } else if (typeof any === 'string') {
            tc.setCss(any);
        } else if (Array.isArray(any) || util.isUintArray(any)) {
            tc.setColor(...any);
        } else if (util.isFloatArray(any)) {
            tc.setWebgl(any);
        } else {
            throw Error('toColor: invalid argument', any)
        }
        return tc
    },
    // Return a random rgb Color, a=255
    randomColor() {
        const r255 = () => util.randomInt(256); // random int in [0,255]
        return this.color(r255(), r255(), r255())
    },
    // A static transparent color, set at end of file
    // transparent: null
};

// Prototype for Color. Getters/setters for usability, may be slower.
const ColorProto = {
    // Inherit from Uint8ClampedArray
    __proto__: Uint8ClampedArray.prototype,

    // Set the Color to new rgba values.
    setColor(r, g, b, a = 255) {
        this.checkColorChange();
        this[0] = r;
        this[1] = g;
        this[2] = b;
        this[3] = a;
    },
    // No real need for getColor, it *is* the typed Uint8 array
    set rgb(rgbaArray) {
        this.setColor(...rgbaArray);
    },
    get rgb() {
        return this
    },

    // Set the Color to a new pixel value
    setPixel(pixel) {
        this.checkColorChange();
        this.pixelArray[0] = pixel;
    },
    // Get the pixel value
    getPixel() {
        return this.pixelArray[0]
    },
    get pixel() {
        return this.getPixel()
    },
    set pixel(pixel) {
        this.setPixel(pixel);
    },

    // Set pixel/rgba values to equivalent of the css string.
    // 'red', '#f00', 'ff0000', 'rgb(255,0,0)', etc.
    //
    // Does *not* set the chached this.string, which will be lazily evaluated
    // to its common triString by getCss(). The above would all return '#f00'.
    setCss(string) {
        return this.setColor(...Color.stringToUint8s(string))
    },
    // Return the triString for this Color, cached in the @string value
    getCss() {
        if (this.string == null) this.string = Color.triString(...this);
        return this.string
    },
    get css() {
        return this.getCss()
    },
    set css(string) {
        this.setCss(string);
    },

    // Note: webgl colors are 3 RGB floats (no A) if A is 255.
    setWebgl(floatArray) {
        this.setColor(
            // OK if float * 255 non-int, setColor stores into uint8 array
            floatArray[0] * 255,
            floatArray[1] * 255,
            floatArray[2] * 255,
            floatArray.length === 4 ? floatArray[3] * 255 : undefined
        );
    },
    getWebgl() {
        if (this.floatArray == null) {
            const floats = [this[0] / 255, this[1] / 255, this[2] / 255];
            if (this[3] !== 255) floats.push(this[3] / 255);
            this.floatArray = new Float32Array(floats);
        }
        return this.floatArray
    },
    get webgl() {
        return this.getWebgl()
    },
    set webgl(floatArray) {
        this.setWebgl(floatArray);
    },

    // Housekeeping when the color is modified.
    checkColorChange() {
        // Reset string & webgl on color change.
        this.string = null; // will be lazy evaluated via getCss.
        this.floatArray = null;
    },
    // Return true if color is same value as myself, comparing pixels
    equals(color) {
        return this.getPixel() === color.getPixel()
    },
    toString() {
        return `[${Array.from(this).toString()}]`
    },
    // Return a [distance metric](
    // http://www.compuphase.com/cmetric.htm) between two colors.
    // Max distance is roughly 765 (3*255), for black & white.
    // For our purposes, omitting the sqrt will not effect our results
    rgbDistance(r, g, b) {
        const [r1, g1, b1] = this;
        const rMean = Math.round((r1 + r) / 2);
        const [dr, dg, db] = [r1 - r, g1 - g, b1 - b];
        const [dr2, dg2, db2] = [dr * dr, dg * dg, db * db];
        const distanceSq =
            (((512 + rMean) * dr2) >> 8) +
            4 * dg2 +
            (((767 - rMean) * db2) >> 8);
        return distanceSq // Math.sqrt(distanceSq)
    },
};

// A colormap is simply an array of typedColors with several utilities such
// as randomColor, closestColor etc.
// This allows the colors to be simple integer indices
// into the Array. They are also designed to be webgl-ready, being a
// GLSL "Uniform" variable TypedArray for colors.

// import util from '../node_modules/as-core/src/util.js'
const ColorMap = {
    // ### Color Array Utilities
    // Several utilities for creating color arrays

    // ### Gradients

    // Ask the browser to use the canvas gradient feature
    // to create nColors given the gradient color stops and locs.
    // See Mozilla [Gradient Doc](
    // https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient),
    //
    // This is a powerful browser feature, can be
    // used to create all the MatLab colormaps.
    //
    // Stops are css strings or rgba arrays.
    // Locs are floats from 0-1, default is equally spaced.
    gradientImageData(nColors, stops, locs) {
        // Convert the color stops to css strings
        stops = stops.map(c => (Array.isArray(c) ? Color.rgbaString(...c) : c));
        const ctx = util.createCtx(nColors, 1);
        // Install default locs if none provide
        if (!locs) locs = util.aRamp(0, 1, stops.length);
        // Create a new gradient and fill it with the color stops
        const grad = ctx.createLinearGradient(0, 0, nColors, 0);
        util.repeat(stops.length, i => grad.addColorStop(locs[i], stops[i]));
        // Draw the gradient, returning the image data TypedArray
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, nColors, 1);
        return util.ctxImageData(ctx).data
    },

    // ### Array Conversion Utilities

    // Convert a Uint8Array into Array of 4 element typedColors.
    // Useful for converting ImageData objects like gradients to colormaps.
    // WebGL ready: the array.typedArray is suitable for Uniforms.
    typedArraytoColors(typedArray) {
        const array = [];
        util.step(
            typedArray.length,
            4,
            // Note: can't share subarray as color's typed array:
            // it's buffer is for entire array, not just subarray.
            i => array.push(Color.color(...typedArray.subarray(i, i + 4)))
        );
        array.typedArray = typedArray;
        return array
    },
    // Convert an Array of Arrays to an Array of typedColors.
    // Webgl ready as above.
    arraysToColors(array) {
        const typedArray = new Uint8ClampedArray(array.length * 4);
        util.repeat(array.length, i => {
            const a = array[i];
            if (a.length === 3) a.push(255);
            typedArray.set(a, i * 4);
        });
        return this.typedArraytoColors(typedArray)
    },

    // Permute the values of 3 arrays. Ex:
    //
    // [1,2],[3],[4,5] -> [ [1,3,4],[1,3,5],[2,3,4],[2,3,5] ]
    permuteArrays(A1, A2 = A1, A3 = A1) {
        const array = [];
        for (const a3 of A3) {
            // sorta odd const works with ths, but...
            for (const a2 of A2) for (const a1 of A1) array.push([a1, a2, a3]);
        }
        return array
    },
    // Use permuteArrays to create uniformly spaced color ramp permutation.
    // Ex: if numRs is 3, permuteArrays's A1 would be [0, 127, 255]
    permuteRGBColors(numRs, numGs = numRs, numBs = numRs) {
        const toRamp = num => util.aIntRamp(0, 255, num);
        const ramps = [numRs, numGs, numBs].map(toRamp);
        return this.permuteArrays(...ramps)
    },

    // ### ColorMaps

    // ColorMaps are Arrays of TypedColors with these additional methods. Webgl
    // ready if made w/ `typedArraytoColors` or `arraysToColors` above.
    // Used to be memory effecent (shared colors), webgl compatible,  and for
    // MatLab-like color-as-data.
    ColorMapProto: {
        // Inherit from Array
        __proto__: Array.prototype,
        // Create a [sparse array](https://goo.gl/lQlq5k) of index[pixel] = pixel.
        // Used by indexOf below for exact match of a color within the colormap.
        createIndex() {
            this.index = [];
            util.repeat(this.length, i => {
                const px = this[i].getPixel();
                this.index[px] = i;
                if (this.cssNames) this.index[this.cssNames[i]] = i;
            });
        },
        // Return a random index into the colormap array
        randomIndex() {
            return util.randomInt(this.length)
        },
        // Return a random color within the colormap
        randomColor() {
            return this[this.randomIndex()]
        },
        // Return the index of a typedColor within the colormap,
        // undefined if no exact match.
        // Use the `closest` methods below for nearest, not exact, match.
        indexOf(color) {
            if (this.index) return this.index[color.getPixel()]
            for (let i = 0; i < this.length; i++) {
                if (color.equals(this[i])) return i
            }
            return undefined
        },
        // Return color scaled by number within [min, max].
        // A linear interpolation (util.lerp) in [0, length-1].
        // Used to match data directly to a color as in MatLab.
        //
        // Ex: scaleColor(25, 0, 50) returns the color in the middle of the colormap
        scaleColor(number, min, max) {
            number = util.clamp(number, min, max);
            const scale = util.lerpScale(number, min, max);
            const index = Math.round(util.lerp(0, this.length - 1, scale));
            return this[index]
        },
        // Return the Uint8 array used to create the typedColors,
        // undefined if not webgl ready.
        webglArray() {
            return this.typedArray
        },

        // Debugging: Return a string with length and array of colors
        toString() {
            return `${this.length} ${util.arraysToString(this)}`
        },

        // Iterate through the colormap colors, returning the index of the
        // min typedColor.rgbDistance value from r, g, b
        rgbClosestIndex(r, g, b) {
            let minDist = Infinity;
            let ixMin = 0;
            for (var i = 0; i < this.length; i++) {
                const d = this[i].rgbDistance(r, g, b);
                if (d < minDist) {
                    minDist = d;
                    ixMin = i;
                    if (d === 0) return ixMin
                }
            }
            return ixMin
        },
        // Return the color with the rgbClosestIndex value
        rgbClosestColor(r, g, b) {
            return this[this.rgbClosestIndex(r, g, b)]
        },

        // Calculate the closest cube index for the given r, g, b values.
        // Faster than rgbClosestIndex, does direct calculation, not iteration.
        cubeClosestIndex(r, g, b) {
            const cube = this.cube;
            const rgbSteps = cube.map(c => 255 / (c - 1));
            const rgbLocs = [r, g, b].map((c, i) => Math.round(c / rgbSteps[i]));
            const [rLoc, gLoc, bLoc] = rgbLocs;
            return rLoc + gLoc * cube[0] + bLoc * cube[0] * cube[1]
        },
        cubeClosestColor(r, g, b) {
            return this[this.cubeClosestIndex(r, g, b)]
        },

        // Choose the appropriate method for finding closest index.
        // Lets the user specify any color, and let the colormap
        // use the best match.
        closestIndex(r, g, b) {
            return this.cube
                ? this.cubeClosestIndex(r, g, b)
                : this.rgbClosestIndex(r, g, b)
        },
        // Choose the appropriate method for finding closest color
        closestColor(r, g, b) {
            return this[this.closestIndex(r, g, b)]
        },
    },

    // ### Utilities for constructing ColorMaps

    // Convert an array of rgb(a) Arrays or TypedColors to a webgl-ready colormap.
    basicColorMap(colors) {
        colors = this.arraysToColors(colors);
        Object.setPrototypeOf(colors, this.ColorMapProto);
        return colors
    },
    // Create a gray map (gray: r=g=b)
    // These are typically 256 entries but can be smaller
    // by passing a size parameter and the min/max range.
    grayColorMap(min = 0, max = 255, size = max - min + 1) {
        const ramp = util.aIntRamp(min, max, size);
        return this.basicColorMap(ramp.map(i => [i, i, i]))
    },

    // Create a colormap by permuted rgb values.
    //
    // numRs, numGs, numBs are numbers, the number of steps beteen 0-255.
    // Ex: numRs = 3, corresponds to 0, 128, 255.
    // NOTE: the defaults: rgbColorCube(6) creates a `6 * 6 * 6` cube.
    rgbColorCube(numRs, numGs = numRs, numBs = numRs) {
        const array = this.permuteRGBColors(numRs, numGs, numBs);
        const map = this.basicColorMap(array);
        // Save the parameters for fast color calculations.
        map.cube = [numRs, numGs, numBs];
        return map
    },
    // Create a colormap by permuting the values of the given arrays.
    // Similar to above but with arrays that may have arbitrary values.
    rgbColorMap(R, G, B) {
        const array = this.permuteArrays(R, G, B);
        return this.basicColorMap(array)
    },

    // Create an hsl map, inputs are arrays to be permutted like rgbColorMap.
    // Convert the HSL values to Color.colors, default to bright hue ramp (L=50).
    hslColorMap(H, S = [100], L = [50]) {
        const hslArray = this.permuteArrays(H, S, L);
        const array = hslArray.map(a => Color.toColor(Color.hslString(...a)));
        return this.basicColorMap(array)
    },

    // Use gradient to build an rgba array, then convert to colormap.
    // Stops are css strings or rgba arrays.
    // locs defaults to evenly spaced, probably what you want.
    //
    // This easily creates all the MatLab colormaps like "jet" below.
    gradientColorMap(nColors, stops, locs) {
        const uint8arrays = this.gradientImageData(nColors, stops, locs);
        const typedColors = this.typedArraytoColors(uint8arrays);
        Object.setPrototypeOf(typedColors, this.ColorMapProto);
        return typedColors
    },
    // The most popular MatLab gradient, "jet":
    jetColors: [
        [0, 0, 127],
        [0, 0, 255],
        [0, 127, 255],
        [0, 255, 255],
        [127, 255, 127],
        [255, 255, 0],
        [255, 127, 0],
        [255, 0, 0],
        [127, 0, 0],
    ],
    // Two other popular MatLab 'ramp' gradients are:
    // * One color: from black/white to color, optionally back to white/black.
    // stops = ['black', 'red'] or ['white', 'orange', 'black']
    // The NetLogo map is a concatenation of 14 of these.
    // * Two colors: stops = ['red', 'orange'] (blends the tow, center is white)

    // The 16 unique [CSS Color Names](https://goo.gl/sxo36X), case insensitive.
    // Aqua == Cyan and Fuchsia == Magenta, 18 total color names.
    // These sorted by hue/saturation/light, hue in 0-300 degrees.
    // In CSS 2.1, the color 'orange' was added to the 16 colors as a 17th color
    // See [Mozilla Color Docs](https://goo.gl/tolSnS) for *lots* more!
    basicColorNames: 'white silver gray black red maroon yellow orange olive lime green cyan teal blue navy magenta purple'.split(
        ' '
    ),
    // Create a named colors colormap
    cssColorMap(cssArray, createNameIndex = false) {
        const array = cssArray.map(str => Color.stringToUint8s(str));
        const map = this.basicColorMap(array);
        map.cssNames = cssArray;
        // REMIND: kinda tacky? Maybe map.name.yellow? Maybe generalize for other
        // map types: map.closest(name)
        if (createNameIndex) {
            cssArray.forEach((name, ix) => {
                map[name] = map[ix];
            });
            if (map.cyan) map.aqua = map.cyan;
            if (map.magenta) map.fuchsia = map.magenta;
        }
        return map
    },

    // ### Shared Global ColorMaps

    // The shared global colormaps are lazy evaluated to minimize memory use.
    LazyMap(name, map) {
        Object.defineProperty(this, name, { value: map, enumerable: true });
        return map
    },
    get Gray() {
        return this.LazyMap('Gray', this.grayColorMap())
    },
    get LightGray() {
        return this.LazyMap('LightGray', this.grayColorMap(200))
    },
    get DarkGray() {
        return this.LazyMap('DarkGray', this.grayColorMap(0, 100))
    },
    get Jet() {
        return this.LazyMap('Jet', this.gradientColorMap(256, this.jetColors))
    },
    get Rgb256() {
        return this.LazyMap('Rgb256', this.rgbColorCube(8, 8, 4))
    },
    get Rgb() {
        return this.LazyMap('Rgb', this.rgbColorCube(16))
    },
    get Basic16() {
        // 17 unique + 2 "aliases" = 19 names. "16" historic
        return this.LazyMap(
            'Basic16',
            this.cssColorMap(this.basicColorNames, true)
        )
    },
};

// import util from '../node_modules/as-core/src/util.js'
// import CoreLink from '../node_modules/as-core/src/Link.js'

class Link$1 extends Link {
    static defaultVariables() {
        // Instance variables.
        return {
            typedColor: null, // A Color.color, converted by getter/setters below
        }
    }
    // Initialize a Link
    constructor() {
        super();
        Object.assign(this, Link$1.defaultVariables());
    }

    // Use typedColor as the real color. Amazingly enough, setdefaults
    // of 'color' ends up calling setter, thus making typedColor the default name.
    // Whew!
    setColor(color) {
        const typedColor = Color.toColor(color); // Convert to Color.color
        const fixedColor = this.links.renderer.fixedColor; // Model set to Color.color
        if (fixedColor && !typedColor.equals(fixedColor)) {
            util.warn(
                `links.setColor: fixedColor != color ${fixedColor.toString()}`
            );
        } else {
            this.typedColor = typedColor;
        }
    }
    getColor() {
        return this.typedColor
    }
    set color(color) {
        this.setColor(color);
    }
    get color() {
        return this.getColor()
    }
    // color prop can be used by *must* be Color.colors
}

// import CoreLinks from '../node_modules/as-core/src/Links.js'

// Links are a collection of all the Link objects between turtles.
// class Links extends AgentSet {
class Links$1 extends Links {
    // Use AgentSeet ctor: constructor (model, AgentClass, name)

    create(from, to, initFcn) {
        const links = super.create(from, to, initFcn);
        links.forEach(link => {
            if (!link.color) link.color = this.model.randomColor();
        });
        return links
    }

    // REMIND: Test that agentarray returned.
    test() {
        console.log(this.map(link => link.id));
    }
}

// import util from '../node_modules/as-core/src/util.js'
// import CorePatches from '../node_modules/as-core/src/Patches.js'
// See CorePatches for the patches architecture
class Patches$1 extends Patches {
    constructor(model, AgentClass, name) {
        super(model, AgentClass, name);

        // Skip if a breedSet (don't rebuild patches!).
        if (this.isBreedSet()) return

        this.setPixels();
    }
    // Setup pixels ctx used for patch.color: `draw` and `importColors`
    setPixels() {
        const { numX, numY } = this.model.world;
        this.pixels = {
            ctx: util.createCtx(numX, numY),
        };
        this.setImageData();
    }
    // Create the pixels object used by `setPixels` and `installColors`
    setImageData() {
        const pixels = this.pixels;
        pixels.imageData = util.ctxImageData(pixels.ctx);
        pixels.data8 = pixels.imageData.data;
        pixels.data = new Uint32Array(pixels.data8.buffer);
    }

    setDefault(name, value) {
        if (name === 'color') {
            this.ask(p => {
                p.setColor(value);
            });
            util.logOnce(
                'patches.setDefault(color, value): color default not supported. Clearing to value'
            );
        } else {
            super.setDefault(name, value);
        }
    }

    installPixels() {
        const pixels = this.pixels;
        pixels.ctx.putImageData(pixels.imageData, 0, 0);
        return pixels
    }
    importColors(imageSrc) {
        util.imagePromise(imageSrc).then(img => this.installColors(img));
    }
    // Direct install image into the patch colors, not async.
    installColors(img) {
        util.fillCtxWithImage(this.pixels.ctx, img);
        this.setImageData();
    }

    scaleColors(colorMap, variable, min, max) {
        this.ask(p => {
            p.setColor(colorMap.scaleColor(p[variable], min, max));
        });
    }

    // REMIND: Test that agentarray returned.
    test() {
        console.log(this.map(patch => patch.id));
    }
}

// import CorePatch from '../node_modules/as-core/src/Patch.js'

// See CorePatch for how patches are "flyweight" patterns.
class Patch$1 extends Patch {
    // No ctor, use super.

    // Manage colors by directly setting pixels in Patches pixels object.
    // With getter/setters, slight performance hit but worth it!
    setColor(color) {
        this.patches.pixels.data[this.id] = Color.toColor(color).getPixel();
    }
    // Optimization: If shared color provided, sharedColor is modified and
    // returned. Otherwise new color returned.
    getColor(sharedColor = null) {
        const pixel = this.patches.pixels.data[this.id];
        if (sharedColor) {
            sharedColor.pixel = pixel;
            return sharedColor
        }
        return Color.toColor(pixel)
    }
    get color() {
        return this.getColor()
    }
    set color(color) {
        this.setColor(color);
    }
}

// See CoreTurtles for architecture
class Turtles$1 extends Turtles {
    // Use CoreTurtle's ctor:
    // constructor (model, AgentClass, name) {
    create(num = 1, initFcn = turtle => {}) {
        return util.repeat(num, (i, a) => {
            const turtle = this.addAgent();
            // REMIND: not if default exists
            turtle.theta = util.randomFloat(Math.PI * 2);
            initFcn(turtle);
            if (!turtle.color) turtle.color = this.model.randomColor();
            a.push(turtle); // Return array of new agents. REMIND: should be agentarray?
        })
    }
    test() {
        console.log(this.map(turtle => turtle.id));
    }
}

// import util from '../node_modules/as-core/src/util.js'
// import CoreTurtle from '../node_modules/as-core/src/Turtle.js'
// Flyweight object creation, see Patch/Patches.

// Class Turtle instances represent the dynamic, behavioral element of modeling.
// Each turtle knows the patch it is on, and interacts with that and other
// patches, as well as other turtles.

// class Turtle {
class Turtle$1 extends Turtle {
    static defaultVariables() {
        return {
            // Core variables for turtles. Not 'own' variables.
            size: 1,
            sprite: null,
            typedColor: null,
            typedStrokeColor: null,
            shapeFcn: 'default',
        }
    }
    // Initialize a Turtle given its Turtles AgentSet.
    constructor() {
        super();
        Object.assign(this, Turtle$1.defaultVariables());
    }

    // Create my sprite via shape: sprite, fcn, string, or image/canvas
    setSprite(sprite = null) {
        if (sprite) {
            this.sprite = sprite;
        } else {
            let { shape, color, strokeColor } = this;
            const needsStroke = shape.slice(-1) === '2';
            shape = shape || 'default';
            color = color || this.model.randomColor();
            strokeColor = needsStroke
                ? strokeColor || this.model.randomColor()
                : null;
            this.sprite = this.model.spriteSheet.newSprite(
                shape,
                color,
                strokeColor
            );
        }
        return this.sprite
    }
    checkSprite() {
        if (!this.turtles.renderer.useSprites) return
        if (this.turtles.settingDefault(this)) {
            const {
                shape,
                typedColor: color,
                typedStrokeColor: strokeColor,
            } = this;
            const needsStroke = shape.slice(-1) === '2';
            const ready = shape && color && (!needsStroke || strokeColor);
            if (ready) {
                this.sprite = this.model.spriteSheet.newSprite(
                    shape,
                    color,
                    strokeColor
                );
            }
        } else {
            this.sprite = null;
        }
    }
    setSize(size) {
        this.size = size;
    } // * this.model.world.patchSize }

    setColor(color) {
        const typedColor = Color.toColor(color); // Convert to Color.color
        const fixedColor = this.turtles.renderer.fixedColor; // Is a Color.color
        if (fixedColor) {
            util.warn(`turtle.setColor: fixedColor ${fixedColor.toString()}`);
        } else {
            // will set default color or instance color (if not fixed etc)
            this.typedColor = typedColor;
        }
        this.checkSprite();
    }
    getColor() {
        return this.sprite ? this.sprite.color : this.typedColor
    }
    set color(color) {
        this.setColor(color);
    }
    get color() {
        return this.getColor()
    }

    setStrokeColor(color) {
        const typedColor = Color.toColor(color); // Convert to Color.color
        const fixedColor = this.turtles.renderer.fixedColor; // Model set to Color.color
        if (fixedColor) {
            util.warn(
                `turtle.setStrokeColor: fixedColor ${fixedColor.toString()}`
            );
        } else {
            // will set default color or instance color
            this.typedStrokeColor = typedColor;
        }
        this.checkSprite();
    }
    getStrokeColor() {
        return this.sprite ? this.sprite.strokeColor : this.typedStrokeColor
    }
    set strokdColor(color) {
        this.setStrokeColor(color);
    }
    get strokdColor() {
        return this.getStrokeColor()
    }

    setShape(shape) {
        const fixedShape = this.turtles.renderer.fixedShape;
        if (fixedShape) util.warn(`turtle.setShape: fixedShape ${fixedShape}`);
        else this.shapeFcn = shape;
        this.checkSprite();
    }
    getShape() {
        return this.sprite ? this.sprite.src : this.shapeFcn
    }
    set shape(shape) {
        this.setShape(shape);
    }
    get shape() {
        return this.getShape()
    }
}

// import util from '../node_modules/as-core/src/util.js'
// Sprites are images/drawings within a sprite-sheet.
class SpriteSheet {
    constructor(spriteSize = 64, spritesPerRow = 16, usePowerOf2 = true) {
        Object.assign(this, { spriteSize, cols: spritesPerRow, usePowerOf2 });
        this.rows = 1;
        this.nextCol = 0;
        this.nextRow = 0;
        this.sprites = {};
        this.paths = Object.assign({}, paths); // installPaths()
        if (usePowerOf2) this.checkPowerOf2();
        this.ctx = util.createCtx(this.width, this.height);
        this.texture = null; // THREE use optional
    }

    // getters for derived values.
    // width & height in pixels
    get width() {
        return this.spriteSize * this.cols
    }
    get height() {
        return this.spriteSize * this.rows
    }
    // next col, row in pixels
    get nextX() {
        return this.spriteSize * this.nextCol
    }
    get nextY() {
        return this.spriteSize * this.nextRow
    }
    // id = number of sprites
    get id() {
        return Object.keys(this.sprites).length
    }

    // REMIND: this is a place holder for deleting sheet and it's sprites.
    // Non-trivial.
    clear() {
        Object.assign(this.ctx.canvas, {
            width: this.width,
            height: this.spriteSize,
        });
    }

    // Return a sprite. Create it if not in sprites cache.
    // Src can be: image, canvas, function name, function.
    // If src is a canvas, it must have a src string w/o / or . chars.
    // If src is function or name of path below, colors can be css
    // or Color module's Color object.
    newSprite(src, color, strokeColor) {
        const isImage = util.isImageable(src);
        if (isImage && !color) color = 'red';

        // Normalize color names to Color.color objects
        if (color) color = Color.toColor(color);
        if (strokeColor) strokeColor = Color.toColor(strokeColor);

        // create a normalized name:
        const name = this.spriteName(src, color, strokeColor);
        // If sprite of ths name already exists, return it.
        if (this.sprites[name]) return this.sprites[name]

        // Make a new sprite.
        const sprite = isImage
            ? this.addImage(src)
            : this.addDrawing(src, color, strokeColor);
        Object.assign(sprite, { src, color, strokeColor });
        // Object.assign(sprite, {src, color, strokeColor, needsUpdate: false})

        // Add normalized colors and shape name to new sprite.
        // if (color) {
        //   sprite.color = color
        //   if (strokeColor) sprite.strokeColor = strokeColor
        //   sprite.shape = name.replace(/#.*/, '') // drop #xxxxxx from name
        // }

        // Add sprite to cache and return it.
        this.sprites[name] = sprite;
        return sprite
    }

    // Install a new named function in the paths object below.
    // Used to add "car", "thug", "spider" etc drawings.
    // installDrawing (fcn, name = fcn.name) { this.paths[name] = fcn }
    installDrawFcn(fcn, name = fcn.name) {
        this.paths[name] = fcn;
    }

    // These are internal, experts only, use newSprite above for normal use.

    // Make a unique, normalized sprite name. See note on src, colors above.
    // Color names are hex css formats, see newSprite's name transformation.
    spriteName(src, fillColor, strokeColor) {
        let name;
        // If src is an image, construct a name.
        if (util.isImageable(src)) {
            name = src.src;
            name = name.replace(/^.*\//, ''); // remove path
            name = name.replace(/\..*/, '.img'); // replace .png/jpg/.. w/ ".img"
        } else {
            // ditto for draw function or name of function in paths obj below
            name = src.name || src;
            if (!name.endsWith('2')) strokeColor = null;
            const fillName = fillColor.css;
            const strokeName = strokeColor ? strokeColor.css : '';
            name = `${name}${fillName}${strokeName}`;
        }
        return name
    }

    // Add an image/canvas to sprite sheet.
    addImage(img) {
        this.checkSheetSize(); // Resize ctx if nextRow === rows
        const [x, y, size] = [this.nextX, this.nextY, this.spriteSize];
        this.ctx.drawImage(img, x, y, size, size);
        const id = this.id; // Object.keys(this.sprites).length
        const { nextRow: row, nextCol: col } = this;
        const sprite = { id, x, y, row, col, size, sheet: this };
        sprite.uvs = this.getUVs(sprite);
        this.incrementRowCol();
        if (this.texture) this.texture.needsUpdate = true;
        return sprite
    }
    // Use above to add a drawing to sprite sheet
    addDrawing(drawFcn, fillColor, strokeColor, useHelpers = true) {
        const img = this.createFcnCanvas(
            drawFcn,
            fillColor,
            strokeColor,
            useHelpers
        );
        return this.addImage(img) // return sprite
    }

    // Return random sprite from sheet
    oneOf () {
        return util.oneValOf(this.sprites)
    }
    // Resize ctx if too small for next row/col
    checkSheetSize() {
        if (this.nextRow === this.rows) {
            // this.nextCol should be 0
            this.rows = this.usePowerOf2 ? this.rows * 2 : this.rows + 1;
            util.resizeCtx(this.ctx, this.width, this.height);
            // Recalculate existing sprite uvs.
            util.forEach(this.sprites, sprite => {
                sprite.uvs = this.getUVs(sprite);
            });
        }
    }
    // Advance nextCol/Row. Done after checkSheetSize enlarged ctx if needed.
    incrementRowCol() {
        this.nextCol += 1;
        if (this.nextCol < this.cols) return
        this.nextCol = 0;
        this.nextRow += 1;
    }

    // Create a sprite image. See [Drawing shapes with canvas](https://goo.gl/uBwxMq)
    //
    // The drawFcn args: drawFcn(ctx).
    // The ctx fill & stroke styles are pre-filled w/ fillColor, strokeColor.
    //
    // If useHelpers:
    // - Transform to -1 -> +1 coords
    // - drawFcn is surrounded with ctx beginPath & closePath, fill fcns.
    //
    // If not using helpers, ctx.canvas.width/height is the size of drawing,
    // top/left canvas coordinates.
    createFcnCanvas(drawFcn, fillColor, strokeColor, useHelpers = true) {
        const ctx = util.createCtx(this.spriteSize, this.spriteSize);
        ctx.fillStyle = fillColor.css || fillColor;
        if (strokeColor) ctx.strokeStyle = strokeColor.css || strokeColor;
        if (useHelpers) {
            ctx.scale(this.spriteSize / 2, this.spriteSize / 2);
            ctx.translate(1, 1);
            ctx.beginPath();
        }

        if (util.isString(drawFcn)) {
            this.paths[drawFcn](ctx);
        } else {
            drawFcn(ctx);
        }

        if (useHelpers) {
            ctx.closePath();
            ctx.fill();
        }

        const name = drawFcn.name || drawFcn;
        ctx.canvas.src = `${name}${fillColor}`;
        return ctx.canvas
    }

    // Return standard agentscript quad:
    //      3   2
    //      -----
    //      |  /|
    //      | / |
    //      |/  |
    //      -----
    //      0   1
    // I.e. botLeft, botRight, topRight, topLeft
    // getUVs (sprite) {
    //   const {row, col} = sprite
    //   const {rows, cols} = this
    //   const x0 = col / cols
    //   const y0 = row / rows
    //   const x1 = (col + 1) / cols
    //   const y1 = (row + 1) / rows
    //   // return [[x0, y1], [x1, y1], [x1, y0], [x0, y0]]
    //   return [x0, y1, x1, y1, x1, y0, x0, y0]
    // }
    getUVs(sprite) {
        // note v's are measured from the bottom.
        const { row, col } = sprite;
        const { rows, cols } = this;
        const u0 = col / cols;
        const v0 = (rows - (row + 1)) / rows;
        const u1 = (col + 1) / cols;
        const v1 = (rows - row) / rows;
        // return [[x0, y1], [x1, y1], [x1, y0], [x0, y0]]
        return [u0, v0, u1, v0, u1, v1, u0, v1]
    }
    // Return uv's object: {topLeft, topRight, botLeft, botRight}
    // getUVsObj (sprite) { // REMIND
    //   const uvs = this.getUVs
    //   return {
    //     botLeft: uvs[0],
    //     botRight: uvs[1],
    //     topRight: uvs[2],
    //     topLeft: uvs[3]
    //   }
    // }

    checkPowerOf2() {
        const { width, height } = this;
        if (!(util.isPowerOf2(width) && util.isPowerOf2(height))) {
            throw Error(`SpriteSheet non power of 2: ${width}x${height}`)
        }
    }
}

const paths = {
    poly(ctx, points) {
        points.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
        });
    },
    default(ctx) {
        this.dart(ctx);
    },
    arrow(ctx) {
        this.poly(ctx, [
            [1, 0],
            [0, 1],
            [0, 0.4],
            [-1, 0.4],
            [-1, -0.4],
            [0, -0.4],
            [0, -1],
        ]);
    },
    bug(ctx) {
        ctx.strokeStyle = ctx.fillStyle;
        this.bug2(ctx);
    },
    bug2(ctx) {
        ctx.lineWidth = 0.1;
        this.poly(ctx, [[0.8, 0.45], [0.4, 0], [0.8, -0.45]]);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0.24, 0, 0.26, 0, 2 * Math.PI);
        ctx.arc(-0.1, 0, 0.26, 0, 2 * Math.PI);
        ctx.arc(-0.54, 0, 0.4, 0, 2 * Math.PI);
    },
    circle(ctx) {
        ctx.arc(0, 0, 1, 0, 2 * Math.PI);
    },
    dart(ctx) {
        this.poly(ctx, [[1, 0], [-1, 0.8], [-0.5, 0], [-1, -0.8]]);
    },
    frame(ctx) {
        const inset = 0.4;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.fill();
        ctx.clearRect(-1 + inset, -1 + inset, 2 - 2 * inset, 2 - 2 * inset);
    },
    frame2(ctx) {
        const inset = 0.4;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.fill();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(-1 + inset, -1 + inset, 2 - 2 * inset, 2 - 2 * inset);
    },
    // person (ctx) {
    //   this.poly(ctx, [ [0.3, -0.4], [0.6, 0], [0.25, 0.2], [0.25, -0.1],
    //   [0.2, 0.3], [0.5, 1], [0.1, 1], [0, 0.5],
    //   [-0.1, 1], [-0.5, 1], [-0.2, 0.3], [-0.25, -0.1],
    //   [-0.25, 0.2], [-0.6, 0], [-0.3, -0.4]])
    //   ctx.closePath()
    //   ctx.arc(0, -0.7, 0.3, 0, 2 * Math.PI)
    // },
    person(ctx) {
        ctx.strokeStyle = ctx.fillStyle;
        this.person2(ctx);
    },
    person2(ctx) {
        this.poly(ctx, [
            [0.3, -0.4],
            [0.6, 0],
            [0.25, 0.2],
            [0.25, -0.1],
            [0.2, 0.3],
            [0.5, 1],
            [0.1, 1],
            [0, 0.5],
            [-0.1, 1],
            [-0.5, 1],
            [-0.2, 0.3],
            [-0.25, -0.1],
            [-0.25, 0.2],
            [-0.6, 0],
            [-0.3, -0.4],
        ]);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.arc(0, -0.7, 0.3, 0, 2 * Math.PI);
    },
    ring(ctx) {
        // transparent
        const [rOuter, rInner] = [1, 0.6];
        ctx.arc(0, 0, rOuter, 0, 2 * Math.PI, false);
        ctx.lineTo(rInner, 0);
        ctx.arc(0, 0, rInner, 0, 2 * Math.PI, true);
    },
    ring2(ctx) {
        // fileStyle is outer color, strokeStyle inner color
        const [rOuter, rInner] = [1, 0.6];
        ctx.arc(0, 0, rOuter, 0, 2 * Math.PI); // x, y, r, ang0, ang1, cclockwise
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.arc(0, 0, rInner, 0, 2 * Math.PI); // x, y, r, ang0, ang1, cclockwise
    },
    square(ctx) {
        ctx.fillRect(-1, -1, 2, 2);
    },
    triangle(ctx) {
        this.poly(ctx, [[1, 0], [-1, -0.8], [-1, 0.8]]);
    },
};

// Meshes used by the Three.js view module

// Utility classes meant to be subclassed:

// ============= BaseMesh =============
// An abstract class for all Meshes. It needs the particular Three.js
// instance to allow for differences in models on the same page.
class BaseMesh {
    // static options(): https://goo.gl/sKdxoY
    constructor(view, options = this.constructor.options()) {
        const { scene, model } = view;
        Object.assign(this, { scene, model, view, options });
        this.mesh = null;
        this.name = this.constructor.name;
        this.fixedColor = options.color;
        this.fixedSize = options.pointSize;
        this.fixedShape =
            this.name === 'PatchesMesh'
                ? 'Patch'
                : this.name === 'PointsMesh'
                    ? 'Point'
                    : this.name === 'LinksMesh'
                        ? 'Link'
                        : undefined;
        this.useSprites = this.name.match(/sprites/i) != null;
        // BaseMesh,
        // CanvasMesh,
        // PatchesMesh,
        // QuadSpritesMesh,
        // PointsMesh,
        // LinksMesh
    }
    dispose() {
        if (!this.mesh) return
        if (this.mesh.parent !== this.scene) {
            console.log('mesh parent not scene');
        }
        this.mesh.parent.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        if (this.mesh.material.map) this.mesh.material.map.dispose();
    }
    init() {
        throw Error('init is abstract, must be overriden')
    }
    update() {
        throw Error('update is abstract, must be overriden')
    }

    // Utilities
    createQuad(r, z = 0) {
        // r is radius of xy quad: [-r,+r], z is quad z
        const vertices = [-r, -r, z, r, -r, z, r, r, z, -r, r, z];
        const indices = [0, 1, 2, 0, 2, 3];
        return { vertices, indices }
    }
    get spriteSheetTexture() {
        if (!this.model.spriteSheet.texture) {
            const texture = new THREE.CanvasTexture(
                this.model.spriteSheet.ctx.canvas
            );
            this.model.spriteSheet.texture = texture;
        }
        return this.model.spriteSheet.texture
    }
}

// ============= CanvasMesh =============

class CanvasMesh extends BaseMesh {
    init(canvas) {
        if (this.mesh) this.dispose();
        const { textureOptions, z } = this.options;
        Object.assign(this, { canvas, z, textureOptions });
        // const {width, height, numX, numY, centerX, centerY, patchSize} = this.model.world
        const { width, height, numX, numY, centerX, centerY } = this.model.world;
        const patchSize = 1; // REMIND

        const texture = new THREE.CanvasTexture(canvas);
        for (const key in textureOptions) {
            texture[key] = THREE[textureOptions[key]];
        }

        const geometry = new THREE.PlaneGeometry(width, height, numX, numY);
        geometry.translate(centerX * patchSize, centerY * patchSize, 0);

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            shading: THREE.FlatShading,
            side: THREE.DoubleSide,
            transparent: true,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.z = z;
        this.scene.add(this.mesh);
    }
    update() {
        // REMIND: have canvas owner set a flag
        this.mesh.material.map.needsUpdate = true;
    }
}

// Several classes for patches, turtles, links, etc.

// ============= DrawingMesh =============

// Drawing meshes are a form of Canvas Mesh


// ============= PatchesMesh =============

// Patch meshes are a form of Canvas Mesh
class PatchesMesh extends CanvasMesh {
    static options() {
        return {
            textureOptions: {
                minFilter: 'NearestFilter',
                magFilter: 'NearestFilter',
            },
            z: 1.0,
        }
    }
    init(patches) {
        // REMIND: pass in patches instead of canvas
        super.init(patches.pixels.ctx.canvas);
    }
    update(patches) {
        patches.installPixels();
        super.update();
    }
}

// ============= QuadSpritesMesh =============

class QuadSpritesMesh extends BaseMesh {
    static options() {
        return {
            z: 2.0,
        }
    }
    constructor(view, options) {
        super(view, options);
        this.unitQuad = this.createQuad(0.5, 0);
    }
    init() {
        if (this.mesh) this.dispose();
        const texture = this.spriteSheetTexture;

        const vertices = new Float32Array();
        const uvs = new Float32Array();
        const indices = new Uint32Array();
        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute(
            'position',
            new THREE.BufferAttribute(vertices, 3)
        );
        geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.z = this.options.z;
        this.scene.add(this.mesh);
    }
    // update takes any array of objects with x,y,z,size,sprite .. position & uvs
    // REMIND: optimize by flags for position/uvs need updates
    update(turtles) {
        const mesh = this.mesh;
        const { vertices, indices } = this.unitQuad;
        // const patchSize = this.model.world.patchSize
        const patchSize = 1; // REMIND
        const positionAttrib = mesh.geometry.getAttribute('position');
        const uvAttrib = mesh.geometry.getAttribute('uv');
        const indexAttrib = mesh.geometry.getIndex();
        const positions = new Float32Array(vertices.length * turtles.length);
        const uvs = [];
        const indexes = [];

        for (let i = 0; i < turtles.length; i++) {
            const turtle = turtles[i];
            // if (turtle.sprite.needsUpdate) turtle.setSprite()
            if (!turtle.sprite) turtle.setSprite();
            const size = turtle.size; // * patchSize
            const theta = turtle.theta;
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            const offset = i * vertices.length;

            for (let j = 0; j < vertices.length; j = j + 3) {
                const x0 = vertices[j];
                const y0 = vertices[j + 1];
                const x = turtle.x; // * patchSize
                const y = turtle.y; // * patchSize
                positions[j + offset] =
                    (size * (x0 * cos - y0 * sin) + x) * patchSize;
                positions[j + offset + 1] =
                    (size * (x0 * sin + y0 * cos) + y) * patchSize;
                positions[j + offset + 2] = turtle.z * patchSize;
            }
            indexes.push(...indices.map(ix => ix + i * 4)); // 4
            uvs.push(...turtle.sprite.uvs);
        }
        positionAttrib.setArray(positions);
        positionAttrib.needsUpdate = true;
        uvAttrib.setArray(new Float32Array(uvs));
        uvAttrib.needsUpdate = true;
        indexAttrib.setArray(new Uint32Array(indexes));
        indexAttrib.needsUpdate = true;
    }
}

// ============= PointsMesh =============

class PointsMesh extends BaseMesh {
    static options() {
        return {
            pointSize: 1,
            color: null,
            z: 2.0,
        }
    }
    init() {
        if (this.mesh) this.dispose();
        // const pointSize = this.options.pointSize * this.model.world.patchSize
        const pointSize = this.options.pointSize; // REMIND
        const color = this.options.color
            ? new THREE.Color(...this.options.color)
            : null;

        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(), 3)
        );
        if (color == null) {
            geometry.addAttribute(
                'color',
                new THREE.BufferAttribute(new Float32Array(), 3)
            );
        }

        const material = color
            ? new THREE.PointsMaterial({ size: pointSize, color: color })
            : new THREE.PointsMaterial({
                  size: pointSize,
                  vertexColors: THREE.VertexColors,
              });

        this.mesh = new THREE.Points(geometry, material);
        this.mesh.position.z = this.options.z;
        this.scene.add(this.mesh);
    }
    // update takes any array of objects with x,y,z,color .. position & color
    // If non-null color passed to init, only x,y,z .. position used
    // REMIND: optimize by flags for position/uvs need updates
    update(turtles) {
        const positionAttrib = this.mesh.geometry.getAttribute('position');
        // const positionBuff = positionAttrib.array
        const colorAttrib = this.mesh.geometry.getAttribute('color');
        const vertices = [];
        const colors = colorAttrib == null ? null : [];
        // const patchSize = this.model.world.patchSize
        const patchSize = 1; // REMIND

        // const red = [1, 0, 0] // REMIND: add color/shape to turtles

        for (let i = 0; i < turtles.length; i++) {
            const { x, y, z, color } = turtles[i];
            vertices.push(x * patchSize, y * patchSize, z * patchSize);
            // if (colors != null) colors.push(...red)
            if (colors != null) colors.push(...color.webgl);
        }
        positionAttrib.setArray(new Float32Array(vertices));
        positionAttrib.needsUpdate = true;
        if (colors) {
            colorAttrib.setArray(new Float32Array(colors));
            colorAttrib.needsUpdate = true;
        }
    }
}

// ============= LinksMesh =============

class LinksMesh extends BaseMesh {
    static options() {
        return {
            color: null,
            z: 1.5,
        }
    }
    init() {
        if (this.mesh) this.dispose();
        const color = this.options.color
            ? new THREE.Color(...this.options.color)
            : null;

        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(), 3)
        );
        if (color == null) {
            geometry.addAttribute(
                'color',
                new THREE.BufferAttribute(new Float32Array(), 3)
            );
        }

        const material = color
            ? new THREE.LineBasicMaterial({ color: color })
            : new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
        // const material = color
        // ? new THREE.PointsMaterial({size: pointSize, color: color})
        // : new THREE.PointsMaterial({size: pointSize, vertexColors: THREE.VertexColors})

        this.mesh = new THREE.LineSegments(geometry, material);
        this.mesh.position.z = this.options.z;
        this.scene.add(this.mesh);
    }
    // update takes any array of objects with color & end0, end1 having x,y,z
    // REMIND: optimize by flags for position/uvs need updates
    update(links) {
        const vertices = [];
        const colors = this.options.color ? null : [];
        for (let i = 0; i < links.length; i++) {
            const { end0, end1, color } = links[i];
            const { x: x0, y: y0, z: z0 } = end0;
            const { x: x1, y: y1, z: z1 } = end1;
            // const ps = this.model.world.patchSize
            const ps = 1; // REMIND
            vertices.push(x0 * ps, y0 * ps, z0 * ps, x1 * ps, y1 * ps, z1 * ps);
            if (colors) colors.push(...color.webgl, ...color.webgl);
        }
        const positionAttrib = this.mesh.geometry.getAttribute('position');
        positionAttrib.setArray(new Float32Array(vertices));
        positionAttrib.needsUpdate = true;
        if (colors) {
            const colorAttrib = this.mesh.geometry.getAttribute('color');
            colorAttrib.setArray(new Float32Array(colors));
            colorAttrib.needsUpdate = true;
        }
    }
}

var ThreeMeshes = {
    BaseMesh,
    CanvasMesh,
    PatchesMesh,
    QuadSpritesMesh,
    PointsMesh,
    LinksMesh,
}

// import SpriteSheet from './SpriteSheet.js'
// import util from '../node_modules/as-core/src/util.js'
// import Stats from '../dist/stats.wrapper.js'
// import dat from '../dist/dat.gui.wrapper.js'

// window.Meshes = Meshes // REMIND

class ThreeView {
    static defaultOptions(useThreeHelpers = true, useUIHelpers = true) {
        const options = {
            // include me in options so Model can instanciate me!
            Renderer: ThreeView, // REMIND: use string.
            orthoView: false, // 'Perspective', 'Orthographic'
            clearColor: 0x000000, // clear to black
            useAxes: useThreeHelpers, // show x,y,z axes
            useGrid: useThreeHelpers, // show x,y plane
            useControls: useThreeHelpers, // navigation. REMIND: control name?
            spriteSize: 64,
            // useStats: useUIHelpers, // show fps widget
            // useGUI: useUIHelpers, // activate dat.gui UI
            patches: {
                meshClass: 'PatchesMesh',
            },
            turtles: {
                meshClass: 'QuadSpritesMesh',
            },
            links: {
                meshClass: 'LinksMesh',
            },
        };
        // util.forEach(options.meshes, (val, key) => {
        //   const Mesh = ThreeMeshes[val.meshClass]
        //   const meshOptions = Mesh.options()
        //   val.options = meshOptions
        // })
        util.forEach(options, (val, key) => {
            if (val.meshClass) {
                const Mesh = ThreeMeshes[val.meshClass];
                const meshOptions = Mesh.options();
                val.options = meshOptions;
            }
        });

        return options
    }
    static printMeshOptions() {
        const obj = {};
        for (const MeshName in ThreeMeshes) {
            const optionsFcn = ThreeMeshes[MeshName].options;
            if (optionsFcn) {
                obj[MeshName] = {
                    options: ThreeMeshes[MeshName].options(),
                };
            }
        }
        const str = util.objectToString(obj);
        console.log(str);
    }

    constructor(model, options = {}) {
        this.model = model;
        // this.spriteSheet = model.spriteSheet // REMIND: Temp

        // Initialize options
        Object.assign(this, ThreeMeshes.defaultOptions); // install defaults
        Object.assign(this, options); // override defaults
        if (this.Renderer !== ThreeView) {
            throw Error('ThreeView ctor: Renderer not ThreeView', this.renderer)
        }

        // Initialize Three.js
        this.initThree();
        this.initThreeHelpers();
    }
    // Init Three.js core: scene, camera, renderer
    initThree() {
        const { clientWidth, clientHeight } = this.model.div;
        const { orthoView, clearColor } = this;
        // const {width, height, centerX, centerY} = this.model.world
        const { width, height } = this.model.world;
        const [halfW, halfH] = [width / 2, height / 2];

        // this.spriteSheet.texture = new THREE.CanvasTexture(this.spriteSheet.ctx)
        // this.spriteSheet.setTexture(THREE.CanvasTexture)

        // REMIND: need world.minZ/maxZ
        const orthographicCam = new THREE.OrthographicCamera(
            -halfW,
            halfW,
            halfH,
            -halfH,
            1,
            20 * width
        );
        orthographicCam.position.set(0, 0, 10 * width);
        orthographicCam.up.set(0, 0, 1);

        const perspectiveCam = new THREE.PerspectiveCamera(
            45,
            clientWidth / clientHeight,
            1,
            10000
        );
        // perspectiveCam.position.set(width + centerX, -width - centerY, width)
        perspectiveCam.position.set(width, -width, width);
        // perspectiveCam.lookAt(new THREE.Vector3(centerX, centerY, 0))
        perspectiveCam.up.set(0, 0, 1);

        const scene = new THREE.Scene();
        // scene.position = new THREE.Vector3(centerX, centerY, 0)
        const camera = orthoView ? orthographicCam : perspectiveCam;

        // if (orthoView)
        //   camera.position.set(0, 0, 100 * width)
        // else
        //   camera.position.set(width, -width, width)
        // camera.up.set(0, 0, 1)

        const renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(clientWidth, clientHeight);
        renderer.setClearColor(clearColor);
        this.model.div.appendChild(renderer.domElement);

        // window.addEventListener('resize', () => {
        //   const {clientWidth, clientHeight} = this.model.div
        //   camera.aspect = clientWidth / clientHeight
        //   camera.updateProjectionMatrix()
        //   renderer.setSize(clientWidth, clientHeight)
        // })
        window.addEventListener('resize', () => {
            this.resize();
        });

        Object.assign(this, {
            scene,
            camera,
            renderer,
            orthographicCam,
            perspectiveCam,
        });
    }
    resize() {
        const { clientWidth, clientHeight } = this.model.div;
        const { width, height } = this.model.world;

        if (this.orthoView) {
            const zoom = Math.min(clientWidth / width, clientHeight / height);
            this.renderer.setSize(zoom * width, zoom * height);
        } else {
            this.camera.aspect = clientWidth / clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(clientWidth, clientHeight);
        }
    }
    toggleCamera() {
        this.orthoView = !this.orthoView;
        if (this.orthoView) {
            this.camera = this.orthographicCam;
        } else {
            this.camera = this.perspectiveCam;
        }
        this.resize();
    }
    // Return a dataURL for the current model step.
    snapshot(useOrtho = true) {
        // Don't set camera, can change w/ toggle below
        const { scene, renderer, model } = this;
        const toggle = useOrtho && this.camera === this.perspectiveCam;

        if (toggle) {
            this.toggleCamera();
            model.draw(true);
        }
        renderer.render(scene, this.camera);
        const durl = renderer.domElement.toDataURL();
        if (toggle) this.toggleCamera();
        return durl
    }
    initThreeHelpers() {
        const { scene, renderer, camera } = this;
        // const {useAxes, useGrid, useControls, useStats, useGUI} = this
        const { useAxes, useGrid, useControls } = this;
        const { width } = this.model.world;
        const helpers = {};

        if (useAxes) {
            helpers.axes = new THREE.AxisHelper(1.5 * width / 2);
            scene.add(helpers.axes);
        }
        if (useGrid) {
            helpers.grid = new THREE.GridHelper(1.25 * width, 10);
            helpers.grid.rotation.x = THREE.Math.degToRad(90);
            scene.add(helpers.grid);
        }
        if (useControls) {
            helpers.controls = new THREE.OrbitControls(
                camera,
                renderer.domElement
            );
        }
        // if (useStats) {
        //   helpers.stats = new Stats()
        //   // This does not work: helpers.stats.dom.style.position = 'absolute'
        //   document.body.appendChild(helpers.stats.dom)
        // }
        // if (useGUI) {
        //   helpers.gui = new dat.GUI() // auto adds to body, appendChild not needed
        // }

        Object.assign(this, helpers);
    }
}

// import World from '../node_modules/as-core/src/World.js'
// import util from '../node_modules/as-core/src/util.js'
// import {util} from '../agentscript/agentscript.esm.js'
// import CoreModel from '../node_modules/as-core/src/Model.js'

// Class Model is the primary interface for modelers, integrating
// all the parts of a model. It also contains NetLogo's `observer` methods.
// class Model {
class Model$1 extends Model {
    // Static class methods for default settings.
    // Default world is centered, patchSize = 13, min/max = 16
    static defaultWorld(maxX, maxY) {
        return super.defaultWorld(maxX, maxY)
    }
    // Default renderer is ThreeView.js
    static defaultRenderer() {
        return ThreeView.defaultOptions()
    }
    static printDefaultViewOptions() {
        ThreeView.printMeshOptions();
    }

    // The Model constructor takes a DOM div and model and renderer options.
    // Default values are given for all constructor arguments.
    constructor(
        div = document.body,
        worldOptions = Model$1.defaultWorld(),
        rendererOptions = Model$1.defaultRenderer()
    ) {
        // Super ctor sets worldOptions, world, patches, turtles, links
        // Tricky: dependes on resetModel duplicated in this name space.
        super(worldOptions);
        this.div = util.isString(div) ? document.getElementById(div) : div;
        this.renderOptions = rendererOptions;
        this.anim = new Animator(this);

        // Default colormap. Change this to another if you'd prefer.
        this.colorMap = ColorMap.Basic16;

        // View setup.
        this.spriteSheet = new SpriteSheet(rendererOptions.spriteSize);
        // Initialize view
        this.view = new rendererOptions.Renderer(this, rendererOptions);
        // Initialize meshes.
        this.meshes = {};
        util.forEach(rendererOptions, (val, key) => {
            if (val.meshClass) {
                const Mesh = ThreeMeshes[val.meshClass];
                const options = Mesh.options(); // default options
                Object.assign(options, val.options); // override by user's
                if (options.color) {
                    // convert options.color rgb array to Color.
                    options.color = Color.toColor(
                        new Float32Array(options.color)
                    );
                }
                this.meshes[key] = new ThreeMeshes[val.meshClass](
                    this.view,
                    options
                );
            }
        });

        // Initialize model calling `startup`, `reset` .. which calls `setup`.
        // this.modelReady = false
        // this.startup().then(() => {
        //   // this.reset(); this.setup(); this.modelReady = true
        //   this.reset(); this.modelReady = true
        // })
        this.resetView(); // REMIND: Temporary
    }

    initAgentRenderer(agentset) {
        const mesh = this.meshes[agentset.name];
        agentset.renderer = mesh;
        if (mesh.fixedColor) agentset.setDefault('color', mesh.fixedColor);
        // REMIND: Turtles only?
        if (mesh.fixedShape) agentset.setDefault('shape', mesh.fixedShape);
        mesh.init(agentset);
    }
    // Duplicate core.resetModel. Called by core's ctor.
    // Can't use core's because imported Patches etc, are view versions
    // thus need to be in this module's scope. A bit odd.
    resetModel() {
        this.world = new World(this.worldOptions);
        // Base AgentSets setup here. Breeds handled by setup
        this.initAgentSet('patches', Patches$1, Patch$1);
        this.initAgentSet('turtles', Turtles$1, Turtle$1);
        this.initAgentSet('links', Links$1, Link$1);
    }
    resetView() {
        this.anim.reset();
        this.refreshLinks = this.refreshTurtles = this.refreshPatches = true;

        // Breeds handled by setup
        this.initAgentRenderer(this.patches);
        this.initAgentRenderer(this.turtles);
        this.initAgentRenderer(this.links);
    }
    reset() {
        this.resetModel();
        this.resetView();
    }

    randomColor() {
        return this.colorMap.randomColor()
    }

    // ### User Model Creation
    // A user's model is made by subclassing Model and over-riding
    // 2 CoreAS abstract methods: setup, step.
    // start, stop, once required: CoreAS has no animator.

    // setup () {} // Your initialization code goes here
    // step () {} // called each step of the animation

    // Start/stop the animation. Return model for chaining.
    start() {
        this.anim.start();
        return this
    }
    stop() {
        this.anim.stop();
    }
    // Animate once by `step(); draw()`.
    once() {
        this.stop();
        this.anim.once();
    } // stop is no-op if already stopped

    draw(force = this.anim.stopped || this.anim.draws === 1) {
        // const {scene, camera} = this.view
        if (this.div) {
            if (force || this.refreshPatches) {
                if (this.patches.length > 0) {
                    this.patches.renderer.update(this.patches);
                }
            }
            if (force || this.refreshTurtles) {
                if (this.turtles.length > 0) {
                    this.turtles.renderer.update(this.turtles);
                }
            }
            if (force || this.refreshLinks) {
                if (this.links.length > 0) {
                    this.links.renderer.update(this.links);
                }
            }

            // REMIND: generalize.
            this.view.renderer.render(this.view.scene, this.view.camera);
        }
        // if (this.view.stats) this.view.stats.update()
    }

    // Breeds: create breeds/subarrays of Patches, Agents, Links
    // Unlike resetModel(), it can use CoreAS's; the baseSets
    // have used this module's Patch, Patches, ...
}

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
// See: [this gist](https://gist.github.com/branneman/fc66785c082099298955)
// and [this post](http://www.jacklmoore.com/notes/mouse-position/) and others.
class Mouse {
    // Create and start mouse obj, args: a model, and a callback method.
    constructor(element, world, callback = null) {
        // this.handleMouseDown = this.handleMouseDown.bind(this)
        // this.handleMouseUp = this.handleMouseUp.bind(this)
        // this.handleMouseMove = this.handleMouseMove.bind(this)
        // this.model = model
        // [this.minXcor, this.maxYcor] = model.world
        // this.callback = callback
        // this.div = this.model.div

        Object.assign(this, { element, world, callback });

        // instance event handlers: arrow fcns to insure "this" is us.
        this.mouseDown = e => this.handleMouseDown(e);
        this.mouseUp = e => this.handleMouseUp(e);
        this.mouseMove = e => this.handleMouseMove(e);

        // this.start()
    }

    // Start/stop the mouseListeners.  Note that NetLogo's model is to have
    // mouse move events always on, rather than starting/stopping them
    // on mouse down/up.  We may want do make that optional, using the
    // more standard down/up enabling move events.
    resetParams() {
        this.xCor = this.yCor = NaN;
        this.moved = this.down = false;
    }
    start() {
        // Note: multiple calls safe
        this.element.addEventListener('mousedown', this.mouseDown);
        document.body.addEventListener('mouseup', this.mouseUp);
        this.element.addEventListener('mousemove', this.mouseMove);
        this.resetParams();
        return this // chaining
    }
    stop() {
        // Note: multiple calls safe
        this.element.removeEventListener('mousedown', this.mouseDown);
        document.body.removeEventListener('mouseup', this.mouseUp);
        this.element.removeEventListener('mousemove', this.mouseMove);
        this.resetParams();
        return this // chaining
    }

    // Handlers for eventListeners
    generalHandler(e, down, moved) {
        this.down = down;
        this.moved = moved;
        this.setXY(e);
        if (this.callback != null) {
            this.callback(e);
        }
    }
    handleMouseDown(e) {
        this.action = 'down';
        this.generalHandler(e, true, false);
    }
    handleMouseUp(e) {
        this.action = 'up';
        this.generalHandler(e, false, false);
    }
    handleMouseMove(e) {
        this.action = this.down ? 'drag' : 'move';
        this.generalHandler(e, this.down, true);
    }

    // set x, y to be event location in patch coordinates.
    setXY(e) {
        const rect = this.element.getBoundingClientRect();
        const pixX = e.clientX - rect.left;
        const pixY = e.clientY - rect.top;
        // return this.pixelXYtoPatchXY(pixX, pixY)
        // const xy = this.pixelXYtoPatchXY(pixX, pixY)
        // [this.xCor, this.yCor] = xy // this.pixelXYtoPatchXY(pixX, pixY)
        Object.assign(this, this.pixelXYtoPatchXY(pixX, pixY));
    }

    patchSize() {
        const { numX, numY } = this.world;
        const { clientWidth: width, clientHeight: height } = this.element;
        const xSize = width / numX;
        const ySize = height / numY;
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
        const patchSize = this.patchSize();
        const { minXcor, maxYcor } = this.world;
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

// import AgentArray      from '../node_modules/as-core/src/AgentArray.js'
// import AgentSet        from '../node_modules/as-core/src/AgentSet.js'
// import DataSet         from '../node_modules/as-core/src/DataSet.js'
// import RGBDataSet      from '../node_modules/as-core/src/RGBDataSet.js'
// import World           from '../node_modules/as-core/src/World.js'
// import util            from '../node_modules/as-core/src/util.js'

export { AgentArray, AgentSet, Animator, Color, ColorMap, DataSet, Link$1 as Link, Links$1 as Links, Model$1 as Model, Mouse, Patch$1 as Patch, Patches$1 as Patches, RGBDataSet, SpriteSheet, ThreeView, ThreeMeshes, Turtle$1 as Turtle, Turtles$1 as Turtles, World, util };

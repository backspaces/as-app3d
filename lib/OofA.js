'use strict';

System.register(['./util.js'], function (_export, _context) {
  var util;
  return {
    setters: [function (_utilJs) {
      util = _utilJs.default;
    }],
    execute: function () {

      // OofA = Object of Arrays.
      //
      // Generally arrays of objects (AofO) are used for homogeneous data instances.
      //
      // OofA is an alternative that uses a single Object who's values represent  a
      // single variable's values. This quirky idea is usefull for drasticly reduced
      // memory footprint, and for being WebGL-friendly.
      //
      // This is an experimental module implementing OofA as a class

      class OofA {
        // The constructor has three parameters:
        //
        // * specs: Define the Object's data arrays.
        // The arrays can be TypedArrays, standard JavaScript Arrays, or constants.
        // * initSize: the initial size used for [TypedArrays](https://goo.gl/3OOQzy)
        // * sizeDelta: how much to grow the TypedArrays when they overflow.
        // Use zero for static arrays
        constructor(arraySpecs, initSize = 100, deltaSize = 100) {
          // arraySpec details: Three forms are used.
          //
          // The "key" is the name of the array. The values are brackets specifying
          // formats for the Object's arrays.
          // * key: [value, 0] - name is a constant value, not an array of values.
          // * key: [arrayType, 1] - key is a simple array of given type.
          //   A shortcut is key: arrayType .. w/o the brackets.
          // * key: [arrayType, num] - name is an Array of TypedArrays of num elements
          //   arrayType has to be a typed array. If Array is to contain arrays,
          //   they should be array objects of size num, not num elements from array.

          this.length = 0;
          this.size = 0;
          this.specs = {};
          this.arrayNames = []; // experiment, may not need
          this.defaultNames = [];
          // convert arraySpecs arrays to {Type, elements} objects
          for (const key in arraySpecs) {
            let val = arraySpecs[key];
            if (util.typeOf(val) === 'function') val = [val, 1];
            const [Type, elements] = val;
            this.specs[key] = { Type, elements };

            if (elements === 0) // experiment, may not need
              this.defaultNames.push(key);else this.arrayNames.push(key);
          }
          this.initSize = initSize;
          this.deltaSize = deltaSize;
          this.arrays = {};
          this.initArrays(this.specs);
          this.sharedGetterSetter = this.createGetterSetter();
        }
        initArrays(specs) {
          const arrays = this.arrays;
          for (const key in specs) {
            const val = specs[key];
            const { Type, elements } = val; // type caps: a ctor

            if (Type === Array && elements > 1) util.error('OofA: JavaScript Arrays must have "elements" 0 or 1');

            if (elements === 0) arrays[key] = Type;else if (Type === Array || elements === 1) arrays[key] = new Type(0);else {
              arrays[key] = [];arrays[key].typedArray = new Type(0);
            }
          }
          this.extendArrays(this.initSize);
        }

        // Extend an Array of TypedArrays.
        // Two arrays are used:
        // * An Array of subarrays of the typed array
        // * A typed array, array.typedArray, of size elements * size
        extendArrayOfTypedArrays(array, elements, deltaSize) {
          array.typedArray = this.extendTypedArray(array.typedArray, deltaSize * elements);
          for (let i = array.length, len = i + deltaSize; i < len; i++) {
            const start = i * elements;
            const end = start + elements;
            array[i] = array.typedArray.subarray(start, end);
          }
          // No return needed, array is mutated instead.
        }
        // Extend a typed array, returning the new typed array.
        extendTypedArray(array, deltaSize) {
          const ta = new array.constructor(array.length + deltaSize); // make new array
          ta.set(array); // fill it with old array
          return ta;
        }

        // Grow the typed arrays by deltaSize
        extendArrays(deltaSize) {
          if (deltaSize === 0) util.error('OofA: attempting to extend static arrays');
          for (const key in this.arrays) {
            const { Type, elements } = this.specs[key];
            if (elements === 0) continue; // a 'default', a single element
            const array = this.arrays[key];
            if (Type === Array) array.fill(null, this.size, this.size + deltaSize);else if (elements === 1) this.arrays[key] = this.extendTypedArray(array, deltaSize);else this.extendArrayOfTypedArrays(array, elements, deltaSize);
          }
          this.size += deltaSize;
        }

        // Three ways to access the OofA:
        // * Individual values
        // * All values at a given index
        // * Using an experimental getterSetter
        //
        // It is also just fine to access the arrays via oofa.arrays[key]
        // but will require more care.

        // Get/Set value at ix for a given key. Can be constant or array,
        // NOTE: no error check for ix >= length!
        getValueAt(ix, key) {
          const { elements } = this.specs[key];
          const array = this.arrays[key];
          if (elements === 0) return array;
          return array[ix];
        }
        setValueAt(ix, key, val) {
          const { elements } = this.specs[key];
          const array = this.arrays[key];
          if (elements === 0) this.arrays[key] = val; // set default
          else if (elements === 1) array[ix] = val; // set array element
            else array[ix].set(val); // set a subarray (Array of TypedArrays)
        }

        // Get/Set/push all the values at a given index, ix, as an object.
        // The object uses the OofA keys.
        // This is a "slice" of the OofA as an instance object.
        // Neither get/setObject check for invalid ix >= length.
        // pushObject will extend the arrays.
        getObject(ix, obj = {}) {
          // provide the obj for reuse and reduced gc
          for (const key in this.arrays) obj[key] = this.getValueAt(ix, key);
          return obj;
        }
        setObject(ix, obj) {
          for (const key in obj) this.setValueAt(ix, key, obj[key]);
        }
        pushObject(obj) {
          if (this.length === this.size) this.extendArrays(this.deltaSize);
          this.setObject(this.length++, obj);
        }
        // Iterate over all the "objects" in the OofA.
        // Fcn args:
        // * The object at the current index: in [0, length)
        // * The current index
        forAllObjects(fcn, obj = {}) {
          for (var i = 0, len = this.length; i < len; i++) {
            this.getObject(i, obj);
            fcn(obj, i);
          }
        }

        // An alternative technique for get/set values at a given indes.
        // The getterSetter is an object using an index, ix, and getter/setters
        // for each of the keys in the OofA. This makes the OofA mimic an AofO.
        // At this time, this is quite experimental and appears to be slower than
        // the Object approach.
        createGetterSetter() {
          const obj = { ix: 0 };
          const arrays = this.arrays;
          for (const key in arrays) {
            const { elements } = this.specs[key];
            if (elements === 0) Object.defineProperty(obj, key, {
              get: () => arrays[key],
              set: val => {
                arrays[key] = val;
              }
            });
            if (elements === 1) Object.defineProperty(obj, key, {
              get: () => arrays[key][obj.ix],
              set: val => {
                arrays[key][obj.ix] = val;
              }
            });
            if (elements > 1) Object.defineProperty(obj, key, {
              get: () => arrays[key][obj.ix],
              set: val => arrays[key][obj.ix].set(val, 0, elements)
            });
          }
          return obj;
        }
        // Push obj values onto the end of the arrays. Extend if needed.
        push(obj, getterSetter = this.sharedGetterSetter) {
          if (this.length === this.size) this.extendArrays(this.deltaSize);
          getterSetter.ix = this.length++;
          for (const key in obj) getterSetter[key] = obj[key];
        }
        // Iterate over all the elements via the getterSetter.
        // Fcn args:
        // * The getterSetter with its index set to [0, length)
        // * The current index
        forAll(fcn, getterSetter = this.sharedGetterSetter) {
          for (var i = 0, len = this.length; i < len; i++) {
            getterSetter.ix = i;
            fcn(getterSetter, i);
          }
        }
      }

      _export('default', OofA);
    }
  };
});
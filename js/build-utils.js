'use strict'

const fs = require('graceful-fs');
const json = JSON.parse(fs.readFileSync('package.json'));
const mkdirsSync = require('./mkdirs-sync');
const path = require('path');
const removeSync = require('./rimraf').sync;

const pkgkey = function (key) {
    if (!key) throw new Error('pkgkey called with no argument');
    let val = json[key];
    if (!val) throw new Error(`pkgkey: ${key} not found`);
    if (Array.isArray(val)) val = val.join(' ');

    return val;
}

const mkdirp = function(v) {
    v.split(' ').forEach(el => mkdirsSync(el));
}

const rmrf = function(v) {
    v.split(' ').forEach(el => removeSync(el));
}

const forEachSpace = function(v, fCallback) {
    v.split(' ').forEach(fCallback);
}

module.exports = {
    forEachSpace: forEachSpace,
    mkdirp: mkdirp,
    pkgkey: pkgkey,
    rmrf: rmrf
};

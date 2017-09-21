//  TODO: maybe use gulp or grunt or something
//  TODO: make this package available via npm
//  TODO: refactor to do as many build steps concurrently as possible.

'use strict'

const BUILD     = require('./build-utils');
const butternut = require('butternut');
const { exec }  = require('child_process');
const shell     = require('shelljs');

const sarrMkdirs    = BUILD.pkgkey('mkdirs'),
      sarrLibs      = BUILD.pkgkey('libs');

//  flow mimicks as if you ran `npm run build` so we start with `npm run clean`
BUILD.rmrf(sarrMkdirs);
BUILD.mkdirp(sarrMkdirs);

//  npm run build-libs
BUILD.forEachSpace(sarrLibs, sLib => shell.cp(sLib, 'libs'));
shell.exec('node ./bin/wraplibs.js');

//  npm run build-models
shell.exec('sh ./bin/buildscripts.sh models/src');      // must use bash. on Windows we can use Git Bash

//  npm run build-dist
shell.exec('rollup -c');
shell.cp('src/*', 'dist/AS');
shell.exec('squash dist/AS.js > dist/AS.min.js');
shell.exec('squash dist/AS.module.js > dist/AS.module.min.js');
//  npm run build-docs "cp -Rp `bin/pkgkey.js docsfiles` docs"
shell.cp('docs/README.md', '.');

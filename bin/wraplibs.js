#!/usr/bin/env node
const fs = require('fs')
const { exec } = require('child_process')

const json = JSON.parse(fs.readFileSync('package.json'))
const libs = json.wraplibs

libs.forEach((lib) => {
  const [dir, name] = lib
  const fromPath = dir

  // Oops .. minification broke OrbitControls. squash bug. trying uglify
  // Minify vanilla .js files:
  // if (!dir.endsWith('.min.js')) {
  //   const minPath = dir.replace(/\.js$/, '.min.js')
  //   execSync(`uglifyjs ${dir} -c > ${minPath}`)
  //   fromPath = minPath
  // }

  // const toPath = fromPath.endsWith('.min.js')
  //   ? fromPath.replace(/\.min\.js/, '.wrapper.js').replace('libs/', 'dist/')
  //   : fromPath.replace(/\.js$/, '.wrapper.js').replace('libs/', 'dist/')
  const toPath = fromPath
    .replace(/\.min\.js$/, '.js')
    .replace(/\.js$/, '.wrapper.js')
    .replace('libs/', 'dist/')

  console.log('wraplibs:', fromPath, name, toPath)
  // Run wraplib.
  exec(`node bin/wraplib.js ${fromPath} ${name} > ${toPath}`)       //  TODO: wraplib vs wraplibplus?
})

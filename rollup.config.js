function externals (id) { return id.includes('/dist/') }
function globals (id) {
  const jsNames = {
    'stats.wrapper.js': 'Stats',
    'dat.gui.wrapper.js': 'dat',
    'three.wrapper.js': 'THREE'
  }
  const fileName = id.replace(/^.*\//, '')
  return jsNames[fileName]
}

export default {
  input: 'src/AS.js',
  external: externals,
  output: [
    { file: 'dist/AS.js',
      format: 'iife',
      globals: globals,
      name: 'AS',
      banner: '/* eslint-disable */'
    },
    { file: 'dist/AS.module.js',
      format: 'es',
      banner: '/* eslint-disable */'
    }
  ]
}

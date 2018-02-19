function externals (id) { return id.includes('wrapper') }
function globals (id) {
  const jsNames = {
    // 'stats.wrapper.js': 'Stats',
    // 'dat.gui.wrapper.js': 'dat',
    'three.wrapper.js': 'THREE'
  }
  const fileName = id.replace(/^.*\//, '')
  return jsNames[fileName]
}

export default {
  input: 'src/AS.js',
  external: externals,
  output: [
    { file: 'dist/as-app3d.umd.js',
      format: 'umd',
      globals: globals,
      name: 'ASapp3d',
      banner: '/* eslint-disable */'
    },
    { file: 'dist/as-app3d.esm.js',
      format: 'es',
      banner: '/* eslint-disable */'
    }
  ]
}

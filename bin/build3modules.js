// Convert three "examples" to es6 modules.
// The files to convert are in package.json.threelibs
const fs = require('fs')

const fromPath = 'node_modules/three/examples/js/'
const toPath = 'dist/threelibs/'
const THREEPath = 'dist/three.min.js'

// Each name is a lib/name (w/o.js) pair in THREE's examples/js hierarchy
const threeLibNames = process.env.npm_package_threelibs.split(/ +/)

threeLibNames.forEach(dirNamePair => {
    const [dir, name] = dirNamePair.split('/')
    let code = fs.readFileSync(`${fromPath}${dir}/${name}.js`).toString()
    code = code.replace(new RegExp(`THREE\\.${name}`, 'g'), `${name}`)
    code = code.replace(new RegExp(`${name} *= *`), `const ${name} = `)
    code = `import * as THREE from '${THREEPath}'
${code}
export default ${name}
`
    fs.writeFileSync(`${toPath}${name}.js`, code)
})

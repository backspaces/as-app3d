#!/usr/bin/env node

const shell = require('shelljs')

const paths = shell.ls('models/*.js')

paths.forEach(path => {
    // First create a comma separated list of module names for this path
    const importNames = shell
        // .grep(/^import.*from '\.\.\/src/, path) // get model's ../src import statements
        .grep(/^import.*from '\.\.\//, path) // get model's ../src import statements
        // .sed(/\* as /, '') // import * as foo => import foo
        .sed(/^import *{*/, '') // get the name of the import. Note {util} -> util
        .sed(/}* *from.*$/, ',')
        // .sed(/^import */, '') // get the name of the import
        // .sed(/ .*$/, ',')
        .replace(/\n/g, ' ') // join the multiple names
        .replace(/, *$/, '') // remove final comma
    // .grep(/^import.*from '\./, path) // get local import statements in this path
    // .sed(/^import *{*/, '') // get the name of the import. Note {util} -> util
    // .sed(/}* *from.*$/, ',')
    // // .sed(/} .*$/, ',')
    // .replace(/\n/g, ' ') // join the multiple names
    // .replace(/, *$/, '') // remove final comma

    shell.echo('=====', `${path}: ${importNames}`)

    // Make the one-liner import
    const imports = `import {${importNames}} from '../dist/as-app3d.esm.min.js'`

    // Replace multiple imports with single import.
    // Write results to docs/path
    // const code = shell.grep('-v', /^import.*from '\./, path)
    const code = shell.grep('-v', /^import.*from '\.\.\//, path)
    shell
        .ShellString(
            `${imports}
${code}
`
        )
        .to(`docs/${path}`)
})

shell.cp('models/*.html', 'docs/models')

# as-app3d: AgentScript Three.js App

This is an app or framework for [AgentScript](https://github.com/backspaces/agentscript). AgentScript itself has no View, it is Model only, in a Model/View architecture. Here we add a tightly integrated Three.js View by extending AgentScript via subclassing

Because this contains both a Model and View, as-app3d is more like [NetLogo](https://ccl.northwestern.edu/netlogo/) who's semantics AgentScript is based on.

Note: Our future plan is a suite of several Views which are less tightly bound to AgentScript. The Three version will be as-view3d.

## Dual Build

as-app3d is based on es6 Modules (ESM) which are delivered as two [Rollup](https://rollupjs.org/) bundles:

```
* UMD: as-app3d.umd.js
* ESM: as-app3d.esm.js
```

The UMD can be used in the browser as a `<script>` tag, and in Node using `require()`

The ESM is used in es6 import statements.

Both are available in minified form. All are in the project's `dist/` directory.

The UMD's global name is `ASapp3d`

## NPM Package
as-app3d is available as a npm *scoped* package: @redfish/as-app3d.

To install the package, `yarn add @redfish/as-app3d`. This places the bundles in `node_modules/@redfish/as-app3d/dist`

To use the package as a CDN, use [unpkg.com](https://unpkg.com/).
* UMD: [https://unpkg.com/@redfish/as-app3d](https://unpkg.com/@redfish/as-app3d)
* ESM: [https://unpkg.com/@redfish/as-app3d?module](https://unpkg.com/@redfish/as-app3d?module)

View the unpkg.dashboard: [https://unpkg.com/@redfish/as-app3d/](https://unpkg.com/@redfish/as-app3d/)

## Developer Information

To clone the github repo:
* cd to where you want the as-app3d/ dir to appear.
* git clone https://github.com/backspaces/as-app3d
* cd as-app3d # go to new repo
* yarn install # install all dev dependencies
* yarn build # complete the install

All workflow is npm run scripts.  See package.json's scripts, or use `yarn run` for a list. [JavaScript Standard Style](https://standardjs.com/) is [used](https://github.com/backspaces/as-app3d/blob/master/.eslintrc.json).

## Github Pages

A [gh-page](http://backspaces.github.io/as-app3d/) is used for the site. It contains the dist/ dir and a models/ dir with sample models also used for testing.

It uses [the docs/ simplification](https://help.github.com/articles/user-organization-and-project-pages/#project-pages) for gh-page creation.

The gh-page hosts our sample models. The fire model can be run with:
> http://backspaces.github.io/as-app3d/models?fire

The Github page can be used as a CDN for experimental use:

*   UMD: [https://backspaces.github.io/as-app3d/dist/as-app3d.umd.js](https://backspaces.github.io/agentscript/dist/agentscript.umd.js)
*   ESM: [https://backspaces.github.io/as-app3d/dist/as-app3d.esm.js](https://backspaces.github.io/as-app3d/dist/as-app3d.esm.js)


## Files

Our directory layout is:
```
bin: workflow scripts
dist: the umd and esm bundles with their min.js versions.
docs: gh-page
models: sample models used for tests and demos
src: individual as-app3d es6 modules
test: test files
```

## Models

The models/ dir contains very, _very_ simple models used for testing (via [Puppeteer](https://github.com/GoogleChrome/puppeteer)) and for documentation. For example:

* [Hello World](https://backspaces.github.io/as-app3d/models/?hello): Simple "hello world" model with patches, turtles, links.

All models have a single html file using a query string to specify the model. So the above has https://backspaces.github.io/as-app3d/models/?hello for it's url.

* [ants](https://backspaces.github.io/as-app3d/models/?ants) A simple ant pheromone model.
* [buttons](https://backspaces.github.io/as-app3d/models/?buttons) Stu Kauffman's famous non-linear behavior of random linking of pairs of buttons in a pile.
* [diffuse](https://backspaces.github.io/as-app3d/models/?diffuse) Diffusion of a variable on a patch grid, with two random walker turtles adding to the variable over time.
* [exit](https://backspaces.github.io/as-app3d/models/?exit) Turtles exiting random openings in a surrounding wall.
* [fire](https://backspaces.github.io/as-app3d/models/?fire) A Cellular Automata fire model.
* [flock](https://backspaces.github.io/as-app3d/models/?flock) The classic [Boids](https://en.wikipedia.org/wiki/Boids) flocking model.
* [linktravel](https://backspaces.github.io/as-app3d/models/?linktravel) Turtles traveling on "roads" that are links, randomly choosing the next road at intersections.
* [wallfollower](https://backspaces.github.io/as-app3d/models/?wallfollower) Turtles traversing obstacles via left/right hand rule.
 
## License

Copyright Owen Densmore, RedfishGroup LLC, 2012-2018<br>
as-app3d may be freely distributed under the GPLv3 license:

as-app3d is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program, see LICENSE within the distribution.
If not, see <http://www.gnu.org/licenses/>.

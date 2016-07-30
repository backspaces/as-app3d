import util from 'lib/util.js'

var canvas, ctx

function start () {
  const opts = {patchSize: 4, minX: -64, maxX: 64, minY: -64, maxY: 64}
  worker.postMessage({type: 'setup', value: opts})
  setInterval(function () {
    worker.postMessage({type: 'step'})
    worker.postMessage({type: 'getImgData'})
  }, 30)

  var canvas = document.createElement('canvas')
  canvas.width = 129
  canvas.height = 129
  canvas.style.width = '800px'
  ctx = canvas.getContext('2d')
  util.addToDom(canvas)
}


var worker = new Worker('test/apps/navier-worker.js')

worker.onmessage = (ev) => {
  // console.log('main recieved msg', ev)
  var msg = ev.data
  if (typeof msg === 'object') {
    if (msg.type === 'imgData') {
      ctx.putImageData(msg.value, 0, 0)
    } else if (msg.type) {
      if (msg.type === 'ready') {
        start()
      }
    }
  }
}

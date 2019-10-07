const Y = require('yjs')
require('y-memory')(Y)
require('y-array')(Y)
require('y-text')(Y)
require('./y-webrtc')(Y)

Y({
    db: {
      name: 'memory'
    },
    connector: {
      name: 'webrtc',
      room: 'webrtc-yjs-demo',
      url: 'https://3000-d18d64cb-71f6-4a13-a6b5-5459ff97afd7.ws-eu0.gitpod.io/'
    },
    share: {
      textfield: 'Text'
    }
  }).then((y) => {
    y.share.textfield.bind(document.getElementById('textfield'))
})

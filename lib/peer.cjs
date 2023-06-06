const SecretStack = require('secret-stack')
const caps = require('ssb-caps')

module.exports = function startPeer() {
  SecretStack({ appKey: caps.shs })
    .use(require('ssb-conn'))
    .use(require('./plugin-hub.cjs'))
    .call(null, {
      port: 8008,
      host: '0.0.0.0',
      conn: {
        autostart: false,
      },
    })
}

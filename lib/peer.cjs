const Path = require('node:path')
const Keypair = require('ppppp-keypair')
const caps = require('ppppp-caps')
const SSAPI = require('secret-stack/lib/api')

module.exports = function startPeer() {
  const path = Path.join(__dirname, '..', 'data')
  const keypairPath = Path.join(path, 'keypair')
  const keypair = Keypair.loadOrCreateSync(keypairPath)

  SSAPI([], {})
    .use(require('secret-stack/lib/core'))
    .use(require('secret-stack/lib/plugins/net'))
    .use(require('secret-handshake-ext/secret-stack'))
    .use(require('ssb-conn'))
    .use(require('./plugin-hub.cjs'))
    .call(null, {
      path,
      caps,
      keypair,
      conn: {
        autostart: false,
      },
      connections: {
        incoming: {
          net: [
            { scope: 'public', transform: 'shse', port: 8008, host: '0.0.0.0' },
          ],
        },
        outgoing: {
          net: [{ transform: 'shse' }],
        },
      },
    })
}

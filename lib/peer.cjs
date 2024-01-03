const Path = require('node:path')
const Keypair = require('ppppp-keypair')
const caps = require('ppppp-caps')
const SecretStack = require('secret-stack/bare')

module.exports = function startPeer() {
  const path = Path.join(__dirname, '..', 'data')
  const keypairPath = Path.join(path, 'keypair')
  const keypair = Keypair.loadOrCreateSync(keypairPath)

  SecretStack()
    .use(require('secret-stack/plugins/net'))
    .use(require('secret-handshake-ext/secret-stack'))
    .use(require('ssb-conn'))
    .use(require('./plugin-hub.cjs'))
    .use(require('./plugin-hub-client.cjs'))
    .call(null, {
      shse: { caps },
      global: {
        path,
        keypair,
        timers: {
          inactivity: 600e3,
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
      },
      conn: {
        autostart: false,
      },
    })
}

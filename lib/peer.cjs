const Keypair = require('ppppp-keypair')
const SSAPI = require('secret-stack/lib/api')

module.exports = function startPeer() {
  const keypair = Keypair.loadOrCreateSync('./keypair')

  SSAPI([], {})
    .use(require('secret-stack/lib/core'))
    .use(require('secret-stack/lib/plugins/net'))
    .use(require('secret-handshake-ext/secret-stack'))
    .use(require('ssb-conn'))
    .use(require('./plugin-hub.cjs'))
    .call(null, {
      caps: { shse: 'p2pLq5VZKvNWaaafMUEcxH9BKm2WjNBCxsc8TRQV5gS' },
      keypair,
      conn: {
        autostart: false,
      },
      connections: {
        incoming: {
          net: [{scope: 'public', transform: 'shse', port: 8008, host: '0.0.0.0'}],
        },
        outgoing: {
          net: [{transform: 'shse'}],
        },
      },
    })
}

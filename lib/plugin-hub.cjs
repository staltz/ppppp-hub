const cat = require('pull-cat')
const Notify = require('pull-notify')
const pull = require('pull-stream')
const debug = require('debug')('ppppp:hub')
const Tokens = require('./tokens.cjs')
const Members = require('./members.cjs')

function ErrorDuplex(message) {
  const err = new Error(message)
  return {
    source(_abort, cb) {
      cb(err)
    },
    sink(read) {
      read(err, () => {})
    },
  }
}

module.exports = {
  name: 'hub',
  version: '1.0.0',
  // needs: ['conn'], // FIXME: uncomment once we re-write conn
  manifest: {
    createTunnel: 'duplex',
    ping: 'sync',
    metadata: 'async',
    attendants: 'source',
    createToken: 'sync',
  },
  permissions: {
    anonymous: {
      allow: ['createTunnel', 'ping', 'metadata', 'attendants', 'createToken'],
    },
  },
  init(peer, config) {
    debug('running multiserver at %s', peer.getAddress('public'))

    Tokens.load(config.global.path)
    Members.load(config.global.path)

    // Ensure that client connections are only from members or to-be members
    peer.auth.hook(function (fn, args) {
      const [clientMetadata, cb] = args
      const { pubkey, extra } = clientMetadata
      if (Members.has(pubkey)) {
        debug('authorized member %s to connect', pubkey)
        cb(null, true)
      } else if (extra && Tokens.has(extra)) {
        debug('authorized NEW member %s to connect', pubkey)
        Tokens.delete(extra)
        Members.add(pubkey)
        cb(null, true)
      } else if (Members.size() === 0) {
        debug('authorized BOOTSTRAP member %s to connect', pubkey)
        Members.add(pubkey)
        cb(null, true)
      } else {
        debug('denied stranger %s from connecting', pubkey)
        cb(new Error('client is a stranger'))
      }
    })

    const attendants = new Map()
    const notifyAttendants = Notify()

    pull(
      peer.conn.hub().listen(),
      pull.filter(
        ({ type }) => type === 'connecting-failed' || type === 'disconnected'
      ),
      pull.filter(({ key }) => !!key && attendants.has(key)),
      pull.drain(({ key }) => {
        debug('farewell %s', key)
        attendants.delete(key)
        notifyAttendants([...attendants.keys()])
      })
    )

    setInterval(() => {
      notifyAttendants([...attendants.keys()])
    }, 10e3)

    return {
      attendants() {
        const clientPubkey = this.shse.pubkey
        const clientRPC = peer.peers[this.id][0]
        if (clientPubkey && clientPubkey !== peer.pubkey) {
          debug('welcome %s', clientPubkey)
          if (!attendants.has(clientPubkey)) {
            attendants.set(clientPubkey, clientRPC)
            notifyAttendants([...attendants.keys()])
          }
        }

        const initial = pull.values([[...attendants.keys()]])
        return cat([initial, notifyAttendants.listen()])
      },

      metadata(cb) {
        cb(null, { name: '' })
      },

      createTunnel(target) {
        if (attendants.has(target)) {
          const origin = this.shse.pubkey
          debug('received tunnel request for target %s from %s', target, origin)
          return attendants.get(target).hubClient.connect(origin, () => {})
        } else {
          // prettier-ignore
          return ErrorDuplex(`Cannot createTunnel with ${target} who appears to be offline`)
        }
      },

      ping() {
        return Date.now()
      },

      createToken() {
        return Tokens.create()
      },

      numMembers() {
        return Members.size()
      },

      getBootstrap() {
        const tcpPort = config.global.connections.incoming.net[0].port
        const shseCredentials = peer.shse.pubkey
        return { tcpPort, shseCredentials }
      },
    }
  },
}

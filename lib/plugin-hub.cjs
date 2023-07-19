const bs58 = require('bs58')
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
  init(local, config) {
    if (!local.conn || !local.conn.connect) {
      throw new Error('tunnel plugin is missing the required ssb-conn plugin')
    }
    debug('running multiserver at %s', local.getAddress('public'))

    Tokens.load(config.path)
    Members.load(config.path)

    // Ensure that client connections are only from members or to-be members
    local.auth.hook(function (fn, args) {
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
      } else {
        debug('denied stranger %s from connecting', pubkey)
        cb(new Error('client is a stranger'))
      }
    })

    const attendants = new Map()
    const notifyAttendants = Notify()

    pull(
      local.conn.hub().listen(),
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
        const clientPubkey = bs58.encode(Buffer.from(this.id, 'base64'))
        const clientRPC = local.peers[this.id][0]
        if (clientPubkey && clientPubkey !== local.pubkey) {
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
          // prettier-ignore
          debug('received tunnel request for target %s from %s', target, this.id)
          const origin = bs58.encode(Buffer.from(this.id, 'base64'))
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
    }
  },
}

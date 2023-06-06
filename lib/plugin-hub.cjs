const cat = require('pull-cat')
const Notify = require('pull-notify')
const pull = require('pull-stream')
const debug = require('debug')('ppppp:hub')

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
    connect: 'duplex',
    ping: 'sync',
    attendants: 'source',
    createToken: 'async',
  },
  permissions: {
    anonymous: {
      allow: ['connect', 'ping', 'attendants', 'createToken'],
    },
  },
  init(me) {
    if (!me.conn || !me.conn.connect) {
      throw new Error('tunnel plugin is missing the required ssb-conn plugin')
    }

    // Ensure that incoming connections are only from members
    me.auth.hook(function (fn, args) {
      const [incomingId, cb] = args

      // FIXME:
      // if (members.has(incomingId)) {
      //   fn.apply(this, args);
      // } else {
      //   debug('prevented stranger %s from connecting to us', incomingId);
      //   cb(new Error('client is a stranger'));
      // }
    })

    const attendants = new Map()
    const notifyAttendants = Notify()

    pull(
      me.conn.hub().listen(),
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
        const clientId = this.id
        if (clientId && clientId !== me.id) {
          debug('welcome %s', clientId)
          if (!attendants.has(clientId)) {
            attendants.set(clientId, me.peers[clientId][0])
            notifyAttendants([...attendants.keys()])
          }
        }

        const initial = pull.values([[...attendants.keys()]])
        return cat([initial, notifyAttendants.listen()])
      },

      connect(opts) {
        if (!opts) return ErrorDuplex('opts MUST be provided')

        const target = opts.target
        if (attendants.has(target)) {
          debug(
            'received tunnel request for target %s from %s',
            target,
            this.id
          )
          opts.origin = this.id
          return attendants.get(target).tunnel.connect(opts, () => {})
        } else {
          return ErrorDuplex('Could not connect to: ' + target)
        }
      },

      ping() {
        return Date.now()
      },

      createToken(cb) {
        cb(new Error('not implemented'))
      },
    }
  },
}

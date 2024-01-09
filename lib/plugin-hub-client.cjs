module.exports = {
  name: 'hubClient',
  manifest: {
    connect: 'duplex',
  },
  permissions: {
    anonymous: {
      allow: ['connect'],
    },
  },

  /**
   * @param {any} peer
   * @param {any} config
   */
  init(peer, config) {
    return {
      /**
       * @param {string} origin
       * @returns {import('pull-stream').Duplex<unknown, unknown>}
       */
      connect(origin) {
        const err = new Error('Not implemented on the hub server')
        return {
          source(_abort, cb) {
            cb(err)
          },
          sink(read) {
            read(err, () => {})
          },
        }
      },
    }
  },
}

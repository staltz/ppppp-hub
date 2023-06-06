const debug = require('debug')
const { pino } = require('pino')

const _info = debug('fastify:info')
const _error = debug('fastify:error')
const _warn = debug('fastify:warn')
const _fatal = debug('fastify:fatal')
const _trace = debug('fastify:trace')
const _debug = debug('fastify:debug')

const logger = {
  info(o, ...n) {
    _info(o, ...n)
  },
  warn(o, ...n) {
    _warn(o, ...n)
  },
  error(o, ...n) {
    _error(o, ...n)
  },
  fatal(o, ...n) {
    _fatal(o, ...n)
  },
  trace(o, ...n) {
    _trace(o, ...n)
  },
  debug(o, ...n) {
    _debug(o, ...n)
  },
  child() {
    const child = Object.create(this)
    child.pino = pino().child(...arguments)
    return child
  },
}

module.exports = logger

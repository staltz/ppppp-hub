import { createRequire } from 'node:module'
import path from 'node:path'
import homepageHTML from './homepage.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(new URL(import.meta.url).pathname)

const fastify = require('fastify')
const fastifyView = require('@fastify/view')
const fastifyStatic = require('@fastify/static')
const ejs = require('ejs')
const logger = require('./logger.cjs')
const startPeer = require('./peer.cjs')
const peer = startPeer()

const staticsPath = path.join(__dirname, 'public')
const viewsPath = path.join(__dirname, 'views')

const app = fastify({ logger })
app.register(fastifyView, { engine: { ejs }, root: viewsPath })
app.register(fastifyStatic, { root: staticsPath })

app.get('/', (req, reply) => {
  if (peer.hub.numMembers() === 0) {
    const { port, pubkey, token } = peer.hub.getBootstrap()
    reply.view('bootstrap.ejs', { port, pubkey, token })
  } else {
    reply.view('homepage.ejs', { markdown: homepageHTML })
  }
})

app.get('/invite', (req, reply) => {
  reply.view('invite.ejs')
})

app.listen(
  { host: '0.0.0.0', port: process.env.HTTP_PORT ?? 3000 },
  (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  }
)

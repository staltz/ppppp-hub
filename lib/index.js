import { createRequire } from 'module'
import path from 'path'
import homepageHTML from './homepage.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(new URL(import.meta.url).pathname)

const fastify = require('fastify')
const fastifyView = require('@fastify/view')
const fastifyStatic = require('@fastify/static')
const ejs = require('ejs')
const logger = require('./logger.cjs')

const staticsPath = path.join(__dirname, 'public')
const viewsPath = path.join(__dirname, 'views')

const app = fastify({ logger })

app.register(fastifyView, { engine: { ejs }, root: viewsPath })

app.register(fastifyStatic, { root: staticsPath })

app.get('/', (req, reply) => {
  reply.view('homepage.ejs', { markdown: homepageHTML })
})

app.get('/invite', (req, reply) => {
  reply.view('invite.ejs')
})

app.listen({ port: 3000 }, (err, address) => {
  app.log.info(`server listening on ${address}`)
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})

const fastify = require('fastify');
const fastifyView = require('@fastify/view');
const fastifyMarkdown = require('fastify-markdown');
const fastifyStatic = require('@fastify/static');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const staticsPath = path.join(__dirname, 'public');
const viewsPath = path.join(__dirname, 'views');
const homepagePath = path.join(__dirname, '..', 'HOMEPAGE.md');
const homepageMD = fs.readFileSync(homepagePath, 'utf8');

const app = fastify({logger: true});

app.register(fastifyView, {
  engine: {ejs},
  root: viewsPath,
});

app.register(fastifyMarkdown, {
  src: false,
});

app.register(fastifyStatic, {
  root: staticsPath,
});

app.get('/', (req, reply) => {
  const markdown = reply.markdown().parse(homepageMD);
  reply.view('index.ejs', {markdown});
});

app.get('/invite', (req, reply) => {
  reply.view('invite.ejs');
});

app.listen({port: 3000}, (err, address) => {
  app.log.info(`server listening on ${address}`);
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

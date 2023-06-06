import {createRequire} from 'module';
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import fs from 'fs'
import path from 'path'

const require = createRequire(import.meta.url);
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const fastify = require('fastify');
const fastifyView = require('@fastify/view');
const fastifyStatic = require('@fastify/static');
const ejs = require('ejs');

const staticsPath = path.join(__dirname, 'public');
const viewsPath = path.join(__dirname, 'views');
const homepagePath = path.join(__dirname, '..', 'HOMEPAGE.md');

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify)

const homepageMD = fs.readFileSync(homepagePath, 'utf8');
const homepageHTML = processor.processSync(homepageMD)

const app = fastify({logger: true});

app.register(fastifyView, { engine: {ejs}, root: viewsPath });

app.register(fastifyStatic, { root: staticsPath });

app.get('/', (req, reply) => {
  reply.view('index.ejs', {markdown: homepageHTML});
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

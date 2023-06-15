import fs from 'node:fs'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const homepagePath = path.join(__dirname, '..', 'HOMEPAGE.md')

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify)

const homepageMD = fs.readFileSync(homepagePath, 'utf8')
const homepageHTML = processor.processSync(homepageMD)

export default homepageHTML

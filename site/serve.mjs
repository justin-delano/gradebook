// Serves the built site so it can be read locally before it is published.
//
// Deliberately the smallest thing that works: the site is static files, and a static
// file server is not a dependency worth carrying. Run `node --run preview`.

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', '_site')
const port = 4321

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
}

createServer((request, response) => {
  // normalize collapses any ".." a request tries to walk out of the directory with.
  const asked = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname))
  const path = join(out, asked.endsWith('/') ? join(asked, 'index.html') : asked)

  if (!path.startsWith(out)) {
    response.writeHead(403).end('Outside the site')
    return
  }

  stat(path)
    .then((info) => {
      const file = info.isDirectory() ? join(path, 'index.html') : path
      response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
      createReadStream(file).pipe(response)
    })
    .catch(() => {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('Not here')
    })
}).listen(port, '127.0.0.1', () => {
  console.log(`The site is at http://127.0.0.1:${port}/`)
})

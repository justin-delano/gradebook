// Turns the markdown under docs/ into the published site.
//
// Every page a teacher reads is markdown, so changing the wording is editing prose and
// nothing else. This script is the whole build: a template, a stylesheet, and one pass
// over the files. There is no framework here on purpose, because a documentation site
// that needs maintaining is a documentation site that stops being written.
//
// The web app itself is not built here. It is built from the private source repository
// and published as a release asset, which the Pages workflow unpacks into app/ beside
// these pages. Keeping the built app out of this repository's history is what stops
// every release from adding a few hundred generated files to it.

import { mkdir, copyFile, readFile, writeFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { marked } from 'marked'

// Substitution through a function rather than a string, because a string replacement
// treats $& and $` as instructions to paste part of the match back in. The prose poured
// in here is written by hand and may contain either.
function fill(text, marker, value) {
  return text.replaceAll(marker, () => value)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, '_site')

// The repository the downloads come from. Read from the environment so a fork builds its
// own links rather than pointing everyone back here.
const repo = process.env.GITHUB_REPOSITORY ?? 'justin-delano/gradebook'

// Order is the order of the navigation bar. Pages after the divider are reachable from
// the footer instead, because a teacher looking for help should not have to read past
// two policies to find it.
const pages = [
  { slug: 'index', title: 'Gradebook', nav: 'Home' },
  { slug: 'install', title: 'Installing Gradebook', nav: 'Install' },
  { slug: 'guide', title: 'Using Gradebook', nav: 'Guide' },
  { slug: 'data', title: 'Where your work is kept', nav: 'Your data' },
  { slug: 'drive', title: 'Google Drive backup', nav: 'Google Drive' },
  { slug: 'help', title: 'When something goes wrong', nav: 'Help' },
  { slug: 'privacy', title: 'Privacy policy', footer: 'Privacy' },
  { slug: 'terms', title: 'Terms of use', footer: 'Terms' },
]

// What the latest release offers, or nothing at all before the first one exists.
//
// Asked of GitHub at build time rather than written into the pages, so the version number
// on the download buttons is never the one someone last remembered to edit. A release
// publishes and then asks this site to rebuild, which is when this runs.
async function latestRelease() {
  const url = `https://api.github.com/repos/${repo}/releases/latest`
  const headers = { accept: 'application/vnd.github+json' }
  // Actions runners are rate limited hard without one; a laptop building locally is not.
  const token = process.env.GITHUB_TOKEN
  if (token !== undefined && token !== '') headers.authorization = `Bearer ${token}`

  try {
    const response = await fetch(url, { headers })
    if (!response.ok) return undefined
    const release = await response.json()
    return { version: release.tag_name, assets: release.assets ?? [] }
  } catch {
    // A build with no network still produces a site; it just sends people to the
    // releases page instead of straight at a file.
    return undefined
  }
}

// The one generated block on any page: the download table on the install page, written
// where the marker sits so the prose around it stays prose.
function downloadTable(release) {
  const releasesPage = `https://github.com/${repo}/releases`
  if (release === undefined) {
    return `<p class="notice">There is no published release yet. When there is one it will be on the <a href="${releasesPage}">releases page</a>, and this table will name the file to download.</p>`
  }

  const find = (suffix) => release.assets.find((asset) => asset.name.endsWith(suffix))
  const rows = [
    { system: 'Windows 10 or 11', asset: find('.exe'), note: 'Installs for you alone, so it needs no administrator.' },
    { system: 'macOS, Intel or Apple Silicon', asset: find('.dmg'), note: 'Open it and drag Gradebook to Applications.' },
  ].filter((row) => row.asset !== undefined)

  if (rows.length === 0) {
    return `<p class="notice">Release ${release.version} has no installer attached to it. The <a href="${releasesPage}">releases page</a> has everything that was published.</p>`
  }

  const body = rows
    .map(
      (row) =>
        `<tr><th scope="row">${row.system}</th><td><a class="download" href="${row.asset.browser_download_url}">Download ${row.asset.name}</a><br><span class="note">${row.note}</span></td></tr>`,
    )
    .join('\n')

  return `<table class="downloads"><caption>Version ${release.version}</caption><tbody>\n${body}\n</tbody></table>`
}

function navigation(current) {
  return pages
    .filter((page) => page.nav !== undefined)
    .map((page) => {
      const href = page.slug === 'index' ? './' : `./${page.slug}.html`
      const here = page.slug === current ? ' aria-current="page"' : ''
      return `<a href="${href}"${here}>${page.nav}</a>`
    })
    .join('\n        ')
}

function footerLinks() {
  return pages
    .filter((page) => page.footer !== undefined)
    .map((page) => `<a href="./${page.slug}.html">${page.footer}</a>`)
    .join('\n        ')
}

const template = await readFile(join(root, 'site', 'page.html'), 'utf8')

const release = await latestRelease()

await mkdir(out, { recursive: true })

for (const page of pages) {
  const source = await readFile(join(root, 'docs', `${page.slug}.md`), 'utf8')
  const body = marked.parse(source, { async: false })
  const html = fill(body, '<!--downloads-->', downloadTable(release))

  let rendered = fill(template, '{{title}}', page.title)
  rendered = fill(rendered, '{{nav}}', navigation(page.slug))
  rendered = fill(rendered, '{{footer}}', footerLinks())
  rendered = fill(rendered, '{{year}}', String(new Date().getFullYear()))
  rendered = fill(rendered, '{{content}}', html)

  await writeFile(join(out, `${page.slug}.html`), rendered)
}

// Everything in site/ that is not part of the build itself is served as it stands.
const passthrough = (await readdir(join(root, 'site'))).filter(
  (name) => !name.endsWith('.mjs') && name !== 'page.html',
)
for (const name of passthrough) {
  await copyFile(join(root, 'site', name), join(out, name))
}

// Tells GitHub Pages not to run its own Jekyll pass over the output, which would
// otherwise drop any file or folder whose name begins with an underscore. Vite names
// its build output that way.
await writeFile(join(out, '.nojekyll'), '')

console.log(
  release === undefined
    ? `Built ${pages.length} pages. No release found, so downloads point at the releases page.`
    : `Built ${pages.length} pages with downloads for ${release.version}.`,
)

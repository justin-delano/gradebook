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

// Doublespaced is the company and Greatbook is a product of it, so the root of the site
// belongs to the company and every page about the app sits one level down. A second
// product would take a directory beside this one and nothing here would have to move.
//
// The whole subtree moves together, which is why this costs one constant rather than a
// rewrite: every link between these pages is relative, so their depth relative to each
// other is unchanged and `./install.html`, `./app/` and `../page.css` all still resolve.
const PRODUCT = 'Greatbook'
const UMBRELLA = 'Doublespaced'
const productDir = 'greatbook'
const productOut = join(out, productDir)

// The repository the downloads come from, which is NOT the repository this site is built
// from: releases are published to doublespacedapp/greatbook and the site lives in
// doublespacedapp/website. So this deliberately does not read GITHUB_REPOSITORY, which
// on a Pages run names the site repository and would send this at a repository with no
// releases in it -- and the failure is a download table that quietly says there is no
// release yet rather than an error anybody sees.
const repo = process.env.RELEASES_REPOSITORY ?? 'doublespacedapp/greatbook'

// Order is the order of the navigation bar. Pages after the divider are reachable from
// the footer instead, because a teacher looking for help should not have to read past
// two policies to find it.
const pages = [
  { slug: 'index', title: PRODUCT, nav: 'Home' },
  { slug: 'install', title: `Installing ${PRODUCT}`, nav: 'Install' },
  { slug: 'guide', title: `Using ${PRODUCT}`, nav: 'Guide' },
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
    { system: 'macOS, Intel or Apple Silicon', asset: find('.dmg'), note: `Open it and drag ${PRODUCT} to Applications.` },
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

// The header and footer differ between the company's page and the product's, which is the
// only reason the template carries these as placeholders rather than as markup.
//
// On a product page the wordmark is the product and leads to its own home; the company is
// named in the footer, one level up. On the company's page there is no app to open, so the
// button that would say so is left out rather than pointed at nothing.
const productChrome = {
  wordmark: `<a class="wordmark" href="./">${PRODUCT}</a>`,
  actions: `<a class="open-app" href="./app/">Open the web app</a>`,
  colophon: `${PRODUCT} is made by <a href="../">${UMBRELLA}</a>. Copyright {{year}}.`,
}

const umbrellaChrome = {
  wordmark: `<a class="wordmark" href="./">${UMBRELLA}</a>`,
  actions: '',
  colophon: `${UMBRELLA} is Justin Delano. Copyright {{year}}.`,
}

// One page, with the chrome it belongs to. Split out of the loop below so the company's
// page and the standing app page can be written the same way rather than each unpicking
// the template on its own.
function render({ title, nav, footer, content, chrome }) {
  let page = fill(template, '{{wordmark}}', chrome.wordmark)
  page = fill(page, '{{actions}}', chrome.actions)
  page = fill(page, '{{colophon}}', chrome.colophon)
  page = fill(page, '{{title}}', title)
  page = fill(page, '{{nav}}', nav)
  page = fill(page, '{{footer}}', footer)
  page = fill(page, '{{content}}', content)
  // Last, so that a year inside the colophon is filled in too.
  return fill(page, '{{year}}', String(new Date().getFullYear()))
}

const template = await readFile(join(root, 'site', 'page.html'), 'utf8')

const release = await latestRelease()

await mkdir(productOut, { recursive: true })

for (const page of pages) {
  const source = await readFile(join(root, 'docs', `${page.slug}.md`), 'utf8')
  const body = marked.parse(source, { async: false })
  const html = fill(body, '<!--downloads-->', downloadTable(release))

  await writeFile(
    join(productOut, `${page.slug}.html`),
    render({
      title: page.title,
      nav: navigation(page.slug),
      footer: footerLinks(),
      content: html,
      chrome: productChrome,
    }),
  )
}

// The company's own page, at the root, above every product.
//
// Written here rather than as another entry in `pages`, because that list describes one
// flat directory of pages that link to each other with `./name.html`, and this one is not
// in it: it sits a level up and points down into it.
const home = marked.parse(await readFile(join(root, 'docs', 'home.md'), 'utf8'), { async: false })
await writeFile(
  join(out, 'index.html'),
  render({
    title: UMBRELLA,
    nav: `<a href="./${productDir}/" aria-current="page">${PRODUCT}</a>`,
    footer: pages
      .filter((page) => page.footer !== undefined)
      .map((page) => `<a href="./${productDir}/${page.slug}.html">${page.footer}</a>`)
      .join('\n        '),
    content: home,
    chrome: umbrellaChrome,
  }),
)

// Everything in site/ that is not part of the build itself is served as it stands, and is
// copied twice because the template asks for `./page.css` beside the page: the company's
// page and the product's pages are at different depths, so one copy cannot serve both.
const passthrough = (await readdir(join(root, 'site'))).filter(
  (name) => !name.endsWith('.mjs') && name !== 'page.html',
)
for (const name of passthrough) {
  await copyFile(join(root, 'site', name), join(out, name))
  await copyFile(join(root, 'site', name), join(productOut, name))
}

// Tells GitHub Pages not to run its own Jekyll pass over the output, which would
// otherwise drop any file or folder whose name begins with an underscore. Vite names
// its build output that way.
await writeFile(join(out, '.nojekyll'), '')

// The custom domain, which has to be written into the build rather than set once in the
// repository's settings.
//
// Pages deployments that come from a workflow artifact, as this one does, serve exactly
// what the artifact contains. A domain configured in settings alone is dropped the first
// time an artifact without this file is published, and the site quietly goes back to its
// github.io address. Written here rather than passed through from site/ so it lands at the
// root and only at the root, which is the only place Pages reads it.
await writeFile(join(out, 'CNAME'), 'doublespaced.app\n')

console.log(
  release === undefined
    ? `Built ${pages.length} pages. No release found, so downloads point at the releases page.`
    : `Built ${pages.length} pages with downloads for ${release.version}.`,
)

// A standing page at app/, so that the link every page carries in its top bar always
// leads somewhere.
//
// Written on every build and overwritten by the real thing when there is one: the Pages
// workflow unpacks the released web bundle over this directory, and its index.html
// replaces this file. So this is what a reader sees only in the window before the first
// release, or if a release ever goes out without the browser build attached.
await mkdir(join(productOut, 'app'), { recursive: true })
await writeFile(
  join(productOut, 'app', 'index.html'),
  render({
    title: 'The web app is not published yet',
    // One level down, so the links back up have to say so.
    nav: navigation('').replaceAll('href="./', 'href="../'),
    footer: footerLinks().replaceAll('href="./', 'href="../'),
    content: `<p>${PRODUCT} runs in the browser, and this is where it will be. It is not published here yet.</p>
<p>The app is put here by the first release. Until then there is nothing to open, and the rest of the site is written and ready: start with <a href="../install.html">installing it</a>, or read <a href="../guide.html">the guide</a>.</p>
<p>If you are expecting it to be here, the <a href="https://github.com/${repo}/releases">releases page</a> says what has been published so far.</p>`,
    chrome: {
      ...productChrome,
      // Everything the chrome points at is one level further up from here, including the
      // company's page in the footer, which is now two.
      wordmark: productChrome.wordmark.replace('href="./"', 'href="../"'),
      actions: productChrome.actions.replace('href="./app/"', 'href="./"'),
      colophon: productChrome.colophon.replace('href="../"', 'href="../../"'),
    },
  })
    .replaceAll('href="./page.css"', 'href="../page.css"')
    .replaceAll('href="./icon.svg"', 'href="../icon.svg"'),
)

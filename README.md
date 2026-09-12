# Doublespaced

The website for Doublespaced, at [doublespaced.app](https://doublespaced.app).

Doublespaced makes software for teachers.
Today that is one product, Greatbook, a gradebook for teachers of any grade from kindergarten through twelfth.

**[Install Greatbook](https://doublespaced.app/greatbook/install.html)** or **[open the web app](https://doublespaced.app/greatbook/app/)**.

## This repository, and the two beside it

Three repositories, and the two public ones are easy to confuse.
This one holds the site and nothing else.
The releases people download live next door, and the application source is kept privately.

| Where                                                                        | What                                                                 |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [The site](https://doublespaced.app)                                          | This repository: the company page and Greatbook's documentation      |
| [Releases](https://github.com/doublespacedapp/greatbook/releases)             | The Windows and macOS installers, and the web bundle the site serves  |
| [Issues](https://github.com/doublespacedapp/greatbook/issues)                 | Problems, questions, and requests                                     |

Please do not put real student names or scores in an issue.
Issues are public.

## How the site is laid out

The root belongs to the company and each product sits one level down, so Greatbook's pages are under `/greatbook/` and the web app is at `/greatbook/app/`.
A second product would take a directory beside it and nothing would have to move.

The pages are markdown under `docs/`, each published at the matching address under `/greatbook/`.
`docs/home.md` is the exception: it is the company's own page, and it is published at the root.

- [Installing Greatbook](docs/install.md)
- [Using Greatbook](docs/guide.md)
- [Where your work is kept](docs/data.md)
- [Google Drive backup](docs/drive.md)
- [When something goes wrong](docs/help.md)
- [Privacy policy](docs/privacy.md)
- [Terms of use](docs/terms.md)

Corrections to any of them are welcome as a pull request.
They are written one sentence per line, which keeps a change to a sentence looking like a change to a sentence rather than to a paragraph.

## Building the site

```sh
pnpm install
pnpm build        # render docs/ into _site/
pnpm preview      # render it and serve it at http://127.0.0.1:4321/
```

The build reads the latest release from the GitHub API to write the download table, so a local build with no network still works and simply points at the releases page instead.
It reads that from `doublespacedapp/greatbook` rather than from this repository, which has no releases in it.

The web app is not built here.
It comes from the private source repository, is attached to each release as `greatbook-web.zip`, and is unpacked into `/greatbook/app/` when the site is published.
That is why `_site/` is not committed and why publishing happens on a release as well as on a push.

The custom domain is written into the build as a `CNAME` file rather than set only in the repository's settings, because a Pages deployment made from a workflow artifact serves exactly what the artifact holds.

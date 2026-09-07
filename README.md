# Gradebook

A gradebook for teachers of grades 3 through 10.
It runs as a desktop app on Windows and macOS, as an installable web app on a Chromebook, works with no internet connection, and keeps every score in a file you own.

**[Install it](https://justin-delano.github.io/gradebook/install.html)** or **[open the web app](https://justin-delano.github.io/gradebook/app/)**.

## This repository

This is the public side of the project: the documentation, the site, and the releases people download.
The application source is kept privately.

| Where | What |
| --- | --- |
| [The site](https://justin-delano.github.io/gradebook/) | Downloads, documentation, and the web app |
| [Releases](https://github.com/justin-delano/gradebook/releases) | The Windows and macOS installers, and the web bundle the site serves |
| [Issues](https://github.com/justin-delano/gradebook/issues) | Problems, questions, and requests |

Please do not put real student names or scores in an issue.
Issues are public.

## Documentation

The pages are markdown under `docs/`, and each one is published at the matching address on the site.

- [Installing Gradebook](docs/install.md)
- [Using Gradebook](docs/guide.md)
- [Where your work is kept](docs/data.md)
- [Google Drive backup](docs/drive.md)
- [When something goes wrong](docs/help.md)
- [Privacy policy](docs/privacy.md)
- [Terms of use](docs/terms.md)

Corrections to any of them are welcome as a pull request.
They are written one sentence per line, which keeps a change to a sentence looking like a change to a sentence rather than to a paragraph.

## Building the site

```sh
npm install
npm run build     # render docs/ into _site/
npm run preview   # render it and serve it at http://127.0.0.1:4321/
```

The build reads the latest release from the GitHub API to write the download table, so a local build with no network still works and simply points at the releases page instead.

The web app is not built here.
It comes from the private source repository, is attached to each release as `gradebook-web.zip`, and is unpacked into `app/` when the site is published.
That is why `_site/` is not committed and why publishing happens on a release as well as on a push.

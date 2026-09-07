If something is wrong, the answer is often on this page.
If it is not, [open an issue](https://github.com/justin-delano/gradebook/issues) and describe what happened.
Please do not paste real student names into an issue; it is a public page.

## Windows will not let me run the installer

SmartScreen says "Windows protected your PC" because the installer is not signed.
Choose More info, then Run anyway.
[More about that](./install.html).

## macOS says the developer cannot be verified

Open System Settings, then Privacy and Security, scroll to the message about Gradebook, and choose Open Anyway.
Then launch it again.
Right-clicking and choosing Open no longer works on recent versions of macOS.

## Chrome is not offering to install the app

The install button appears once Chrome has decided the page is a real app, which can take a moment on a first visit.
It also needs a secure connection, so it will not appear on a copy of the site served over plain `http`.

If it still does not appear, the app works perfectly well in a tab.
Installing only changes the window it opens in.

## The app says it cannot write to my file

Something outside the app is in the way: the file is open in another program, the drive it is on has been unplugged, or the disk is full.

Your work is safe.
Everything you typed was recorded on this computer before the file was ever touched, and the file catches up once the obstacle is gone.

## Chrome is asking for permission to my file again

Chrome forgets file permissions between sessions and asks again when you return.
Say yes and the app carries on where it was.

## My gradebook is empty on this computer

A gradebook is kept per computer, and per browser.
If you were using the web app, the copy at one address is not the copy at another, so `localhost` and `127.0.0.1` really are two different places.

If you have a backup file, Settings, then Restore from a file, brings it back.

## I made a mess of a column

Undo is in the top bar, and covers what you have done since you opened the app.

If the mess is older than that, Settings lists dated backups under Backups, and restoring one replaces the gradebook with what it held.

## Google Drive is not offered in Settings

Most likely it is not switched on for teachers yet; it is [the planned paid addition](./drive.html).

It is also hidden if your school has turned off third-party apps for school Google accounts, which many districts do.

## I want to start the year again

Settings, then Start over, erases the gradebook on this computer.
Take a backup first, because that is the only way back, and the app will say so.

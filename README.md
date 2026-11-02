# MBCS Projects

Archive of the MBCS documentation (manuals, rubrics, guidelines). The notes in this repo are published as the website **https://www.mbcs-projects.nl** via GitHub Pages. The site is a copy of how it used to look on Obsidian Publish.

## Editing and publishing

1. Edit the `.md` notes (in Obsidian or any editor, see [below](#maintaining-the-notes-without-obsidian)) and add images next to them.
2. Commit and push to the `main` branch.
3. GitHub rebuilds the site automatically. After about a minute the change is live. Progress is under the **Actions** tab; a green tick means it is deployed.

Nothing needs to be installed to build the site. It is built on GitHub, not on your computer.

## Maintaining the notes without Obsidian

Obsidian is not needed. The notes are plain text files, so any editor works (for example [VS Code](https://code.visualstudio.com/), which also has a Markdown preview).

### One-time setup

1. Install [Git](https://git-scm.com/downloads) (and optionally [GitHub Desktop](https://desktop.github.com/) if you prefer buttons over commands).
2. Make sure your GitHub account has **Write** access to this repo (Settings → Collaborators).
3. Download ("clone") the repo to your computer:
   ```bash
   git clone https://github.com/braincogsci/mbcs-projects.git
   ```
   The first time you push, a browser window asks you to sign in to GitHub. Git remembers this afterwards.

### Day-to-day

Edit the `.md` files in the cloned folder, then publish:

```bash
git pull                              # get the latest version first
git add -A
git commit -m "Describe what you changed"
git push
```

Within a minute the website is rebuilt. Check progress under the **Actions** tab. If you are not comfortable with the command line, GitHub Desktop and the source-control panel in VS Code do the same thing with buttons.

Small edits can also be made without installing anything: on github.com open a file and click the pencil icon, or press `.` anywhere in the repo for a browser-based editor.

### Writing notes without Obsidian

- **Links to other notes:** use normal Markdown with the path relative to the current file, for example `[Examiner](../Miscellaneous/Examiner.md)`, and add `#Heading` to link to a section: `[grading](Research%20Project%201%20Manual.md#Grading)`. Spaces in paths are written as `%20`. Obsidian-style `[[../Miscellaneous/Examiner|Examiner]]` links keep working as well, so the existing notes need no changes.
- **Images:** put the image file in the repo (for example next to the note) and write `![description](picture.png)`. The `![[picture.png]]` form also works.
- **Callouts:** a block quote starting with the type, for example
  ```
  > [!note] Optional title
  > The text of the callout.
  ```
  Types: `note`, `info`, `tip`, `help`, `warning`, `caution`, `danger`, `success`.
- **Diagrams:** a code block tagged `mermaid`. **Footnotes:** `text[^1]` with `[^1]: the footnote` further down.
- **Page title:** the file name is the page title. There is no need to repeat it as a `# Heading` at the top of the note.
- **Folders:** just create, rename or move files and folders. Remember to update links that pointed to a moved note, and add a redirect (see below) if the old web address has been shared.

### Previewing before you publish (optional)

Needs [Node.js](https://nodejs.org/). In the repo folder:

```bash
npm install                # once
node site/build.mjs        # writes the website to the folder _site/
cd _site && python -m http.server 8000
```

Then open http://localhost:8000. The build also lists broken links, so it doubles as a check.

### Publishing automatically (cron / Task Scheduler)

[`site/sync.sh`](site/sync.sh) does the whole `pull`, `commit`, `push` sequence in one go and does nothing if there are no changes. Run it by hand with `bash site/sync.sh`, or schedule it.

- **Linux / macOS (cron):** run `crontab -e` and add a line like the following, which publishes every day at 18:00 (adjust the path):
  ```
  0 18 * * * /bin/bash /home/you/mbcs-projects/site/sync.sh >> /home/you/mbcs-sync.log 2>&1
  ```
- **Windows (Task Scheduler):** create a task with a daily trigger and an action that starts the program `"C:\Program Files\Git\bin\bash.exe"` with the argument `site/sync.sh`, and "Start in" set to the cloned folder.

Things to keep in mind with automatic publishing:
- Whatever is saved at that moment goes online, including half-finished edits. Schedule it for a time when you are not editing, or keep drafts outside the repo folder.
- The machine must be logged in to GitHub once (see setup), otherwise the push in the scheduled job fails. Check the log file occasionally.
- If someone else changed the same lines through github.com, the script stops with a merge conflict and publishes nothing. Resolve it by hand (`git status` shows what to do) and run the script again.
- Even without a schedule you can run the script manually whenever you have finished a round of edits.

## What the site does for you

- **Menu:** the sidebar is built from the folders and files. New notes, folders and moves appear automatically, in alphabetical order.
- **Links and images:** plain Markdown links and images with relative paths, and Obsidian's `[[wikilinks]]` (also `[[Note#Heading]]`) and `![[image.png]]` embeds, `>[!note]` callouts, footnotes, tables and mermaid diagrams all work.
- **Search and outline:** generated from the page titles and headings.
- **README.md** (this file) is not published as a page.

## When you move or rename notes

- **Links inside the notes:** links are found by path first and then by file name, so they survive a move as long as the file name is unique in the repo. Moving files in Obsidian also updates the links for you.
- **Old web addresses:** a moved or renamed page gets a new address, so existing bookmarks and links from other sites (Datanose, emails, ...) would break. To keep them working, add a line to [`site/redirects.json`](site/redirects.json):
  ```json
  "Old folder/Old name": "New folder/New name"
  ```
  (no `.md`). Visitors to the old address are sent to the new one.
- **Broken links:** open the latest run under the **Actions** tab. Links to notes or images that don't exist are listed there as warnings (and appear as grey text on the site). Fix them or ignore them. A few links in `Interdisciplinary research` and `Thinking tools` currently point to notes that were never written.

## Things stored outside the notes

| What | Where |
| --- | --- |
| Home page (the page at `/`) | `INDEX` near the top of `site/build.mjs` (currently `General/About`) |
| Site name | `SITE_NAME` in `site/build.mjs` |
| Logo and browser icon | `site/mbcs.png` (replace the file) |
| Look and feel | `site/style.css` |
| Domain name | the `CNAME` file in the repo root, plus DNS (see below) |

Folders `site/`, `.github/` and `node_modules/`, and any folder whose name starts with a dot (such as `.obsidian`), are never published as notes.

## If the site does not update

1. Check the **Actions** tab for a red cross and open the failed run to read the error.
2. Check **Settings → Pages**: Source must be **GitHub Actions**, and the custom domain `www.mbcs-projects.nl` must be set.
3. You can start a rebuild by hand: Actions → *Deploy site to GitHub Pages* → *Run workflow*.
4. Browsers cache pages. Try a hard refresh (Ctrl+F5).

## Domain and hosting (technical)

- Domain registered at TransIP. DNS is managed in **Cloudflare** (the TransIP DNS screen is not used).
- `www` is a CNAME to `braincogsci.github.io` (DNS only, not proxied). The bare domain `mbcs-projects.nl` has four `A` records (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and four `AAAA` records for IPv6 (`2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`), all pointing to GitHub Pages and all DNS only. Any other `A` or `AAAA` record for the bare domain (such as an old TransIP address) would send some visitors to the wrong server.
- The old Obsidian Publish site is no longer used.

## Running it locally (optional)

Needs Node.js.

```bash
npm install
node site/build.mjs        # writes the site to _site/
```

Open `_site/` through any local web server (for example `python -m http.server` inside `_site`). Opening the files directly will not work because links start with `/`.

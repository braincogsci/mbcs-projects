# MBCS Projects

Archive of the MBCS documentation (manuals, rubrics, guidelines). The notes in this repo are published as the website **https://www.mbcs-projects.nl** via GitHub Pages. The site is a copy of how it used to look on Obsidian Publish.

## Editing and publishing

1. Edit the `.md` notes (in Obsidian or any editor) and add images next to them.
2. Commit and push to the `main` branch.
3. GitHub rebuilds the site automatically. After about a minute the change is live. Progress is under the **Actions** tab; a green tick means it is deployed.

Nothing needs to be installed to publish. The site is built on GitHub, not on your computer.

## What the site does for you

- **Menu:** the sidebar is built from the folders and files. New notes, folders and moves appear automatically, in alphabetical order.
- **Obsidian syntax:** `[[wikilinks]]` (also `[[Note#Heading]]`), `![[image.png]]` embeds, `>[!note]` callouts, footnotes, tables and mermaid diagrams all work.
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
- `www` is a CNAME to `braincogsci.github.io` (DNS only, not proxied). The bare domain has four A records pointing to GitHub Pages (`185.199.108.153` to `.111.153`).
- The old Obsidian Publish site is no longer used.

## Running it locally (optional)

Needs Node.js.

```bash
npm install
node site/build.mjs        # writes the site to _site/
```

Open `_site/` through any local web server (for example `python -m http.server` inside `_site`). Opening the files directly will not work because links start with `/`.

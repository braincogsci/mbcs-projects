// Builds the notes in this repo into a static site that mimics the old Obsidian Publish site.
// Usage: node site/build.mjs   (output in ./_site)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "_site");
const BASE = (process.env.BASE_PATH || "").replace(/\/$/, ""); // "" on a custom domain, "/mbcs-projects" on github.io
const SITE_NAME = "MBCS Projects";
const INDEX = "General/About";
const SKIP_DIRS = new Set([".git", ".github", "node_modules", "site", "_site"]);
const IMG = /\.(png|jpe?g|gif|svg|webp)$/i;

// ---- collect files ----
const notes = []; // {rel: "General/About", file}
const assets = []; // relative paths
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    const rel = path.relative(root, p).split(path.sep).join("/");
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".md") && rel !== "README.md") notes.push({ rel: rel.slice(0, -3), file: p });
    else if (IMG.test(e.name)) assets.push(rel);
  }
})(root);
assets.push("mbcs.png");

const warnings = []; // broken links etc., reported at the end of the build
const warn = (msg) => warnings.push(msg);

const byLower = new Map(notes.map((n) => [n.rel.toLowerCase(), n]));
const byName = new Map();
for (const n of notes) byName.set(path.posix.basename(n.rel).toLowerCase(), n);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (s) => s.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
const urlOf = (rel) => BASE + "/" + rel.split("/").map(encodeURIComponent).join("/");

function resolveNote(target, fromRel) {
  const t = target.replace(/\.md$/, "");
  const dir = path.posix.dirname(fromRel);
  const cand = path.posix.normalize(path.posix.join(dir, t)).toLowerCase();
  return byLower.get(cand) || byLower.get(t.toLowerCase()) || byName.get(path.posix.basename(t).toLowerCase());
}
function resolveAsset(target, fromRel) {
  const dir = path.posix.dirname(fromRel);
  const cand = path.posix.normalize(path.posix.join(dir, target));
  if (assets.includes(cand)) return cand;
  if (assets.includes(target)) return target;
  return assets.find((a) => path.posix.basename(a) === path.posix.basename(target));
}

// ---- markdown ----
const md = new MarkdownIt({ html: true, linkify: true, typographer: false }).use(footnote);
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, o, env, self) => {
  const t = tokens[idx];
  if (t.info.trim() === "mermaid") return `<pre class="mermaid">${esc(t.content)}</pre>\n`;
  return defaultFence(tokens, idx, o, env, self);
};
const defaultHeadOpen = md.renderer.rules.heading_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
md.renderer.rules.heading_open = (tokens, idx, o, env, self) => {
  const text = tokens[idx + 1].children.map((c) => c.content).join("");
  const id = slug(text);
  tokens[idx].attrSet("id", id);
  env.headings.push({ level: +tokens[idx].tag.slice(1), text, id });
  return defaultHeadOpen(tokens, idx, o, env, self);
};

function preprocess(src, rel) {
  src = src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ""); // frontmatter
  src = src.replace(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, target, alt) => {
    const a = resolveAsset(target, rel);
    if (!a) warn(`${rel}.md: embedded file not found: ![[${target}]]`);
    return a ? `![${alt || ""}](${urlOf(a)})` : "";
  });
  src = src.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const [link, text] = inner.split("|");
    const [target, heading] = link.split("#");
    const n = target ? resolveNote(target, rel) : { rel };
    const label = text || (heading ? `${target} > ${heading}` : target);
    if (!n) warn(`${rel}.md: link to a note that does not exist: [[${inner}]]`);
    if (!n) return `<span class="unresolved">${esc(label)}</span>`;
    return `<a class="internal-link" href="${urlOf(n.rel)}${heading ? "#" + slug(heading) : ""}">${esc(label)}</a>`;
  });
  return src;
}

// Obsidian callouts: ">[!note] Title" blockquotes
function callouts(html) {
  return html.replace(/<blockquote>\s*<p>\[!(\w+)\][+-]?([^\n<]*)(?:\n|<\/p>)([\s\S]*?)<\/blockquote>/g, (m, type, title, rest) => {
    type = type.toLowerCase();
    const t = title.trim() || type[0].toUpperCase() + type.slice(1);
    const body = rest.startsWith("</p>") ? rest.slice(4) : "<p>" + rest.replace(/^<\/p>/, "");
    return `<div class="callout" data-callout="${type}"><div class="callout-title">${t}</div><div class="callout-content">${body}</div></div>`;
  });
}

// ---- layout ----
function buildTree() {
  const tree = { dirs: {}, files: [] };
  for (const n of notes) {
    const parts = n.rel.split("/");
    let cur = tree;
    for (const d of parts.slice(0, -1)) cur = cur.dirs[d] ||= { dirs: {}, files: [] };
    cur.files.push({ name: parts.at(-1), rel: n.rel });
  }
  return tree;
}
const tree = buildTree();
const cmp = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

function renderTree(node, current, prefix = "") {
  let h = "<ul>";
  for (const d of Object.keys(node.dirs).sort(cmp)) {
    const sub = node.dirs[d];
    const open = current.startsWith(prefix + d + "/") ? " open" : "";
    h += `<li><details${open}><summary>${esc(d)}</summary>${renderTree(sub, current, prefix + d + "/")}</details></li>`;
  }
  for (const f of node.files.sort((a, b) => cmp(a.name, b.name))) {
    h += `<li class="file${f.rel === current ? " active" : ""}"><a href="${urlOf(f.rel)}">${esc(f.name)}</a></li>`;
  }
  return h + "</ul>";
}

function page({ title, body, headings, rel }) {
  const toc = headings.filter((h) => h.level >= 2 && h.level <= 4);
  const outline = toc.length
    ? `<aside class="outline"><div class="outline-title">On this page</div><ul>${toc
        .map((h) => `<li class="l${h.level}"><a href="#${h.id}">${esc(h.text)}</a></li>`)
        .join("")}</ul></aside>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} - ${SITE_NAME}</title>
<link rel="icon" href="${BASE}/mbcs.png">
<link rel="stylesheet" href="${BASE}/style.css">
<script>try{var t=localStorage.getItem("site-theme")||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body>
<button class="menu-btn" aria-label="Menu" onclick="document.body.classList.toggle('nav-open')">&#9776;</button>
<nav class="sidebar">
  <a class="logo" href="${urlOf(INDEX)}"><img src="${BASE}/mbcs.png" alt="MBCS"></a>
  <a class="site-name" href="${urlOf(INDEX)}">${SITE_NAME}</a>
  <label class="theme-toggle" title="Toggle theme"><input type="checkbox" id="theme"><span class="slider"><svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg><svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg></span></label>
  <div class="search"><input id="q" type="search" placeholder="Search page or heading..." autocomplete="off"><ul id="results"></ul></div>
  <div class="tree">${renderTree(tree, rel)}</div>
</nav>
<main>
  <article class="markdown">
    <h1 class="page-title">${esc(title)}</h1>
    ${body}
  </article>
  <footer>Published with GitHub Pages</footer>
</main>
${outline}
<script>window.BASE="${BASE}"</script>
<script src="${BASE}/site.js"></script>
${body.includes('class="mermaid"') ? `<script type="module">import m from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";m.initialize({startOnLoad:false,theme:document.documentElement.dataset.theme==="dark"?"dark":"default"});m.run();</script>` : ""}
</body>
</html>`;
}

// ---- build ----
fs.mkdirSync(out, { recursive: true });
for (const e of fs.readdirSync(out)) fs.rmSync(path.join(out, e), { recursive: true, force: true });
const write = (rel, data) => {
  const p = path.join(out, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
};

const searchIndex = [];
for (const n of notes) {
  const src = fs.readFileSync(n.file, "utf8");
  const env = { headings: [] };
  const body = callouts(md.render(preprocess(src, n.rel), env));
  const title = path.posix.basename(n.rel);
  write(n.rel + ".html", page({ title, body, headings: env.headings, rel: n.rel }));
  write(n.rel + "/index.html", page({ title, body, headings: env.headings, rel: n.rel }));
  searchIndex.push({ t: title, u: urlOf(n.rel), h: env.headings.map((h) => ({ t: h.text, i: h.id })) });
}
// redirects for moved/renamed pages: site/redirects.json maps "Old/Path" -> "New/Path" (no .md)
const redirectsFile = path.join(root, "site", "redirects.json");
const redirects = fs.existsSync(redirectsFile) ? JSON.parse(fs.readFileSync(redirectsFile, "utf8")) : {};
for (const [from, to] of Object.entries(redirects)) {
  if (from.startsWith("_")) continue; // keys starting with _ are comments
  if (!byLower.has(to.toLowerCase())) { warn(`site/redirects.json: target page does not exist: ${to}`); continue; }
  if (byLower.has(from.toLowerCase())) { warn(`site/redirects.json: "${from}" still exists as a page, redirect ignored`); continue; }
  const dest = urlOf(to);
  const html = `<!doctype html><meta charset="utf-8"><title>Moved</title><meta http-equiv="refresh" content="0; url=${dest}"><link rel="canonical" href="${dest}"><script>location.replace(${JSON.stringify(dest)}+location.hash)</script><a href="${dest}">This page has moved</a>`;
  write(from + ".html", html);
  write(from + "/index.html", html);
}

// root redirects to the index note
const target = urlOf(INDEX);
write("index.html", `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><script>location.replace("${target}")</script><a href="${target}">${SITE_NAME}</a>`);
write("404.html", `<!doctype html><meta charset="utf-8"><title>Not found - ${SITE_NAME}</title><link rel="stylesheet" href="${BASE}/style.css"><main style="margin:4rem auto;max-width:30rem;padding:1rem"><h1>Page not found</h1><p><a href="${target}">Go to ${SITE_NAME}</a></p></main>`);
write("search.json", JSON.stringify(searchIndex));
write(".nojekyll", "");
for (const a of assets) write(a, fs.readFileSync(path.join(root, a === "mbcs.png" ? "site/mbcs.png" : a)));
for (const f of ["style.css", "site.js"]) write(f, fs.readFileSync(path.join(root, "site", f)));
console.log(`Built ${notes.length} pages, ${assets.length} assets -> ${out}`);

if (!byLower.has(INDEX.toLowerCase())) warn(`Home page ${INDEX}.md does not exist; set INDEX in site/build.mjs`);
if (warnings.length) {
  console.log(`
${warnings.length} warning(s):`);
  for (const w of warnings) {
    console.log("  - " + w);
    if (process.env.GITHUB_ACTIONS) console.log(`::warning::${w}`); // shown on the Actions run page
  }
  if (process.env.STRICT) process.exit(1);
}

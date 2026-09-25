# Star Wars Audiobooks — The Complete Library, by Era

A self-contained, interactive reference for every canon Star Wars audiobook
(plus a Legends companion), organized into Lucasfilm's official timeline eras.
Tap an era to open an accordion of titles with publisher descriptions, dates,
narrators, and cover art.

## What's in this folder

- `index.html` — the page shell, styling, and layout (open this to view)
- `data.js`    — the full dataset (all eras, titles, and cover URLs)
- `app.js`     — the rendering and navigation logic

These three files are the whole app. There is no build step and no framework.

## How to view it

**Locally:** open `index.html` in any modern web browser (double-click it, or
File > Open). Everything runs client-side.

**Hosted (to get a shareable link):** upload all three files, keeping them in the
same folder, to any static host. `index.html` must stay the entry point.
Options that work with zero configuration:

- **GitHub Pages** — commit the folder to a repo, enable Pages in Settings.
- **Netlify** — drag the folder onto app.netlify.com/drop.
- **Cloudflare Pages / Vercel** — point them at the folder.

## Making it work fully offline (optional)

By default the covers stream from Wookieepedia, so they need an internet
connection. To bake every cover into the file for true offline use, run the
included script on your own machine:

```
python3 embed_covers.py
```

It reads `data.js`, downloads each cover, base64-encodes it, and writes
`data-offline.js` with the images inlined. To switch the app over, back up your
original `data.js`, then rename `data-offline.js` to `data.js` (or point
`index.html`'s `<script src>` at `data-offline.js`). Needs only Python 3.8+ —
no installs. The offline file will be tens of MB; that's the tradeoff for
zero internet dependency.

## Notes

- **Cover images** load from Wookieepedia's CDN (`static.wikia.nocookie.net`).
  They require an internet connection. If any cover ever 404s (Wookieepedia
  occasionally re-uploads files), update its URL in `data.js`.
- **Content** — publisher summaries © Del Rey / Random House Worlds /
  Disney–Lucasfilm Press. Dates and narrators verified against Wookieepedia and
  publisher listings.
- **Editing** — to add a title, copy an existing entry object in `data.js` and
  fill in its fields (`phase`, `cat`, `title`, `author`, `narrator`, `pubdate`,
  `publisher`, `timeline`, `runtime`, `cover`, `lead`, `summary`).

---

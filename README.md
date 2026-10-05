# Waraqa – question paper maker

Make Arabic, English and Malayalam question papers and mark sheets on a phone.
React + Vite, no backend. Everything is saved in the browser (IndexedDB) and works offline once installed.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # installable PWA in dist/
npm run build:single # one self-contained HTML file in dist-single/
```

## Put it online (needed for "Install app" on phones)

The PWA needs HTTPS hosting. Any static host works:

- **Vercel**: import the GitHub repo, framework "Vite", build `npm run build`, output `dist`.
- **Netlify**: build `npm run build`, publish directory `dist`.
- **GitHub Pages**: run `npm run build` and publish `dist/` (paths are relative, so a sub-folder works).

Open the site on the phone in Chrome → menu (⋮) → *Install app*. On iPhone: Safari → Share → *Add to Home Screen*.

## What is inside

| Folder | What it does |
|---|---|
| `src/lib/models.js` | The 16 question types, their default content, title presets and the "paste many" parsers |
| `src/lib/templates.js` | The 6 paper templates (built from real papers) and default design settings |
| `src/paper/render.jsx` | Turns a paper into printable blocks (headers, headings, every question type) |
| `src/paper/Pager.jsx` | Measures blocks and splits them into A4 pages, scaled preview, thumbnails |
| `src/editor/*` | Phone-first editor: sections, per-type editors, paper details, design panel |
| `src/marksheet/MarkSheet.jsx` | Cumulative mark sheets with totals, ranks, Ab/Nil and CSV export |
| `src/export/stage.jsx` | PDF / images / print / share (renders pages off-screen, html-to-image + jsPDF) |
| `src/export/docx.js` | Editable Word export with right-to-left paragraphs |
| `src/ui/ArabicKeyboard.jsx` | On-screen Arabic keyboard with harakat, digits and a blank key |
| `src/lib/db.js` | IndexedDB storage, backup and restore |

## Adding a template

Add an entry to `TEMPLATES` in `src/lib/templates.js`: a `header` (style `classic`, `periodic`, `annual` or `boxed`),
`settings` overrides, and a `sample()` function returning sections built with `S(type, title, marks, fields)`.
Teachers can also save any paper as "My template" from the app.

## Data safety

Papers live only in the browser on that device. Use **Settings → Back up everything** regularly;
the backup file can be restored on any phone. The app asks the browser for persistent storage so it is not cleared automatically.

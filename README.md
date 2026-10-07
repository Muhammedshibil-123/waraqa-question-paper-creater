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

## Connect to ChatGPT / Claude (MCP connector)

A teacher uploads a photo of questions to ChatGPT or Claude and asks for a paper. The AI calls the Waraqa connector,
which saves the paper for 30 days and returns a short link (`…/#/import/<id>`). Opening the link loads the paper
into Waraqa on that device, ready to check and download as PDF. Papers are still stored only on the device; the
connector keeps nothing but those 30-day links. Needs internet.

It runs on the same Vercel project as the app: `api/mcp.js` is the connector and `api/paper/[id].js` serves the links.
Set up once:

1. Vercel dashboard → the project → **Storage** → *Create* → **Upstash for Redis** (free plan) → connect it to the project.
   This adds the `KV_REST_API_URL` / `KV_REST_API_TOKEN` variables the connector uses.
2. Redeploy (push to GitHub, or *Deployments → Redeploy*).
3. Connector URL: `https://<your-site>.vercel.app/api/mcp`

- **Claude**: Settings → Connectors → *Add custom connector* → paste the connector URL.
- **ChatGPT** (paid plan, on chatgpt.com): Settings → Apps & Connectors → Advanced settings → turn on *Developer mode*,
  then *Create*: name `Waraqa`, MCP server URL as above, authentication *No authentication*.

Locally, `npx vercel dev` runs the app and the connector together (papers are kept in memory when Redis is not set).

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
| `src/lib/fromSpec.js` | Turns a paper sent by the AI connector into a Waraqa paper |
| `server/` | The MCP connector (`mcp.js`) and the Cloudflare Worker entry (`worker.js`) |

## Adding a template

Add an entry to `TEMPLATES` in `src/lib/templates.js`: a `header` (style `classic`, `periodic`, `annual` or `boxed`),
`settings` overrides, and a `sample()` function returning sections built with `S(type, title, marks, fields)`.
Teachers can also save any paper as "My template" from the app.

## Data safety

Papers live only in the browser on that device. Use **Settings → Back up everything** regularly;
the backup file can be restored on any phone. The app asks the browser for persistent storage so it is not cleared automatically.

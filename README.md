# Columbus Ballot Issues 8 & 9 Infographic

An editable, nonpartisan visual guide to the two Columbus City Council charter amendments on the November 3, 2026 ballot.

## Files

- `index.html` and `styles.css` contain the shared editable layout.
- `assets/qr-election-info.svg` links to the Franklin County Board of Elections 2026 election page.
- `SOURCES.md` records verified facts, qualifications, and editorial corrections.
- `output/` contains the high-resolution letter PNG, mobile PNG, and print-ready PDF.
- `site/` contains the editable companion landing page.
- `site/sitemap.xml`, `site/robots.txt`, and the IndexNow key file are copied into every website build.
- `dist/` is the generated, self-contained website with bundled downloads.

## Rebuild

Install the development dependencies once, then regenerate the QR code and all exports:

```powershell
npm install
npm run build
```

To edit the copy or design, change `index.html` or `styles.css`, then run `npm run export`. Run `npm run assets` only when the QR destination changes.

To rebuild only the share page after changing `site/index.html` or `site/site.css`:

```powershell
npm run site:build
npm run site:preview
```

## Publish without Codex

The companion site is fully static and has no server-side runtime or external build service dependency. To publish it yourself:

1. Install a current Node.js LTS release and run `npm ci` in this repository.
2. Regenerate the infographic and website bundle:

   ```powershell
   npm run build
   npm run site:qa
   ```

3. Confirm that `dist/` contains `index.html`, `site.css`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `.openai/hosting.json`, the `sources/` page, and all three files under `downloads/`.
4. Upload the **contents of `dist/`** to the web root of any static host. For services such as Cloudflare Pages or Netlify, use `npm run build` as the build command and `dist` as the output/publish directory.
5. Point the desired domain at that host, enable HTTPS, and verify these public URLs:

   - `/`
   - `/favicon.ico`
   - `/robots.txt`
   - `/sitemap.xml`
   - `/sources/`
   - `/downloads/columbus-issues-8-9-print.pdf`

Keep `.openai/hosting.json` unchanged when updating the existing Sites project. Never place repository credentials, deployment tokens, or other secrets in `site/` or `dist/`.

After publishing changed pages, notify participating search engines with `npm run site:indexnow`. Submit `https://issue8and9.org/sitemap.xml` once in Bing Webmaster Tools, then use its Sitemap and URL Inspection reports to monitor discovery and indexing.

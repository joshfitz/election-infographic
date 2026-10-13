# Columbus Ballot Issues 8 & 9 Infographic

An editable, nonpartisan visual guide to the two Columbus City Council charter amendments on the November 3, 2026 ballot.

## Files

- `index.html` and `styles.css` contain the shared editable layout.
- `assets/qr-election-info.svg` links to the Franklin County Board of Elections 2026 election page.
- `SOURCES.md` records verified facts, qualifications, and editorial corrections.
- `output/` contains the high-resolution letter PNG, mobile PNG, and print-ready PDF.
- `site/` contains the editable companion landing page.
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

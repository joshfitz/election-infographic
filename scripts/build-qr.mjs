import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "assets", "qr-election-info.svg");
const electionUrl = "https://www.vote.franklincountyohio.gov/election-info/2026";

const svg = await QRCode.toString(electionUrl, {
  type: "svg",
  errorCorrectionLevel: "M",
  margin: 1,
  color: { dark: "#003B70", light: "#FFFFFF" },
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, svg, "utf8");
console.log(`Wrote ${path.relative(root, outputPath)} for ${electionUrl}`);


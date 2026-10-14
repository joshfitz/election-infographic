import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "site");
const outputDir = path.join(root, "output");
const distDir = path.join(root, "dist");
const downloadsDir = path.join(distDir, "downloads");

await rm(distDir, { recursive: true, force: true });
await mkdir(downloadsDir, { recursive: true });

await cp(siteDir, distDir, { recursive: true });

for (const requiredFile of ["index.html", "site.css", "favicon.ico", "robots.txt"]) {
  const details = await stat(path.join(distDir, requiredFile));
  if (!details.isFile() || details.size === 0) {
    throw new Error(`Required site file is missing or empty: ${requiredFile}`);
  }
}

const artifacts = [
  [path.join(outputDir, "columbus-issues-8-9-letter.png"), "columbus-issues-8-9-letter.png"],
  [path.join(outputDir, "columbus-issues-8-9-mobile.png"), "columbus-issues-8-9-mobile.png"],
  [path.join(outputDir, "pdf", "columbus-issues-8-9-print.pdf"), "columbus-issues-8-9-print.pdf"],
];

for (const [source, filename] of artifacts) {
  await cp(source, path.join(downloadsDir, filename));
}

const hostingSource = path.join(root, ".openai", "hosting.json");
try {
  const hosting = JSON.parse(await readFile(hostingSource, "utf8"));
  await mkdir(path.join(distDir, ".openai"), { recursive: true });
  await writeFile(
    path.join(distDir, ".openai", "hosting.json"),
    `${JSON.stringify(hosting, null, 2)}\n`,
    "utf8",
  );
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log("Built static site in dist/");

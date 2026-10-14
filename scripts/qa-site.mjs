import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const qaDir = path.join(root, "tmp", "site-qa");
const pageUrl = pathToFileURL(path.join(distDir, "index.html")).href;
const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const browserExecutable = browserCandidates.find((candidate) => existsSync(candidate));

await rm(qaDir, { recursive: true, force: true });
await mkdir(qaDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});

async function checkPage(name, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(pageUrl, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const checks = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    imageCount: document.images.length,
    imagesLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
    downloadCount: document.querySelectorAll("a[download]").length,
    brokenAnchors: [...document.querySelectorAll('a[href^="#"]')]
      .map((link) => link.getAttribute("href"))
      .filter((href) => href !== "#" && !document.querySelector(href)),
    recommendedFormat: document.documentElement.dataset.recommendedFormat,
    recommendedCards: document.querySelectorAll(".download-card.is-recommended").length,
    firstDownloadFormat: document.querySelector(".download-card")?.dataset.format,
    primaryHref: document.querySelector("#recommended-guide-link")?.getAttribute("href"),
    previewHref: document.querySelector("#preview-link")?.getAttribute("href"),
  }));

  const expectedFormat = viewport.width <= 720 ? "mobile" : "letter";
  const expectedAsset = expectedFormat === "mobile"
    ? "downloads/columbus-issues-8-9-mobile.png"
    : "downloads/columbus-issues-8-9-letter.png";
  if (
    checks.horizontalOverflow ||
    !checks.imagesLoaded ||
    checks.downloadCount !== 4 ||
    checks.brokenAnchors.length ||
    checks.recommendedFormat !== expectedFormat ||
    checks.recommendedCards !== 1 ||
    checks.firstDownloadFormat !== expectedFormat ||
    checks.primaryHref !== expectedAsset ||
    checks.previewHref !== expectedAsset
  ) {
    throw new Error(`${name} failed: ${JSON.stringify(checks)}`);
  }

  await page.screenshot({ path: path.join(qaDir, `${name}.png`), fullPage: true });
  await context.close();
  console.log(`${name}: ${JSON.stringify(checks)}`);
}

try {
  await checkPage("desktop", { width: 1440, height: 1000 });
  await checkPage("mobile", { width: 390, height: 844 });
} finally {
  await browser.close();
}

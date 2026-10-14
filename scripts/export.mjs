import { mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "output");
const pdfDir = path.join(outputDir, "pdf");

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browserExecutable = browserCandidates.find((candidate) => existsSync(candidate));

await mkdir(pdfDir, { recursive: true });
const pageUrl = pathToFileURL(path.join(root, "index.html")).href;
const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});

async function assertLayout(page, name) {
  const checks = await page.evaluate(() => {
    const sheet = document.querySelector(".sheet");
    const sheetBox = sheet.getBoundingClientRect();
    const problems = [...document.querySelectorAll(".sheet *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const box = element.getBoundingClientRect();
        return (
          box.right > sheetBox.right + 0.5 ||
          box.bottom > sheetBox.bottom + 0.5 ||
          box.left < sheetBox.left - 0.5 ||
          box.top < sheetBox.top - 0.5
        );
      })
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`)
      .slice(0, 12);
    return {
      problems,
      issue8DistrictSeats: document.querySelectorAll(".issue-8 .seats i.district").length,
      issue9DistrictSeats: document.querySelectorAll(".issue-9 .seats i.district").length,
      issue9CitywideSeats: document.querySelectorAll(".issue-9 .seats i.citywide").length,
      matrixRows: document.querySelectorAll(".matrix .matrix-row").length,
      sameOutcomeExplained: document.querySelector(".matrix .matrix-row:last-child")?.textContent.includes("No extra structural effect"),
      phaseInExplained: document.querySelector(".matrix-note")?.textContent.includes("11 beginning in 2028") && document.querySelector(".matrix-note")?.textContent.includes("13 beginning in 2030"),
      redistrictingExplained: document.querySelector(".issue-9 .proposal-note")?.textContent.includes("New boundaries used in 2029"),
      loadedImages: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
    };
  });
  if (checks.problems.length) {
    throw new Error(`${name} contains out-of-bounds elements: ${checks.problems.join(", ")}`);
  }
  if (
    checks.issue8DistrictSeats !== 9 ||
    checks.issue9DistrictSeats !== 9 ||
    checks.issue9CitywideSeats !== 4 ||
    checks.matrixRows !== 4 ||
    !checks.sameOutcomeExplained ||
    !checks.phaseInExplained ||
    !checks.redistrictingExplained
  ) {
    throw new Error(`${name} failed content counts: ${JSON.stringify(checks)}`);
  }
  if (!checks.loadedImages) throw new Error(`${name} contains an unloaded image asset.`);
}

try {
  const letterContext = await browser.newContext({
    viewport: { width: 850, height: 1100 },
    deviceScaleFactor: 3,
  });
  const letterPage = await letterContext.newPage();
  await letterPage.goto(`${pageUrl}?layout=letter`, { waitUntil: "load" });
  await letterPage.evaluate(() => document.fonts.ready);
  await assertLayout(letterPage, "Letter layout");
  await letterPage.locator(".sheet").screenshot({
    path: path.join(outputDir, "columbus-issues-8-9-letter.png"),
  });
  await letterPage.emulateMedia({ media: "print" });
  await letterPage.pdf({
    path: path.join(pdfDir, "columbus-issues-8-9-print.pdf"),
    width: "8.5in",
    height: "11in",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: true,
  });
  await letterContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${pageUrl}?layout=mobile`, { waitUntil: "load" });
  await mobilePage.evaluate(() => document.fonts.ready);
  await assertLayout(mobilePage, "Mobile layout");
  await mobilePage.locator(".sheet").screenshot({
    path: path.join(outputDir, "columbus-issues-8-9-mobile.png"),
  });
  await mobileContext.close();

  for (const file of [
    path.join(outputDir, "columbus-issues-8-9-letter.png"),
    path.join(outputDir, "columbus-issues-8-9-mobile.png"),
    path.join(pdfDir, "columbus-issues-8-9-print.pdf"),
  ]) {
    const details = await stat(file);
    console.log(`${path.relative(root, file)} (${details.size.toLocaleString()} bytes)`);
  }
} finally {
  await browser.close();
}


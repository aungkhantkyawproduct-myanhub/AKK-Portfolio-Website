import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
await fs.mkdir("artifacts/reference-motion", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.goto(pathToFileURL(process.argv[2]).href);
  await page.waitForFunction(
    () => document.querySelector("video")?.readyState >= 2,
  );
  const duration = await page.evaluate(
    () => document.querySelector("video").duration,
  );
  for (const fraction of [0.15, 0.35, 0.6, 0.85]) {
    await page.evaluate((t) => {
      const v = document.querySelector("video");
      v.pause();
      v.currentTime = t;
    }, duration * fraction);
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `artifacts/reference-motion/${fraction}.png`,
    });
  }
  console.log({ duration });
} finally {
  await browser.close();
}

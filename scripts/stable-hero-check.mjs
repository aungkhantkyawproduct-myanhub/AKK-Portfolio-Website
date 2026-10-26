import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/stable-hero", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-painted="true"]') &&
      window.__worldDiagnostic,
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(800);
  const first = await page.evaluate(() => window.__worldDiagnostic());
  await page.screenshot({
    path: `artifacts/stable-hero/${name}-first-live.png`,
  });
  await page.waitForTimeout(2500);
  const later = await page.evaluate(() => window.__worldDiagnostic());
  expect(first.camera).toEqual([0, 4, 12]);
  expect(later.camera).toEqual(first.camera);
  expect(later.cameraQuaternion).toEqual(first.cameraQuaternion);
  await expect(page.locator('[class*="heroPoster"]')).toHaveCount(0);
  await page.screenshot({ path: `artifacts/stable-hero/${name}-settled.png` });
  expect(errors).toEqual([]);
  results.push({ name, first, later, errors });
  await page.close();
}
await browser.close();
await fs.writeFile(
  "artifacts/stable-hero/results.json",
  JSON.stringify(results, null, 2),
);
console.log(
  "Desktop/mobile hero camera and projection stay identical after first live frame. No screenshot swap.",
);

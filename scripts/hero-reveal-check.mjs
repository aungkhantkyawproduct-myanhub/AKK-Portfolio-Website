import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/hero-reveal", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [],
  timings = [];
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({ viewport: { width, height } }),
    page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__loaderSamples = [];
    new MutationObserver(() => {
      const el = document.querySelector("[role=status]");
      if (el) {
        const n = parseInt(el.textContent.match(/(\d+)\s*%/)?.[1] ?? "-1");
        if (n >= 0 && window.__loaderSamples.at(-1)?.n !== n)
          window.__loaderSamples.push({ n, t: performance.now() });
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-label"],
    });
  });
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => performance.getEntriesByName("portfolio-loader-finish").length > 0,
    null,
    { timeout: 30000 },
  );
  await expect(page.getByRole("status")).toHaveCount(0);
  const timing = await page.evaluate(() => {
    const a = performance.getEntriesByName("portfolio-loader-start").at(-1),
      b = performance.getEntriesByName("portfolio-loader-finish").at(-1);
    return { ms: b.startTime - a.startTime, samples: window.__loaderSamples };
  });
  console.log(name, "intro", Math.round(timing.ms), "ms");
  timings.push({ name, ...timing });
  expect(timing.ms).toBeLessThan(3000);
  await expect(page.locator("h1")).toHaveText("Aung Khant Kyaw");
  await expect(
    page.locator("header").getByRole("button", { name: "AKK", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sound off", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sound on", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  await page.waitForFunction(() => window.__worldDiagnostic);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `artifacts/hero-reveal/${name}-hero.png` });
  await expect(
    page.locator('aside[aria-label="Journey chapters"]'),
  ).toBeVisible();
  await context.close();
}
await browser.close();
await fs.writeFile(
  "artifacts/hero-reveal/timing.json",
  JSON.stringify({ errors, timings }, null, 2),
);
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "Under-three-second intro, hero, logo, rail and sound icons passed.",
);

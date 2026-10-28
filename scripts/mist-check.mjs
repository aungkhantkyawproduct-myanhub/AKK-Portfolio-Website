import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const out = "artifacts/blurred-mist";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [],
  errors = [];
try {
  for (const [name, width, height, dpr, tier] of [
    ["desktop-high", 1917, 907, 1.25, "high"],
    ["desktop-medium", 1440, 900, 1.5, "medium"],
    ["desktop-low", 1440, 900, 1, "low"],
    ["mobile", 390, 844, 3, "low"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: dpr,
      isMobile: name === "mobile",
      hasTouch: name === "mobile",
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (
        m.type() === "error" &&
        /shader|WebGLProgram|feedback loop|GL_INVALID/.test(m.text())
      )
        errors.push(m.text());
    });
    await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        window.__worldDiagnostic &&
        !document.querySelector('[role="status"]') &&
        window.__sceneStats,
      null,
      { timeout: 60000 },
    );
    await page.evaluate(async (quality) => {
      const { useJourney } = await import("/src/app/store.ts");
      useJourney.setState({ qualityTier: quality });
    }, tier);
    const canvas = await page.locator("canvas").elementHandle();
    const frames = [];
    for (const p of [0.055, 0.09, 0.125, 0.15]) {
      await page.evaluate((progress) => window.__debugProgress(progress), p);
      await page.waitForTimeout(1800);
      const probe = await page.evaluate(() => window.__mistProbe());
      expect(probe.passes).toBe(3);
      expect(Math.max(...probe.dimensions)).toBeLessThanOrEqual(384);
      expect(probe.softness).toBeGreaterThanOrEqual(18);
      // Inspect actual final GPU pixels: a wide tonal range with gentle neighbors.
      expect(probe.levels).toBeGreaterThan(12);
      expect(probe.maxNeighbor).toBeLessThanOrEqual(4);
      frames.push({ p, ...probe });
      await page.screenshot({ path: `${out}/${name}-${p}.png` });
    }
    await page.waitForTimeout(1800);
    const drift = await page.evaluate(() => window.__mistProbe());
    expect(drift.signature).not.toBe(frames.at(-1).signature);
    await page.screenshot({ path: `${out}/${name}-drift.png` });
    if (name === "mobile") {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(500);
      // Rotation changes the document's scroll distance: return to the mist.
      await page.evaluate(() => window.__debugProgress(0.09));
      await page.waitForTimeout(1800);
      const resized = await page.evaluate(() => window.__mistProbe());
      expect(resized.dimensions[0]).toBeGreaterThan(resized.dimensions[1]);
      expect(resized.maxNeighbor).toBeLessThanOrEqual(4);
      await page.screenshot({ path: `${out}/mobile-landscape.png` });
    }
    await page.evaluate(() => window.__debugProgress(0.2));
    await page.waitForTimeout(2000);
    expect((await page.evaluate(() => window.__mistProbe())).passes).toBe(0);
    expect(
      await page.evaluate(
        (el) => el === document.querySelector("canvas"),
        canvas,
      ),
    ).toBe(true);
    results.push({ name, frames, drift });
    await page.close();
  }
  expect(errors).toEqual([]);
} finally {
  await browser.close();
  await fs.writeFile(
    `${out}/results.json`,
    JSON.stringify({ results, errors }, null, 2),
  );
}
console.log(
  "Mist GPU gradients, Gaussian passes, drift, quality tiers, Retina resize and idle suspension passed.",
);

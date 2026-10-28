import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const baseline = process.argv.includes("--baseline");
const out = `artifacts/${baseline ? "fog-growth-before" : "fog-growth"}`;
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [],
  errors = [];
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: name === "mobile" ? 2 : 1,
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && /shader|WebGLProgram/.test(m.text()))
        errors.push(m.text());
    });
    await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        window.__worldDiagnostic && !document.querySelector('[role="status"]'),
      null,
      { timeout: 60000 },
    );
    const canvas = await page.locator("canvas").elementHandle();
    const samples = [];
    const steps = baseline
      ? [0.06, 0.095, 0.13, 0.3, 0.36]
      : [
          0.04, 0.065, 0.09, 0.115, 0.145, 0.17, 0.255, 0.275, 0.3, 0.34, 0.38,
          0.42, 0.5, 0.65, 0.8,
        ];
    for (const p of steps) {
      await page.evaluate((v) => window.__debugProgress(v), p);
      await page.waitForTimeout(1500);
      const state = await page.evaluate(() => window.__worldDiagnostic());
      samples.push({ p, ...state });
      await page.screenshot({ path: `${out}/${name}-${p}.png` });
    }
    if (!baseline) {
      expect(samples.find((s) => s.p === 0.09).cloudOpacity).toBeGreaterThan(
        0.7,
      );
      expect(samples.find((s) => s.p === 0.17).cloudOpacity).toBeLessThan(
        0.001,
      );
      const forward = samples.find((s) => s.p === 0.34).growth;
      await page.evaluate(() => window.__debugProgress(0.34));
      await page.waitForTimeout(2200);
      const reverse = await page.evaluate(() => window.__worldDiagnostic());
      expect(reverse.growth).toBeCloseTo(forward, 4);
      expect(
        await page.evaluate(
          (el) => el === document.querySelector("canvas"),
          canvas,
        ),
      ).toBe(true);
      await page.screenshot({ path: `${out}/${name}-reverse-sprout.png` });
    }
    results.push({ name, samples });
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
  baseline
    ? "Baseline fog/growth captured."
    : "Fog, intermediate growth, reverse growth and persistent canvas checks passed.",
);

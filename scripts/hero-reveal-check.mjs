import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/hero-reveal", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [],
  errors = [];
for (const [name, width, height, delay] of [
  ["desktop", 1440, 900, 0],
  ["mobile", 390, 844, 0],
  ["delayed", 1440, 900, 2200],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", (e) => errors.push(e.message));
  let releaseModule;
  const moduleGate = new Promise(resolve => { releaseModule = resolve; });
  if (delay)
    await page.route("**/src/canvas/World.tsx*", async (route) => {
      await moduleGate;
      await route.continue();
    });
  await page.addInitScript(() => {
    window.__revealSamples = [];
    const sample = () => {
      const loader = document.querySelector("[data-phase]");
      const canvas = document.querySelector("canvas");
      if (loader) {
        const phase = loader.getAttribute("data-phase");
        if (window.__revealSamples.at(-1)?.phase !== phase)
          window.__revealSamples.push({
            t: performance.now(),
            phase,
            ready: loader.getAttribute("data-assets-ready"),
            painted: !!document.querySelector('[data-painted="true"]'),
            canvasOpacity: canvas ? getComputedStyle(canvas).opacity : null,
          });
      }
    };
    new MutationObserver(sample).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-phase", "data-painted"],
    });
  });
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  if (delay) {
    await page.waitForTimeout(1400);
    await expect(page.getByRole("status")).toHaveAttribute(
      "data-phase",
      "loading",
    );
    await page.screenshot({
      path: `artifacts/hero-reveal/${name}-held-mist.png`,
    });
    releaseModule();
  }
  await page.waitForFunction(
    () => performance.getEntriesByName("portfolio-hero-reveal").length > 0,
    null,
    { timeout: 60000 },
  );
  const reveal = await page.evaluate(() => ({
    samples: window.__revealSamples,
    frame: window.__worldDiagnostic?.(),
    paint: performance.getEntriesByName("portfolio-world-painted").at(-1)
      ?.startTime,
    reveal: performance.getEntriesByName("portfolio-hero-reveal").at(-1)
      ?.startTime,
  }));
  expect(reveal.frame.earthTextureReady).toBe(true);
  expect(reveal.paint).toBeLessThanOrEqual(reveal.reveal);
  await page.screenshot({ path: `artifacts/hero-reveal/${name}-clearing.png` });
  await page.waitForFunction(
    () => performance.getEntriesByName("portfolio-loader-finish").length > 0,
    null,
    { timeout: 60000 },
  );
  await expect(page.getByRole("status")).toHaveCount(0);
  const timing = await page.evaluate(() => {
    const mark = (n) => performance.getEntriesByName(n).at(-1)?.startTime;
    return {
      start: mark("portfolio-loader-start"),
      paint: mark("portfolio-world-painted"),
      reveal: mark("portfolio-hero-reveal"),
      finish: mark("portfolio-loader-finish"),
      canvasOpacity: getComputedStyle(document.querySelector("canvas")).opacity,
      samples: window.__revealSamples,
    };
  });
  const clearing = timing.samples.find((s) => s.phase === "revealing");
  expect(clearing.ready).toBe("true");
  expect(clearing.painted).toBe(true);
  expect(clearing.canvasOpacity).toBe("1");
  expect(timing.finish - timing.reveal).toBeGreaterThanOrEqual(1750);
  expect(timing.canvasOpacity).toBe("1");
  await page.screenshot({ path: `artifacts/hero-reveal/${name}-hero.png` });
  results.push({ name, ...timing });
  await page.close();
}
await browser.close();
expect(errors).toEqual([]);
await fs.writeFile(
  "artifacts/hero-reveal/timing.json",
  JSON.stringify({ errors, results }, null, 2),
);
console.log(
  "Desktop/mobile and delayed-module reveal keep mist until textured frames exist; slow clearing exposes a visible Earth without a blank interval.",
);

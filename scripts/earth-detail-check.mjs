import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const out = "artifacts/earth-detail";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [],
  errors = [];
try {
  for (const name of [
    "desktop",
    "mobile",
    "missing-8k",
    "gpu-4k",
    "procedural",
  ]) {
    const mobile = name === "mobile";
    const page = await browser.newPage({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
      deviceScaleFactor: mobile ? 3 : 2,
      isMobile: mobile,
      hasTouch: mobile,
    });
    page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && /shader|WebGLProgram/.test(m.text()))
        errors.push(m.text());
    });
    let requested8k = false;
    page.on("request", (request) => {
      if (request.url().includes("earth-day-8k.webp")) requested8k = true;
    });
    if (name === "gpu-4k")
      await page.addInitScript(() => {
        // Simulate the capability reported by an older driver, without changing assets.
        const original = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function (parameter) {
          return parameter === 0x0d33 ? 4096 : original.call(this, parameter);
        };
      });
    if (name === "missing-8k")
      await page.route("**/earth-day-8k.webp", (r) =>
        r.fulfill({ status: 404, body: "" }),
      );
    if (name === "procedural")
      await page.route("**/textures/earth-*.webp", (r) =>
        r.fulfill({ status: 404, body: "" }),
      );
    // A medium laptop and a low-tier phone must both receive 8K detail.
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 }),
    );
    await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        document.querySelector('[data-painted="true"]') &&
        window.__worldDiagnostic,
      null,
      { timeout: 60000 },
    );
    const expected =
      name === "procedural"
        ? 0
        : name === "missing-8k" || name === "gpu-4k"
          ? 4096
          : 8192;
    await page.waitForFunction(
      (w) => window.__worldDiagnostic().earthTexture.width === w,
      expected,
      { timeout: 60000 },
    );
    await page.waitForFunction(
      () => !document.querySelector("[role=status]"),
      null,
      { timeout: 60000 },
    );
    const first = await page.evaluate(() => window.__worldDiagnostic());
    expect(first.earthTexture.dpr).toBe(mobile ? 1.5 : 2);
    expect(first.earthTexture.height).toBe(expected / 2);
    if (expected)
      expect(first.earthTexture.anisotropy).toBeGreaterThanOrEqual(4);
    expect(first.camera).toEqual([0, 4, 12]);
    if (name === "gpu-4k") expect(requested8k).toBe(false);
    expect(first.satellite.visible).toBe(true);
    expect(first.satellite.screen[0]).toBeGreaterThan(30);
    expect(first.satellite.screen[0]).toBeLessThan((mobile ? 390 : 1440) - 30);
    await page.screenshot({ path: `${out}/${name}-hero.png` });
    await page.waitForTimeout(1800);
    const later = await page.evaluate(() => window.__worldDiagnostic());
    expect(later.satellite.phase).toBeGreaterThan(first.satellite.phase);
    const radius = (p) => Math.hypot(p[0], p[1] + 10, p[2]);
    expect(radius(later.satellite.position)).toBeCloseTo(11.2, 6);
    expect(later.cameraQuaternion).toEqual(first.cameraQuaternion);
    // Depth occlusion is handled by the opaque globe, not a fake screen orbit.
    if (name === "desktop" || mobile) {
      await page.evaluate(async (isPhone) => {
        if (isPhone) {
          const { useJourney } = await import("/src/app/store.ts");
          useJourney.setState({ qualityTier: "low" });
        }
        window.__debugProgress(0.15);
      }, mobile);
      await page.waitForTimeout(2500);
      const descended = await page.evaluate(() => window.__worldDiagnostic());
      expect(descended.satellite.visible).toBe(false);
      if (mobile) expect(descended.earthTexture.dpr).toBe(1);
      const buffers = await page.evaluate(() => window.__auroraDiagnostic());
      expect(buffers.targetBuffer).toEqual(buffers.buffer);
      expect(await page.locator("canvas").count()).toBe(1);
      await page.evaluate(() => window.__debugProgress(0));
      await page.waitForTimeout(2500);
      const returned = await page.evaluate(() => window.__worldDiagnostic());
      expect(returned.satellite.visible).toBe(true);
      expect(returned.earthTexture.dpr).toBe(mobile ? 1.5 : 2);
    }
    results.push({ name, first, later });
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
  "8K desktop/mobile, 4K/procedural fallbacks, Retina DPR, satellite motion and descent passed.",
);

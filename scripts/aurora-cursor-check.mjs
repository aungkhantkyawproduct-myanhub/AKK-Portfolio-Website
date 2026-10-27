import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const out = "artifacts/aurora-cursor";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error" && /shader|WebGLProgram/.test(m.text()))
    errors.push(m.text());
});
await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.waitForFunction(
  () =>
    window.__auroraDiagnostic &&
    document.querySelector('[data-painted="true"]'),
  null,
  { timeout: 60000 },
);
await expect(page.locator("canvas")).toHaveCount(1);
await page.evaluate(
  () => (window.savedCanvas = document.querySelector("canvas")),
);
const physics = await page.evaluate(async () => {
  const {
    createAuroraMotion,
    aimAurora,
    advanceAurora,
    resizeAurora,
    stopAurora,
  } = await import("/src/canvas/aurora/motion.ts");
  const make = () => {
    const s = createAuroraMotion();
    s.enabled = true;
    resizeAurora(s, 1440, 900);
    aimAurora(s, 200, 450, 0);
    aimAurora(s, 800, 450, 0.001);
    return s;
  };
  const rates = [30, 60, 120].map((hz) => {
    const s = make();
    for (let i = 0; i < hz / 2; i++) advanceAurora(s, 1 / hz, (i + 1) / hz);
    return { hz, x: s.x, y: s.y, wakeX: s.wakeX };
  });
  const s = make();
  advanceAurora(s, 1 / 60, 1 / 60);
  const first = { x: s.x, vx: s.vx };
  for (let i = 1; i < 9; i++) advanceAurora(s, 1 / 60, (i + 1) / 60);
  const before = s.x;
  advanceAurora(s, 0.1, 0.25);
  const after = s.x;
  const normal = s.x / s.width;
  resizeAurora(s, 720, 450);
  const resizeError = Math.abs(normal - s.x / s.width);
  stopAurora(s);
  aimAurora(s, 90, 70, 10);
  const reentry = [s.x, s.y, s.vx, s.vy];
  return { rates, first, before, after, resizeError, reentry };
});
for (const r of physics.rates)
  expect(Math.abs(r.x - physics.rates[0].x)).toBeLessThan(0.00001);
expect(physics.first.x).toBeGreaterThan(200);
expect(physics.first.x).toBeLessThan(800);
expect(physics.first.vx).toBeGreaterThan(0);
expect(physics.after).toBeGreaterThan(physics.before);
expect(physics.resizeError).toBeLessThan(1e-9);
expect(physics.reentry).toEqual([90, 70, 0, 0]);
for (const mode of ["hero", "profile"]) {
  if (mode === "profile") {
    await page
      .locator("#about-title")
      .evaluate((e) => e.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(2000);
  }
  for (let i = 0; i < 24; i++) {
    await page.mouse.move(210 + i * 18, 465 + Math.sin(i * 0.2) * 55);
    await page.waitForTimeout(40);
  }
  await page.screenshot({ path: `${out}/${mode}-moving.png` });
  const active = await page.evaluate(() => window.__auroraDiagnostic());
  expect(active.renderedEnergy).toBeGreaterThan(0.01);
  await expect
    .poll(() => page.evaluate(() => window.__auroraDiagnostic().time), {
      timeout: 3000,
    })
    .toBeGreaterThan(active.time);
  await page.screenshot({ path: `${out}/${mode}-drifting.png` });
  await page.waitForFunction(
    () =>
      !window.__auroraDiagnostic().initialized &&
      window.__auroraDiagnostic().renderedEnergy === 0,
    null,
    { timeout: 15000 },
  );
  await page.screenshot({ path: `${out}/${mode}-dissipated.png` });
}
expect(
  await page.evaluate(
    () => window.savedCanvas === document.querySelector("canvas"),
  ),
).toBe(true);
await page.waitForFunction(() => window.__sceneStats, null, { timeout: 20000 });
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 900,
  height: 700,
  deviceScaleFactor: 2,
  mobile: false,
});
await page.evaluate(async () => {
  const { useJourney } = await import("/src/app/store.ts");
  useJourney.setState({ qualityTier: "high" });
});
await page.waitForFunction(
  () => {
    const d = window.__auroraDiagnostic();
    return d.dpr === 2 && d.buffer[0] === 1800 && d.targetBuffer[0] === 1800;
  },
  null,
  { timeout: 30000 },
);
const retina = await page.evaluate(() => window.__auroraDiagnostic());
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 720,
  height: 900,
  deviceScaleFactor: 2,
  mobile: false,
});
await page.waitForFunction(
  () => {
    const d = window.__auroraDiagnostic();
    return (
      d.viewport[0] === 720 &&
      d.width === 720 &&
      d.buffer[0] === 1440 &&
      d.targetBuffer[0] === 1440
    );
  },
  null,
  { timeout: 30000 },
);
await page.mouse.move(490, 500);
await page.waitForTimeout(350);
const resized = await page.evaluate(() => window.__auroraDiagnostic());
// Capture through CDP so Playwright does not restore its original viewport.
const retinaCapture = await cdp.send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: false,
});
await fs.writeFile(
  `${out}/retina-resized.png`,
  Buffer.from(retinaCapture.data, "base64"),
);
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 720,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await page.waitForFunction(
  () => {
    const d = window.__auroraDiagnostic();
    return d.dpr === 1 && d.buffer[0] === 720 && d.targetBuffer[0] === 720;
  },
  null,
  { timeout: 30000 },
);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.waitForTimeout(1000);
await expect(page.locator("canvas")).toHaveCount(0);
const coarse = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await coarse.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
expect(
  await coarse.evaluate(async () => {
    const { auroraMotion } = await import("/src/canvas/aurora/motion.ts");
    return auroraMotion.enabled;
  }),
).toBe(false);
await browser.close();
expect(errors).toEqual([]);
await fs.writeFile(
  `${out}/results.json`,
  JSON.stringify(
    {
      errors,
      physics,
      retina,
      resized,
      singleCanvas: true,
      coarseAndReducedMotionDisabled: true,
    },
    null,
    2,
  ),
);
console.log(
  "Frame-rate-independent spring lag/inertia, idle curtains/fade, one canvas, Retina resize/DPR transfer, coarse/reduced motion passed.",
);

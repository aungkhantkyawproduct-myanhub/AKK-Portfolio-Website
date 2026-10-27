import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const out = "artifacts/motion-details";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [],
  results = [];
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /shader|WebGLProgram/.test(m.text()))
      errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      window.__worldDiagnostic &&
      document.querySelector('[data-painted="true"]'),
    null,
    { timeout: 60000 },
  );
  const clouds = [];
  for (const p of [0.06, 0.09, 0.12, 0.15, 0.18]) {
    await page.evaluate((v) => window.__debugProgress(v), p);
    await page.waitForTimeout(1800);
    const state = await page.evaluate(() => window.__worldDiagnostic());
    clouds.push({ p, opacity: state.cloudOpacity });
    await page.screenshot({ path: `${out}/${name}-descent-${p}.png` });
  }
  expect(clouds.find((s) => s.p === 0.09).opacity).toBeGreaterThan(0.7);
  expect(clouds.at(-1).opacity).toBe(0);
  await page.evaluate(() => window.__debugProgress(0.8));
  await page.waitForTimeout(2500);
  const camera = await page.evaluate(() => window.__worldDiagnostic().camera);
  await page.mouse.move(width * 0.12, height * 0.2);
  await page.waitForTimeout(1400);
  const left = await page.evaluate(() => window.__worldDiagnostic());
  await page.mouse.move(width * 0.88, height * 0.8);
  await page.waitForTimeout(1400);
  const right = await page.evaluate(() => window.__worldDiagnostic());
  expect(right.auroraPointer[0] - left.auroraPointer[0]).toBeGreaterThan(1);
  camera.forEach((v, i) =>
    expect(Math.abs(right.camera[i] - v)).toBeLessThan(0.005),
  );
  const sectionStates = [];
  const passages = page.locator("#profile [data-reveal]");
  for (let i = 0; i < (await passages.count()); i++) {
    const el = passages.nth(i);
    const top = await el.evaluate(
      (e) => e.getBoundingClientRect().top + scrollY,
    );
    await page.evaluate((t) => window.scrollTo(0, t - innerHeight * 0.88), top);
    await page.waitForTimeout(1100);
    const entering = await el.evaluate((e) =>
      (e.children.length ? Array.from(e.children) : [e]).map(
        (c) => new DOMMatrixReadOnly(getComputedStyle(c).transform).m42,
      ),
    );
    await page.evaluate((t) => window.scrollTo(0, t - innerHeight * 0.35), top);
    await page.waitForTimeout(1100);
    const settled = await el.evaluate((e) =>
      (e.children.length ? Array.from(e.children) : [e]).map(
        (c) => new DOMMatrixReadOnly(getComputedStyle(c).transform).m42,
      ),
    );
    sectionStates.push({ i, entering, settled });
    expect(Math.max(...entering)).toBeGreaterThan(Math.max(...settled) + 5);
    await page.screenshot({ path: `${out}/${name}-passage-${i}.png` });
  }
  await page
    .locator("#about-title")
    .evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1500);
  await page.mouse.move(width * 0.9, height * 0.4);
  await page.waitForTimeout(1000);
  const cssPointer = await page
    .locator("[data-profile-atmosphere]")
    .evaluate((e) => parseFloat(e.style.getPropertyValue("--aurora-x")));
  expect(cssPointer).toBeGreaterThan(2);
  results.push({
    name,
    clouds,
    cameraStable: true,
    cursorResponse: [left.auroraPointer, right.auroraPointer],
    cssPointer,
    sectionStates,
  });
  await page.close();
}
const page = await browser.newPage({
  reducedMotion: "reduce",
  viewport: { width: 390, height: 844 },
});
await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await expect(page.locator("canvas")).toHaveCount(0);
const transforms = await page
  .locator("#profile [data-reveal] > *")
  .evaluateAll((els) => els.map((e) => getComputedStyle(e).transform));
expect(transforms.every((t) => t === "none")).toBe(true);
await browser.close();
await fs.writeFile(
  `${out}/results.json`,
  JSON.stringify({ errors, results, reducedMotion: true }, null, 2),
);
expect(errors).toEqual([]);
console.log(
  "Atmosphere clears before the seed; cursor bends aurora with stable camera; every biography passage animates; reduced motion remains static.",
);

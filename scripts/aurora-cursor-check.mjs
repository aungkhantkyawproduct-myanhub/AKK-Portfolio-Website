import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const out = "artifacts/aurora-cursor";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.waitForFunction(
  () =>
    window.__worldDiagnostic && document.querySelector('[data-painted="true"]'),
  null,
  { timeout: 60000 },
);
const cursor = page.locator("[data-aurora-cursor]");
expect(await cursor.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe(
  "none",
);
const tree = await page.evaluate(async () => {
  const { createSkeleton } = await import("/src/canvas/tree/skeleton.ts");
  const { segments, leaves } = createSkeleton();
  return {
    segments: segments.length,
    leaves: leaves.length,
    earlyChildren: segments.filter(
      (s) => s.parent >= 0 && s.birth < segments[s.parent].birth,
    ).length,
  };
});
expect(tree.segments).toBeGreaterThan(4000);
expect(tree.leaves).toBeLessThan(125000);
expect(tree.earlyChildren).toBe(0);
for (const mode of ["hero", "profile"]) {
  if (mode === "profile") {
    await page
      .locator("#about-title")
      .evaluate((e) => e.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(2200);
  }
  for (let i = 0; i < 30; i++) {
    await page.mouse.move(120 + i * 22, 400 + Math.sin(i * 0.2) * 105);
    await page.waitForTimeout(35);
    if (i === 18) await page.screenshot({ path: `${out}/${mode}-moving.png` });
  }
  expect(
    await cursor.evaluate((e) => parseFloat(getComputedStyle(e).opacity)),
  ).toBeGreaterThan(0.3);
  const bounds = await cursor
    .locator("[data-wisp]")
    .first()
    .evaluate((e) => ({
      width: e.getBBox().width,
      height: e.getBBox().height,
    }));
  expect(bounds.width).toBeGreaterThan(80);
  expect(bounds.height).toBeGreaterThan(30);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(1900);
  expect(
    await cursor.evaluate((e) => parseFloat(getComputedStyle(e).opacity)),
  ).toBe(0);
  await page.screenshot({ path: `${out}/${mode}-dissipated.png` });
}
await page
  .locator("#profile footer")
  .evaluate((e) => e.scrollIntoView({ block: "end" }));
await page.waitForTimeout(1600);
expect(
  await page
    .locator("#profile footer")
    .evaluate((e) => getComputedStyle(e).borderTopWidth),
).toBe("0px");
await page.screenshot({ path: `${out}/single-footer-divider.png` });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.waitForTimeout(500);
expect(await cursor.evaluate((e) => getComputedStyle(e).display)).toBe("none");
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await mobile.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
expect(
  await mobile
    .locator("[data-aurora-cursor]")
    .evaluate((e) => getComputedStyle(e).display),
).toBe("none");
await browser.close();
expect(errors).toEqual([]);
await fs.writeFile(
  `${out}/results.json`,
  JSON.stringify(
    {
      errors,
      tree,
      localTrail: true,
      dissipates: true,
      coarseAndReducedMotionDisabled: true,
      singleFooterDivider: true,
    },
    null,
    2,
  ),
);
console.log(
  "Local aurora wisps move and dissipate in hero/biography; one canvas; pointer passthrough; reduced/coarse disabled; tree parent ordering and foliage budget verified.",
  tree,
);

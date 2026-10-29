import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/roots-cue", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true }),
  errors = [],
  results = [];
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
    await page.goto("http://127.0.0.1:5173");
    await page.waitForFunction(
      () =>
        window.__worldDiagnostic && !document.querySelector('[role="status"]'),
      null,
      { timeout: 90000 },
    );
    const geometry = await page.evaluate(async () => {
      const { getSkeleton } = await import("/src/canvas/tree/skeleton.ts");
      const { realmAttachments } = await import("/src/canvas/tree/Realms.tsx");
      const { segments } = getSkeleton(),
        roots = segments.filter((s) => s.root);
      return {
        rootCount: roots.length,
        buried: roots.filter((s) => s.endRadius <= 0.004 && s.end.y < 0.1)
          .length,
        reach: Math.max(...roots.map((s) => Math.hypot(s.end.x, s.end.z))),
        scheduleErrors: segments.filter(
          (s) => s.parent >= 0 && s.birth + 1e-6 < segments[s.parent].finish,
        ).length,
        anchorErrors: realmAttachments().filter(
          (a) =>
            !segments.some((s) => !s.root && s.end.distanceTo(a.anchor) < 1e-6),
        ).length,
      };
    });
    expect(geometry.buried).toBeGreaterThan(10);
    expect(geometry.reach).toBeGreaterThan(6);
    expect(geometry.scheduleErrors).toBe(0);
    expect(geometry.anchorErrors).toBe(0);
    const growth = [];
    for (const p of [0.5, 0.95, 0.5, 0.95]) {
      await page.evaluate((p) => window.__debugProgress(p), p);
      await page.waitForTimeout(2200);
      growth.push(
        (await page.evaluate(() => window.__worldDiagnostic())).growth,
      );
    }
    expect(Math.abs(growth[0] - growth[2])).toBeLessThan(0.01);
    await expect(page.locator(".hanging-marker")).toHaveCount(9);
    await page.screenshot({
      path: `artifacts/roots-cue/${name}-roots-stars.png`,
    });
    await page.locator(".hanging-marker").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.evaluate(() =>
      document
        .getElementById("profile")
        .scrollIntoView({ behavior: "instant", block: "start" }),
    );
    await page.waitForTimeout(2600);
    const cue = page.getByRole("button", {
      name: "Scroll to continue",
      exact: true,
    });
    await cue.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/roots-cue/${name}-cue.png` });
    await cue.click();
    await page.waitForTimeout(2300);
    const about = await page.locator("#profile-about").boundingBox();
    expect(about.y).toBeGreaterThanOrEqual(50);
    expect(about.y).toBeLessThan(250);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await cue
        .locator("span")
        .first()
        .evaluate((el) => getComputedStyle(el, "::after").animationName),
    ).toBe("none");
    results.push({ name, geometry, growth, aboutTop: about.y });
    await page.close();
  }
  expect(errors).toEqual([]);
} finally {
  await browser.close();
  await fs.writeFile(
    "artifacts/roots-cue/results.json",
    JSON.stringify({ results, errors }, null, 2),
  );
}
console.log(
  "Root burial and continuity, branch anchors, keyboard stars, circular cue navigation and reduced motion passed.",
);

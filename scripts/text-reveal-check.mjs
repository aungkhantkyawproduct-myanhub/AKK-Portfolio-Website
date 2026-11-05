import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/text-reveal", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => document.documentElement.dataset.journeyReady === "true",
      null,
      { timeout: 90000 },
    );
    await expect(page.locator("h1")).toHaveText("Aung Khant Kyaw");
    await page.waitForTimeout(1600);
    for (const p of [0.3, 0.8, 0.3, 1]) {
      await page.evaluate((p) => window.__debugProgress(p), p);
      await page.waitForFunction(
        () =>
          !!document.querySelector('[aria-hidden="false"] [data-reveal-word]'),
      );
      await page.waitForTimeout(180);
      await page.screenshot({
        path: `artifacts/text-reveal/${name}-${p}-enter.png`,
      });
      await page.waitForTimeout(1600);
      const heading = page.locator(
        'section[data-chapter][aria-hidden="false"] h2',
      );
      expect(
        await heading.locator("[data-reveal-word]").count(),
      ).toBeGreaterThan(1);
      const settled = await heading.evaluate((el) =>
        [...el.children].every(
          (word) =>
            getComputedStyle(word).opacity === "1" &&
            getComputedStyle(word).filter === "none",
        ),
      );
      expect(settled).toBe(true);
    }
    await page
      .locator('header button[aria-label="Experience"]')
      .first()
      .evaluate((el) => el.click());
    await page.locator("#profile-title").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    await expect(page.locator("#profile-title")).toHaveText(
      "The person behind the product.",
    );
    expect(
      await page.locator("#profile-title [data-reveal-word]").count(),
    ).toBeGreaterThan(1);
    await page.screenshot({
      path: `artifacts/text-reveal/${name}-profile.png`,
    });
    for (const target of ["#profile article", "#profile footer"]) {
      const el = page.locator(target).first();
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1600);
      await page.screenshot({
        path: `artifacts/text-reveal/${name}-${target.includes("footer") ? "footer" : "job"}.png`,
      });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(400);
    await expect(page.locator("[data-reveal-word]")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveText("Aung Khant Kyaw");
    expect(errors).toEqual([]);
    results.push({ name, errors, reducedMotion: true, reverseChapter: true });
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    "artifacts/text-reveal/results.json",
    JSON.stringify(results, null, 2),
  );
}
console.log(
  "Text reveals settle, reverse chapters replay, biography/footer render, and reduced motion restores plain text on desktop/mobile.",
);

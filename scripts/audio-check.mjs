import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/audio", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true }),
  results = [];
const baseURL = process.env.AUDIO_TEST_URL ?? "http://127.0.0.1:5173";
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: name === "mobile",
      hasTouch: name === "mobile",
    });
    const errors = [];
    let requested = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (r.url().includes("/audio/seed-to-scale.mp3")) requested++;
    });
    await page.addInitScript(() => {
      window.Audio = new Proxy(window.Audio, {
        construct(Target, args) {
          const track = new Target(...args);
          window.__track = track;
          return track;
        },
      });
    });
    await page.goto(baseURL);
    await page.waitForFunction(
      () => !document.querySelector('[role="status"]'),
      null,
      { timeout: 90000 },
    );
    expect(requested).toBe(0);
    expect(await page.evaluate(() => !!window.__track)).toBe(false);
    const button = page.locator("header button[aria-pressed]");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true", {
      timeout: 30000,
    });
    await page.waitForFunction(() => window.__track.currentTime > 0.1);
    const playing = await page.evaluate(() => ({
      src: window.__track.currentSrc,
      duration: window.__track.duration,
      loop: window.__track.loop,
    }));
    expect(playing.duration).toBeGreaterThan(175);
    expect(playing.loop).toBe(true);
    await page.evaluate(() => {
      window.__track.currentTime = window.__track.duration - 0.2;
    });
    await page.waitForTimeout(1100);
    expect(await page.evaluate(() => window.__track.currentTime)).toBeLessThan(
      3,
    );
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(850);
    expect(await page.evaluate(() => window.__track.paused)).toBe(true);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__track.paused)).toBe(false);
    await button.click();
    await page.waitForTimeout(850);
    await expect(button).toHaveAttribute("aria-pressed", "false");
    expect(await page.evaluate(() => window.__track.paused)).toBe(true);
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await button.click();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.__track.paused)).toBe(false);
    await button.click();
    await page.waitForTimeout(850);
    await page.screenshot({ path: `artifacts/audio/${name}.png` });
    expect(errors).toEqual([]);
    results.push({ name, playing, requested, errors });
    await page.close();
  }
  const failure = await browser.newPage();
  await failure.route("**/audio/seed-to-scale.mp3", (r) => r.abort());
  await failure.goto(baseURL);
  await failure.waitForFunction(
    () => !document.querySelector('[role="status"]'),
    null,
    { timeout: 90000 },
  );
  await failure.locator("header button[aria-pressed]").click();
  await failure.waitForTimeout(2000);
  await expect(failure.locator("header button[aria-pressed]")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(
    failure.getByText(
      "Sound could not start. Please try the sound icon again.",
    ),
  ).toBeVisible();
  await failure.close();
} finally {
  await browser.close();
  await fs.writeFile(
    "artifacts/audio/results.json",
    JSON.stringify(results, null, 2),
  );
}
console.log(
  "Local MP3, explicit opt-in, no preload, duration, looping, mute, rapid toggles, visibility and failure handling passed.",
);

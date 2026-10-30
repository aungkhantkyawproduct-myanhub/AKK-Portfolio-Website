import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";

await fs.mkdir("artifacts/contact-reading", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      hasTouch: name === "mobile",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    // Observe actual pointer/keyboard activation without launching a mail app or LinkedIn.
    await page.addInitScript(() => {
      window.__contactClicks = [];
      document.addEventListener("click", (event) => {
        const anchor = event.target.closest?.(
          'a[href^="mailto:"],a[href*="linkedin.com"]',
        );
        if (!anchor) return;
        window.__contactClicks.push({
          href: anchor.href,
          prevented: event.defaultPrevented,
        });
        event.preventDefault();
      });
    });
    await page.goto("http://127.0.0.1:5173/");
    await page.waitForFunction(
      () => document.documentElement.dataset.journeyReady === "true",
    );
    await page.evaluate(() => window.__debugProgress(0));
    await page.waitForTimeout(1800);
    const hero = await page.locator('[data-chapter="0"]').evaluate((el) => ({
      top: el.getBoundingClientRect().top / innerHeight,
      slogan: el.querySelector("p").textContent,
    }));
    expect(hero.top).toBeLessThanOrEqual(0.185);
    expect(hero.slogan).toBe(
      "Every product has a beginning. This is how I help it grow.",
    );
    const sizes = [];
    for (const [index, progress] of [
      [1, 0.2],
      [2, 0.3],
      [3, 0.5],
      [4, 0.65],
      [5, 0.8],
      [6, 0.95],
      [7, 1],
    ]) {
      await page.evaluate((p) => window.__debugProgress(p), progress);
      await page.waitForTimeout(850);
      const section = page.locator(`[data-chapter="${index}"]`);
      const size = await section.evaluate((el) => ({
        title: parseFloat(getComputedStyle(el.querySelector("h2")).fontSize),
        body: parseFloat(getComputedStyle(el.querySelector("p")).fontSize),
        label: parseFloat(getComputedStyle(el.firstElementChild).fontSize),
        overflow: el.scrollWidth > el.clientWidth + 1,
      }));
      expect(size.title).toBeGreaterThanOrEqual(34);
      expect(size.body).toBeGreaterThanOrEqual(16);
      expect(size.label).toBeGreaterThanOrEqual(12);
      expect(size.overflow).toBe(false);
      sizes.push({ index, ...size });
    }
    const section = page.locator('[data-chapter="7"]');
    const email = section.getByRole("link", { name: /Email me/ });
    const linkedin = section.getByRole("link", { name: /Connect on LinkedIn/ });
    await expect(email).toHaveAttribute(
      "href",
      "mailto:aungkhantkyaw.product@gmail.com",
    );
    await expect(linkedin).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/aungkhantkyawofficial/",
    );
    await expect(linkedin).toHaveAttribute("target", "_blank");
    // Click the arrows themselves, then activate each link with Enter.
    for (const link of [email, linkedin]) {
      await link.locator("svg").click();
      await link.focus();
      await page.keyboard.press("Enter");
    }
    const clicks = await page.evaluate(() => window.__contactClicks);
    expect(clicks.map((c) => c.href)).toEqual([
      "mailto:aungkhantkyaw.product@gmail.com",
      "mailto:aungkhantkyaw.product@gmail.com",
      "https://www.linkedin.com/in/aungkhantkyawofficial/",
      "https://www.linkedin.com/in/aungkhantkyawofficial/",
    ]);
    expect(clicks.every((c) => !c.prevented)).toBe(true);
    await section.evaluate((el) => (el.scrollTop = 0));
    if (name === "mobile") {
      expect(
        await section.evaluate((el) =>
          parseFloat(getComputedStyle(el).maxHeight),
        ),
      ).toBeGreaterThan(600);
      const utility = section.getByRole("button", { name: /Copy email/ });
      const bounds = await utility.boundingBox();
      expect(bounds.y + bounds.height).toBeLessThan(height - 24);
    }
    await page.screenshot({
      path: `artifacts/contact-reading/${name}-contact.png`,
    });
    expect(errors).toEqual([]);
    results.push({ name, hero, sizes, clicks, errors });
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    "artifacts/contact-reading/results.json",
    JSON.stringify(results, null, 2),
  );
}
console.log(
  "Desktop/mobile chapter reading sizes and actual arrow/keyboard link activation passed.",
);

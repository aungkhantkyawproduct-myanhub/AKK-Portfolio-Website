import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/open-story", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [],
  checks = [];
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /shader|WebGLProgram/.test(m.text()))
      errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__debugProgress);
  await page.waitForFunction(
    () => !document.querySelector("[role=status]"),
    null,
    { timeout: 60000 },
  );
  await page.evaluate(() => {
    const swatch = document.createElement("div");
    swatch.id = "logo-swatch";
    Object.assign(swatch.style, {
      position: "fixed",
      inset: "100px auto auto 100px",
      width: "200px",
      height: "90px",
      zIndex: "10000",
      background: "#19807b",
      display: "grid",
      placeItems: "center",
    });
    swatch.append(document.querySelector("header button svg").cloneNode(true));
    document.body.append(swatch);
  });
  await page
    .locator("#logo-swatch")
    .screenshot({ path: `artifacts/open-story/${name}-logo-alpha.png` });
  await page.locator("#logo-swatch").evaluate((el) => el.remove());
  for (const p of [0.15, 0.8, 0.95, 1]) {
    await page.evaluate((v) => window.__debugProgress(v), p);
    await page.waitForTimeout(2200);
    const chapter = page.locator('section[aria-hidden="false"]');
    const style = await chapter.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        background: s.backgroundColor,
        border: s.borderTopWidth,
        radius: s.borderRadius,
      };
    });
    expect(style.background).toBe("rgba(0, 0, 0, 0)");
    expect(style.border).toBe("0px");
    expect(style.radius).toBe("0px");
    await page.screenshot({ path: `artifacts/open-story/${name}-${p}.png` });
  }
  await page.evaluate(() => {
    const main = document.querySelector("#story");
    window.scrollTo(0, main.offsetHeight - innerHeight + innerHeight * 0.5);
  });
  await page.waitForTimeout(2200);
  const blend = await page.evaluate(
    () => window.__auroraDiagnostic().profileBlend,
  );
  expect(blend).toBeGreaterThan(0.1);
  expect(blend).toBeLessThan(0.95);
  await page.screenshot({ path: `artifacts/open-story/${name}-handoff.png` });
  if (width > 600)
    await page
      .locator("header")
      .getByRole("button", { name: "Experience", exact: true })
      .click();
  else {
    await page.getByRole("button", { name: /Menu/ }).click();
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("button", { name: /Experience/ })
      .click();
  }
  await page.waitForTimeout(3500);
  await expect(page.locator("#profile")).toBeInViewport();
  await page.screenshot({ path: `artifacts/open-story/${name}-profile.png` });
  await page
    .locator("[data-profile-step]")
    .first()
    .evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(2200);
  await page.screenshot({
    path: `artifacts/open-story/${name}-experience.png`,
  });
  await expect(page.locator("[data-profile-step]").first()).toContainText(
    "Digit7s",
  );
  await expect(page.locator("[data-profile-step]").last()).toContainText(
    "Yoon Han Thar",
  );
  await page
    .locator("#about-title")
    .evaluate((el) => el.closest("section").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `artifacts/open-story/${name}-about.png` });
  const family = await page
    .locator("#about-title")
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain("SF Pro");
  const navBlur = await page
    .locator("header")
    .evaluate((el) => getComputedStyle(el, "::before").backdropFilter);
  expect(navBlur).toContain("blur(18px)");
  const boxes = await page.locator("#profile article").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, radius: s.borderRadius };
    }),
  );
  expect(
    boxes.every(
      (x) => x.background === "rgba(0, 0, 0, 0)" && x.radius === "0px",
    ),
  ).toBe(true);
  await page
    .locator("#education-title")
    .evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `artifacts/open-story/${name}-education.png` });
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  checks.push({ name, blend, axeViolations: axe.violations });
  expect(axe.violations).toEqual([]);
  await context.close();
}
await browser.close();
await fs.writeFile(
  "artifacts/open-story/results.json",
  JSON.stringify({ errors, checks }, null, 2),
);
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "Card-free chapter and biography surfaces, gradual backdrop handoff and logo transparency swatches captured.",
  checks.map((c) => ({ name: c.name, axe: c.axeViolations.length })),
);

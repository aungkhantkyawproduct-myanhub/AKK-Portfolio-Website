import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
await fs.mkdir("artifacts/verification", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => !!window.__debugProgress);
await page.waitForFunction(
  () => !document.querySelector("[role=status]"),
  null,
  { timeout: 60000 },
);
await expect(page.locator("canvas")).toHaveCount(1);
await page.evaluate(
  () => (window.savedCanvas = document.querySelector("canvas")),
);
await page.getByRole("button", { name: /Sound off/i }).click();
await expect(page.getByRole("button", { name: /Sound on/i })).toHaveAttribute(
  "aria-pressed",
  "true",
);
await page.getByRole("button", { name: /Sound on/i }).click();
await page.getByRole("button", { name: /Menu/ }).click();
await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
await page.keyboard.press("Escape");
await expect(page.getByRole("dialog", { name: "Menu" })).not.toBeVisible();
await page.evaluate(() => window.__debugProgress(0.8));
await page.waitForTimeout(1800);
await page.getByRole("button", { name: /Travel AI Assistant/ }).click();
await expect(page.locator("#detail-title")).toHaveText("Travel AI Assistant");
await page.keyboard.press("Escape");
await page
  .getByRole("button", { name: /Weather & Disaster Alert AI Assistant/ })
  .click();
await expect(
  page.getByRole("link", { name: /Explore project/ }),
).toHaveAttribute("href", "https://myanaid-7b3dd.web.app/");
await page.keyboard.press("Escape");
await page.evaluate(() => window.__debugProgress(0.95));
await page.waitForTimeout(1500);
await page
  .getByRole("button", { name: /Languages & Localization/ })
  .last()
  .click();
await expect(
  page.getByRole("dialog").filter({ has: page.locator("#detail-title") }),
).toContainText("78/100");
await page.keyboard.press("Escape");
await page.evaluate(() => window.__debugProgress(1));
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /Copy email/ }).click();
await expect(page.getByRole("status")).toHaveText("Email copied");
await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute(
  "href",
  "mailto:aungkhantkyaw.product@gmail.com",
);
if (
  !(await page.evaluate(
    () => window.savedCanvas === document.querySelector("canvas"),
  ))
)
  throw Error("Canvas was remounted during journey");
const stats = await page.evaluate(() => window.__sceneStats);
const accessibility = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa"])
  .analyze();
await page
  .getByRole("button", { name: /Back to the seed/ })
  .first()
  .click();
await page.waitForTimeout(3600);
await expect(page.locator('section[data-chapter="0"]')).toHaveAttribute(
  "aria-hidden",
  "false",
);
await page.screenshot({
  path: "artifacts/verification/hero.png",
  animations: "disabled",
});
await page.emulateMedia({ reducedMotion: "reduce" });
await page.waitForTimeout(800);
await expect(page.locator("canvas")).toHaveCount(0);
await expect(page.locator("section:not([aria-hidden])")).toHaveCount(9);
await page.screenshot({
  path: "artifacts/verification/reduced-motion.png",
  animations: "disabled",
});
await page.emulateMedia({ reducedMotion: "no-preference" });
await page.goto("http://127.0.0.1:5173/?fallback", {
  waitUntil: "domcontentloaded",
});
await page.waitForFunction(
  () => !document.querySelector("[role=status]"),
  null,
  { timeout: 60000 },
);
await expect(page.locator("canvas")).toHaveCount(0);
await expect(page.locator("section:not([aria-hidden])")).toHaveCount(9);
await page.screenshot({
  path: "artifacts/verification/fallback.png",
  animations: "disabled",
});
await fs.writeFile(
  "artifacts/verification/results.json",
  JSON.stringify(
    {
      errors,
      stats,
      accessibilityViolations: accessibility.violations,
      passed: [
        "persistent canvas",
        "sound opt-in toggle",
        "menu + Escape",
        "project modal and outbound URL",
        "skill details",
        "clipboard",
        "contact link",
        "reverse journey",
        "reduced motion",
        "WebGL fallback",
      ],
    },
    null,
    2,
  ),
);
await browser.close();
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "Interaction checks passed",
  stats,
  "axe violations:",
  accessibility.violations.length,
);

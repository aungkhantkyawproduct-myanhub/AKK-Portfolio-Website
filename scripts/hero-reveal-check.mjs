import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/hero-reveal", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
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
  const loader = page.getByRole("status");
  await expect(loader).toBeVisible();
  await page.screenshot({ path: `artifacts/hero-reveal/${name}-loading.png` });
  await page.waitForFunction(
    () =>
      document.querySelector("[role=status]")?.getAttribute("data-phase") ===
      "revealing",
    null,
    { timeout: 30000 },
  );
  await expect(loader).toContainText("100");
  await page.waitForTimeout(1200);
  await expect(loader).toBeVisible();
  await page.screenshot({ path: `artifacts/hero-reveal/${name}-clearing.png` });
  await expect(loader).toHaveCount(0, { timeout: 20000 });
  await expect(page.locator("h1")).toContainText("Aung Khant Kyaw");
  await expect(
    page.locator("header").getByRole("button", { name: "AKK", exact: true }),
  ).toBeVisible();
  const sound = page.getByRole("button", { name: "Sound off", exact: true });
  await expect(sound.locator("svg")).toBeVisible();
  await sound.click();
  await expect(
    page.getByRole("button", { name: "Sound on", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  const origin = await page.evaluate(
    () => window.__worldDiagnostic().myanmarScreen,
  );
  expect(origin[0]).toBeGreaterThan(width * 0.25);
  expect(origin[0]).toBeLessThan(width * 0.75);
  expect(origin[1]).toBeGreaterThan(height * 0.4);
  expect(origin[1]).toBeLessThan(height * 0.95);
  await page.screenshot({ path: `artifacts/hero-reveal/${name}-hero.png` });
  await expect(
    page.locator('aside[aria-label="Journey chapters"]'),
  ).toBeVisible();
  await page.close();
}
await browser.close();
await fs.writeFile(
  "artifacts/hero-reveal/errors.json",
  JSON.stringify(errors, null, 2),
);
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "Desktop/mobile gradual 100% fog reveal, reference hero, unchanged chapter rail and sound icon toggle passed.",
);

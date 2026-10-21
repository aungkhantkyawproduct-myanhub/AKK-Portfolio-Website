import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const browser=await chromium.launch({channel:"msedge",headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();
await page.goto("http://127.0.0.1:5173");
await page.getByRole("status").first().screenshot({path:"artifacts/verification/loader.png"});
await page.waitForTimeout(5500);
await page.locator("header").getByRole("button",{name:"Experience",exact:true}).click();
await page.waitForTimeout(3500);
await expect(page.locator("#profile")).toBeInViewport();
await expect(page.locator("#profile")).toContainText("Digit7s");
await expect(page.locator("#profile")).toContainText("University of Lancashire");
for (const chapter of [1,2,3,4,5]) {
  await expect(page.locator(`[data-chapter="${chapter}"]`)).not.toContainText("Citizens Pay");
  await expect(page.locator(`[data-chapter="${chapter}"]`)).not.toContainText("University of Lancashire");
}
await page.screenshot({path:"artifacts/verification/profile.png"});
const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();
await fs.writeFile("artifacts/verification/profile-axe.json",JSON.stringify(axe.violations,null,2));
console.log("Profile navigation and content checks passed; axe violations:",axe.violations.length);
await browser.close();

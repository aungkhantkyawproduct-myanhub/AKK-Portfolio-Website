import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:800}});
await page.goto('http://127.0.0.1:5173/artifacts/reference/review.html');
await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
const duration=await page.evaluate(()=>document.querySelector('video').duration);console.log({duration});
for(const fraction of [.15,.35,.55,.75,.9]){await page.evaluate(t=>{document.querySelector('video').currentTime=t;},duration*fraction);await page.waitForTimeout(700);await page.screenshot({path:`artifacts/reference/review-${fraction}.png`});}await browser.close();



import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts/review',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>console.error(e.message));
await page.goto('http://127.0.0.1:5173');await page.waitForTimeout(4000);
for(const p of process.argv.slice(2).map(Number)){await page.evaluate(v=>window.__debugProgress(v),p);await page.waitForTimeout(3500);await page.screenshot({path:`artifacts/review/${p}.png`,animations:'disabled'});console.log(p,await page.evaluate(()=>({sections:[...document.querySelectorAll('section')].map(s=>({text:s.querySelector('h2')?.textContent,opacity:getComputedStyle(s).opacity})),canvases:document.querySelectorAll('canvas').length})));}
await browser.close();

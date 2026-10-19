import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const phase=process.argv[2]||'final';await fs.mkdir(`artifacts/${phase}`,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const errors=[];
for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173');await page.waitForTimeout(2500);for(const p of [0,.15,.3,.5,.65,.8,.95,1]){await page.evaluate(v=>window.__debugProgress(v),p);await page.waitForTimeout(2400);await page.screenshot({animations:'disabled',path:`artifacts/${phase}/${name}-${p}.png`});}await page.close();}
await browser.close();await fs.writeFile(`artifacts/${phase}/errors.json`,JSON.stringify(errors,null,2));if(errors.length)throw Error(errors.join('\n'));


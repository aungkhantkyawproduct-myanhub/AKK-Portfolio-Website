import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram/.test(m.text()))errors.push(m.text());});
await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__worldDiagnostic);await page.waitForTimeout(7000);
const states=[];
for(const p of [.15,.4,.65,.8,.95,.8,.65,.4,.15]){
 await page.evaluate(v=>window.__debugProgress(v),p);await page.waitForTimeout(2200);
 const state=await page.evaluate(()=>window.__worldDiagnostic());states.push({p,...state});
 if(p>=.4)expect(state.treeVisible).toBe(true);
 expect(state.sky).toEqual(states[0].sky);expect(state.meadow).toEqual(states[0].meadow);
}
for(const p of [.15,.4,.65,.8]){const matches=states.filter(s=>s.p===p);expect(Math.abs(matches[0].growth-matches.at(-1).growth)).toBeLessThan(.015);}
const before=await page.evaluate(()=>window.__worldDiagnostic());await page.waitForTimeout(1200);const after=await page.evaluate(()=>window.__worldDiagnostic());expect(after.skyTime).toBeGreaterThan(before.skyTime);
const box=await page.locator('[data-chapter="1"]').boundingBox();expect(before.seedScreen[0]).toBeLessThan(box.x);
await page.evaluate(()=>window.__debugProgress(1));await page.waitForTimeout(2000);await page.locator('header').getByRole('button',{name:'Experience',exact:true}).click();await page.waitForTimeout(2500);await expect(page.locator('#profile')).toBeInViewport();
await fs.writeFile('artifacts/verification/continuous.json',JSON.stringify({errors,states,idleAnimation:after.skyTime>before.skyTime},null,2));
await browser.close();if(errors.length)throw Error(errors.join('\n'));console.log('Fixed-world transforms, reversible growth, idle animation and reading-column separation passed.');

import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const label=process.argv[2]??'after';
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[],errors=[];
try{
 for(const [width,height,dpr] of [[390,844,3],[1440,900,1.5]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(()=>window.__sceneStats && !document.querySelector('[role="status"]'),null,{timeout:90000});
  await page.waitForTimeout(2500);
  if(label !== 'before') await page.waitForFunction(()=>window.__worldDiagnostic().cloudTexture?.ready,null,{timeout:90000});
  for(const p of [0,.3,.5,.8]){
   await page.evaluate(p=>window.__debugProgress(p),p);await page.waitForTimeout(2200);
   const timing=await page.evaluate(()=>new Promise(resolve=>{
    let last=performance.now(),start=last;const times=[];
    const tick=t=>{times.push(t-last);last=t;if(t-start<1800)requestAnimationFrame(tick);else{
     times.sort((a,b)=>a-b);const c=document.querySelector('canvas');
     resolve({median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],frames:times.length,buffer:[c.width,c.height],earth:window.__worldDiagnostic().earthTexture.width,cloud:window.__worldDiagnostic().cloudTexture});
    }};requestAnimationFrame(tick);
   }));
   results.push({width,p,...timing});
  }await page.close();
 }
}finally{await browser.close();await fs.mkdir('artifacts/frame-cost',{recursive:true});await fs.writeFile(`artifacts/frame-cost/${label}.json`,JSON.stringify({results,errors},null,2));}
if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(results));

import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({channel:'msedge',headless:true});
const results = [], errors = [];
try {
  for (const [width,height,dpr] of [[1440,900,1.5],[390,844,3]]) {
    const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173');
    await page.waitForFunction(()=>window.__sceneStats && window.__mistProbe && !document.querySelector('[role="status"]'),null,{timeout:60000});
    const result = await page.evaluate(async()=>{
      const canvas=document.querySelector('canvas');
      const dimensions=[canvas.width,canvas.height], frames=[];
      let resized=false,replaced=false,last=performance.now();
      const start=last;
      await new Promise(resolve=>{
        const tick=now=>{
          frames.push(now-last);last=now;
          const t=Math.min(1,(now-start)/6000);
          // Native scrolling exercises Lenis/ScrollTrigger and their scrub timeline.
          const p=t<.5?t*2:2-t*2;
          window.scrollTo(0,p*(document.getElementById('story').offsetHeight-innerHeight));
          resized ||= canvas.width!==dimensions[0] || canvas.height!==dimensions[1];
          replaced ||= canvas!==document.querySelector('canvas');
          if(t<1)requestAnimationFrame(tick);else resolve();
        };requestAnimationFrame(tick);
      });
      frames.sort((a,b)=>a-b);
      return {dimensions,resized,replaced,medianMs:frames[Math.floor(frames.length*.5)],p95Ms:frames[Math.floor(frames.length*.95)],frames:frames.length};
    });
    expect(result.resized).toBe(false);
    expect(result.replaced).toBe(false);
    results.push({width,height,...result});
    await page.close();
  }
  expect(errors).toEqual([]);
} finally {
  await browser.close();
  await fs.mkdir('artifacts/scroll-budget',{recursive:true});
  await fs.writeFile('artifacts/scroll-budget/results.json',JSON.stringify({results,errors},null,2));
}
console.log(JSON.stringify(results));

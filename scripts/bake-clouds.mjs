// Reproduce the existing procedural cloud field once at 4K, rather than per frame.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const source=await fs.readFile('src/shaders/earth.ts','utf8');
const original=source.match(/export const cloudFragment = `([\s\S]*?)`;/)[1];
const shader=original.replace(/float l=max[\s\S]*$/, 'gl_FragColor=vec4(vec3(f),a); }');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');
 const png=await page.evaluate(async fragment=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const renderer=new T.WebGLRenderer({alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
  renderer.setSize(4096,2048);renderer.setClearColor(0,0);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const material=new T.ShaderMaterial({uniforms:{uTime:{value:0}},vertexShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vWorld;void main(){vUv=uv;vNormal=vec3(0.,1.,0.);vWorld=position;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:fragment,depthTest:false,depthWrite:false});
  scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));renderer.render(scene,camera);
  const result=renderer.domElement.toDataURL('image/png');renderer.dispose();return result;
 },shader);
 await fs.mkdir('artifacts/cloud-bake',{recursive:true});
 await fs.writeFile('artifacts/cloud-bake/earth-clouds-4k.png',Buffer.from(png.split(',')[1],'base64'));
 console.log('Baked artifacts/cloud-bake/earth-clouds-4k.png (4096×2048). Encode as lossless WebP with alpha into public/textures/earth-clouds-4k.webp.');
}finally{await browser.close();}

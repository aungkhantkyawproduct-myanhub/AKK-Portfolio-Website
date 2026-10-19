import { CatmullRomCurve3, Vector3 } from 'three';
export const boundaries = [0,.1,.25,.4,.55,.7,.9,.96,1];
export const chapterAt = (p:number) => Math.min(7,boundaries.findIndex((v,i)=> i<8 && p>=v && p<boundaries[i+1])<0?7:boundaries.findIndex((v,i)=> i<8 && p>=v && p<boundaries[i+1]));
export const pacing = {scrub:1.2, height:1000};
export const earthCenter = new Vector3(0,-10,0);
// Points correspond to boundaries above. Earth surface / tree origin is (0,0,0).
const positions = [[0,6,24],[0,2,8],[0,1.4,5],[5,3,9],[-7,5,12],[5,9,20],[0,19,37],[0,24,40],[0,31,46]];
const targets = [[0,1,0],[1.6,.6,0],[1.4,.6,0],[-2,1.5,0],[2,3,0],[-3,6,0],[4,7,0],[0,12,0],[2,14,0]];
export const cameraCurve = new CatmullRomCurve3(positions.map(p=>new Vector3(...p)),false,'catmullrom',.25);
export const targetCurve = new CatmullRomCurve3(targets.map(p=>new Vector3(...p)),false,'catmullrom',.25);
export function pathTime(p:number){const i=Math.min(7,Math.max(0,boundaries.findIndex((v,j)=>j<8&&p>=v&&p<boundaries[j+1])));return p>=1?1:(i+(p-boundaries[i])/(boundaries[i+1]-boundaries[i]))/8;}


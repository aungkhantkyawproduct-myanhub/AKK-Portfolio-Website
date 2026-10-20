export const boundaries = [0,.1,.25,.4,.55,.7,.9,.96,1];
export const chapterAt = (p:number) => Math.min(7,boundaries.findIndex((v,i)=> i<8 && p>=v && p<boundaries[i+1])<0?7:boundaries.findIndex((v,i)=> i<8 && p>=v && p<boundaries[i+1]));
export const pacing = {scrub:1.2, height:1000};
export const earthCenter = [0,-10,0] as const;
// Points correspond to boundaries above. Earth surface / tree origin is (0,0,0).
export const cameraPoints = [[0,3,12.7],[0,2,7],[0,1.4,5],[5,3,9],[-7,5,16],[7,13,37],[0,23,62],[0,27,65],[0,36,72]];
export const targetPoints = [[-2.5,-4,0],[1.6,.6,0],[1.4,.6,0],[-2,1.5,0],[2,3,0],[-3,6,0],[9,7,0],[-8,9,0],[10,12,0]];
export function pathTime(p:number){const i=Math.min(7,Math.max(0,boundaries.findIndex((v,j)=>j<8&&p>=v&&p<boundaries[j+1])));return p>=1?1:(i+(p-boundaries[i])/(boundaries[i+1]-boundaries[i]))/8;}




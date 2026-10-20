import { Vector3 } from 'three';
export interface Segment {start:Vector3;end:Vector3;radius:number;birth:number;depth:number;parent:number}
export interface Leaf {position:Vector3;birth:number;angle:number;size:number}
export function createSkeleton(){let seed=49;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const segments:Segment[]=[];const leaves:Leaf[]=[];
 function limb(start:Vector3,direction:Vector3,length:number,radius:number,depth:number,birth:number,parent:number){let from=start.clone();let dir=direction.clone();for(let j=0;j<5;j++){dir.y+=depth===0?.03:.08;dir.x+=(random()-.5)*.12;dir.z+=(random()-.5)*.12;dir.normalize();const end=from.clone().addScaledVector(dir,length/5);const index=segments.length;segments.push({start:from.clone(),end:end.clone(),radius:radius*(1-j*.12),birth:birth+j*.018,depth,parent});parent=index;
 if(depth<3&&j>=2){const a=random()*Math.PI*2;const next=new Vector3(Math.cos(a)*.9,.35+random()*.5,Math.sin(a)*.9).addScaledVector(dir,.6).normalize();limb(end,next,length*(depth===0?.69:.54),radius*.43,depth+1,birth+j*.018+.1,parent);}
 if(depth>=2){for(let k=0;k<(depth===3?9:3);k++){leaves.push({position:end.clone().add(new Vector3((random()-.5)*1.5,(random()-.5)*.7,(random()-.5)*1.5)),birth:birth+j*.018+.09,angle:random()*Math.PI*2,size:.17+random()*.25});}}
 from=end;
 }}
 limb(new Vector3(),new Vector3(.03,1,0),10,.7,0,0,-1);
 // Sweeping primary boughs make an open, umbrella-shaped world-tree canopy.
 for(let k=0;k<7;k++){const a=k/7*Math.PI*2;limb(new Vector3(.1,5.5+k*.42,0),new Vector3(Math.cos(a),.38,Math.sin(a)).normalize(),7,.3,1,.25+k*.015,0);}
 for(let k=0;k<12;k++){const a=k/12*Math.PI*2;let last=new Vector3(0,.04,0);for(let j=1;j<=18;j++){const t=j/18*1.35;const angle=a+Math.sin(t*3+k)*.12;const end=new Vector3(10.08*Math.sin(t)*Math.cos(angle),-10+10.08*Math.cos(t),10.08*Math.sin(t)*Math.sin(angle));segments.push({start:last,end,radius:.22*(1-j/23),birth:.55+j*.014,depth:4,parent:-1});last=end;}}
 return {segments,leaves};}

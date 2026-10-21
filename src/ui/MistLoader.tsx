import { content as c } from "../content/content";
import s from "./MistLoader.module.css";
const branches: string[] = [];
function branch(x:number,y:number,length:number,angle:number,depth:number) {
  const ex=x+Math.cos(angle)*length, ey=y+Math.sin(angle)*length;
  branches.push(`M${x},${y} Q${x+Math.cos(angle+.15)*length*.55},${y+Math.sin(angle)*length*.55} ${ex},${ey}`);
  if(depth>0) {
    branch(ex,ey,length*.72,angle-.42,depth-1);
    branch(ex,ey,length*.69,angle+.5,depth-1);
  }
}
branch(500,640,170,-Math.PI/2,7);
export default function MistLoader({progress}:{progress:number}) {
 return <div className={s.loader} role="status" aria-live="polite">
   <div className={s.landscape}/>
   <svg className={s.silhouette} viewBox="0 0 1000 700" aria-hidden="true">
     {branches.map((d,i)=><path key={i} d={d} stroke="#020b10" strokeWidth={Math.max(1.5,21/Math.sqrt(i+1))} fill="none" strokeLinecap="round"/>)}
   </svg>
   <svg width="0" height="0" aria-hidden="true"><filter id="mist"><feTurbulence type="fractalNoise" baseFrequency=".009 .025" numOctaves="3" seed="7"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer><feGaussianBlur stdDeviation="8"/></filter></svg>
   <div className={s.mist}/><div className={`${s.mist} ${s.second}`}/>
   <div className={s.copy}><span>{c.ui.wordmark}</span><p>{c.tagline}</p><i style={{background:`conic-gradient(#ddcd9a ${progress*3.6}deg, #ffffff20 0)`}}/><small>{c.ui.loading} · {progress}%</small></div>
 </div>;
}

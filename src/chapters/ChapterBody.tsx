import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { content as c } from '../content/content';
import { useJourney } from '../app/store';
import s from './Chapters.module.css';
export const openDetail=(title:string,text:string,url?:string)=>window.dispatchEvent(new CustomEvent('open-detail',{detail:{title,text,url}}));
function Result({index}:{index:number}){const el=useRef<HTMLElement>(null);const active=useJourney(v=>v.activeChapter);useEffect(()=>{if(!el.current)return;const value={n:0};const num=parseFloat(c.results[index][0]);const suffix=c.results[index][0].replace(/[\d.]/g,'');const tween=gsap.to(value,{n:num,duration:1.5,ease:'power2.out',onUpdate:()=>{if(el.current)el.current.textContent=(num%1?value.n.toFixed(1):Math.round(value.n))+suffix;}});return()=>{tween.kill();};},[active,index]);return <div className={s.result}><b ref={el}>{c.results[index][0]}</b><span>{c.results[index][1]}</span></div>}
export default function ChapterBody({chapter}:{chapter:number}){
 if(chapter===1)return <div className={s.body}><p className={s.summary}>{c.summary}</p><div className={s.education}>{c.education.map((e,i)=><div key={e}><span>0{i+1}</span>{e}</div>)}</div></div>;
 if(chapter>=2&&chapter<=5){const exp=c.experience[chapter-2];return <div className={s.job}><small>{exp.dates}</small><h3>{exp.company}</h3><p>{exp.role}</p>{chapter===4&&<div className={s.results}>{[0,1,2].map(i=><Result key={i} index={i}/>)}</div>}{chapter===5&&<div className={s.results}>{[3,4].map(i=><Result key={i} index={i}/>)}</div>}<ul>{exp.bullets.slice(0,chapter===2?1:2).map(b=><li key={b}>{b}</li>)}</ul>{exp.bullets.length>2&&<button className={s.link} onClick={()=>openDetail(`${exp.role} · ${exp.company}`,`${exp.dates}\n\n${exp.bullets.join('\n\n')}`)}>{c.ui.details} ↗</button>}{chapter===5&&<div className={s.projects}>{c.projects.map((project,i)=><button key={project.name} onClick={()=>openDetail(project.name,project.description,project.url)}><i>{i===0?'✧':'◈'}</i>{project.name} ↗</button>)}</div>}</div>;}
 return null;
}

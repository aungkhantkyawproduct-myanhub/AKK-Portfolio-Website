import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useProgress } from '@react-three/drei';
import { content as c } from '../content/content';
import { useJourney } from './store';
import { useScrollJourney, navigate } from '../hooks/useJourney';
import { boundaries } from '../canvas/cameraPath';
import s from './App.module.css';
import ChapterBody from '../chapters/ChapterBody';
import DetailPanel from '../ui/DetailPanel';
import { Menu, Enhancements } from '../ui/Enhancements';
import { toggleAmbient } from '../audio/ambient';
const World=lazy(()=>import('../canvas/World'));
function Rail(){const p=useJourney(v=>v.scrollProgress);const chapter=useJourney(v=>v.activeChapter);return <><aside className={s.rail} aria-label="Journey chapters"><span>{c.chapters[chapter].stage}</span><div className={s.track}><i style={{height:`${p*100}%`}}/>{boundaries.slice(0,8).map((v,i)=><button aria-label={c.chapters[i].stage} aria-current={chapter===i?'step':undefined} key={v} style={{top:`${v*100}%`}} onClick={()=>navigate(v+.001)}/>)}</div><small>{p<.25?'◈':p<.7?'♧':'♧'} {String(chapter+1).padStart(2,'0')}</small></aside><div className={s.hint} style={{opacity:p<.025?1:0}}><span>↓</span>{innerWidth<600?c.ui.mobileHint:c.ui.hint}</div></>}
export default function App(){
 useScrollJourney();const chapter=useJourney(v=>v.activeChapter);const sound=useJourney(v=>v.soundOn);const reduced=useJourney(v=>v.reducedMotion);const [loaded,setLoaded]=useState(false);const [menu,setMenu]=useState(false);const {progress}=useProgress();const overlay=useRef<HTMLDivElement>(null);
 useEffect(()=>{const ready=()=>setLoaded(true);window.addEventListener('world-ready',ready);const timer=setTimeout(ready,8000);return()=>{clearTimeout(timer);window.removeEventListener('world-ready',ready);};},[]);
 useEffect(()=>{const section=overlay.current?.children[chapter];if(!section||reduced)return;const animation=gsap.fromTo(section,{opacity:0,y:16},{opacity:1,y:0,duration:.7,ease:'power2.out'});return()=>{animation.kill();};},[chapter,reduced]);
 return <><DetailPanel/><Menu open={menu} onClose={()=>setMenu(false)}/><Enhancements/>
 <a className={s.skip} href="#story">{c.ui.skip}</a><div className={s.canvas}><Suspense fallback={null}><World/></Suspense></div>
 <header className={s.header}><button className={s.logo} onClick={()=>navigate(0)}>{c.ui.wordmark}<span>✳</span></button><nav>{c.ui.nav.map((n,i)=><button key={n} onClick={()=>navigate([0,.4,.91,.98][i])}>{n}</button>)}</nav><div className={s.actions}><button className={s.sound} onClick={()=>void toggleAmbient()} aria-pressed={sound}>{sound?c.ui.soundOn:c.ui.soundOff} <span>▥</span></button><button className={s.menuButton} onClick={()=>setMenu(true)} aria-expanded={menu}>{c.ui.menu} ☰</button></div></header>
 <main id="story" className={s.scroll} tabIndex={-1}><div ref={overlay} className={s.overlay}>{c.chapters.map((ch,i)=><section key={ch.stage} data-chapter={i} data-lenis-prevent className={`${s.chapter} ${i===0?s.hero:''} ${i%2===1?s.right:''}`} aria-hidden={chapter!==i} inert={chapter!==i?'':undefined} style={{visibility:chapter===i?'visible':'hidden'}}><div className={s.eyebrow}>{ch.eyebrow}</div>{i===0?<><div className={s.identity}>{c.role}</div><h1 aria-label={c.name}>{c.name.split(' ').map((n,j)=><span key={n} aria-hidden="true">{n.split('').map((char,k)=><span className={s.char} key={k} style={{animationDelay:`${.3+j*.15+k*.035}s`}}>{char}</span>)}</span>)}</h1><p className={s.tagline}>{c.tagline}</p><div className={s.heroBottom}><span>01 — 08</span><span>{c.location}<br/><i/> {c.status}</span></div></>:<><h2>{ch.title}</h2><p>{ch.line}</p><ChapterBody chapter={i}/></>}</section>)}</div></main><Rail/>
 {!loaded&&<div className={s.loader} role="status"><span>◈</span><p>{c.ui.loading}</p><small>{Math.round(progress)}%</small></div>}</>;
}



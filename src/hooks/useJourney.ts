import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useJourney } from '../app/store';
import { boundaries, pacing } from '../canvas/cameraPath';
gsap.registerPlugin(ScrollTrigger);
let lenis:Lenis|undefined;
export function navigate(p:number){const y=p*(document.documentElement.scrollHeight-innerHeight);if(lenis)lenis.scrollTo(y,{duration:2.1});else window.scrollTo({top:y,behavior:useJourney.getState().reducedMotion?'instant':'smooth'});}
export function useScrollJourney(){useEffect(()=>{const state=useJourney.getState();const driver={p:0};
 const timeline=gsap.timeline({scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:state.reducedMotion?true:pacing.scrub},onUpdate:()=>state.setProgress(driver.p)}).to(driver,{p:1,duration:1,ease:'none'},0);
 boundaries.slice(0,8).forEach((p,i)=>timeline.addLabel(`chapter-${i}`,p));
 if(!state.reducedMotion){lenis=new Lenis();lenis.on('scroll',ScrollTrigger.update);}
 const tick=(t:number)=>lenis?.raf(t*1000);gsap.ticker.add(tick);
 const debug=(p:number)=>{const v=Math.max(0,Math.min(1,p));lenis?.scrollTo(v*(document.documentElement.scrollHeight-innerHeight),{immediate:true});window.scrollTo(0,v*(document.documentElement.scrollHeight-innerHeight));timeline.progress(v);state.setProgress(v);};
 if(import.meta.env.DEV)window.__debugProgress=debug;
 const keyboard=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('button,a,input,dialog,[role="dialog"]'))return;const d=['ArrowDown','PageDown',' '].includes(e.key)?1:['ArrowUp','PageUp'].includes(e.key)?-1:0;if(d){e.preventDefault();navigate(boundaries[Math.max(0,Math.min(7,useJourney.getState().activeChapter+d))]+.001);}};
 window.addEventListener('keydown',keyboard);return()=>{timeline.scrollTrigger?.kill();timeline.kill();gsap.ticker.remove(tick);lenis?.destroy();lenis=undefined;delete window.__debugProgress;window.removeEventListener('keydown',keyboard);};},[]);}

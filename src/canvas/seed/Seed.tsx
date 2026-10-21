import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { DataTexture, Group, LatheGeometry, Mesh, RGBAFormat, Vector2, RepeatWrapping, SRGBColorSpace } from "three";
import { useJourney } from "../../app/store";
export default function Seed() {
 const group=useRef<Group>(null), seed=useRef<Mesh>(null);
 const geometry=useMemo(()=>new LatheGeometry(Array.from({length:48},(_,i)=>{const t=i/47;return new Vector2(Math.pow(Math.sin(t*Math.PI),.65)*(.18+.055*t),t*.58-.29);}),64),[]);
 const texture=useMemo(()=>{
   const size=256,data=new Uint8Array(size*size*4);let state=81;
   for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
     state=(state*1664525+1013904223)>>>0;
     const grain=state/4294967296;
     const ridge=Math.sin(x*.31+Math.sin(y*.032)*1.7)*.5+.5;
     const seam=Math.exp(-Math.pow((x-size*.5)/2.4,2.));
     const light=.62+grain*.28+ridge*.1-seam*.25;
     const i=(y*size+x)*4;data[i]=125*light;data[i+1]=75*light;data[i+2]=38*light;data[i+3]=255;
   }
   const map=new DataTexture(data,size,size,RGBAFormat);map.wrapS=map.wrapT=RepeatWrapping;map.colorSpace=SRGBColorSpace;map.needsUpdate=true;return map;
 },[]);
 useFrame(()=>{
   const p=useJourney.getState().scrollProgress;
   if(group.current) group.current.visible=p>.105&&p<.39;
   if(seed.current) { const scale=Math.max(0,1-Math.max(0,p-.28)*8);seed.current.scale.set(scale,scale,scale*.65); }
 });
 return <group ref={group}>
   <mesh ref={seed} geometry={geometry} position={[0,.14,0]} rotation={[.65,0,1.05]} castShadow>
     <meshStandardMaterial map={texture} bumpMap={texture} bumpScale={.018} roughness={.83} metalness={0}/>
   </mesh>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,.018,0]}><circleGeometry args={[.36,48]}/><shaderMaterial transparent depthWrite={false} vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`varying vec2 vUv;void main(){float a=1.-smoothstep(.12,.5,length(vUv-.5));gl_FragColor=vec4(.025,.035,.02,a*.7);}`}/></mesh>
   <pointLight position={[-1,1.2,1]} color="#ffdc9e" intensity={2.4} distance={4}/>
   <Sparkles count={35} scale={[3,2,3]} position={[0,1,0]} size={1.1} speed={.15} color="#dec394"/>
 </group>;
}

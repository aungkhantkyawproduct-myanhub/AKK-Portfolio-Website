import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, DoubleSide, Group, InstancedBufferAttribute, InstancedBufferGeometry } from "three";
import { useJourney } from "../../app/store";
export default function Meadow(){
 const group=useRef<Group>(null);
 const tier=useJourney(s=>s.qualityTier);
 const uniforms=useMemo(()=>({uTime:{value:0}}),[]);
 const geometry=useMemo(()=>{
   let seed=723;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
   const g=new InstancedBufferGeometry(),pos:number[]=[],uv:number[]=[];
   for(let j=0;j<4;j++){const a=j/4,b=(j+1)/4;for(const [t,s] of [[a,-1],[a,1],[b,1],[a,-1],[b,1],[b,-1]]){pos.push(s*(1-t),t,0);uv.push((s+1)/2,t);}}
   g.setAttribute('position',new BufferAttribute(new Float32Array(pos),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));
   const count=tier==='low'?24000:60000,origins:number[]=[],traits:number[]=[];
   for(let i=0;i<count;i++){const a=random()*Math.PI*2,r=Math.pow(random(),1.6)*65;origins.push(Math.cos(a)*r,0,Math.sin(a)*r);traits.push(.12+random()*.28,random()*Math.PI*2,.003+random()*.004,random());}
   g.setAttribute('aOrigin',new InstancedBufferAttribute(new Float32Array(origins),3));g.setAttribute('aTraits',new InstancedBufferAttribute(new Float32Array(traits),4));g.instanceCount=count;return g;
 },[tier]);
 useFrame(({clock})=>{if(group.current)group.current.visible=useJourney.getState().scrollProgress>.115;uniforms.uTime.value=useJourney.getState().reducedMotion?0:clock.elapsedTime;});
 return <group ref={group} name="meadow">
 <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[320,320]}/><meshStandardMaterial color="#172e23" roughness={1}/></mesh>
 <mesh geometry={geometry} frustumCulled={false}><shaderMaterial side={DoubleSide} uniforms={uniforms}
 vertexShader={`attribute vec3 aOrigin;attribute vec4 aTraits;uniform float uTime;varying float vHeight,vTone,vFog;void main(){float t=position.y;float gust=sin(aOrigin.x*.5+aOrigin.z*.35-uTime*1.1)+.3*sin(aOrigin.z*2.+uTime*1.6);float angle=aTraits.y;vec3 p=aOrigin+vec3(cos(angle)*position.x*aTraits.z, .006+t*aTraits.x,sin(angle)*position.x*aTraits.z);p.x+=(.09+gust*.07)*t*t;p.z+=sin(angle)*.06*t*t;vHeight=t;vTone=aTraits.w;vFog=1.-exp(-length(cameraPosition-p)*.018);if(length(aOrigin.xz)<.29)p.y=0.;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`}
 fragmentShader={`varying float vHeight,vTone,vFog;void main(){vec3 c=mix(vec3(.025,.067,.042),vec3(.12,.23,.13),vHeight)*(.65+vTone*.5);gl_FragColor=vec4(mix(c,vec3(.12,.22,.25),vFog),1.);}`}/></mesh>
 </group>;
}

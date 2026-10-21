import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Mesh } from "three";
import { useJourney } from "../app/store";
export default function Environment() {
 const [meadow,tree]=useTexture(["/environments/meadow.webp","/environments/yggdrasil-reference.png"]);
 const mesh=useRef<Mesh>(null);
 const uniforms=useMemo(()=>({uMeadow:{value:meadow},uTree:{value:tree},uMix:{value:0},uOpacity:{value:0},uTime:{value:0}}),[meadow,tree]);
 useFrame(({camera,viewport,clock})=>{
   const p=useJourney.getState().scrollProgress;
   uniforms.uOpacity.value=Math.min(1,Math.max(0,(p-.085)/.045));
   uniforms.uMix.value=Math.min(1,Math.max(0,(p-.62)/.12));
   uniforms.uTime.value=useJourney.getState().reducedMotion?0:clock.elapsedTime;
   if(mesh.current) {
     mesh.current.visible=p>.085;
     mesh.current.position.copy(camera.position);mesh.current.quaternion.copy(camera.quaternion);mesh.current.translateZ(-110);
     const h=2*110*Math.tan(Math.PI/8);
     mesh.current.scale.set(Math.max(h*viewport.aspect,h*1.777),Math.max(h,h*viewport.aspect/1.777),1);
   }
 });
 return <mesh ref={mesh} renderOrder={-100}><planeGeometry/><shaderMaterial transparent depthWrite={false} uniforms={uniforms}
 vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
 fragmentShader={`varying vec2 vUv;uniform sampler2D uMeadow,uTree;uniform float uMix,uOpacity,uTime;void main(){vec2 uv=vUv;float grass=1.-smoothstep(.08,.36,uv.y);float wind=sin(uv.x*35.+uTime*1.1)+.45*sin(uv.x*71.-uTime*1.7);uv.x+=wind*.0015*grass;uv.y+=sin(uv.x*58.+uTime*.9)*.0007*grass;vec3 c=mix(texture2D(uMeadow,uv).rgb,texture2D(uTree,uv).rgb,smoothstep(0.,1.,uMix));gl_FragColor=vec4(c,uOpacity);}`}/></mesh>;
}

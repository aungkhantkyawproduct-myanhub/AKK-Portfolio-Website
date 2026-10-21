import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Mesh } from "three";
import { useJourney } from "../../app/store";
export default function Sun() {
 const mesh=useRef<Mesh>(null);
 const uniforms=useMemo(()=>({uFade:{value:1}}),[]);
 useFrame(({camera})=>{
  const p=useJourney.getState().scrollProgress;
  uniforms.uFade.value=Math.max(0,1-p/.08);
  if(mesh.current) {
    mesh.current.visible=p<.08;
    mesh.current.position.copy(camera.position);
    mesh.current.quaternion.copy(camera.quaternion);
    mesh.current.translateZ(-30);mesh.current.translateX(9);mesh.current.translateY(9.5);
  }
 });
 return <mesh ref={mesh} renderOrder={20}><planeGeometry args={[11,11]}/><shaderMaterial transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} uniforms={uniforms}
 vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
 fragmentShader={`varying vec2 vUv;uniform float uFade;void main(){vec2 p=vUv-.5;float r=length(p);float a=atan(p.y,p.x);float core=exp(-r*r*1800.);float glow=exp(-r*20.)*.35;float rays=pow(abs(sin(a*7.)),25.)*exp(-r*15.)*.18;float streak=exp(-abs(p.y)*400.)*exp(-abs(p.x)*8.)*.15;gl_FragColor=vec4(vec3(1.,.8,.48)*(core+glow+rays+streak),uFade);}`}/></mesh>;
}

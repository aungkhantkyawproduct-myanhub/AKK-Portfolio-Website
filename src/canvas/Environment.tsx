import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BackSide, Group, FogExp2, BufferGeometry, BufferAttribute, DoubleSide } from "three";
import { useJourney } from "../app/store";
// World-anchored sky: animation comes from elapsed time, never scroll-space UV warping.
export default function Environment() {
 const group=useRef<Group>(null);
 const {scene}=useThree();
 const fog=useMemo(()=>new FogExp2('#1f383d',.013),[]);
 const hills=useMemo(()=>{const g=new BufferGeometry(),v:number[]=[];for(let i=0;i<160;i++){const a=i/160*Math.PI*2,b=(i+1)/160*Math.PI*2;const h=(t:number)=>4+Math.sin(t*5)*2+Math.sin(t*13+1)*1.4;for(const [t,y] of [[a,-3],[b,-3],[b,h(b)],[a,-3],[b,h(b)],[a,h(a)]])v.push(Math.cos(t)*105,y,Math.sin(t)*105);}g.setAttribute('position',new BufferAttribute(new Float32Array(v),3));g.computeVertexNormals();return g;},[]);
 const uniforms=useMemo(()=>({uTime:{value:0}}),[]);
 useFrame(({clock})=>{const local=useJourney.getState().scrollProgress>.105;scene.fog=local?fog:null;if(group.current) group.current.visible=local;uniforms.uTime.value=useJourney.getState().reducedMotion?0:clock.elapsedTime;});
 return <group ref={group} name="sky">
 <mesh geometry={hills}><meshBasicMaterial color="#263f46" side={DoubleSide}/></mesh>
 <mesh><sphereGeometry args={[130,48,32]}/><shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms}
 vertexShader={`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
 fragmentShader={`varying vec3 vDirection;uniform float uTime;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}float fbm(vec2 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=noise(p)*a;p=p*2.03+4.7;a*=.5;}return f;}
 void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.);vec2 uv=vec2(atan(d.z,d.x),asin(d.y));vec3 color=mix(vec3(.12,.22,.25),vec3(.004,.014,.036),smoothstep(0.,.65,h));
 vec2 c=uv*vec2(3.2,5.);c.x+=uTime*.007;float cloud=fbm(c+fbm(c*.7));float wisps=smoothstep(.43,.73,cloud)*(1.-smoothstep(.02,.65,h));color=mix(color,vec3(.20,.31,.34),wisps*.68);
 float wave=.36+.10*sin(uv.x*2.8+uTime*.08)+.035*sin(uv.x*7.-uTime*.14);float curtain=exp(-pow((uv.y-wave)/.17,2.));float rays=pow(noise(vec2(uv.x*95.+uTime*.3,uv.y*2.)),2.);vec3 aurora=mix(vec3(.025,.42,.30),vec3(.19,.09,.4),smoothstep(wave-.05,wave+.2,uv.y));color+=aurora*curtain*rays*.72;
 float star=step(.9985,hash(floor(uv*950.)))*smoothstep(.08,.5,h);color+=star*.65;gl_FragColor=vec4(color,1.);}`} /></mesh>
 </group>;
}

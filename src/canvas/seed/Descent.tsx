import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  ShaderMaterial,
  MeshStandardMaterial,
} from "three";
import { useJourney } from "../../app/store";
const vert = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const frag = `uniform float uTime;uniform float uOpacity;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}void main(){vec2 p=vUv*6.+vec2(uTime*.018,0.);float f=n(p)*.55+n(p*2.1)*.3+n(p*4.3)*.15;float edge=pow(max(0.,1.-length(vUv-.5)*1.7),.7);float a=smoothstep(.15,.7,f)*edge*uOpacity;gl_FragColor=vec4(mix(vec3(.25,.43,.51),vec3(1.,.94,.78),f),a);}`;
export default function Descent() {
  const group = useRef<Group>(null);
  const mat = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 0 } }),
    [],
  );
  useFrame(({ clock, camera }) => {
    const p = useJourney.getState().scrollProgress;
    uniforms.uOpacity.value =
      Math.sin(Math.min(1, Math.max(0, (p - 0.035) / 0.12)) * Math.PI) * 0.9;
    uniforms.uTime.value = clock.elapsedTime;
    if (group.current) {
      group.current.visible = p > 0.035 && p < 0.155;
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
    }
  });
  return (
    <group ref={group}>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[((i % 2) - 0.5) * 2, Math.sin(i) * 1.4, -2 - i * 1.2]}
          rotation={[0, 0, i]}
        >
          <planeGeometry args={[12, 9]} />
          <shaderMaterial
            ref={i === 0 ? mat : undefined}
            uniforms={uniforms}
            vertexShader={vert}
            fragmentShader={frag}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
export function Grass() {
  const ground=useRef<ShaderMaterial>(null);
  const soilUniforms=useMemo(()=>({uOpacity:{value:1}}),[]);
  const blades=useRef<MeshStandardMaterial>(null);
  const group = useRef<Group>(null);
  const data = useMemo(() => {
    const positions: number[] = [],
      colors: number[] = [];
    let seed = 23;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 22000; i++) {
      const angle = random() * Math.PI * 2,
        r = Math.sqrt(random()) * 15;
      if (r < 0.43) continue;
      const x = Math.cos(angle) * r,
        z = Math.sin(angle) * r;
      const height = 0.09 + random() * 0.17;
      const green = new Color().setHSL(.29+random()*.07,.32,.12+random()*.14);
      const width=.004+random()*.007, bend=.06+random()*.12;
      const point=(t:number,side:number)=>[x+Math.sin(angle)*bend*t*t+Math.cos(angle)*width*(1-t)*side,.02+height*t,z+Math.cos(angle)*bend*t*t+Math.sin(angle)*width*(1-t)*side];
      for(let j=0;j<4;j++) {
        const a=j/4,b=(j+1)/4;
        for(const [t,side] of [[a,-1],[a,1],[b,1],[a,-1],[b,1],[b,-1]]) {
          positions.push(...point(t,side));
          const light=.45+t*.55;
          colors.push(green.r*light,green.g*light,green.b*light);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(positions), 3),
    );
    g.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(() => {
    const p = useJourney.getState().scrollProgress;
    if (group.current) {
      group.current.visible = p > 0.12 && p < 0.88;
      const s = p > 0.82 ? 1 - (p - 0.82) / 0.06 : 1;
      soilUniforms.uOpacity.value=s;
      if(blades.current) blades.current.opacity=s;
    }
  });
  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[15, 100]} />
        <shaderMaterial ref={ground} uniforms={soilUniforms} transparent depthWrite={false} vertexShader={vert} fragmentShader={`varying vec2 vUv;uniform float uOpacity;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){float r=length(vUv-.5)*2.;float a=(1.-smoothstep(.15,1.,r))*uOpacity;float n=h(floor(vUv*1700.));vec3 color=mix(vec3(.016,.043,.032),vec3(.045,.095,.067),n);gl_FragColor=vec4(color,a);}`} />
      </mesh>
      <mesh geometry={data}>
        <meshStandardMaterial ref={blades} vertexColors side={DoubleSide} roughness={0.9} transparent />
      </mesh>
    </group>
  );
}

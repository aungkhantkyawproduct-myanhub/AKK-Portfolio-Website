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

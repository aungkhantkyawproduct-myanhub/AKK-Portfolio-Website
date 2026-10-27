import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { useJourney } from "../../app/store";
const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `uniform float uTime,uOpacity,uLayer;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
void main(){vec2 p=vUv*4.+vec2(uTime*.045+uLayer*5.,uTime*.015);
float f=noise(p)*.5+noise(p*2.03)*.28+noise(p*4.1)*.15+noise(p*8.2)*.07;
// Every edge reaches zero: no rectangular planes become visible while diving.
vec2 edge=smoothstep(vec2(0.),vec2(.24),vUv)*smoothstep(vec2(0.),vec2(.24),1.-vUv);
float alpha=edge.x*edge.y*smoothstep(.18,.72,f)*uOpacity;
vec3 light=mix(vec3(.34,.48,.57),vec3(.91,.9,.82),smoothstep(.22,.8,f));
gl_FragColor=vec4(light,alpha);}`;
/** Camera-relative cloud banks conceal the orbit-to-meadow handoff. */
export default function Descent() {
  const group = useRef<Group>(null);
  const layers = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uLayer: { value: i },
      })),
    [],
  );
  useFrame(({ clock, camera }) => {
    const { scrollProgress: p, reducedMotion } = useJourney.getState();
    const density =
      MathUtils.smoothstep(p, 0.035, 0.085) *
      (1 - MathUtils.smoothstep(p, 0.105, 0.155));
    layers.forEach((uniforms) => {
      uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
      uniforms.uOpacity.value = density * 0.8;
    });
    if (!group.current) return;
    group.current.visible = density > 0.001;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);
    group.current.children.forEach((cloud, i) => {
      // Scroll advances through layers; time continues their lateral drift.
      cloud.position.z = -3 - i * 1.5 + (p - 0.035) * 8;
      cloud.position.x =
        Math.sin(i * 2.4 + (reducedMotion ? 0 : clock.elapsedTime * 0.035)) * 2;
    });
  });
  return (
    <group ref={group} name="descent-clouds">
      {layers.map((uniforms, i) => (
        <mesh
          key={i}
          position={[0, Math.sin(i * 1.7) * 2, -3 - i * 1.5]}
          rotation={[0, 0, i * 0.7]}
          renderOrder={30 - i}
        >
          <planeGeometry args={[18 + i * 2, 14 + i * 2]} />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={vertex}
            fragmentShader={fragment}
            transparent
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  );
}

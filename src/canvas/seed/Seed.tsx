import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { Group, LatheGeometry, Mesh, ShaderMaterial, Vector2 } from "three";
import { useJourney } from "../../app/store";
const vertex = `uniform float uTime;uniform float uCrack;varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=position;vec3 p=position;p.x+=sign(p.x)*uCrack*.12*abs(p.y+.3);p+=normal*sin(p.y*13.+uTime)*.008;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const fragment = `uniform float uTime;uniform float uCrack;varying vec3 vN;varying vec3 vP;void main(){float seam=pow(1.-abs(sin(vP.x*20.+vP.y*2.)),20.);float rim=pow(1.-abs(vN.z),2.);float stripes=sin(vP.y*90.+vP.x*20.)*.06;vec3 c=vec3(.19,.105,.045)+stripes;c+=vec3(.85,.58,.23)*(rim*.6+seam*(.15+uCrack)+.15*(sin(uTime*1.5)*.5+.5));gl_FragColor=vec4(c,1.);}`;
export default function Seed() {
  const group = useRef<Group>(null);
  const seed = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(
    () =>
      new LatheGeometry(
        Array.from({ length: 24 }, (_, i) => {
          const t = i / 23;
          return new Vector2(
            Math.sin(t * Math.PI) * (0.2 + 0.09 * t),
            t * 0.8 - 0.35,
          );
        }),
        48,
      ),
    [],
  );
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uCrack: { value: 0 } }),
    [],
  );
  useFrame(({ clock }) => {
    const p = useJourney.getState().scrollProgress;
    if (group.current) group.current.visible = p > 0.105 && p < 0.47;
    if (seed.current)
      seed.current.scale.setScalar(1 - Math.max(0, p - 0.28) * 4);
    if (material.current) {
      uniforms.uTime.value = clock.elapsedTime;
      uniforms.uCrack.value = Math.max(0, (p - 0.23) * 8);
    }
  });
  return (
    <group ref={group}>
      <mesh
        ref={seed}
        geometry={geometry}
        position={[0, 0.38, 0]}
        rotation={[0, 0, -0.35]}
      >
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
        />
      </mesh>
      <pointLight
        position={[0, 1, 1]}
        color="#dec394"
        intensity={4}
        distance={5}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.7, 0.705, 64]} />
        <meshBasicMaterial color="#b8a47e" transparent opacity={0.35} />
      </mesh>
      <Sparkles
        count={70}
        scale={[5, 3, 4]}
        position={[0, 1, 0]}
        size={1.5}
        speed={0.22}
        color="#dec394"
      />
      <Sparkles
        count={25}
        scale={[1, 5, 1]}
        position={[0, 2.4, 0]}
        size={2}
        speed={0.7}
        color="#9de9df"
      />
    </group>
  );
}

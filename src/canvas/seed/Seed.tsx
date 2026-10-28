import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import {
  DataTexture,
  DoubleSide,
  Group,
  LatheGeometry,
  MathUtils,
  RGBAFormat,
  Vector2,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { useJourney } from "../../app/store";
export default function Seed() {
  const group = useRef<Group>(null),
    halves = useRef<Group>(null);
  const geometry = useMemo(
    () =>
      [0, Math.PI].map(
        (angle) =>
          new LatheGeometry(
            Array.from({ length: 48 }, (_, i) => {
              const t = i / 47;
              return new Vector2(
                Math.pow(Math.sin(t * Math.PI), 0.65) * (0.18 + 0.055 * t),
                t * 0.58 - 0.29,
              );
            }),
            32,
            angle,
            Math.PI,
          ),
      ),
    [],
  );
  const texture = useMemo(() => {
    const size = 256,
      data = new Uint8Array(size * size * 4);
    let state = 81;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        state = (state * 1664525 + 1013904223) >>> 0;
        const grain = state / 4294967296;
        const ridge =
          Math.sin(x * 0.31 + Math.sin(y * 0.032) * 1.7) * 0.5 + 0.5;
        const seam = Math.exp(-Math.pow((x - size * 0.5) / 2.4, 2));
        const light = 0.62 + grain * 0.28 + ridge * 0.1 - seam * 0.25;
        const i = (y * size + x) * 4;
        data[i] = 125 * light;
        data[i + 1] = 75 * light;
        data[i + 2] = 38 * light;
        data[i + 3] = 255;
      }
    const map = new DataTexture(data, size, size, RGBAFormat);
    map.wrapS = map.wrapT = RepeatWrapping;
    map.colorSpace = SRGBColorSpace;
    map.needsUpdate = true;
    return map;
  }, []);
  useFrame(() => {
    const p = useJourney.getState().scrollProgress;
    if (group.current) group.current.visible = p > 0.105 && p < 0.43;
    if (halves.current) {
      const open = MathUtils.smoothstep(p, 0.252, 0.32);
      const sink = MathUtils.smoothstep(p, 0.315, 0.43);
      halves.current.position.y = 0.14 - sink * 0.4;
      halves.current.scale.set(
        1 - sink * 0.45,
        1 - sink * 0.45,
        (1 - sink * 0.45) * 0.65,
      );
      halves.current.children.forEach((half, i) => {
        const side = i === 0 ? 1 : -1;
        half.position.x = side * open * 0.1;
        half.rotation.z = side * open * 0.35;
      });
    }
  });
  return (
    <group ref={group}>
      <group
        ref={halves}
        position={[0, 0.14, 0]}
        rotation={[0.65, 0, 1.05]}
        scale={[1, 1, 0.65]}
        name="seed-shells"
      >
        {geometry.map((shape, i) => (
          <mesh key={i} geometry={shape} castShadow>
            <meshStandardMaterial
              map={texture}
              bumpMap={texture}
              bumpScale={0.012}
              roughness={0.83}
              metalness={0}
              side={DoubleSide}
            />
          </mesh>
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <circleGeometry args={[0.36, 48]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`varying vec2 vUv;void main(){float a=1.-smoothstep(.12,.5,length(vUv-.5));gl_FragColor=vec4(.025,.035,.02,a*.7);}`}
        />
      </mesh>
      <pointLight
        position={[-1, 1.2, 1]}
        color="#ffdc9e"
        intensity={2.4}
        distance={4}
      />
      <Sparkles
        count={35}
        scale={[3, 2, 3]}
        position={[0, 1, 0]}
        size={1.1}
        speed={0.15}
        color="#dec394"
      />
    </group>
  );
}

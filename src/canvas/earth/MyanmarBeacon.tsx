import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import {
  AdditiveBlending,
  DoubleSide,
  Group,
  Material,
  Quaternion,
  Vector3,
} from "three";
import { useJourney } from "../../app/store";
import boundary from "./myanmarBoundary.json";
const surface = (lon: number, lat: number, r = 10.075) => {
  const a = (lat * Math.PI) / 180,
    b = (lon * Math.PI) / 180;
  return new Vector3(
    Math.cos(b) * Math.cos(a),
    Math.sin(a),
    -Math.sin(b) * Math.cos(a),
  ).multiplyScalar(r);
};
function inside(x: number, y: number, ring: number[][]) {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      result = !result;
  }
  return result;
}
/** Public-domain Natural Earth outline; every beam is anchored inside Myanmar. */
export default function MyanmarBeacon() {
  const outline = useRef<Group>(null);
  const { points, beams, uniforms } = useMemo(() => {
    const ring = boundary[0];
    const beams: { position: Vector3; rotation: Quaternion; height: number }[] =
      [];
    for (let lat = 17; lat <= 27; lat += 1.1)
      for (let lon = 93.5; lon < 99; lon += 1.1)
        if (inside(lon, lat, ring)) {
          const position = surface(lon, lat),
            normal = position.clone().normalize();
          beams.push({
            position,
            rotation: new Quaternion().setFromUnitVectors(
              new Vector3(0, 1, 0),
              normal,
            ),
            height: 1.1 + (Math.sin(lat * 9 + lon * 3) * 0.5 + 0.5) * 2.2,
          });
        }
    return {
      points: boundary.map((ring) =>
        ring.map(
          ([lon, lat]) =>
            surface(lon, lat).toArray() as [number, number, number],
        ),
      ),
      beams: beams.filter(
        (_, i) => i % Math.max(1, Math.ceil(beams.length / 16)) === 0,
      ),
      uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    };
  }, []);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    const fade = Math.max(0, 1 - useJourney.getState().scrollProgress / 0.11);
    uniforms.uFade.value = fade;
    outline.current?.traverse((o) => {
      if ("material" in o)
        (o.material as Material).opacity = fade * (o.userData.baseOpacity ?? 1);
    });
  });
  return (
    <group>
      <group name="myanmar-origin" position={surface(95.9, 21.9)} />
      <group ref={outline}>
        {points.map((ring, i) => (
          <group key={i}>
            <Line
              points={ring}
              color="#73ebc5"
              lineWidth={8}
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={AdditiveBlending}
              userData={{ baseOpacity: 0.12 }}
              toneMapped={false}
            />
            <Line
              points={ring}
              color="#a3f6bf"
              lineWidth={2}
              transparent
              opacity={0.85}
              depthWrite={false}
              blending={AdditiveBlending}
              userData={{ baseOpacity: 0.85 }}
              toneMapped={false}
            />
          </group>
        ))}
      </group>
      {beams.map(({ position, rotation, height }, i) => (
        <group key={i} position={position} quaternion={rotation}>
          {[0, Math.PI / 2].map((angle) => (
            <mesh
              key={angle}
              position={[0, height / 2, 0]}
              rotation={[0, angle, 0]}
            >
              <planeGeometry args={[0.25, height]} />
              <shaderMaterial
                transparent
                depthWrite={false}
                side={DoubleSide}
                blending={AdditiveBlending}
                uniforms={uniforms}
                vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
                fragmentShader={`varying vec2 vUv;uniform float uTime,uFade;void main(){float x=abs(vUv.x-.5);float ray=exp(-x*x*95.)*pow(1.-vUv.y,1.8);float pulse=.65+.35*sin(vUv.y*11.-uTime*1.3);gl_FragColor=vec4(mix(vec3(.45,1.,.75),vec3(.1,.65,1.),vUv.y),ray*pulse*uFade*.65);}`}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

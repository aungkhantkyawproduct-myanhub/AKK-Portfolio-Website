import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  Group,
  ShaderMaterial,
  Texture,
  Vector3,
} from "three";
import { useJourney } from "../../app/store";
import { content } from "../../content/content";
import MyanmarBeacon from "./MyanmarBeacon";
import useEarthTextures from "./useEarthTextures";
import {
  earthVertex,
  earthFragment,
  atmosphereFragment,
  cloudFragment,
} from "../../shaders/earth";
const sun = new Vector3(-0.8, 0.6, 0.9).normalize();
export default function Earth() {
  const globe = useRef<Group>(null);
  const world = useRef<Group>(null);
  const cloud = useRef<Group>(null);
  const orbitLive = useRef(
    document.documentElement.dataset.heroRevealed === "true",
  );
  useEffect(() => {
    const reveal = () => {
      orbitLive.current = true;
    };
    window.addEventListener("hero-reveal", reveal);
    return () => window.removeEventListener("hero-reveal", reveal);
  }, []);
  const showMarkers = useJourney((s) => s.scrollProgress < 0.12);
  const uniforms = useMemo(
    () => ({
      uDay: { value: new Texture() },
      uNight: { value: new Texture() },
      uHasDay: { value: 0 },
      uHasNight: { value: 0 },
      uSun: { value: sun },
    }),
    [],
  );
  const clouds = useMemo(() => ({ uTime: { value: 0 } }), []);
  const mat = useRef<ShaderMaterial>(null);
  useEarthTextures(uniforms);
  useFrame((_, dt) => {
    const p = useJourney.getState().scrollProgress;
    if (world.current) world.current.visible = p < 0.125;
    if (orbitLive.current && globe.current)
      globe.current.rotation.y += dt * 0.002;
    if (orbitLive.current && cloud.current) {
      cloud.current.rotation.y += dt * 0.0035;
      clouds.uTime.value += dt;
    }
  });
  return (
    <group ref={world} position={[0, -10, 0]} rotation={[-0.95, 0, -0.4084]}>
      <group ref={globe} rotation={[0, -3.42, 0]}>
        <MyanmarBeacon />
        <mesh name="earth-surface">
          <sphereGeometry args={[10, 256, 128]} />
          <shaderMaterial
            ref={mat}
            vertexShader={earthVertex}
            fragmentShader={earthFragment}
            uniforms={uniforms}
          />
        </mesh>
        {showMarkers &&
          content.markers.map((m, i) => (
            <Html
              key={m.name}
              position={i === 0 ? [-1.7, 2.4, -9.58] : [-1.05, 2.91, -9.51]}
              center
              occlude
              zIndexRange={[10, 0]}
            >
              <button
                className="earth-marker"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-detail", {
                      detail: { title: m.name, text: m.description },
                    }),
                  );
                  window.dispatchEvent(new Event("camera-nudge"));
                }}
              >
                <i />
                {m.name}
              </button>
            </Html>
          ))}
      </group>
      <group ref={cloud} rotation={[0, -3.42, 0]}>
        <mesh>
          <sphereGeometry args={[10.04, 160, 96]} />
          <shaderMaterial
            vertexShader={earthVertex}
            fragmentShader={cloudFragment}
            uniforms={clouds}
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[10.16, 160, 96]} />
        <shaderMaterial
          vertexShader={earthVertex}
          fragmentShader={atmosphereFragment}
          uniforms={{ uSun: { value: sun } }}
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

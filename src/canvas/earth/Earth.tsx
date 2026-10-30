import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  Group,
  ShaderMaterial,
  Texture,
  TextureLoader,
  RepeatWrapping,
  LinearMipmapLinearFilter,
  Vector3,
} from "three";
import { useJourney } from "../../app/store";
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
  const clouds = useMemo(() => ({ uTime: { value: 0 }, uCloud: { value: new Texture() }, uHasCloud: { value: 0 } }), []);
  useEffect(() => {
    let live = true;
    const texture = new TextureLoader().load('/textures/earth-clouds-4k.webp', map => {
      if (!live) { map.dispose(); return; }
      map.wrapS = RepeatWrapping;
      map.minFilter = LinearMipmapLinearFilter;
      map.anisotropy = 8;
      clouds.uCloud.value.dispose();
      clouds.uCloud.value = map;
      clouds.uHasCloud.value = 1;
    }, undefined, () => { /* Existing procedural shader remains a fallback. */ });
    return () => { live = false; texture.dispose(); clouds.uCloud.value.dispose(); };
  }, [clouds]);
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

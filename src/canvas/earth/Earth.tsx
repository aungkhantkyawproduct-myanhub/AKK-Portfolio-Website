import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  Group,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { useJourney } from "../../app/store";
import { content } from "../../content/content";
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
  const progress = useJourney((s) => s.scrollProgress);
  const tier = useJourney((s) => s.qualityTier);
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
  useEffect(() => {
    let live = true;
    const textures: Texture[] = [];
    const loader = new TextureLoader();
    const load = (
      url: string,
      key: "uDay" | "uNight",
      flag: "uHasDay" | "uHasNight",
    ) =>
      loader.load(
        url,
        (t) => {
          if (!live) {
            t.dispose();
            return;
          }
          textures.push(t);
          t.anisotropy = 4;
          uniforms[key].value = t;
          uniforms[flag].value = 1;
          if (key === "uDay") window.dispatchEvent(new Event("world-ready"));
        },
        undefined,
        () => {
          window.dispatchEvent(new Event("world-ready"));
        },
      );
    load("/textures/earth-day-2k.webp", "uDay", "uHasDay");
    if (tier === "high")
      setTimeout(() => {
        if (live) load("/textures/earth-day-8k.webp", "uDay", "uHasDay");
      }, 1800);
    fetch("/textures/earth-night-2k.webp", { method: "HEAD" })
      .then((r) => {
        if (live && r.ok && r.headers.get("content-type")?.startsWith("image"))
          load("/textures/earth-night-2k.webp", "uNight", "uHasNight");
      })
      .catch(() => {});
    return () => {
      live = false;
      textures.forEach((t) => t.dispose());
    };
  }, [uniforms]);
  useFrame((_, dt) => {
    const p=useJourney.getState().scrollProgress;
    if(world.current) world.current.visible=p<.125;
    if (globe.current) globe.current.rotation.y += dt * 0.012;
    if (cloud.current) cloud.current.rotation.y += dt * 0.018;
  });
  return (
    <group ref={world} position={[0, -10, 0]} rotation={[-0.55, 0, -0.4084]}>
      <group ref={globe} rotation={[0, -4.4, 0]}>
        <mesh>
          <sphereGeometry args={[10, 96, 64]} />
          <shaderMaterial
            ref={mat}
            vertexShader={earthVertex}
            fragmentShader={earthFragment}
            uniforms={uniforms}
          />
        </mesh>
        {progress < 0.12 &&
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
      <group ref={cloud} rotation={[0, -4.4, 0]}>
        <mesh>
          <sphereGeometry args={[10.04, 72, 48]} />
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
        <sphereGeometry args={[10.16, 72, 48]} />
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

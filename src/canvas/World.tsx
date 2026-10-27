import { useEffect, useRef, useState, type ReactNode } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import Earth from "./earth/Earth";
import CameraRig from "./CameraRig";
import Seed from "./seed/Seed";
import Tree from "./tree/Tree";
import Realms from "./tree/Realms";
import PolarEffects from "./earth/PolarEffects";
import Descent from "./seed/Descent";
import Effects from "./Effects";
import Quality from "./Quality";
import Environment from "./Environment";
import Meadow from "./seed/Meadow";
import Sun from "./earth/Sun";
import { useJourney } from "../app/store";
import { Preload } from "@react-three/drei";
import { useDisplay } from "../hooks/useDisplay";
function JourneyWorld({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (group.current)
      group.current.visible = useJourney.getState().profileBlend < 0.995;
  });
  return (
    <group ref={group} name="journey-world">
      {children}
    </group>
  );
}
export default function World() {
  const display = useDisplay();
  const tier = useJourney((s) => s.qualityTier);
  const requested = useJourney((s) => s.scrollProgress > 0.015);
  const [localReady, setLocalReady] = useState(false);
  useEffect(() => {
    if (requested) setLocalReady(true);
  }, [requested]);
  return (
    <Canvas
      camera={{ position: [0, 4, 12], fov: 45, near: 0.05, far: 250 }}
      dpr={
        tier === "low"
          ? 1
          : Math.min(display.dpr, display.width < 600 ? 1.5 : 2)
      }
      gl={{
        antialias: tier !== "low",
        powerPreference: "high-performance",
        alpha: true,
        premultipliedAlpha: false,
      }}
    >
      <color attach="background" args={["#05070d"]} />
      <JourneyWorld>
        <ambientLight intensity={0.7} />
        <directionalLight position={[-10, 10, 10]} intensity={2} />
        <Stars
          radius={100}
          depth={40}
          count={tier === "low" ? 3500 : 8000}
          factor={3.5}
          fade
        />
        <Earth />
        <Sun />
        {localReady && <Environment />}
        <PolarEffects />
        <CameraRig />
        {localReady && <Seed />}
        {localReady && <Meadow />}
        {localReady && <Descent />}
        {localReady && <Tree />}
        {localReady && <Realms />}
        <Quality />
        <Preload />
      </JourneyWorld>
      <Effects />
    </Canvas>
  );
}

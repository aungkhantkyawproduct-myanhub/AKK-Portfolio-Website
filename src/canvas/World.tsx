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
export default function World() {
  const tier = useJourney((s) => s.qualityTier);
  return (
    <Canvas
      camera={{ position: [0, 3, 12.7], fov: 45, near: 0.05, far: 250 }}
      dpr={
        tier === "low"
          ? 1
          : Math.min(devicePixelRatio, innerWidth < 600 ? 1.5 : 2)
      }
      gl={{ antialias: tier !== "low", powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#05070d"]} />
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
      <Environment />
      <PolarEffects />
      <CameraRig />
      <Seed />
      <Meadow />
      <Descent />
      <Tree />
      <Realms />
      <Effects />
      <Quality />
      <Preload all />
    </Canvas>
  );
}

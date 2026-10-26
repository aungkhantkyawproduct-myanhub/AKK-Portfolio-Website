import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { useJourney } from "../app/store";
export default function Effects() {
  const tier = useJourney((s) => s.qualityTier);
  return tier === "low" ? null : (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.32}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.5}
        mipmapBlur
      />
      <Noise opacity={0.008} />
      <Vignette eskil={false} offset={0.25} darkness={0.45} />
    </EffectComposer>
  );
}

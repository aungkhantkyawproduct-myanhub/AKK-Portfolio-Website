import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
  ToneMapping,
} from "@react-three/postprocessing";
import { useJourney } from "../app/store";
import AuroraEffect from "./aurora/AuroraEffect";
import { ToneMappingMode } from "postprocessing";
export default function Effects() {
  const tier = useJourney((s) => s.qualityTier);
  return (
    <EffectComposer multisampling={0}>
      {[
        ...(tier !== "low"
          ? [
              <Bloom
                key="bloom"
                intensity={0.32}
                luminanceThreshold={0.85}
                luminanceSmoothing={0.5}
                mipmapBlur
              />,
              <Noise key="grain" opacity={0.008} />,
              <Vignette
                key="vignette"
                eskil={false}
                offset={0.25}
                darkness={0.45}
              />,
            ]
          : // Offscreen scene rendering skips the direct renderer's ACES curve.
            // Restore it before adding cursor light, so low tier keeps its look.
            [<ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />]),
        <AuroraEffect key="aurora" />,
      ]}
    </EffectComposer>
  );
}

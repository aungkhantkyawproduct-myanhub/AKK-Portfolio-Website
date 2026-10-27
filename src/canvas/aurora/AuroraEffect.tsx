import { useContext, useEffect, useMemo } from "react";
import { EffectComposerContext } from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, Effect } from "postprocessing";
import { Uniform, Vector2, Vector3 } from "three";
import { cursorAuroraPalette } from "../../styles/palette";
import { useJourney } from "../../app/store";
import { cursorAuroraFragment } from "../../shaders/cursorAurora";
import { advanceAurora, auroraMotion, stopAurora } from "./motion";
import { checkDisplayDensity } from "../../hooks/useDisplay";

export default function AuroraEffect() {
  const tier = useJourney((state) => state.qualityTier);
  const { gl, size, viewport } = useThree();
  const composerState = useContext(EffectComposerContext);
  const composer = composerState?.composer;
  const uniforms = useMemo(
    () => ({
      uHead: new Uniform(new Vector2(0.5, 0.5)),
      uWake: new Uniform(new Vector2(0.5, 0.5)),
      uVelocity: new Uniform(new Vector2()),
      uViewport: new Uniform(new Vector2(1, 1)),
      uTime: new Uniform(0),
      uEnergy: new Uniform(0),
      uLayers: new Uniform(3),
      uProfile: new Uniform(0),
      uEmerald: new Uniform(new Vector3(...cursorAuroraPalette.emerald)),
      uCyan: new Uniform(new Vector3(...cursorAuroraPalette.cyan)),
      uViolet: new Uniform(new Vector3(...cursorAuroraPalette.violet)),
    }),
    [],
  );
  const effect = useMemo(
    () =>
      new Effect("CursorAurora", cursorAuroraFragment, {
        blendFunction: BlendFunction.NORMAL,
        uniforms: new Map(Object.entries(uniforms)),
      }),
    [uniforms],
  );

  useEffect(() => {
    // Canvas owns DPR. Sync targets after its renderer updates, including when
    // CSS dimensions stay unchanged during a display-density transfer.
    composer?.setSize(size.width, size.height);
  }, [composer, size.width, size.height, viewport.dpr]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const pixels = new Vector2();
    Object.assign(window, {
      __auroraDiagnostic: () => ({
        ...auroraMotion,
        renderedEnergy: uniforms.uEnergy.value,
        profileBlend: uniforms.uProfile.value,
        layers: uniforms.uLayers.value,
        viewport: uniforms.uViewport.value.toArray(),
        buffer: gl.getDrawingBufferSize(pixels).toArray(),
        targetBuffer: composer
          ? [composer.inputBuffer.width, composer.inputBuffer.height]
          : null,
        dpr: gl.getPixelRatio(),
      }),
    });
    return () => {
      delete (window as any).__auroraDiagnostic;
    };
  }, [gl, uniforms, composer]);
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame(({ size }, delta) => {
    checkDisplayDensity();
    if (document.hidden) stopAurora(auroraMotion);
    else advanceAurora(auroraMotion, delta, performance.now() / 1000);
    const motion = auroraMotion;
    uniforms.uHead.value.set(
      motion.x / motion.width,
      1 - motion.y / motion.height,
    );
    uniforms.uWake.value.set(
      motion.wakeX / motion.width,
      1 - motion.wakeY / motion.height,
    );
    uniforms.uVelocity.value.set(motion.vx, -motion.vy);
    uniforms.uViewport.value.set(size.width, size.height);
    uniforms.uTime.value = motion.time;
    uniforms.uEnergy.value = motion.enabled ? motion.opacity : 0;
    uniforms.uProfile.value = useJourney.getState().profileBlend;
    uniforms.uLayers.value = tier === "low" ? 2 : 3;
  });
  return <primitive object={effect} />;
}

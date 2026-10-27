import { useContext, useEffect, useMemo } from "react";
import { EffectComposerContext } from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { Texture, Uniform, Vector2 } from "three";
import { useJourney } from "../../app/store";
import { cursorAuroraFragment } from "../../shaders/cursorAurora";
import { advanceAurora, auroraMotion, stopAurora } from "./motion";
import { checkDisplayDensity } from "../../hooks/useDisplay";
import { FluidField } from "./FluidField";

export default function AuroraEffect() {
  const tier = useJourney((state) => state.qualityTier);
  const { gl, size, viewport } = useThree();
  const composer = useContext(EffectComposerContext)?.composer;
  const fluid = useMemo(() => new FluidField(), []);
  const uniforms = useMemo(
    () => ({
      uDye: new Uniform<Texture>(fluid.empty),
      uFlow: new Uniform<Texture>(fluid.empty),
      uDyeTexel: new Uniform(fluid.dyeTexel),
      uSimTexel: new Uniform(fluid.simTexel),
      uEnergy: new Uniform(0),
      uProfile: new Uniform(0),
    }),
    [fluid],
  );
  const effect = useMemo(
    () =>
      new Effect("CursorAurora", cursorAuroraFragment, {
        blendFunction: BlendFunction.NORMAL,
        // Refraction samples neighboring scene pixels, so it needs a separate pass.
        attributes: EffectAttribute.CONVOLUTION,
        uniforms: new Map(Object.entries(uniforms)),
      }),
    [uniforms],
  );

  useEffect(() => {
    // Canvas owns DPR; keep the composer's targets synchronized with it.
    composer?.setSize(size.width, size.height);
  }, [composer, size.width, size.height, viewport.dpr]);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const pixels = new Vector2();
    Object.assign(window, {
      __fluidProbe: (x: number, y: number) => fluid.inspect(gl, x, y),
      __auroraDiagnostic: () => ({
        ...auroraMotion,
        renderedEnergy: uniforms.uEnergy.value,
        profileBlend: uniforms.uProfile.value,
        fluidActive: fluid.active,
        fluidSupported: fluid.supported,
        fluidDimensions: fluid.dimensions,
        simulationPasses: fluid.passes,
        simulationSteps: fluid.steps,
        viewport: [size.width, size.height],
        buffer: gl.getDrawingBufferSize(pixels).toArray(),
        targetBuffer: composer
          ? [composer.inputBuffer.width, composer.inputBuffer.height]
          : null,
        dpr: gl.getPixelRatio(),
      }),
    });
    return () => {
      delete (window as any).__auroraDiagnostic;
      delete (window as any).__fluidProbe;
    };
  }, [gl, uniforms, composer, fluid, size]);
  useEffect(
    () => () => {
      effect.dispose();
      fluid.dispose();
    },
    [effect, fluid],
  );
  useFrame((_, delta) => {
    checkDisplayDensity();
    if (document.hidden) stopAurora(auroraMotion);
    else advanceAurora(auroraMotion, delta, performance.now() / 1000);
    fluid.update(
      gl,
      auroraMotion,
      delta,
      performance.now() / 1000,
      tier === "low",
    );
    uniforms.uDye.value = fluid.dyeTexture;
    uniforms.uFlow.value = fluid.flowTexture;
    uniforms.uEnergy.value = fluid.active ? auroraMotion.opacity : 0;
    uniforms.uProfile.value = useJourney.getState().profileBlend;
  });
  return <primitive object={effect} />;
}

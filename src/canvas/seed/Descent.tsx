import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { useJourney } from "../../app/store";
import { MistField, mistComposite } from "./MistField";
// Clip-space coverage has no billboard edges when the camera crosses the clouds.
const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment = `uniform sampler2D uMist;uniform float uOpacity;varying vec2 vUv;
void main(){vec4 mist=texture2D(uMist,vUv);gl_FragColor=vec4(mist.rgb/max(mist.a,.001),mist.a*uOpacity);}`;
/** Composite a genuinely blurred mist texture, without blurring DOM text. */
export default function Descent() {
  const group = useRef<Group>(null);
  const { gl } = useThree();
  const field = useMemo(() => new MistField(), []);
  const uniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uMist: { value: field.texture },
    }),
    [field],
  );
  useEffect(() => {
    if (import.meta.env.DEV)
      Object.assign(window, { __mistProbe: () => field.inspect(gl) });
    return () => {
      delete (window as any).__mistProbe;
      field.dispose();
      mistComposite.texture = null;
      mistComposite.opacity = 0;
    };
  }, [field, gl]);
  useFrame(({ clock, size }) => {
    const { scrollProgress: p, reducedMotion } = useJourney.getState();
    const density =
      MathUtils.smoothstep(p, 0.035, 0.085) *
      (1 - MathUtils.smoothstep(p, 0.125, 0.17));
    uniforms.uOpacity.value = density * 0.98;
    mistComposite.opacity = uniforms.uOpacity.value;
    if (!group.current) return;
    group.current.visible = density > 0.001;
    if (group.current.visible) {
      field.update(
        gl,
        size.width,
        size.height,
        reducedMotion ? 0 : clock.elapsedTime,
        (p - 0.035) * 6,
      );
      uniforms.uMist.value = field.texture;
      mistComposite.texture = field.texture;
    } else field.passes = 0;
  });
  return (
    <group ref={group} name="descent-clouds">
      <mesh visible={false} frustumCulled={false} renderOrder={100}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
          transparent
          depthWrite={false}
          depthTest={false}
          precision="highp"
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

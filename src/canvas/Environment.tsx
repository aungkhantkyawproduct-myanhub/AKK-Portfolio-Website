import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BackSide, Group, FogExp2 } from "three";
import { skyFragment } from "../shaders/sky";
import { useJourney } from "../app/store";
/** The sky is fixed in world space. Only wind and light evolve with time. */
export default function Environment() {
  const group = useRef<Group>(null);
  const { scene } = useThree();
  const fog = useMemo(() => new FogExp2("#112531", 0.0045), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    const local = useJourney.getState().scrollProgress > 0.105;
    scene.fog = local ? fog : null;
    if (group.current) group.current.visible = local;
    uniforms.uTime.value = useJourney.getState().reducedMotion
      ? 0
      : clock.elapsedTime;
  });
  return (
    <group ref={group} name="sky">
      <mesh>
        <sphereGeometry args={[130, 64, 40]} />
        <shaderMaterial
          side={BackSide}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={skyFragment}
        />
      </mesh>
    </group>
  );
}

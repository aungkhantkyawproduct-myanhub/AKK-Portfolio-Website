import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Mesh } from "three";
import { useJourney } from "../../app/store";
export default function Sun() {
  const mesh = useRef<Mesh>(null);
  const uniforms = useMemo(() => ({ uFade: { value: 1 } }), []);
  useFrame(({ camera }) => {
    const p = useJourney.getState().scrollProgress;
    uniforms.uFade.value = Math.max(0, 1 - p / 0.08);
    if (mesh.current) {
      mesh.current.visible = p < 0.08;
      mesh.current.position.copy(camera.position);
      mesh.current.quaternion.copy(camera.quaternion);
      mesh.current.translateZ(-30);
      mesh.current.translateX(9);
      mesh.current.translateY(3.2);
    }
  });
  return (
    <mesh ref={mesh} renderOrder={20}>
      <planeGeometry args={[11, 11]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        depthTest={false}
        blending={AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vUv;uniform float uFade;void main(){vec2 p=vUv-.5;float r=length(p);float core=1.-smoothstep(.004,.009,r);float corona=exp(-r*52.)*.2;float halo=exp(-r*r*38.)*.065;vec3 light=vec3(1.,.97,.85)*core+vec3(.72,.86,1.)*corona+vec3(.55,.65,.82)*halo;gl_FragColor=vec4(light,uFade);}`}
      />
    </mesh>
  );
}

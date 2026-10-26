import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide, Quaternion, Vector3 } from "three";
import { useJourney } from "../../app/store";

/** Geographic anchor: 21.9 N, 95.9 E, in the day map's longitude convention. */
export default function MyanmarBeacon() {
  const { position, rotation, uniforms } = useMemo(() => {
    const lat = (21.9 * Math.PI) / 180,
      lon = (95.9 * Math.PI) / 180;
    const normal = new Vector3(
      Math.cos(lon) * Math.cos(lat),
      Math.sin(lat),
      -Math.sin(lon) * Math.cos(lat),
    );
    return {
      position: normal.clone().multiplyScalar(10.07),
      rotation: new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        normal,
      ),
      uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    };
  }, []);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uFade.value = Math.max(
      0,
      1 - useJourney.getState().scrollProgress / 0.11,
    );
  });
  return (
    <group position={position} quaternion={rotation}>
      {[0, Math.PI / 3, (Math.PI * 2) / 3].map((angle) => (
        <mesh key={angle} position={[0, 1.1, 0]} rotation={[0, angle, 0]}>
          <planeGeometry args={[0.65, 2.2]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            side={DoubleSide}
            blending={AdditiveBlending}
            uniforms={uniforms}
            vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
            fragmentShader={`varying vec2 vUv;uniform float uTime,uFade;void main(){float x=abs(vUv.x-.5);float ray=exp(-x*x*140.)*pow(1.-vUv.y,2.);float pulse=.75+.25*sin(vUv.y*14.-uTime*1.3);gl_FragColor=vec4(mix(vec3(1.,.75,.3),vec3(.2,.9,.8),vUv.y),ray*pulse*uFade*.65);}`}
          />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.085, 16, 12]} />
        <meshBasicMaterial color="#ffe9ad" toneMapped={false} />
      </mesh>
    </group>
  );
}

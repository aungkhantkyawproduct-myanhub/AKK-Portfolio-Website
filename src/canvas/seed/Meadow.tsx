import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  PlaneGeometry,
} from "three";
import { useJourney } from "../../app/store";
import { elevation } from "./terrain";
export default function Meadow() {
  const group = useRef<Group>(null);
  const ground = useMemo(() => {
    const g = new PlaneGeometry(320, 320, 128, 128),
      p = g.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setZ(i, elevation(p.getX(i), -p.getY(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const geometry = useMemo(() => {
    let seed = 723;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const g = new InstancedBufferGeometry(),
      pos: number[] = [],
      uv: number[] = [];
    for (let j = 0; j < 4; j++) {
      const a = j / 4,
        b = (j + 1) / 4;
      for (const [t, s] of [
        [a, -1],
        [a, 1],
        [b, 1],
        [a, -1],
        [b, 1],
        [b, -1],
      ]) {
        pos.push(s * (1 - t), t, 0);
        uv.push((s + 1) / 2, t);
      }
    }
    g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
    const count = 48000,
      origins: number[] = [],
      traits: number[] = [];
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2,
        r = Math.pow(random(), 1.15) * 40;
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      origins.push(x, elevation(x, z), z);
      traits.push(
        0.1 + random() * 0.2,
        random() * Math.PI * 2,
        0.009 + random() * 0.009,
        random(),
      );
    }
    g.setAttribute(
      "aOrigin",
      new InstancedBufferAttribute(new Float32Array(origins), 3),
    );
    g.setAttribute(
      "aTraits",
      new InstancedBufferAttribute(new Float32Array(traits), 4),
    );
    g.instanceCount = count;
    return g;
  }, []);
  useFrame(({ clock }) => {
    const tier = useJourney.getState().qualityTier;
    geometry.instanceCount = tier === "low" ? 18000 : tier === "medium" ? 32000 : 48000;
    if (group.current)
      group.current.visible = useJourney.getState().scrollProgress > 0.115;
    uniforms.uTime.value = useJourney.getState().reducedMotion
      ? 0
      : clock.elapsedTime;
  });
  return (
    <group ref={group} name="meadow">
      <mesh geometry={ground} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#20372d" roughness={1} />
      </mesh>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          side={DoubleSide}
          uniforms={uniforms}
          vertexShader={`attribute vec3 aOrigin;attribute vec4 aTraits;uniform float uTime;varying float vHeight,vTone,vFog,vGlow;void main(){float t=position.y;float gust=sin(aOrigin.x*.5+aOrigin.z*.35-uTime*1.1)+.3*sin(aOrigin.z*2.+uTime*1.6);float angle=aTraits.y;vec3 p=aOrigin+vec3(cos(angle)*position.x*aTraits.z, .006+t*aTraits.x,sin(angle)*position.x*aTraits.z);p.x+=(.10+gust*.055)*t*t;p.z+=sin(angle)*.06*t*t;vHeight=t;vTone=aTraits.w;vGlow=exp(-length(aOrigin.xz)/10.);vFog=1.-exp(-length(cameraPosition-p)*.006);if(length(aOrigin.xz)<.29)p.y=0.;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`}
          fragmentShader={`varying float vHeight,vTone,vFog,vGlow;void main(){vec3 c=mix(vec3(.025,.067,.042),vec3(.22,.34,.17),vHeight)*(.25+vTone*.25);c+=vec3(.012,.065,.058)*vGlow;gl_FragColor=vec4(mix(c,vec3(.008,.022,.03),vFog),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}
        />
      </mesh>
    </group>
  );
}

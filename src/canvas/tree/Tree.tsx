import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useJourney } from "../../app/store";
import { createSkeleton } from "./skeleton";
import { palette } from "../../styles/palette";
const vertex = `attribute vec3 aStart;attribute float aBirth;uniform float uGrowth;uniform float uTime;varying vec2 vBarkUv;varying vec3 vN;varying vec3 vP;varying float vG;
void main(){vBarkUv=uv;float g=smoothstep(aBirth,aBirth+.12,uGrowth);vec3 p=mix(aStart,position,g);p.x+=sin(uTime*.45+p.y*.65)*.012*max(p.y,0.)*g;vN=normalize(normalMatrix*normal);vP=position;vG=g;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const fragment = `uniform float uOpacity;uniform float uLocal;uniform vec3 uBark;uniform vec3 uGold;varying vec2 vBarkUv;varying vec3 vN;varying vec3 vP;varying float vG;void main(){if(vG<.005||(uLocal>.5&&vP.y<0.))discard;float grooves=sin(vBarkUv.x*100.+sin(vP.y*1.2)*.6)*.5+.5;float vein=pow(grooves,28.);float l=.3+max(dot(normalize(vN),normalize(vec3(-1,1,1))),0.)*.8;vec3 c=(uBark+vec3(.08,.055,.025))*(.7+grooves*.3)*l+vec3(.08,.8,.73)*vein*.06;gl_FragColor=vec4(c,uOpacity);}`;
const leafVertex = `attribute vec3 aCenter;attribute float aBirth;uniform float uGrowth;uniform float uTime;varying vec2 vUv;varying float vG;void main(){vUv=uv;float g=smoothstep(aBirth,aBirth+.1,uGrowth);vec3 p=aCenter+(position-aCenter)*g;p.x+=sin(uTime*.8+p.y+p.z)*.018*max(p.y,0.);vG=g;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const leafFragment = `uniform float uOpacity;uniform float uSeason;uniform vec3 uGreen;uniform vec3 uGold;varying vec2 vUv;varying float vG;void main(){vec2 q=vUv*2.-1.;if(abs(q.x)+q.y*q.y>1.||vG<.01)discard;vec3 c=mix(uGreen,uGold,uSeason);float vein=1.-smoothstep(.015,.055,abs(q.x));c*=.45+(.25+q.y*.2);c+=vec3(.03,.06,.03)*vein;gl_FragColor=vec4(c,uOpacity);}`;
export default function Tree() {
  const group = useRef<Group>(null);
  const bark = useRef<ShaderMaterial>(null);
  const leaf = useRef<ShaderMaterial>(null);
  const tier = useJourney((s) => s.qualityTier);
  const data = useMemo(() => {
    const { segments, leaves } = createSkeleton();
    const parts = segments.map((s) => {
      const dir = s.end.clone().sub(s.start);
      const geo = new CylinderGeometry(
        s.radius * 0.88,
        s.radius,
        dir.length(),
        9,
        3,
      );
      geo.applyMatrix4(
        new Matrix4().compose(
          s.start.clone().add(s.end).multiplyScalar(0.5),
          new Quaternion().setFromUnitVectors(
            new Vector3(0, 1, 0),
            dir.normalize(),
          ),
          new Vector3(1, 1, 1),
        ),
      );
      const n = geo.attributes.position.count;
      geo.setAttribute(
        "aStart",
        new BufferAttribute(
          new Float32Array(
            Array.from({ length: n }, () => s.start.toArray()).flat(),
          ),
          3,
        ),
      );
      geo.setAttribute(
        "aBirth",
        new BufferAttribute(new Float32Array(n).fill(s.birth), 1),
      );
      return geo;
    });
    const branches = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    const chosen = leaves.filter((_, i) => tier !== "low" || i % 3 === 0);
    const pos: number[] = [],
      centers: number[] = [],
      uv: number[] = [],
      birth: number[] = [];
    chosen.forEach((l) => {
      const corners = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, -1],
        [1, 1],
        [-1, 1],
      ];
      corners.forEach(([x, y]) => {
        pos.push(
          l.position.x + x * l.size * Math.cos(l.angle),
          l.position.y + y * l.size * 1.2,
          l.position.z + x * l.size * Math.sin(l.angle),
        );
        centers.push(...l.position.toArray());
        uv.push((x + 1) / 2, (y + 1) / 2);
        birth.push(l.birth);
      });
    });
    const foliage = new BufferGeometry();
    foliage.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(pos), 3),
    );
    foliage.setAttribute(
      "aCenter",
      new BufferAttribute(new Float32Array(centers), 3),
    );
    foliage.setAttribute(
      "aBirth",
      new BufferAttribute(new Float32Array(birth), 1),
    );
    foliage.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
    return { branches, foliage };
  }, [tier]);
  const uniforms = useMemo(
    () => ({
      uOpacity: {value:1},
      uLocal: { value: 1 },
      uGrowth: { value: 0 },
      uTime: { value: 0 },
      uBark: { value: new Color(palette.bark) },
      uGold: { value: new Color(palette.gold) },
      uGreen: { value: new Color(palette.green) },
      uSeason: { value: 0 },
    }),
    [],
  );
  useFrame(({ clock }) => {
    const p = useJourney.getState().scrollProgress;
    uniforms.uLocal.value = 1;
    uniforms.uOpacity.value=1;
    uniforms.uGrowth.value = Math.max(0, Math.min(1, (p - 0.24) / 0.59));
    uniforms.uTime.value = useJourney.getState().reducedMotion
      ? 0
      : clock.elapsedTime;
    uniforms.uSeason.value =
      p > 0.7 ? (Math.sin((p - 0.7) * 26) * 0.5 + 0.5) * 0.22 : 0;
    if (group.current) {
      group.current.visible = p > 0.235;
      const size = 0.18 + 0.82 * Math.min(1, Math.max(0, (p - 0.25) / 0.49));
      group.current.scale.setScalar(size);
    }
  });
  return (
    <group ref={group} name="growing-tree">
      <mesh geometry={data.branches} frustumCulled={false}>
        <shaderMaterial
          ref={bark}
          vertexShader={vertex}
          fragmentShader={fragment}
          transparent
          uniforms={uniforms}
        />
      </mesh>
      <mesh geometry={data.foliage} frustumCulled={false}>
        <shaderMaterial
          ref={leaf}
          vertexShader={leafVertex}
          fragmentShader={leafFragment}
          transparent
          uniforms={uniforms}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

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
import { getSkeleton } from "./skeleton";
import { palette } from "../../styles/palette";
const vertex = `attribute vec3 aStart;attribute vec3 aDirection;attribute float aBirth,aFinish,aAlong,aRoot;uniform float uGrowth;uniform float uTime;varying vec2 vBarkUv;varying vec3 vN;varying vec3 vP;varying float vG;
void main(){vBarkUv=uv;float g=smoothstep(aBirth,aFinish,uGrowth);
vec3 delta=position-aStart;vec3 axial=aDirection*dot(delta,aDirection);vec3 radial=delta-axial;
float thickness=mix(.018,1.,smoothstep(.15,.8,uGrowth));
// A growing tip tapers to a living apex, instead of exposing a sawn cylinder.
float tip=mix(1.,.035+.965*(1.-smoothstep(.45,1.,aAlong)),1.-smoothstep(.7,1.,g));
vec3 p=aStart+(axial+radial*thickness*tip)*g;
p.y*=mix(1.,smoothstep(.42,.85,uGrowth),aRoot);
p.x+=sin(uTime*.65+p.y*.65)*.007*max(p.y,0.)*(1.-smoothstep(.2,.65,uGrowth));vN=normalize(normalMatrix*normal);vP=p;vG=g;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const fragment = `uniform float uOpacity,uGrowth;uniform float uLocal;uniform vec3 uBark;uniform vec3 uGold;varying vec2 vBarkUv;varying vec3 vN;varying vec3 vP;varying float vG;
float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,41.31)))*43758.5453);}
void main(){if(vG<.005||(uLocal>.5&&vP.y<0.))discard;
float angle=atan(vP.z,vP.x);float ridge=.5+.5*sin(vBarkUv.x*94.+sin(vP.y*2.8)*1.7);float pores=hash(floor(vP*55.));float fissure=pow(1.-ridge,5.);
vec3 n=normalize(vN);float key=max(dot(n,normalize(vec3(-.55,.85,.65))),0.);float rim=pow(1.-abs(n.z),2.);
float vein=pow(.5+.5*sin(angle*11.+vP.y*.8+sin(vP.y*.6)*2.),60.);float pulse=.75+.25*sin(vP.y*.7);
vec3 wood=vec3(.12,.106,.087)*(.78+ridge*.22+pores*.08);wood*=.48+key*.85;wood*=1.-fissure*.35;
float woody=smoothstep(.13,.43,uGrowth);
vec3 living=mix(vec3(.045,.12,.025),vec3(.16,.3,.06),key)*(.9+.1*sin(vP.y*.25));
vec3 c=mix(living,wood,woody)+vec3(.06,.22,.23)*rim*.25+vec3(.08,1.05,.95)*vein*pulse*.4*smoothstep(.38,.72,uGrowth);gl_FragColor=vec4(c,uOpacity);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const leafVertex = `attribute vec3 aCenter;attribute float aBirth,aJuvenile;uniform float uGrowth;uniform float uTime;varying vec2 vUv;varying float vG,vJuvenile;varying float vTone;varying vec3 vLeaf;
void main(){vUv=uv;vJuvenile=aJuvenile;float g=smoothstep(aBirth,aBirth+mix(.07,.025,aJuvenile),uGrowth);
vec3 offset=position-aCenter;float furl=(1.-g)*aJuvenile;offset.y+=length(offset.xz)*furl*.8;offset.xz*=mix(1.,.12,furl);
float age=1.-aJuvenile*smoothstep(.55,.8,uGrowth);vec3 p=aCenter+offset*g*age;
p.x+=sin(uTime*.65+p.y*.65)*.007*max(p.y,0.)*(1.-smoothstep(.2,.65,uGrowth));
p.z+=sin(uTime*1.25+aCenter.y*2.)*.018*g*vUv.y*aJuvenile;
vTone=fract(sin(dot(aCenter,vec3(12.98,78.23,43.1)))*43758.);vLeaf=p;vG=g*age;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const leafFragment = `uniform float uOpacity;uniform float uSeason;uniform vec3 uGreen;uniform vec3 uGold;varying vec2 vUv;varying float vG,vJuvenile;varying float vTone;varying vec3 vLeaf;
void main(){vec2 q=vUv*2.-1.;if((vJuvenile<.5&&abs(q.x)+q.y*q.y>1.)||vG<.01)discard;
vec3 n=normalize(cross(dFdx(vLeaf),dFdy(vLeaf)));float light=abs(dot(n,normalize(vec3(-.4,1.,.6))));
vec3 c=mix(vec3(.022,.08,.057),vec3(.075,.205,.135),vTone);c=mix(c,uGold*.38,uSeason);c*=.65+light*.6;
vec3 young=mix(vec3(.035,.14,.025),vec3(.18,.38,.065),light)*(.85+vUv.y*.15);c=mix(c,young,vJuvenile);
float vein=1.-smoothstep(.015,.055,abs(q.x));float ribs=pow(max(0.,cos(vUv.y*62.-abs(q.x)*10.)),12.)*.018;
c+=vec3(.025,.052,.026)*vein+vec3(.4,.65,.22)*ribs*vJuvenile;c+=vec3(.04,.12,.12)*pow(light,4.)*.3;
gl_FragColor=vec4(c,uOpacity);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export default function Tree() {
  const group = useRef<Group>(null);
  const bark = useRef<ShaderMaterial>(null);
  const leaf = useRef<ShaderMaterial>(null);
  const data = useMemo(() => {
    const { segments, leaves } = getSkeleton();
    const parts = segments.map((s) => {
      const dir = s.end.clone().sub(s.start);
      const length = dir.length();
      const geo = new CylinderGeometry(
        s.endRadius ?? s.radius * 0.92,
        s.radius,
        dir.length(),
        s.radius > 0.22 ? 16 : s.radius > 0.07 ? 8 : 5,
        s.radius > 0.22 ? 3 : 1,
        false,
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
      const along = new Float32Array(n),
        positions = geo.attributes.position;
      for (let i = 0; i < n; i++)
        along[i] =
          ((positions.getX(i) - s.start.x) * dir.x +
            (positions.getY(i) - s.start.y) * dir.y +
            (positions.getZ(i) - s.start.z) * dir.z) /
          length;
      geo.setAttribute("aAlong", new BufferAttribute(along, 1));
      geo.setAttribute(
        "aRoot",
        new BufferAttribute(new Float32Array(n).fill(s.root ? 1 : 0), 1),
      );
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
        "aDirection",
        new BufferAttribute(
          new Float32Array(
            Array.from({ length: n }, () => dir.toArray()).flat(),
          ),
          3,
        ),
      );
      geo.setAttribute(
        "aBirth",
        new BufferAttribute(new Float32Array(n).fill(s.birth), 1),
      );
      geo.setAttribute(
        "aFinish",
        new BufferAttribute(new Float32Array(n).fill(s.finish), 1),
      );
      return geo;
    });
    const branches = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    // Retain the first leaves even when the device lowers canopy density.
    const lowLeaves = leaves.filter((leaf, i) => leaf.juvenile || i % 3 === 0);
    const chosen = lowLeaves.concat(
      leaves.filter((leaf, i) => !leaf.juvenile && i % 3 !== 0),
    );
    const pos: number[] = [],
      centers: number[] = [],
      uv: number[] = [],
      birth: number[] = [],
      juvenile: number[] = [];
    chosen.forEach((l) => {
      if (l.juvenile) {
        // Curved leaf blade, grown from the petiole with a raised midrib.
        const rows = 8;
        for (let row = 0; row < rows; row++) {
          for (const [t, x] of [
            [row / rows, -1],
            [row / rows, 1],
            [(row + 1) / rows, 1],
            [row / rows, -1],
            [(row + 1) / rows, 1],
            [(row + 1) / rows, -1],
          ]) {
            const width = l.size * 0.31 * Math.pow(Math.sin(t * Math.PI), 0.85);
            const along = l.size * t;
            pos.push(
              l.position.x +
                Math.cos(l.angle) * along -
                Math.sin(l.angle) * x * width,
              l.position.y +
                l.size * (0.6 * t - 0.25 * t * t) +
                x * width * 0.45,
              l.position.z +
                Math.sin(l.angle) * along +
                Math.cos(l.angle) * x * width,
            );
            centers.push(...l.position.toArray());
            uv.push((x + 1) / 2, t);
            birth.push(l.birth);
            juvenile.push(1);
          }
        }
        return;
      }
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
        juvenile.push(0);
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
    foliage.setAttribute(
      "aJuvenile",
      new BufferAttribute(new Float32Array(juvenile), 1),
    );
    return {
      branches,
      foliage,
      lowLeafVertices: lowLeaves.reduce((n, l) => n + (l.juvenile ? 48 : 6), 0),
    };
  }, []);
  const uniforms = useMemo(
    () => ({
      uOpacity: { value: 1 },
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
    data.foliage.setDrawRange(
      0,
      useJourney.getState().qualityTier === "low"
        ? data.lowLeafVertices
        : Infinity,
    );
    uniforms.uLocal.value = 1;
    uniforms.uOpacity.value = 1;
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
          uniforms={uniforms}
        />
      </mesh>
      <mesh geometry={data.foliage} frustumCulled={false}>
        <shaderMaterial
          ref={leaf}
          vertexShader={leafVertex}
          fragmentShader={leafFragment}
          uniforms={uniforms}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

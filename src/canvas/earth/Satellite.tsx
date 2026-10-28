import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Material,
  MathUtils,
  Matrix4,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useJourney } from "../../app/store";
import { earthCenter, satelliteOrbit as orbit } from "../cameraPath";

const panelVertex = `varying vec2 vUv;varying vec3 vNormal;
void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const panelFragment = `uniform float uFade;varying vec2 vUv;varying vec3 vNormal;
void main(){vec2 cell=vUv*vec2(8.,5.);vec2 edge=min(fract(cell),1.-fract(cell));
vec2 aa=max(fwidth(cell)*1.2,vec2(.012));float grid=1.-smoothstep(.012,.012+aa.x,edge.x)*smoothstep(.012,.012+aa.y,edge.y);
float light=.45+.55*abs(dot(normalize(vNormal),normalize(vec3(-.8,.6,.9))));
vec3 blue=mix(vec3(.008,.025,.08),vec3(.035,.13,.3),vUv.y);
gl_FragColor=vec4(mix(blue,vec3(.23,.37,.49),grid*.75)*light,uFade);}`;

/** Small original model: six draw calls, no remote model or texture dependency. */
export default function Satellite() {
  const root = useRef<Group>(null);
  const phase = useRef(orbit.initialPhase);
  const revealed = useRef(
    document.documentElement.dataset.heroRevealed === "true",
  );
  const materials = useRef<Material[]>([]);
  const panel = useRef<ShaderMaterial>(null);
  const panelUniforms = useMemo(() => ({ uFade: { value: 1 } }), []);
  const basis = useMemo(
    () => ({
      radial: new Vector3(),
      tangent: new Vector3(),
      normal: new Vector3(),
      center: new Vector3(...earthCenter),
      matrix: new Matrix4(),
    }),
    [],
  );
  const geometry = useMemo(() => {
    const boxes = [
      new BoxGeometry(0.22, 0.26, 0.3),
      new BoxGeometry(1.54, 0.025, 0.025).translate(0, 0, 0),
      new BoxGeometry(0.018, 0.24, 0.018).translate(0.06, 0.23, 0.08),
      new BoxGeometry(0.018, 0.18, 0.018).translate(-0.08, 0.2, -0.1),
    ];
    const frame = mergeGeometries(boxes)!;
    boxes.forEach((g) => g.dispose());
    const planes = [-1, 1].map((side) =>
      new PlaneGeometry(0.57, 0.36).translate(side * 0.48, 0, 0.025),
    );
    const panels = mergeGeometries(planes)!;
    planes.forEach((g) => g.dispose());
    const dish = new LatheGeometry(
      [
        new Vector2(0, 0),
        new Vector2(0.025, 0.004),
        new Vector2(0.06, 0.022),
        new Vector2(0.095, 0.05),
      ],
      24,
    );
    return { frame, panels, dish };
  }, []);
  useEffect(() => {
    root.current?.traverse((o) => {
      if (o instanceof Mesh && !(o.material instanceof ShaderMaterial)) {
        const list = Array.isArray(o.material) ? o.material : [o.material];
        list.forEach((m) => {
          m.transparent = true;
          materials.current.push(m);
        });
      }
    });
    const reveal = () => {
      revealed.current = true;
    };
    window.addEventListener("hero-reveal", reveal);
    return () => {
      window.removeEventListener("hero-reveal", reveal);
      materials.current = [];
    };
  }, []);
  useFrame((_, dt) => {
    if (!root.current) return;
    const state = useJourney.getState();
    const fade =
      1 -
      MathUtils.smoothstep(
        state.scrollProgress,
        orbit.fadeStart,
        orbit.fadeEnd,
      );
    root.current.visible = fade > 0.001;
    if (!root.current.visible) return;
    if (revealed.current && !state.reducedMotion && !document.hidden)
      phase.current += Math.min(dt, 0.25) * orbit.angularSpeed;
    const t = phase.current,
      si = Math.sin(orbit.inclination),
      co = Math.cos(orbit.inclination);
    basis.radial.set(Math.cos(t), Math.sin(t) * si, Math.sin(t) * co);
    basis.tangent.set(-Math.sin(t), Math.cos(t) * si, Math.cos(t) * co);
    basis.normal.crossVectors(basis.tangent, basis.radial).normalize();
    root.current.position
      .copy(basis.radial)
      .multiplyScalar(orbit.radius)
      .add(basis.center);
    basis.matrix.makeBasis(basis.tangent, basis.radial, basis.normal);
    root.current.quaternion.setFromRotationMatrix(basis.matrix);
    root.current.userData.phase = t;
    materials.current.forEach((m) => {
      m.opacity = fade;
    });
    panelUniforms.uFade.value = fade;
  });
  return (
    <group ref={root} name="hero-satellite" scale={0.72}>
      <mesh geometry={geometry.frame}>
        <meshStandardMaterial
          color="#b5bdc4"
          metalness={0.8}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.235, 0.21, 0.27]} />
        <meshStandardMaterial
          color="#b99a50"
          metalness={0.7}
          roughness={0.48}
        />
      </mesh>
      <mesh geometry={geometry.panels}>
        <shaderMaterial
          ref={panel}
          uniforms={panelUniforms}
          vertexShader={panelVertex}
          fragmentShader={panelFragment}
          side={DoubleSide}
          transparent
        />
      </mesh>
      <mesh
        geometry={geometry.dish}
        position={[0.06, 0.29, 0.08]}
        rotation={[0.25, 0, -0.25]}
      >
        <meshStandardMaterial
          color="#d8dce1"
          metalness={0.75}
          roughness={0.3}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, -0.04, 0.176]}>
        <cylinderGeometry args={[0.046, 0.046, 0.035, 16]} />
        <meshStandardMaterial color="#142635" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.09, 0.06, 0.172]}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <meshBasicMaterial color="#8be6ed" />
      </mesh>
    </group>
  );
}

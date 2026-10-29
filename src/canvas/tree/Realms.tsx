import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import {
  BufferGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Object3D,
  Shape,
  Vector3,
} from "three";
import { useJourney } from "../../app/store";
import { content } from "../../content/content";
import { openDetail } from "../../chapters/ChapterBody";
import { getSkeleton } from "./skeleton";

export function realmAttachments() {
  const candidates = getSkeleton().segments.filter(
    (s) =>
      !s.root && s.depth > 0 && s.depth < 3 && s.end.y > 13 && s.end.y < 21,
  );
  const used = new Set<number>();
  return content.skills.map((_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const target = new Vector3(
      Math.cos(a) * 8,
      17 + Math.sin(a) * 2,
      3 + Math.sin(a) * 4,
    );
    let best = 0,
      distance = Infinity;
    candidates.forEach((s, j) => {
      const d = s.end.distanceToSquared(target);
      if (!used.has(j) && d < distance) {
        best = j;
        distance = d;
      }
    });
    used.add(best);
    return {
      anchor: candidates[best].end,
      birth: candidates[best].finish,
      length: 0.9 + (i % 3) * 0.35,
    };
  });
}
export default function Realms() {
  const group = useRef<Group>(null),
    fruit = useRef<InstancedMesh>(null);
  const pendulums = useRef<(Group | null)[]>([]);
  const showMarkers = useJourney(
    (s) => s.scrollProgress >= 0.9 && s.scrollProgress < 0.96,
  );
  const dummy = useMemo(() => new Object3D(), []);
  const attachments = useMemo(realmAttachments, []);
  const data = useMemo(() => {
    const branches = getSkeleton().segments.filter(
      (s) => !s.root && s.depth === 2 && s.end.y > 14,
    );
    const points = Array.from(
      { length: 64 },
      (_, i) => branches[Math.floor((i / 64) * branches.length)],
    );
    const shape = new Shape();
    shape.moveTo(0, 0.24);
    shape.lineTo(0.06, 0.06);
    shape.lineTo(0.24, 0);
    shape.lineTo(0.06, -0.06);
    shape.lineTo(0, -0.24);
    shape.lineTo(-0.06, -0.06);
    shape.lineTo(-0.24, 0);
    shape.lineTo(-0.06, 0.06);
    shape.closePath();
    return {
      points,
      star: new ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false }),
      cords: attachments.map((a) =>
        new BufferGeometry().setFromPoints([
          new Vector3(),
          new Vector3(0, -a.length, 0),
        ]),
      ),
    };
  }, [attachments]);
  useFrame(({ clock }) => {
    const { scrollProgress: p, reducedMotion } = useJourney.getState();
    if (!group.current) return;
    group.current.visible = p > 0.56;
    if (!group.current.visible) return;
    group.current.scale.setScalar(
      0.18 + 0.82 * Math.min(1, Math.max(0, (p - 0.25) / 0.49)),
    );
    const growth = Math.max(0, Math.min(1, (p - 0.24) / 0.59));
    pendulums.current.forEach((g, i) => {
      if (g)
        g.rotation.z = reducedMotion
          ? 0
          : Math.sin(clock.elapsedTime * 0.65 + i * 1.9) * 0.045;
    });
    if (fruit.current) {
      data.points.forEach((s, i) => {
        dummy.position.copy(s.end);
        dummy.position.y -= 0.16;
        dummy.scale.setScalar(
          growth >= s.finish
            ? 0.065 + Math.sin(clock.elapsedTime + i) * 0.005
            : 0,
        );
        dummy.updateMatrix();
        fruit.current!.setMatrixAt(i, dummy.matrix);
      });
      fruit.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group ref={group} name="branch-lanterns">
      <instancedMesh ref={fruit} args={[undefined, undefined, 64]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color="#dec394"
          emissive="#edc16b"
          emissiveIntensity={2}
        />
      </instancedMesh>
      <Sparkles
        count={90}
        scale={[29, 23, 22]}
        position={[0, 13, 0]}
        color="#c2cc9f"
        size={1.3}
        speed={0.15}
      />
      {showMarkers &&
        attachments.map((a, i) => (
          <group key={i} position={a.anchor} name={`hanging-realm-${i}`}>
            <group
              ref={(el) => {
                pendulums.current[i] = el;
              }}
            >
              <lineSegments geometry={data.cords[i]}>
                <lineBasicMaterial color="#dec394" transparent opacity={0.65} />
              </lineSegments>
              <mesh
                geometry={data.star}
                scale={1.8}
                position={[0, -a.length, -0.018]}
              >
                <meshStandardMaterial
                  color="#f4db9c"
                  emissive="#b28c41"
                  emissiveIntensity={0.8}
                  metalness={0.65}
                  roughness={0.3}
                />
              </mesh>
              <Html position={[0, -a.length, 0]} center zIndexRange={[5, 0]}>
                <button
                  className="realm-marker hanging-marker"
                  aria-label={content.skills[i][0]}
                  title={content.skills[i][0]}
                  onClick={() =>
                    openDetail(content.skills[i][0], content.skills[i][1])
                  }
                >
                  <span aria-hidden="true">✧</span>
                </button>
              </Html>
            </group>
          </group>
        ))}
    </group>
  );
}

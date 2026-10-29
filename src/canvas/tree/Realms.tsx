import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import { Group, InstancedMesh, Object3D } from "three";
import { useJourney } from "../../app/store";
import { content } from "../../content/content";
import { openDetail } from "../../chapters/ChapterBody";
export default function Realms() {
  const group = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const fruit = useRef<InstancedMesh>(null);
  const showMarkers = useJourney((s) => s.scrollProgress >= 0.9 && s.scrollProgress < 0.96);
  const dummy = useMemo(() => new Object3D(), []);
  const points = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => {
        const a = i * 2.399;
        return [
          Math.cos(a) * (4 + (i % 8)),
          13 + (i % 9),
          Math.sin(a) * (3 + (i % 7)),
        ] as [number, number, number];
      }),
    [],
  );
  useFrame(({ clock }) => {
    if (group.current)
      group.current.visible = useJourney.getState().scrollProgress > 0.56;
    if (!group.current?.visible) return;
    if (ring.current) ring.current.rotation.y = clock.elapsedTime * 0.08;
    if (fruit.current) {
      const o = dummy;
      points.forEach((pos, i) => {
        o.position.set(...pos);
        o.scale.setScalar(0.085 + Math.sin(clock.elapsedTime + i) * 0.012);
        o.updateMatrix();
        fruit.current!.setMatrixAt(i, o.matrix);
      });
      fruit.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group ref={group}>
      <instancedMesh ref={fruit} args={[undefined, undefined, points.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color="#dec394"
          emissive="#edc16b"
          emissiveIntensity={3}
        />
      </instancedMesh>
      <group ref={ring} position={[0, 13, 0]} rotation={[0.1, 0, 0.13]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[11, 0.012, 6, 128]} />
          <meshBasicMaterial color="#8adbd9" transparent opacity={0.12} />
        </mesh>
        <mesh position={[11, 0, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#c8f9ef" />
        </mesh>
      </group>
      <Sparkles
        count={140}
        scale={[29, 23, 22]}
        position={[0, 13, 0]}
        color="#c2cc9f"
        size={1.8}
        speed={0.15}
      />
      {showMarkers &&
        content.skills.map(([name, description], i) => {
          const a = (i / 9) * Math.PI * 2;
          return (
            <Html
              key={name}
              position={[
                Math.cos(a) * 7,
                17 + Math.sin(a) * 4,
                Math.sin(a) * 3,
              ]}
              center
              zIndexRange={[5, 0]}
            >
              <button
                className="realm-marker"
                aria-label={name}
                title={name}
                onClick={() => openDetail(name, description)}
              >
                ✧
              </button>
            </Html>
          );
        })}
    </group>
  );
}

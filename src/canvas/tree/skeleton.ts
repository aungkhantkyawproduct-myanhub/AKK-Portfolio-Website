import { Vector3 } from "three";
export interface Segment {
  start: Vector3;
  end: Vector3;
  radius: number;
  endRadius?: number;
  birth: number;
  depth: number;
  parent: number;
}
export interface Leaf {
  position: Vector3;
  birth: number;
  angle: number;
  size: number;
}
/** One deterministic branching organism. Births are shared by bark and foliage. */
export function createSkeleton() {
  let seed = 49;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const segments: Segment[] = [],
    leaves: Leaf[] = [];
  const trunk = (y: number) =>
    new Vector3(Math.sin(y * 0.3) * 0.32, y, Math.sin(y * 0.4) * 0.22);
  function bough(
    start: Vector3,
    direction: Vector3,
    length: number,
    radius: number,
    depth: number,
    birth: number,
    parent: number,
  ) {
    let from = start.clone();
    const dir = direction.clone().normalize();
    const bend = new Vector3(
      (random() - 0.5) * 0.045,
      0.025,
      (random() - 0.5) * 0.045,
    );
    for (let j = 0; j < 12; j++) {
      dir.add(bend).normalize();
      const end = from.clone().addScaledVector(dir, length / 12),
        index = segments.length;
      segments.push({
        start: from,
        end,
        radius: radius * Math.pow(1 - j / 13, 1.3),
        endRadius: radius * Math.pow(1 - (j + 1) / 13, 1.3),
        birth: birth + j * 0.006,
        depth,
        parent,
      });
      parent = index;
      if (depth < 3 && (j === 4 || j === 7 || j === 10)) {
        const angle = random() * Math.PI * 2;
        const next = new Vector3(
          Math.cos(angle) * 0.75,
          0.38 + random() * 0.5,
          Math.sin(angle) * 0.75,
        )
          .addScaledVector(dir, 0.8)
          .normalize();
        bough(
          end,
          next,
          length * (0.48 + random() * 0.13),
          radius * 0.36,
          depth + 1,
          birth + j * 0.006 + 0.11,
          parent,
        );
      }
      if ((depth >= 2 && j > 3) || (depth === 1 && j > 9)) {
        for (let k = 0; k < (depth === 3 ? 58 : 18); k++) {
          const a = random() * Math.PI * 2,
            r = Math.sqrt(random()) * (depth === 3 ? 0.85 : 0.55);
          leaves.push({
            position: end
              .clone()
              .add(
                new Vector3(
                  Math.cos(a) * r,
                  (random() - 0.35) * 0.65,
                  Math.sin(a) * r,
                ),
              ),
            birth: birth + j * 0.006 + 0.02,
            angle: random() * Math.PI * 2,
            size: 0.065 + random() * 0.07,
          });
        }
      }
      from = end;
    }
  }
  // Continuous serpentine trunk, tapering into the upper crown.
  for (let j = 0; j < 40; j++) {
    const y = (j / 40) * 13;
    segments.push({
      start: trunk(y),
      end: trunk(y + 13 / 40),
      radius: 1.15 * Math.pow(1 - j / 43, 1.1),
      endRadius: 1.15 * Math.pow(1 - (j + 1) / 43, 1.1),
      birth: j * 0.005,
      depth: 0,
      parent: j - 1,
    });
  }
  // Unequal heights and golden-angle branching avoid radial symmetry.
  for (let k = 0; k < 17; k++) {
    const a = k * 2.399963 + 0.35,
      y = 4.2 + k * 0.47;
    const length = 11.5 + Math.sin(k * 0.7) * 1.3 - k * 0.17;
    bough(
      trunk(y),
      new Vector3(Math.cos(a), 0.1 + k * 0.018, Math.sin(a)),
      length,
      0.62 - k * 0.021,
      1,
      0.19 + k * 0.012,
      Math.floor((y / 13) * 40),
    );
  }
  bough(trunk(12.8), new Vector3(0.12, 1, -0.05), 4.5, 0.15, 1, 0.39, 39);
  // Thick, tapered buttresses meet the grass; root tips disappear below the soil.
  for (let k = 0; k < 11; k++) {
    const a = k * 2.399963;
    let from = trunk(3.5);
    for (let j = 0; j < 24; j++) {
      const t = (j + 1) / 24,
        r = 0.7 + Math.pow(t, 1.4) * (3.3 + random() * 0.2),
        angle = a + Math.sin(t * 2) * 0.26;
      const end = new Vector3(
        Math.cos(angle) * r,
        3.5 * Math.pow(1 - t, 3) - 0.045,
        Math.sin(angle) * r,
      );
      segments.push({
        start: from,
        end,
        radius: 0.34 * Math.pow(1 - j / 25, 1.1),
        birth: 0.16 + j * 0.004,
        depth: 1,
        parent: -1,
      });
      from = end;
    }
  }
  for (let i = 0; i < 5; i++)
    for (const side of [-1, 1])
      leaves.push({
        position: new Vector3(side * (0.24 + i * 0.04), 0.65 + i * 0.33, 0),
        birth: 0.025 + i * 0.018,
        angle: side * 0.4,
        size: 0.27 + i * 0.025,
      });
  return { segments, leaves };
}

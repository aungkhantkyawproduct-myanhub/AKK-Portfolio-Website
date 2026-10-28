import { CubicBezierCurve3, Vector3 } from "three";
export interface Segment {
  start: Vector3;
  end: Vector3;
  radius: number;
  endRadius?: number;
  birth: number;
  finish: number;
  root?: boolean;
  depth: number;
  parent: number;
}
export interface Leaf {
  position: Vector3;
  birth: number;
  angle: number;
  size: number;
  juvenile?: boolean;
}
/** One seeded, broad-crowned organism. Every stage reveals the same skeleton. */
export function createSkeleton() {
  let seed = 49;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const segments: Segment[] = [],
    leaves: Leaf[] = [];
  const trunk = (y: number) =>
    new Vector3(Math.sin(y * 0.35) * 0.4, y, Math.sin(y * 0.27) * 0.3);
  function foliage(
    center: Vector3,
    birth: number,
    spread: number,
    count: number,
  ) {
    // More supporting branches share the foliage budget instead of multiplying it.
    for (let i = 0; i < Math.ceil(count * 0.72); i++) {
      const a = random() * Math.PI * 2,
        r = Math.sqrt(random()) * spread;
      leaves.push({
        position: center
          .clone()
          .add(
            new Vector3(
              Math.cos(a) * r,
              (random() - 0.45) * spread * 0.8,
              Math.sin(a) * r,
            ),
          ),
        birth: Math.min(0.94, birth + random() * 0.025),
        angle: random() * Math.PI * 2,
        size: 0.085 + random() * 0.1,
      });
    }
  }
  function limb(
    start: Vector3,
    end: Vector3,
    radius: number,
    depth: number,
    birth: number,
    parent: number,
  ) {
    const delta = end.clone().sub(start),
      horizontal = new Vector3(delta.x, 0, delta.z);
    const curve = new CubicBezierCurve3(
      start,
      start
        .clone()
        .addScaledVector(delta, 0.3)
        .add(
          new Vector3(
            -horizontal.z * 0.12,
            depth === 5 ? 0.035 : 0.9,
            horizontal.x * 0.12,
          ),
        ),
      start
        .clone()
        .addScaledVector(delta, 0.78)
        .add(
          new Vector3(
            horizontal.z * 0.08,
            depth === 5 ? -0.015 : -0.4,
            -horizontal.x * 0.08,
          ),
        ),
      end,
    );
    birth = Math.max(birth, segments[parent]?.finish ?? 0);
    const count = depth === 5 ? 5 : depth === 1 ? 18 : 10,
      duration = depth === 5 ? 0.006 : depth === 1 ? 0.19 : 0.13;
    let from = start;
    for (let j = 0; j < count; j++) {
      const t = (j + 1) / count,
        point = curve.getPoint(t),
        index = segments.length;
      segments.push({
        start: from,
        end: point,
        radius: radius * Math.pow(1 - j / (count + 1), 1.2),
        endRadius: radius * Math.pow(1 - (j + 1) / (count + 1), 1.2),
        birth: birth + (j / count) * duration,
        finish: birth + ((j + 1) / count) * duration,
        depth,
        parent,
      });
      parent = index;
      if (
        depth < 3 &&
        [
          Math.floor(count * 0.45),
          Math.floor(count * 0.68),
          count - 2,
        ].includes(j)
      ) {
        const angle = Math.atan2(delta.z, delta.x) + (random() - 0.5) * 2.5;
        const length =
          delta.length() *
          (depth === 1 ? 0.48 : 0.55) *
          (0.8 + random() * 0.35);
        const next = point
          .clone()
          .add(
            new Vector3(
              Math.cos(angle) * length * 0.82,
              length * (0.32 + random() * 0.22),
              Math.sin(angle) * length * 0.82,
            ),
          );
        limb(
          point,
          next,
          radius * 0.32,
          depth + 1,
          birth + (j / count) * duration + 0.012,
          parent,
        );
      }
      if (depth === 3 && j > 3)
        foliage(point, birth + (j / count) * duration + 0.012, 0.7, 42);
      // Young branches carry true leaves as they lengthen, before crown clusters.
      if (depth === 1 && j > 2 && j % 3 === 1)
        leaves.push({
          position: point.clone(),
          birth: birth + ((j + 1) / count) * duration + 0.003,
          angle: Math.atan2(delta.z, delta.x) + (j % 2 === 0 ? -0.9 : 0.9),
          size: 0.9,
          juvenile: true,
        });
      if (depth === 2 && j > 7)
        foliage(point, birth + (j / count) * duration + 0.018, 0.9, 55);
      from = point;
    }
    if (depth >= 2 && depth < 5)
      foliage(end, birth + duration + 0.015, depth === 2 ? 1.25 : 0.95, 150);
  }
  for (let j = 0; j < 48; j++) {
    const y = (j / 48) * 13;
    segments.push({
      start: trunk(y),
      end: trunk(y + 13 / 48),
      radius: 2.8 * Math.pow(1 - j / 55, 1.1),
      endRadius: 2.8 * Math.pow(1 - (j + 1) / 55, 1.1),
      birth: 0.008 + j * 0.005,
      finish: 0.008 + (j + 1) * 0.005,
      depth: 0,
      parent: j - 1,
    });
  }
  // Rising limbs carry a dome of foliage, rather than horizontal spokes.
  for (let k = 0; k < 18; k++) {
    const a = k * 2.399963 + 0.18,
      y = 6.8 + (k % 6) * 1.1,
      extent = 8.2 + random() * 3.2;
    const top = 18 + (1 - Math.abs(k - 8.5) / 10) * 3.4 + random() * 1.3;
    limb(
      trunk(y),
      new Vector3(Math.cos(a) * extent, top, Math.sin(a) * extent),
      1.02 - (k % 6) * 0.065,
      1,
      Math.max(0.15 + k * 0.009, (y / 13) * 48 * 0.005 + 0.02),
      Math.floor((y / 13) * 48),
    );
  }
  limb(trunk(12.7), new Vector3(0.5, 20, -0.4), 0.24, 1, 0.29, 47);
  // Fill the crown with attached twig clusters following an irregular domed envelope.
  // The seeded crown is generated once, never swapped for a mature-stage model.
  const tips = segments
    .map((segment, index) => ({ segment, index }))
    .filter((t) => t.segment.depth === 3);
  for (let i = 0; i < 128; i++) {
    const a = i * 2.399963,
      radial = Math.sqrt(random()),
      r = radial * (11.5 + 0.65 * Math.sin(a * 5));
    const center = new Vector3(
      Math.cos(a) * r,
      19.3 + 5.8 * Math.sqrt(1 - radial * radial) + (random() - 0.5) * 2.1,
      Math.sin(a) * r * 0.82,
    );
    const nearest = tips.reduce((best, t) =>
      t.segment.end.distanceToSquared(center) <
      best.segment.end.distanceToSquared(center)
        ? t
        : best,
    );
    const born = Math.min(0.78, Math.max(0.52, nearest.segment.birth + 0.035));
    limb(nearest.segment.end, center, 0.035, 4, born, nearest.index);
    foliage(center, born + 0.13, 1.35 + random() * 0.35, 340);
  }
  // Interlaced buttresses settle into the meadow.
  for (let k = 0; k < 13; k++) {
    const a = k * 2.399963,
      reach = 4.6 + random() * 1.7;
    let from = trunk(5.3);
    for (let j = 0; j < 32; j++) {
      const t = (j + 1) / 32,
        angle = a + Math.sin(t * 3) * 0.22,
        r = 0.5 + Math.pow(t, 1.65) * reach;
      const end = new Vector3(
        Math.cos(angle) * r,
        5.3 * Math.pow(1 - t, 3.5) - 0.035,
        Math.sin(angle) * r,
      );
      segments.push({
        start: from,
        end,
        radius: 0.62 * Math.pow(1 - j / 33, 1.25),
        endRadius: 0.62 * Math.pow(1 - (j + 1) / 33, 1.25),
        // Buttresses develop after a living stem and first branches exist.
        birth: 0.34 + j * 0.003,
        finish: 0.34 + (j + 1) * 0.003,
        root: true,
        depth: 1,
        parent: -1,
      });
      from = end;
    }
  }
  // Cotyledons and true leaves belong to actual stem nodes, with petioles.
  for (let i = 0; i < 9; i++) {
    const y = 1.1 + i * 1.25;
    const parent = Math.floor(y / (13 / 48));
    for (const side of [-1, 1]) {
      const angle = (side < 0 ? Math.PI : 0) + i * 0.5;
      const node = trunk(y);
      const petiole = node
        .clone()
        .add(new Vector3(Math.cos(angle) * 0.32, 0.13, Math.sin(angle) * 0.32));
      const birth = segments[parent].finish + 0.003;
      limb(node, petiole, 0.045, 5, birth, parent);
      leaves.push({
        position: petiole,
        birth: birth + 0.007,
        angle,
        size: i === 0 ? 0.8 : 1.05 + i * 0.045,
        juvenile: true,
      });
    }
  }
  return { segments, leaves };
}

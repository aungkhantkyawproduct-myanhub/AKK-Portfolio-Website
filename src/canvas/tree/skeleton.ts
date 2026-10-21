import { Vector3 } from "three";
export interface Segment {
  start: Vector3;
  end: Vector3;
  radius: number;
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
export function createSkeleton() {
  let seed = 49;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const segments: Segment[] = [];
  const leaves: Leaf[] = [];
  function limb(
    start: Vector3,
    direction: Vector3,
    length: number,
    radius: number,
    depth: number,
    birth: number,
    parent: number,
  ) {
    let from = start.clone();
    let dir = direction.clone();
    for (let j = 0; j < 5; j++) {
      dir.y += depth === 0 ? 0.03 : 0.08;
      dir.x += (random() - 0.5) * 0.12;
      dir.z += (random() - 0.5) * 0.12;
      dir.normalize();
      const end = from.clone().addScaledVector(dir, length / 5);
      const index = segments.length;
      segments.push({
        start: from.clone(),
        end: end.clone(),
        radius: radius * (1 - j * 0.12),
        birth: birth + j * 0.018,
        depth,
        parent,
      });
      parent = index;
      if (depth < 3 && j >= 2) {
        const a = random() * Math.PI * 2;
        const next = new Vector3(
          Math.cos(a) * 0.9,
          0.35 + random() * 0.5,
          Math.sin(a) * 0.9,
        )
          .addScaledVector(dir, 0.6)
          .normalize();
        limb(
          end,
          next,
          length * (depth === 0 ? 0.69 : 0.54),
          radius * 0.43,
          depth + 1,
          birth + j * 0.018 + 0.1,
          parent,
        );
      }
      if (depth >= 2) {
        for (let k = 0; k < (depth === 3 ? 42 : 12); k++) {
          leaves.push({
            position: end
              .clone()
              .add(
                new Vector3(
                  (random() - 0.5) * 1.5,
                  (random() - 0.5) * 0.7,
                  (random() - 0.5) * 1.5,
                ),
              ),
            birth: birth + j * 0.018 + 0.09,
            angle: random() * Math.PI * 2,
            size: 0.055 + random() * 0.09,
          });
        }
      }
      from = end;
    }
  }
  limb(new Vector3(), new Vector3(0.03, 1, 0), 10, 1.0, 0, 0, -1);
  // Sweeping primary boughs make an open, umbrella-shaped world-tree canopy.
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    limb(
      new Vector3(0.1, 5.5 + k * 0.42, 0),
      new Vector3(Math.cos(a), 0.38, Math.sin(a)).normalize(),
      7,
      0.42,
      1,
      0.25 + k * 0.015,
      0,
    );
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    let last = new Vector3(0, 0.04, 0);
    for (let j = 1; j <= 18; j++) {
      const t = (j / 18) * 1.35;
      const angle = a + Math.sin(t * 3 + k) * 0.12;
      const end = new Vector3(
        10.08 * Math.sin(t) * Math.cos(angle),
        -10 + 10.08 * Math.cos(t),
        10.08 * Math.sin(t) * Math.sin(angle),
      );
      segments.push({
        start: last,
        end,
        radius: 0.22 * (1 - j / 23),
        birth: 0.55 + j * 0.014,
        depth: 4,
        parent: -1,
      });
      last = end;
    }
  }
  // Intertwined buttress roots continue up the trunk, giving the mature tree
  // a continuous organic base rather than a straight cylindrical silhouette.
  for(let k=0;k<9;k++) {
    const a=k/9*Math.PI*2;
    let last=new Vector3(Math.cos(a)*3.7,.015,Math.sin(a)*3.7);
    for(let j=1;j<=28;j++) {
      const t=j/28;
      const radius=3.7*Math.exp(-t*7)+.37;
      const angle=a+t*2.5;
      const end=new Vector3(Math.cos(angle)*radius,Math.pow(t,1.7)*6.7,Math.sin(angle)*radius);
      segments.push({start:last,end,radius:.22*(1-t*.75),birth:.25+t*.28,depth:1,parent:-1});
      last=end.clone();
    }
  }
  for(const segment of segments) {
    if(segment.depth!==4) {
      segment.start.set(segment.start.x*1.65,segment.start.y*.8,segment.start.z*1.65);
      segment.end.set(segment.end.x*1.65,segment.end.y*.8,segment.end.z*1.65);
    }
  }
  for(const leaf of leaves) leaf.position.set(leaf.position.x*1.65,leaf.position.y*.8,leaf.position.z*1.65);
  return { segments, leaves };
}

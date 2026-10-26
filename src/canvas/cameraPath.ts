export const boundaries = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.9, 0.96, 1];
export const chapterAt = (p: number) =>
  Math.min(
    7,
    boundaries.findIndex((v, i) => i < 8 && p >= v && p < boundaries[i + 1]) < 0
      ? 7
      : boundaries.findIndex(
          (v, i) => i < 8 && p >= v && p < boundaries[i + 1],
        ),
  );
export const pacing = { scrub: 1.2, height: 1000 };
export const earthCenter = [0, -10, 0] as const;
// Points correspond to boundaries above. Earth surface / tree origin is (0,0,0).
export const cameraPoints = [
  [0, 4, 12],
  [0, 1.3, 5],
  [0, 1.3, 5],
  [0, 3.5, 13],
  [0, 8, 33],
  [0, 13, 49],
  [0, 14, 54],
  [0, 14, 54],
  [0, 14, 54],
];
export const targetPoints = [
  [0, 0.5, 0],
  [1, 0.45, 0],
  [1, 0.45, 0],
  [2.5, 3, 0],
  [5.5, 7, 0],
  [8, 13, 0],
  [9, 14, 0],
  [9, 14, 0],
  [9, 14, 0],
];
export function pathTime(p: number) {
  const i = Math.min(
    7,
    Math.max(
      0,
      boundaries.findIndex((v, j) => j < 8 && p >= v && p < boundaries[j + 1]),
    ),
  );
  return p >= 1
    ? 1
    : (i + (p - boundaries[i]) / (boundaries[i + 1] - boundaries[i])) / 8;
}

export const profileCamera = {
  position: [-4, 22, 60] as const,
  target: [0, 21, 0] as const,
};

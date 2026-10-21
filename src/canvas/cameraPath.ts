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
  [0, 3, 10],
  [0, 1.5, 4.5],
  [0, 1.4, 5],
  [5, 3, 9],
  [-7, 5, 16],
  [3, 9, 29],
  [0, 9, 30],
  [0, 10, 31],
  [0, 11, 32],
];
export const targetPoints = [
  [0, -2, 0],
  [1.6, 0.6, 0],
  [1.4, 0.6, 0],
  [-2, 1.5, 0],
  [2, 3, 0],
  [-3, 6, 0],
  [9, 7, 0],
  [-8, 9, 0],
  [10, 12, 0],
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

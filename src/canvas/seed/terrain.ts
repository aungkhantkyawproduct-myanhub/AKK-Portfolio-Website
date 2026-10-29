/** Shared ground height for meadow geometry and exposed tree roots. */
export const elevation = (x: number, z: number) =>
  Math.sin(x * 0.065) * Math.sin(z * 0.055) * 1.3 +
  Math.min(1, Math.max(0, (Math.hypot(x, z) - 28) / 45)) *
    (2.8 + Math.sin(x * 0.055 + z * 0.025) * 2.2 + Math.sin(z * 0.08) * 1.4);

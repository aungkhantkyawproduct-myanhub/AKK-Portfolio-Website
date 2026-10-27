export const auroraTuning = {
  stiffness: 70,
  damping: 14,
  wakeStiffness: 26,
  wakeDamping: 9.5,
  step: 1 / 120,
  fadeDelay: 0.35,
  fadeEnd: 3.1,
};
export function createAuroraMotion() {
  return {
    enabled: false,
    initialized: false,
    width: 1,
    height: 1,
    targetX: 0,
    targetY: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    wakeX: 0,
    wakeY: 0,
    wakeVx: 0,
    wakeVy: 0,
    lastInput: -1e6,
    time: 0,
    opacity: 0,
    accumulator: 0,
  };
}
export type AuroraMotion = ReturnType<typeof createAuroraMotion>;
export const auroraMotion = createAuroraMotion();
export function resizeAurora(
  state: AuroraMotion,
  width: number,
  height: number,
) {
  const sx = width / state.width,
    sy = height / state.height;
  state.x *= sx;
  state.targetX *= sx;
  state.vx *= sx;
  state.wakeX *= sx;
  state.wakeVx *= sx;
  state.y *= sy;
  state.targetY *= sy;
  state.vy *= sy;
  state.wakeY *= sy;
  state.wakeVy *= sy;
  state.width = Math.max(1, width);
  state.height = Math.max(1, height);
}
export function aimAurora(
  state: AuroraMotion,
  x: number,
  y: number,
  now: number,
) {
  if (!state.enabled) return;
  // Never draw an origin-to-cursor streak on re-entry.
  if (!state.initialized || now - state.lastInput > 4) {
    state.x = state.wakeX = x;
    state.y = state.wakeY = y;
    state.vx = state.vy = state.wakeVx = state.wakeVy = 0;
    state.opacity = 0;
    state.accumulator = 0;
    state.initialized = true;
  }
  state.targetX = x;
  state.targetY = y;
  state.lastInput = now;
}
export function stopAurora(state: AuroraMotion) {
  state.opacity = 0;
  state.initialized = false;
  state.accumulator = 0;
}
/** Fixed substeps keep the spring consistent across 30/60/120 Hz displays. */
export function advanceAurora(state: AuroraMotion, delta: number, now: number) {
  if (!state.enabled || !state.initialized) return;
  const dt = Math.min(0.1, Math.max(0, delta));
  state.time += dt;
  state.accumulator += dt;
  const { step, stiffness, damping, wakeStiffness, wakeDamping } = auroraTuning;
  while (state.accumulator + 1e-9 >= step) {
    state.vx +=
      ((state.targetX - state.x) * stiffness - state.vx * damping) * step;
    state.vy +=
      ((state.targetY - state.y) * stiffness - state.vy * damping) * step;
    state.x += state.vx * step;
    state.y += state.vy * step;
    state.wakeVx +=
      ((state.x - state.wakeX) * wakeStiffness - state.wakeVx * wakeDamping) *
      step;
    state.wakeVy +=
      ((state.y - state.wakeY) * wakeStiffness - state.wakeVy * wakeDamping) *
      step;
    state.wakeX += state.wakeVx * step;
    state.wakeY += state.wakeVy * step;
    state.accumulator -= step;
  }
  const age = Math.max(0, now - state.lastInput);
  const fade = Math.min(
    1,
    Math.max(
      0,
      (age - auroraTuning.fadeDelay) /
        (auroraTuning.fadeEnd - auroraTuning.fadeDelay),
    ),
  );
  const target = 1 - fade * fade * (3 - 2 * fade);
  state.opacity +=
    (target - state.opacity) *
    (1 -
      Math.exp(
        -Math.min(1, Math.max(0, delta)) * (target > state.opacity ? 7 : 4),
      ));
  if (age > 4.5 || (age > 4 && state.opacity < 0.002)) stopAurora(state);
}

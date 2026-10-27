import { useEffect, useState } from "react";
const densityListeners = new Set<() => void>();
let lastDpr = devicePixelRatio;

/** Some display/zoom changes omit resize/media events. One comparison in the
 * existing render loop covers them without another RAF loop or polling timer. */
export function checkDisplayDensity() {
  if (lastDpr === devicePixelRatio) return;
  lastDpr = devicePixelRatio;
  densityListeners.forEach((update) => update());
}

/** A single DPR owner for Canvas; supports display transfers and browser zoom. */
export function useDisplay() {
  const [display, setDisplay] = useState(() => ({
    width: innerWidth,
    dpr: devicePixelRatio,
  }));
  useEffect(() => {
    let resolution: MediaQueryList;
    const update = () => {
      lastDpr = devicePixelRatio;
      resolution?.removeEventListener("change", update);
      setDisplay((old) =>
        old.width === innerWidth && old.dpr === devicePixelRatio
          ? old
          : { width: innerWidth, dpr: devicePixelRatio },
      );
      resolution = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      resolution.addEventListener("change", update);
    };
    update();
    densityListeners.add(update);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      densityListeners.delete(update);
      window.removeEventListener("resize", update);
      resolution?.removeEventListener("change", update);
    };
  }, []);
  return display;
}

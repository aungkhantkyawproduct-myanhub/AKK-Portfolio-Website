import { useEffect, useRef } from "react";
import { useJourney } from "../app/store";

/** Input only; renderers damp their own light response, never the camera. */
export function useAuroraPointer() {
  const pointer = useRef({ x: 0, y: 0 });
  const reduced = useJourney((state) => state.reducedMotion);
  useEffect(() => {
    if (reduced || !matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / innerHeight) * 2 - 1;
    };
    const reset = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", reset);
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [reduced]);
  return pointer;
}

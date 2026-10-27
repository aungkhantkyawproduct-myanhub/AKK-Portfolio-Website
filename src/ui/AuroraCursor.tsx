import { useEffect } from "react";
import { useJourney } from "../app/store";
import {
  aimAurora,
  auroraMotion,
  resizeAurora,
  stopAurora,
} from "../canvas/aurora/motion";

/** Passive input only. Physics and light render in the existing R3F RAF loop. */
export default function AuroraCursor() {
  const reduced = useJourney((state) => state.reducedMotion);
  useEffect(() => {
    const media = matchMedia("(hover: hover) and (pointer: fine)");
    const configure = () => {
      auroraMotion.enabled = !reduced && media.matches;
      resizeAurora(auroraMotion, innerWidth, innerHeight);
      if (!auroraMotion.enabled) stopAurora(auroraMotion);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "touch")
        aimAurora(
          auroraMotion,
          event.clientX,
          event.clientY,
          performance.now() / 1000,
        );
    };
    const hide = () => stopAurora(auroraMotion);
    const visibility = () => {
      if (document.hidden) hide();
    };
    configure();
    media.addEventListener("change", configure);
    window.addEventListener("resize", configure, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", hide);
    document.documentElement.addEventListener("pointerleave", hide);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      auroraMotion.enabled = false;
      hide();
      media.removeEventListener("change", configure);
      window.removeEventListener("resize", configure);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [reduced]);
  return null;
}

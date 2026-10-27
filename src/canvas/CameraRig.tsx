import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, Vector3 } from "three";
import {
  cameraPoints,
  targetPoints,
  pathTime,
  profileCamera,
  mobileFraming,
} from "./cameraPath";
const cameraCurve = new CatmullRomCurve3(
  cameraPoints.map((p) => new Vector3(...p)),
  false,
  "catmullrom",
  0.25,
);
const targetCurve = new CatmullRomCurve3(
  targetPoints.map((p) => new Vector3(...p)),
  false,
  "catmullrom",
  0.25,
);
import { useJourney } from "../app/store";
export default function CameraRig() {
  const { gl } = useThree();
  const offset = useRef({ x: 0, y: 0, drag: false, nudge: 0 });
  const target = useRef(new Vector3());
  const initialized = useRef(false);
  useEffect(() => {
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !offset.current.drag) return;
      offset.current.x =
        (e.clientX / innerWidth - 0.5) * (offset.current.drag ? 1.3 : 0.35);
      offset.current.y = (e.clientY / innerHeight - 0.5) * 0.25;
    };
    const down = () => {
      offset.current.drag = true;
    };
    const up = () => {
      offset.current.drag = false;
      offset.current.x = 0;
      offset.current.y = 0;
    };
    const nudge = () => {
      offset.current.nudge = 1;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("camera-nudge", nudge);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("camera-nudge", nudge);
    };
  }, [gl]);
  useFrame(({ camera }, dt) => {
    const { scrollProgress: p, reducedMotion } = useJourney.getState();
    const t = pathTime(p);
    const pos = cameraCurve.getPoint(t);
    const look = targetCurve.getPoint(t);
    if (innerWidth < 600 && p > 0.1) {
      pos.z *= mobileFraming.distance;
      look.x = 0;
      look.y +=
        mobileFraming.seedLift +
        (mobileFraming.crownLift - mobileFraming.seedLift) *
          Math.min(1, Math.max(0, (p - 0.25) / 0.45));
    }
    const blend = useJourney.getState().profileBlend;
    if (blend > 0 && !reducedMotion) {
      pos.lerp(new Vector3(...profileCamera.position), blend);
      look.lerp(new Vector3(...profileCamera.target), blend);
    }
    // Pointer parallax is orbital-only. Local scenes stay stable while reading.
    if (!reducedMotion && p < 0.1) {
      pos.x += offset.current.x;
      pos.y += offset.current.y;
      pos.z -= offset.current.nudge;
      offset.current.nudge *= Math.exp(-dt * 3);
    }
    if (!initialized.current) {
      camera.position.copy(pos);
      target.current.copy(look);
      initialized.current = true;
    } else {
      camera.position.lerp(pos, 1 - Math.exp(-dt * 6));
      target.current.lerp(look, 1 - Math.exp(-dt * 6));
    }
    camera.lookAt(target.current);
    camera.rotateZ(-0.025 * (1 - Math.min(1, p / 0.13)));
  });
  return null;
}

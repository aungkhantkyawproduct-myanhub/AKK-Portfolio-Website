import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useJourney } from "../app/store";
export default function Quality() {
  const samples = useRef({ frames: 0, time: 0, done: false });
  const { gl } = useThree();
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault();
      window.dispatchEvent(new Event("webgl-failed"));
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  useFrame((_, dt) => {
    if (document.hidden || samples.current.done) return;
    const s = samples.current;
    s.time += dt;
    s.frames++;
    if (s.time > 6) {
      const fps = s.frames / s.time;
      if (fps < 26) useJourney.setState({ qualityTier: "low" });
      else if (fps < 45) useJourney.setState({ qualityTier: "medium" });
      window.__sceneStats = {
        fps,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      };
      s.done = true;
    }
  });
  return null;
}

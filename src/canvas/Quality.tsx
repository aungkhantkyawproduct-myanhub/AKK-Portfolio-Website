import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useJourney } from "../app/store";
export default function Quality() {
  const painted = useRef(0);
  const samples = useRef({ frames: 0, time: 0, done: false });
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    Object.assign(window, {
      __worldDiagnostic: () => {
        const sky = scene.getObjectByName("sky"),
          meadow = scene.getObjectByName("meadow"),
          tree = scene.getObjectByName("growing-tree");
        const materials: any[] = [];
        scene.traverse((o: any) => {
          if (o.material?.uniforms) materials.push(o.material.uniforms);
        });
        const projected = camera.position
          .clone()
          .set(0, 0.15, 0)
          .project(camera);
        const origin = scene
          .getObjectByName("myanmar-origin")
          ?.getWorldPosition(camera.position.clone())
          .project(camera);
        return {
          myanmarScreen: origin
            ? [
                ((origin.x + 1) * innerWidth) / 2,
                ((1 - origin.y) * innerHeight) / 2,
              ]
            : null,
          camera: camera.position.toArray(),
          cameraQuaternion: camera.quaternion.toArray(),
          sky: sky?.matrixWorld.toArray(),
          meadow: meadow?.matrixWorld.toArray(),
          treeVisible: tree?.visible,
          growth: materials.find((u) => u.uGrowth)?.uGrowth.value,
          skyTime: (
            sky?.children.find((o: any) => o.material?.uniforms?.uTime) as any
          )?.material.uniforms.uTime.value,
          seedScreen: [
            ((projected.x + 1) * innerWidth) / 2,
            ((1 - projected.y) * innerHeight) / 2,
          ],
        };
      },
    });
    return () => {
      delete (window as any).__worldDiagnostic;
    };
  }, [scene, camera]);
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault();
      window.dispatchEvent(new Event("webgl-failed"));
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  useFrame((_, dt) => {
    if (painted.current < 3) {
      painted.current++;
      if (painted.current === 3)
        requestAnimationFrame(() =>
          window.dispatchEvent(new Event("world-painted")),
        );
    }
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

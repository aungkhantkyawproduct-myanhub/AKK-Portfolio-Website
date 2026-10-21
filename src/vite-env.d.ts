/// <reference types="vite/client" />
interface Window {
  __debugProgress?: (progress: number) => void;
}
interface Window {
  __sceneStats?: { fps: number; drawCalls: number; triangles: number };
}

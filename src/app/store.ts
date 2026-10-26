import { create } from "zustand";
import { chapterAt } from "../canvas/cameraPath";
export const useJourney = create<{
  scrollProgress: number;
  activeChapter: number;
  profileActive: boolean;
  profileBlend: number;
  profileProgress: number;
  soundOn: boolean;
  qualityTier: "high" | "medium" | "low";
  reducedMotion: boolean;
  setProgress: (p: number) => void;
  toggleSound: () => void;
}>((set) => ({
  scrollProgress: 0,
  activeChapter: 0,
  profileActive: false,
  profileBlend: 0,
  profileProgress: 0,
  soundOn: false,
  qualityTier:
    innerWidth < 600
      ? "low"
      : navigator.hardwareConcurrency >= 8
        ? "high"
        : "medium",
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  setProgress: (p) => set({ scrollProgress: p, activeChapter: chapterAt(p) }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
}));

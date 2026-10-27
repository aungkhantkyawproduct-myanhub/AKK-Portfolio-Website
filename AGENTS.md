# Project rules

- Build Aung Khant Kyaw's Earth → Seed → Yggdrasil portfolio with Vite, React 18, strict TypeScript, Three.js, React Three Fiber/Drei/postprocessing, GSAP ScrollTrigger, Lenis, Zustand and CSS modules. Framer Motion is for DOM micro-interactions only.
- Structure: src/{app,canvas,canvas/earth,canvas/seed,canvas/tree,chapters,ui,content,hooks,shaders,audio,styles}.
- Never invent content, metrics, employers or dates. CV is authoritative. Store all portfolio copy in typed src/content/content.ts. Mark missing information TODO.
- Keep one persistent canvas. Earth position is fixed; rotation is time-based. Camera curves, chapter boundaries and pacing belong in src/canvas/cameraPath.ts.
- Use seeded procedural tree geometry and growth uniforms; no heavy model downloads.
- Performance budgets: DPR ≤2 desktop/1.5 mobile; fewer than 100 scene draw calls; target 60 fps desktop, 30–60 mobile; lazy canvas bundle; reduced leaves and effects on mobile.
- Provide keyboard interaction, readable semantic DOM, reduced-motion and WebGL fallback. Audio starts only after explicit interaction.
- Run npm run build and Playwright desktop/mobile checkpoints for each phase. Record limits honestly. Commit phases if Git is available.
- Do not deploy or change domain records without configured hosting access.

## October 27 — Altitude fluid reference
- Replace the cursor's procedural curtains with persistent, softly luminous warm/cool ink clouds, following the latest Altitude recording.
- Advect velocity and dye, preserve vortices and project pressure in small GPU fields inside the existing canvas/RAF. Add subtle scene-only refraction; leave DOM text sharp.
- Weight cursor impulses by elapsed time and interpolation count. Keep spring smoothing, idle suspension, Retina resizing and touch/reduced-motion safeguards.
- Verify actual GPU curl, multidirectional velocity and lingering dye, story checkpoints, Earth-ready reveal and readable biography compositing. Refresh GitHub/source and static archives.

# Aung Khant Kyaw — From seed to scale

A static React 18 / strict TypeScript portfolio with a persistent Three.js canvas: rotating Earth, cloud descent, seed, continuous procedural tree growth, and separate CV history.

## Run and upload

Requires Node.js 22 and npm.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

The preview uses http://127.0.0.1:5173. Build creates `dist/`. Upload its contents to a static host at the domain root. For GitHub, extract `release/akk-portfolio-source.zip` and upload its contents to the repository root; see `GITHUB-UPLOAD.md`. No backend, API keys or environment variables are required. Domain/DNS and hosting have not been changed.

## Current design

The header uses a full-width masked gradient and 18px backdrop blur. Its lower edge fades into the scene. Open text layouts use softly masked darkness/blur instead of rounded cards. All text shares an SF Pro system stack: Apple system font, locally available SF Pro, then Segoe UI Variable/Segoe UI, Helvetica or Arial. Font binaries from Apple/Google are not downloaded or served; exact appearance depends on the device. See Apple's font guidance: https://developer.apple.com/documentation/technologyoverviews/fonts . The unused, previously bundled Inter font/license remains available but is no longer requested.

The world starts behind the initial mist. Progress eases toward 92%, then reaches 100% only after textures/fallback and rendered planet frames are ready. The mist clears over 1.8 seconds onto the already-visible Earth; there is no empty post-loader interval, second canvas fade or screenshot-to-globe swap. Startup duration still depends on assets and GPU preparation. Reduced motion uses a short static/fade alternative. The initial camera pose is applied before the first visible frame, and tree/meadow construction remains deferred until scrolling. One canvas and one tree remain throughout the journey.

The world tree has a thick tapering trunk, curved ascending limbs, attached twig clusters, a broad irregular crown and spreading buttress roots. A seeded skeleton generates 4,366 branch segments and 106,184 leaves at full quality; low tier reduces foliage. Custom shaders reveal growth continuously, add wind, bark grain, cyan veins and leaf shading. The fixed sky dome has layered nebula light, moving clouds and three overlapping aurora curtains. Terrain is a single rolling meadow with time-driven grass and a subtle pool of cyan light near the roots. The reference illustration guides composition and lighting; the result is procedural 3D art, not an exact photorealistic reconstruction.

Beyond the Journey blends into a distinct animated aurora backdrop. The circular About label introduces the exact CV summary. Experience runs newest first: Digit7s, AIA Myanmar, Citizens Pay, Yoon Han Thar. Education, recognition, certifications and tools remain separate from lifecycle stages. The supplied AKK mark uses actual SVG alpha.

## How to tweak

- Copy and factual CV material: `src/content/content.ts`. Never invent metrics, dates or employers.
- Camera path, chapter boundaries and pacing: `src/canvas/cameraPath.ts`. Development-only `window.__debugProgress(.8)` jumps to a stage.
- Mobile subject placement: `mobileFraming` in the same file. Biography entrances: the GSAP timelines in `src/chapters/Profile.tsx`.
- Palette: `src/styles/palette.ts`. Scene-specific spectral colors are in the shaders.
- Tree shape: `src/canvas/tree/skeleton.ts`. Materials and growth: `Tree.tsx`. Lights, fruit and realm markers: `Realms.tsx`.
- Sky: `src/shaders/sky.ts` and `src/canvas/Environment.tsx`. Biography aurora: `src/ui/ProfileAtmosphere.tsx` and its CSS module.
- Cursor response: `src/hooks/useAuroraPointer.ts` supplies normalized fine-pointer input. Aurora shaders and biography CSS damp the light response; reduced motion disables it.
- Cursor-local fluid light: passive input is in `src/ui/AuroraCursor.tsx`; spring response, inertia and fade timing are in `src/canvas/aurora/motion.ts`. `FluidField.ts` advances persistent velocity, pressure, curl and dye fields inside the existing canvas/RAF. Tune injection radius/force, pressure iterations and dye dissipation there. GPU solver passes live in `src/shaders/cursorFluid.ts`; scene refraction and light strength are in `src/shaders/cursorAurora.ts`. Warm/cool ink colors are in `cursorFluidPalette` in `src/styles/palette.ts`. Trails curl and remain at earlier positions, then dissipate; copy remains crisp above them. Touch/reduced-motion input is disabled.
- Earth and Myanmar lights: `src/canvas/earth/`. Earth position is fixed at `(0,-10,0)`; rotation is time-based. Magnetic field lines are not rendered.
- Grass and cloud descent: `src/canvas/seed/Meadow.tsx` and `Descent.tsx`.
- Typography: `--font-family` in `src/styles/global.css`. Header blending: `src/app/App.module.css`.
- Audio: `src/audio/ambient.ts`. Synthesized ambient sound starts only after opt-in. Optional recordings: `public/audio/README.md`.
- Textures: NASA 2K/8K day and 2K night WebP maps are bundled; missing maps fall back gracefully. See `public/textures/README.md`.

## Verification

Keep the development server running, then use:

```sh
npm run checkpoints -- final
node scripts/stable-hero-check.mjs
node scripts/hero-reveal-check.mjs
node scripts/open-story-check.mjs
node scripts/continuous-check.mjs
node scripts/interactions.mjs
node scripts/motion-check.mjs
node scripts/aurora-cursor-check.mjs
```

Scripts use installed Microsoft Edge via Playwright. Change `channel` to your installed browser, or install Playwright Chromium. Checkpoints capture progress 0, .15, .3, .5, .65, .8, .95 and 1 at desktop 1440×900 and mobile 390×844. Reports/screenshots are in ignored `artifacts/`. `PHASES.md` records historical revisions and verification limits.

Stable-hero checks compare camera position and orientation after the first visible live frame, ensuring no startup zoom. Open-story checks cover masked header blur, typography, experience order, card-free surfaces and axe WCAG A/AA scans. Continuity checks cover fixed-world transforms and reversible growth. Interaction checks cover audio, keyboard/modal behavior, clipboard, contact, reduced motion and WebGL fallback. Cursor checks read back actual GPU fields to verify multidirectional flow, nonzero curl and lingering dye, alongside spring inertia, idle suspension and Retina transfers. Hero-reveal checks cover normal and deliberately delayed world loading.

`?fallback` forces the 2D alternative. Reduced motion presents every chapter as a readable document, disables the camera journey and freezes decorative motion. Context loss also switches to fallback. Markers and controls are keyboard accessible; Escape closes dialogs.

## Performance and limits

The canvas bundle is lazy-loaded. DPR is capped at 2 desktop / 1.5 mobile. Quality may drop after a frame-time probe; low tier reduces foliage/stars and disables bloom, grain and vignette. A final pass retains cursor light and biography compositing. The Altitude-inspired ink simulation uses bounded half-float targets (velocity long edge 160, dye 768), 8/12 pressure iterations and at most 25 simulation draws while active. It allocates targets on first input, performs no simulation draws at idle, and clears on exit or resize. Unsupported float-render targets disable only the decorative ink. Refraction affects the 3D background; semantic DOM text remains undistorted. The spring uses fixed substeps without frame allocations. Resize and display-density changes update both the canvas and composer buffers within the DPR caps. Local headless rendering is not a real-device performance benchmark. GPU frame rate and Lighthouse targets remain unverified on production hardware.

The local meadow/tree/sky are live procedural geometry and shaders. Clouds use layered noise rather than physical raymarching. Foliage uses merged quads. Photogrammetry, full volumetric scattering, DOF and recorded environmental foley are not included. The loader uses its own existing meadow artwork; that image is not behind the live growing tree. No user recordings or private reference captures are included in release archives.

## Cursor visual reference

The local ink-cloud movement is inspired by [Altitude](https://www.getlayers.ai/layer/altitude) and the supplied recording. The original fluid implementation uses advection, vorticity confinement and pressure projection; see [GPU Gems: Fast Fluid Dynamics Simulation](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu) for the numerical approach. No template code or premium assets are bundled.

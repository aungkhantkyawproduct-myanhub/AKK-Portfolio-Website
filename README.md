# Aung Khant Kyaw — From seed to scale

A static React 18 / TypeScript portfolio with one persistent Three.js canvas, an independently rotating NASA-textured Earth, polar aurora and magnetic fields, a cloud descent to a seed on grass, and a procedural growing world tree.

## Run and build

Requires Node.js 22 and npm.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Vite serves the local development preview at http://127.0.0.1:5173. `npm run build` checks strict TypeScript and creates `dist/`. Upload **the contents of dist/** to the existing static host for aungkhantkyaw.com. No backend, environment variables or API keys are required. Domain/DNS and production hosting were not changed by this implementation. The canonical URL, sitemap, contact details and structured data retain the existing identity.

## How to tweak

- **Copy:** `src/content/content.ts`. Career bullets and AI project descriptions were transcribed from the supplied DOCX. Narrative framing is separate from factual CV claims. Career history, education, recognition and results live in the separate `Profile.tsx` section below the journey. The Experience navigation item scrolls directly there.
- **Camera and chapter timing:** `src/canvas/cameraPath.ts`. `cameraPoints` and `targetPoints` correspond to `boundaries`. `CameraRig.tsx` constructs two Catmull–Rom curves. The hero has a −15° roll; the globe axis is tilted 23.4°. Local ground and the tree share the globe's north surface position `(0,0,0)`; Earth remains centered at `(0,-10,0)`. This is a poetic local patch rather than a geospatial terrain simulation.
- **Pacing:** `pacing.scrub` controls ScrollTrigger smoothing. The 1000vh rail is in `App.module.css`; boundaries map to a single GSAP timeline. In development, `window.__debugProgress(0.8)` jumps to a checkpoint.
- **Palette:** `src/styles/palette.ts`, applied to CSS variables at startup; tree shaders consume its colors. Earth and aurora spectral colors live in their shaders.
- **Tree:** `src/canvas/tree/skeleton.ts` contains the deterministic seed, recursive branching and spherical roots. Geometry is generated once, then merged. The branch/leaf vertex shaders in `Tree.tsx` use `uGrowth`, birth attributes and time-based wind; the tree scales continuously during growth.
- **Earth and polar effects:** `src/canvas/earth/`. `PolarEffects.tsx` uses the analytic dipole `r=L·sin²θ`, animated pulses, and noise-driven aurora ribbons. Hero effects fade through descent and return at the reveal.
- **Cloud descent and grass:** `src/canvas/seed/Descent.tsx`; stacked noise planes conceal the local ground appearing. `Seed.tsx` contains the lathe and crack shader.
- **Audio:** `src/audio/ambient.ts`. It synthesizes a quiet evolving pad and filtered wind after explicit opt-in. See `public/audio/README.md` for optional recordings.
- **Textures:** NASA day (2K progressive preview, 8K desktop upgrade) and night WebP maps are bundled. See `public/textures/README.md`. Missing maps are tolerated; procedural continents remain available. Source JPGs are retained outside the build in `assets/source/`.

## Verification

```sh
# Keep npm run dev running in another terminal.
npm run checkpoints -- final
node scripts/interactions.mjs
```

The checkpoint script uses installed Microsoft Edge via Playwright. Change `channel` to `chrome`, or remove it and install Playwright Chromium on other systems. It captures 0, .15, .3, .5, .65, .8, .95 and 1 at 1440×900 and 390×844 into `artifacts/`. `PHASES.md` records phase checkpoints and intentional simplifications.

`?fallback` forces the illustrated 2D version. OS reduced-motion preferences produce a normal document with every chapter visible, no camera journey and no Lenis smoothing. Context loss also switches to the fallback. Keyboard arrows, PageUp/PageDown and Space navigate chapters; native dialogs trap focus and close with Escape. The menu, contact links, realm list and all detail buttons remain keyboard accessible.

## Performance and limits

The scene is lazy-loaded. Quality starts from screen size/hardware concurrency and can drop after a six-second frame-time probe. Low tier uses DPR 1, fewer leaves/stars and no postprocessing; other tiers cap DPR at 2 desktop and 1.5 mobile. The probe is available as `window.__sceneStats` for diagnostics; headless timing is not a real-device benchmark.

The tree and grass remain procedural 3D art rather than scanned photogrammetry. A generated meadow/aurora backdrop supplies photographic environmental detail; it is not a replacement for the live growing tree. Clouds use layered noise rather than volumetric raymarching; foliage uses merged quads; bark uses shader veins; normal mapping, recorded environmental foley, DOF and chromatic aberration are intentionally omitted. Ocean highlights are inferred from the day map, not a separate scientific ocean mask. Fonts request Google Fonts and have local serif/sans/mono fallbacks. GPU performance and Lighthouse targets must be assessed on the intended host and real devices; do not treat development screenshots as a 60fps guarantee.

## Reference revision

The mist loader is `src/ui/MistLoader.tsx`: layered animated SVG turbulence over a meadow, a recursively generated tree silhouette and an asset-ready indicator. The landscape is `public/environments/meadow.webp`, created with the imagegen generate mode. Prompt: �Photorealistic cinematic wide-angle empty meadow at blue hour, fine dew-covered grass, distant low hills, natural teal aurora and stars, low cyan mist, empty center for a live 3D tree, no people, no text.� The source PNG is retained alongside it. The supplied stock Earth image was used for composition only, not embedded.

`Environment.tsx` crops the backdrop to cover portrait and landscape views. `Descent.tsx` supplies nine moving cloud layers and curved grass blades. The horizon is a visual local/global transition concealed by cloud opacity, not a physical atmospheric simulation. `Sun.tsx` adds the restrained sunrise glow. The tree has smaller dense leaves, a broader canopy and intertwined buttress roots.

Additional verification: `node scripts/profile-check.mjs` checks profile navigation, separation of CV history from lifecycle chapters, and profile accessibility. `node scripts/audit.mjs` runs Lighthouse against a production preview on port 4173. Local captures and reports are in ignored `artifacts/verification` and `artifacts/final`.

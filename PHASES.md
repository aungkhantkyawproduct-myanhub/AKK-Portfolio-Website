# Phase checkpoints

## Phase 1
Done: scaffold, typed CV content, scroll state, GSAP master timeline, Lenis sync, navigation, rail and preloader shell. Build passed; all 16 Playwright checkpoints captured with no page errors in artifacts/phase1.
Stubbed at this point: planet material, seed/tree, chapter bodies, detail interactions and audio.
Unverified: real-device GPU performance. Checkpoints use headless Edge.

## Phase 2
Done: NASA 2k/4k WebP Earth, independent rotation, procedural clouds and Fresnel atmosphere, stars and marker groundwork. Build and 16 screenshots passed with no page errors.
Simplified: cloud noise instead of a cloud texture; night-map loader ready, asset not yet bundled; topographic shading instead of normal mapping. GPU speed unverified.

## Phase 3
Done: camera/target curves, pointer parallax and drag, fixed surface seed with displacement crack shader, soil cross-section, particles, CV summary and education. Build and 16 screenshots passed without page errors. Screenshot review prompted closer seed framing and longer capture settling.
Simplified: sparkles suggest tending water/light; soil is stylized. Layered cloud descent and field-device performance remain unverified.

## Phase 4
Done: deterministic branching skeleton, merged branch geometry and leaves, shader-driven growth/wind, globe-wrapping roots, all four career sections, exact CV detail panels, animated metrics and AI project descriptions. Build and all 16 screenshots passed with no page errors.
Simplified: merged leaf quads rather than instancing; two visible bullets plus full expandable career panels preserve reading space. Real-device frame rate remains unverified.

## Phase 5
Done: world-tree pullback, nine keyboard-accessible skill realms, lifecycle ring, fruits, certifications, tools and contact. Incorporated follow-up: close rolled Earth hero, 23.4-degree tilt, analytical dipole lines with pulses, animated aurora ribbons, cloud-covered descent and grass replacing the soil cross-section. NASA night map is now bundled. Build and all 16 screenshots passed without page errors.
Review findings: clouds linger too long at .15; mobile hero and tree lighting need polish. Simplified: orbital geometry is an artistic dipole, cloud layers are noise planes rather than raymarching; seasonal palette is shader-driven. No GPU speed claim.

## Phase 6
Done: user-activated synthesized audio, animated fullscreen menu, native modal focus/escape handling, clipboard toast, leaf cursor, per-character hero reveal, GSAP chapter reveals, restrained bloom/grain/vignette, and cloud timing/lighting polish. Build and 16 desktop/mobile captures passed without page errors.
Simplified: no photographic audio recordings, depth of field or chromatic aberration; these effects were omitted to protect clarity and frame budget. Audio interaction and accessibility receive dedicated final checks.

## Phase 7 and reference revision
Done: responsive quality tiers, reduced-motion and WebGL fallback, Person schema, canonical metadata, sitemap, robots, favicon, hero social image, deployment/tweaking guide. Added mist/silhouette loader, 8K desktop Earth, low-orbit sunrise composition, denser clouds, meadow backdrop, curved grass, broad procedural canopy and buttress roots. Career history and education now occupy their own standalone section, reached through Experience navigation.
Verified: production build; 16 final desktop/mobile checkpoint screenshots with zero page errors; interaction checks including persistent canvas, sound, modal Escape, clipboard, reverse journey and fallback modes; standalone profile navigation and content separation. Axe WCAG A/AA checks returned zero violations on contact and profile.
Audit: Lighthouse returned Accessibility 95, Best Practices 100, SEO 100. Performance was unavailable because the continuously rendering scene did not reach CPU idle in this headless environment; the >=85 target is NOT verified. Its touch-target finding was subsequently corrected by spacing the rail buttons evenly and enlarging them to 24px.
Limits: procedural tree/grass remain stylized rather than photographic scans. Distant meadow is a generated image, clouds are layered noise, and the local/global change is concealed rather than physically simulated. Real-device frame rate and production-host performance remain unverified. No deployment or DNS changes were made.

## Visual correction checkpoint
Removed orbital magnetic lines and the late Earth pedestal; kept the meadow through Nine Realms and Contact. Added exact-reference image-backed mature tree reveal, wind-driven fine grass plus meadow motion, natural rough seed, blurred reading panels and hidden scrollbars. The final tree is deliberately the supplied artwork rather than a claimed exact procedural reconstruction. Production build and all 16 desktop/mobile screenshots passed with no page errors.

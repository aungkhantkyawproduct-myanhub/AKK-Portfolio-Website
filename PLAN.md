# Milestones

1. Scaffold, verified CV content, persistent canvas, scroll synchronization, navigation and loading.
2. Tilted Earth, day/night textures, atmosphere, clouds, stars and geographic markers.
3. Continuous camera descent, soil and glowing seed.
4. Procedural growing tree, career chapters and results.
5. World-tree reveal, lifecycle, skills, certifications and contact.
6. Effects, optional synthesized audio, cursor, menu and accessible detail panels.
7. Responsive quality tiers, fallbacks, SEO, documentation and final visual checks.

Checkpoints: 0, .15, .3, .5, .65, .8, .95, 1 at 1440×900 and 390×844. Build and capture at each phase. Record implementation and verification in PHASES.md.

## Latest reference revision

- Replace seed-icon loader with animated cinematic mist and a tree silhouette, guided by the supplied MP4.
- Reframe Earth to a broad low-orbit horizon and sunrise, replacing the earlier steep diagonal crop. Upgrade maps and cloud detail.
- Strengthen first-person cloud descent and natural meadow; rebuild the tree silhouette with finer foliage, textured bark and luminous veins.
- Keep lifecycle storytelling separate from factual career history: move all experience and education into a clean standalone section.
- Re-run browser, accessibility and build checks after these changes; earlier captures are historical checkpoints, not final acceptance.

## October 27 — section motion and clear subject framing

- Add staggered, reversible biography entrances from the introduction through About, results, every employer, education, certifications/tools and footer. Keep text opaque; animate positions and quiet separator light. Respect reduced motion.
- Let fine-pointer movement gently bend the hero and meadow aurora and drift the biography light; keep the local camera stable.
- Thicken the atmosphere crossing with twelve soft-edged cloud banks. Clear the mist as the ground/seed is revealed.
- Reserve the desktop reading column and lower mobile subject area through camera framing; sharpen the subject side of the reading mask.
- Verify motion, cloud clearing, camera stability, desktop/mobile checkpoints and accessibility; refresh source/static archives after passing checks.

## October 27 — local aurora trails and a fuller crown
- Review the Altitude reference and supplied recording; implement local curling light around the cursor with dissipating trails.
- Enlarge the solar disc and soften its warm corona/scatter.
- Strengthen About-to-footer entrances with masked headings, staggered copy and gradual section light.
- Simplify chapter 07 to a conversation invitation and direct contact actions; keep repeated footer utilities in the footer.
- Keep one divider before the footer; expand the tree's primary limbs and supporting crown while sharing the foliage budget.
- Rebuild, inspect desktop/mobile checkpoints, verify interaction/motion/accessibility, commit and refresh both archives.

## October 27 — spring-driven GPU cursor aurora
- Replace SVG point-chain geometry and turbulence filters with screen-space GLSL curtains in the existing canvas/composer.
- Use fixed-step damped springs for the leading light and slower wake, with momentum and independent time-driven folds/rays.
- Keep copy above the light and preserve biography compositing, coarse-pointer/reduced-motion behavior and idle shader early-outs.
- Handle viewport/DPR changes, verify 30/60/120 Hz motion equivalence, stop/re-entry behavior, Retina resizing, shader errors and visual checkpoints.

# Ambient sound

Audio is off until the visitor presses SOUND ON. The shipped Web Audio soundscape uses low-volume sine pads and filtered noise generated locally; no recordings or downloads are needed. The filter evolves with journey progress. Browser autoplay restrictions are respected.

Optional future recorded layers: `space-pad.ogg`, `soil-water.ogg`, `canopy-wind-birds.ogg`, and `ui-tick.ogg`. These filenames are extension suggestions, not missing runtime dependencies. Add licensed files here and route through the master gain in `src/audio/ambient.ts`. Normalize conservatively, loop without clicks, and preserve off-by-default behavior.

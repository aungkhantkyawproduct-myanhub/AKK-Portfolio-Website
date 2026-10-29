# Earth assets

The bundled day maps are NASA Blue Marble June 2004 topography: `earth-day-2k.webp` (2048×1024), `earth-day-4k.webp` (4096×2048) and `earth-day-8k.webp` (8192×4096). The 8K map is a high-quality WebP, approximately 3.84 MB, resampled directly from the 21600×10800 source rather than enlarged from a smaller texture.

NASA collection: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/
8K source: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/june/world.topo.200406.3x21600x10800.jpg

Every animation quality tier, including mobile/low, loads a quick 2K preview and immediately requests 8K when the GPU supports textures at least 8192 pixels wide. Anisotropic filtering (up to 16×), trilinear mipmaps and correct sRGB decoding preserve detail at the curved horizon. Older GPUs use 4K or 2K according to their maximum texture size. Missing 8K falls back to 4K, then the preview; if all day maps are absent the procedural globe remains visible. The loader waits for painted preview/fallback frames, allowing the detailed map to arrive progressively without a blank reveal. Full-detail arrival depends on connection speed and GPU upload time.

The night map, `earth-night-2k.webp`, is NASA Black Marble city lights, resized from https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg . Original source JPGs live in `assets/source/` outside the public build and release archives. NASA image credit does not imply endorsement.

Day imagery includes topographic shading. `earth-clouds-4k.webp` is a 4096×2048 lossless RGBA bake of this project's procedural cloud shader (3.46 MB); it has no external image source. Cloud density and coverage are sampled with mipmaps while sphere rotation and texture drift remain time-based. Missing cloud maps use the original procedural shader. Atmosphere and ocean highlights remain procedural. `node scripts/bake-clouds.mjs` generates a source PNG under `artifacts/cloud-bake/`; encode it as lossless WebP with alpha to replace the shipped map. No additional assets are needed for the satellite: its body, solar cells, antenna and dish are generated in code.

Replacement maps must be 2:1 equirectangular WebP with identical day/night registration. Keep the filenames above or update `src/canvas/earth/useEarthTextures.ts`. Single 16K textures are intentionally avoided: an uncompressed 8K RGBA texture with mipmaps already requires about 171 MiB of GPU memory. Hardware limitations and real-phone frame rates still require device testing.

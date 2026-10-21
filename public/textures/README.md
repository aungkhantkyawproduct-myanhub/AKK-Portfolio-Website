# Earth assets

Bundled day maps: `earth-day-2k.webp` and `earth-day-4k.webp`, resized from NASA Blue Marble June 2004 topography (public-domain NASA imagery).
Source: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/
Original: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/june/world.topo.200406.3x5400x2700.jpg

Bundled night map: `earth-night-2k.webp` (NASA Black Marble equirectangular city lights), resized from https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg . Original JPGs live in `assets/source/` outside the public build.

Missing maps fall back to procedural continents; clouds, ocean highlights and atmosphere are procedural. Day imagery contains topographic shading. Optional source assets for future enhancement: `earth-normal-2k.webp`, `earth-ocean-2k.webp`, `earth-clouds-2k.webp`; these three are not loaded by the current renderer.

Texture convention: 2:1 equirectangular. Keep day and night registration identical. 2k loads first; high tier upgrades to 4k. WebP avoids shipping a Basis transcoder. NASA image credit does not imply endorsement.

Desktop upgrade: `earth-day-8k.webp` (8192 × 4096, approximately 2.7 MB), derived from NASA Blue Marble June topography, https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/june/world.topo.200406.3x21600x10800.jpg . The 2K preview loads first; low/mobile starts retain 2K. Clouds are procedural six-octave noise, not a satellite cloud photograph.

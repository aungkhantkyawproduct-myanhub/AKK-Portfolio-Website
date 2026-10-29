# Ambient sound

`seed-to-scale.mp3` is the user's completed ElevenLabs ambient soundtrack: approximately 180 seconds, 4.34 MB, generated with Eleven Music v2. Generation ID: `tFj4dS0J8w09wpuTG0vs`; project: https://elevenlabs.io/app/music/project/Lh9fWrO2V0fBAb9tlbIL?selectedSongId=F1zBBXYCzUPpo6B77Z2d . It is bundled locally; playback does not use an expiring signed URL or an API key.

Audio remains off by default and is not downloaded during page loading. The first explicit sound-icon click creates a streaming HTML audio element routed through Web Audio master gain. Playback loops, fades to a conservative 0.28 gain over 1.4 seconds, and fades out over 0.6 seconds before pausing. Hidden tabs pause; visible tabs resume only when sound was enabled. Rapid toggles are guarded against stale playback promises. Failed playback keeps the icon off and shows a retry toast. Loop endpoints use the supplied track's original audio; seamless crossfading is not claimed.

Change the file path and gain in `src/audio/ambient.ts`. Keep user-gesture playback, no preload and sound-off defaults. Run `node scripts/audio-check.mjs` to verify real browser playback and error handling. The former synthesized oscillators/noise are no longer played.

# Upload this project to GitHub

1. Extract akk-portfolio-source.zip locally.
2. In your GitHub repository choose Add file > Upload files, and upload the extracted files/folders. Keep package.json, index.html, vite.config.ts, src/ and public/ at the repository root. Include .gitignore when using Git locally.
3. Commit the upload. No tokens, secrets or API keys are required.
4. To run locally: install Node.js 22, run `npm ci`, then `npm run dev`.
5. To build: run `npm run build`. The generated website is in dist/.

The archive is source code. Your existing `aungkhantkyawproduct-myanhub/AKK-Portfolio-Website` repository is connected to Hostinger: pushing `main` triggers a build and publishes `dist` to aungkhantkyaw.com. Uploading to another repository does not configure hosting or change your domain.

## Hosting

Use build command `npm run build` and output directory `dist`. The included production ZIP can also be extracted directly into a static host's web root. The current configuration and absolute asset paths assume a root domain such as aungkhantkyaw.com, or a root-level GitHub Pages user site. For GitHub Pages, use your existing custom-domain configuration. A repository subpath such as username.github.io/repository/ is not supported without updating Vite base and root-relative runtime asset URLs. Do not point DNS until your chosen host is configured.

## Contents and assets

All runtime textures are included. Large original NASA JPEG masters are omitted; source URLs are recorded in public/textures/README.md. The supplied tree reference is retained as a reference only; the live journey uses the same procedural tree throughout. The loader uses the bundled generated meadow image. The bundled ElevenLabs soundtrack plays only after user opt-in.

No account credentials, browser recordings, node_modules, Git history or test screenshots are included. The package does not assign an open-source license to your personal content or supplied reference artwork.

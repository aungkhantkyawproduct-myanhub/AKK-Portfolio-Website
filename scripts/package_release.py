from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json
root = Path(__file__).resolve().parent.parent
out = root / 'release'
out.mkdir(exist_ok=True)
root_files = ['package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','.gitignore','README.md','GITHUB-UPLOAD.md','AGENTS.md','PLAN.md','PHASES.md']
script_files = ['checkpoints.mjs','preview.mjs','interactions.mjs','profile-check.mjs','continuous-check.mjs','audit.mjs','earth-detail-check.mjs','fog-growth-check.mjs','mist-check.mjs','hero-reveal-check.mjs','open-story-check.mjs','stable-hero-check.mjs','motion-check.mjs','aurora-cursor-check.mjs','package_release.py']
script_files.append('scroll-budget-check.mjs')
script_files.extend(['frame-cost-check.mjs','bake-clouds.mjs'])
script_files.extend(['roots-cue-check.mjs','reference-motion.mjs'])
script_files.append('audio-check.mjs')
files = [root / name for name in root_files]
files += [p for folder in ['src','public'] for p in (root / folder).rglob('*') if p.is_file()]
files += [root / 'scripts' / name for name in script_files]
missing = [str(p.relative_to(root)) for p in files if not p.is_file()]
if missing: raise RuntimeError(f'Missing package inputs: {missing}')
for name, inputs, base in [('akk-portfolio-source.zip', files, root), ('akk-portfolio-dist.zip', [p for p in (root/'dist').rglob('*') if p.is_file()], root/'dist')]:
    with ZipFile(out/name, 'w', ZIP_DEFLATED, compresslevel=9) as z:
        for p in sorted(inputs): z.write(p, p.relative_to(base).as_posix())
    with ZipFile(out/name) as z:
        assert z.testzip() is None
        assert 'index.html' in z.namelist()
checksums = {p.name: {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.glob('*.zip')}
(out/'checksums.json').write_text(json.dumps(checksums,indent=2))
print(json.dumps(checksums,indent=2))

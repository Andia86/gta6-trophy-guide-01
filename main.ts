// Leonida Ledger — hand-in program for the gta6-trophy-guide-01 bounty.
//
// What this program does, in plain terms: the guide itself is the static
// web app in app/ (index.html, style.css, store.js, views.js, app.js and
// data/trophies.json — plain files, no build step, no network at runtime).
// This program delivers it: it copies app/ and screenshots/ from beside
// this file into the output directory and writes dossier.json there with
// the vendored make.fun library, exactly as the bounty requires.
//
// Run it locally the same way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// MAKEFUN_OUTPUT_DIR stands in for /output outside the grader. Running it
// twice over the same tree writes byte-identical output.
//
// vendor/makefun-frontend.ts is the kit's library and stays untouched:
// the scorer rebuilds the dossier with its own copy and compares bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The dossier caps mirror the bounty's gate: 4 screenshots of at most
// 256 KiB each, app/ of at most 993 entries and 48 MiB, and the dossier
// text capped at 160 KiB. Passing them here means this program refuses
// exactly what the scorer would refuse, instead of handing in a dud.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function deliverGuide() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  const shotsDir = join(repoDir, 'screenshots');
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
  }
  const dossier = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log('Leonida Ledger delivered to ' + outputDir + ' (dossier.json: ' + dossier.length + ' bytes)');
}

deliverGuide();

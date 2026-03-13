/**
 * move-to-web.mjs
 *
 * Moves all files in out/ into out/web/ for apps-in-toss bundling.
 * Uses cp + rm instead of rename to avoid Windows EPERM issues
 * where Next.js build traces hold file handles on directories.
 *
 * When the framework sees out/web/ already populated, it skips
 * the rename step (src === webDistDir check).
 */

import { cpSync, rmSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'out');
const webDir = join(outDir, 'web');

function main() {
  if (!existsSync(outDir)) {
    console.log('[move-to-web] No out/ directory, skipping.');
    return;
  }

  mkdirSync(webDir, { recursive: true });

  const items = readdirSync(outDir);
  for (const item of items) {
    if (item === 'web') continue;

    const src = join(outDir, item);
    const dest = join(webDir, item);

    cpSync(src, dest, { recursive: true });
    rmSync(src, { recursive: true, force: true });
  }

  console.log('[move-to-web] Moved out/* -> out/web/');
}

main();

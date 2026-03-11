/**
 * fix-root-html.mjs
 *
 * Post-build script for .ait static bundle (Toss mini-app).
 *
 * In the Toss WebView, all routes are served from the root index.html since
 * it's a static export (SPA). The WebView always loads "/" regardless of the
 * intended deep link path. This script:
 *
 * 1. Reads the built out/index.html
 * 2. Injects a URL normalization script that captures the actual path and
 *    stores it as window.__FM_ACTUAL_PATH__ before the SPA hydrates
 * 3. Copies index.html to 404.html for SPA fallback
 *
 * Usage:
 *   node scripts/fix-root-html.mjs
 *   AIT_DEBUG=true node scripts/fix-root-html.mjs  (enables debug logging in injected script)
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const OUT_DIR = join(projectRoot, 'out');
const INDEX_PATH = join(OUT_DIR, 'index.html');
const FALLBACK_PATH = join(OUT_DIR, '404.html');

const isDebug = process.env.AIT_DEBUG === 'true';

function main() {
  if (!existsSync(INDEX_PATH)) {
    console.log('[fix-root-html] No out/index.html found, skipping.');
    return;
  }

  console.log('[fix-root-html] Processing out/index.html...');

  let html = readFileSync(INDEX_PATH, 'utf-8');

  // Build the URL normalization script to inject
  const injectedScript = buildInjectedScript();

  // Inject right after <head> tag
  html = html.replace(
    '<head>',
    `<head>\n${injectedScript}`
  );

  // Write modified index.html
  writeFileSync(INDEX_PATH, html, 'utf-8');
  console.log('[fix-root-html] Injected deep-link handler into index.html');

  // Copy to 404.html for SPA fallback (some static hosts use 404.html as fallback)
  copyFileSync(INDEX_PATH, FALLBACK_PATH);
  console.log('[fix-root-html] Copied index.html -> 404.html (SPA fallback)');

  // Also ensure that sub-route directories have index.html for static export
  // This handles cases where the Toss CDN serves directory-based routes
  const routes = [
    'judges',
    'history',
    'settings',
    'login',
  ];

  for (const route of routes) {
    const routeDir = join(OUT_DIR, route);
    const routeIndex = join(routeDir, 'index.html');

    if (!existsSync(routeIndex)) {
      if (!existsSync(routeDir)) {
        mkdirSync(routeDir, { recursive: true });
      }
      copyFileSync(INDEX_PATH, routeIndex);
      console.log(`[fix-root-html] Created fallback: ${route}/index.html`);
    }
  }

  console.log('[fix-root-html] Done.');
}

function buildInjectedScript() {
  const debugLog = isDebug
    ? `console.log('[FM:deep-link] actualPath:', actualPath, 'location:', window.location.pathname);`
    : '';

  return `<script>
(function() {
  try {
    // Capture the actual intended path from the URL.
    // In Toss WebView, the URL may contain the real path even though the
    // static host always serves the root index.html.
    var actualPath = window.location.pathname;
    var search = window.location.search;
    var hash = window.location.hash;

    ${debugLog}

    // If we're not at root, store the actual path so the DeepLinkHandler
    // component can pick it up and navigate via Next.js router.
    if (actualPath && actualPath !== '/' && actualPath !== '/index.html') {
      window.__FM_ACTUAL_PATH__ = actualPath + (search || '') + (hash || '');
      ${isDebug ? `console.log('[FM:deep-link] Stored __FM_ACTUAL_PATH__:', window.__FM_ACTUAL_PATH__);` : ''}
    }
  } catch (e) {
    ${isDebug ? `console.error('[FM:deep-link] Error:', e);` : ''}
  }
})();
</script>`;
}

main();

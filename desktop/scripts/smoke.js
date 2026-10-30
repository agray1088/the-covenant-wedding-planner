'use strict';

/**
 * Headless smoke test for the desktop static server (no Electron UI required).
 * Verifies local assets load and desktop config injects the API default.
 */
const path = require('path');
const http = require('http');
const { startPlannerServer } = require('../lib/static-server');
const { PACKAGED_DEFAULT } = require('../lib/api-config');

const ROOT = path.join(__dirname, '..', '..');
const API = PACKAGED_DEFAULT;

function get(urlPath, origin) {
  return new Promise((resolve, reject) => {
    const req = http.get(origin + urlPath, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8')
        });
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  const hosted = await startPlannerServer(ROOT, API);
  const failures = [];

  try {
    const index = await get('/', hosted.origin);
    if (index.status !== 200) failures.push('index status ' + index.status);
    if (!/COVENANT_DESKTOP/.test(index.body)) failures.push('index missing desktop bootstrap');
    if (!index.body.includes(API)) failures.push('index missing API default inject');
    if (/id=["']planner-footer["']/.test(index.body)) {
      failures.push('planner-footer should be removed from shell HTML');
    }
    if (!/covenantDesktop\.onMenuAction/.test(index.body)) {
      failures.push('index missing desktop menu bridge inject');
    }
    if (!/covenant-desktop/.test(index.body)) {
      failures.push('index missing covenant-desktop chrome class bootstrap');
    }
    if (!/action==='dark-mode'/.test(index.body)) {
      failures.push('menu bridge missing dark-mode action');
    }
    if (!/action==='quick-jump'/.test(index.body)) {
      failures.push('menu bridge missing quick-jump action');
    }
    if (!/action==='data-hub'/.test(index.body)) {
      failures.push('menu bridge missing data-hub action');
    }
    if (!/id=["']scripture-banner["']/.test(index.body)) {
      failures.push('scripture-banner should remain after footer removal');
    }
    /* Phase A: PWA manifest / theme-color scrubbed from desktop-served HTML */
    if (/rel=["']manifest["']/.test(index.body)) {
      failures.push('desktop index should scrub manifest link');
    }
    if (/name=["']theme-color["']/.test(index.body)) {
      failures.push('desktop index should scrub theme-color meta');
    }
    /* Phase A: native confirm bridge on preload + main */
    const fs = require('fs');
    const preloadBody = fs.readFileSync(path.join(__dirname, '..', 'preload.js'), 'utf8');
    if (!preloadBody.includes('covenant:confirm') || !/confirm\s*:/.test(preloadBody)) {
      failures.push('preload missing covenantDesktop.confirm → covenant:confirm');
    }
    const mainBody = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
    if (!mainBody.includes('covenant:confirm') || !mainBody.includes('showMessageBox')) {
      failures.push('main.js missing covenant:confirm native dialog handler');
    }

    const cfg = await get('/config.js', hosted.origin);
    if (cfg.status !== 200) failures.push('config.js status ' + cfg.status);
    if (!cfg.body.includes(API)) failures.push('config.js missing API default');

    const css = await get('/css/planner.css', hosted.origin);
    if (css.status !== 200) failures.push('planner.css status ' + css.status);

    const icon = await get('/assets/icons/icon-512.png', hosted.origin);
    if (icon.status !== 200) failures.push('icon-512 status ' + icon.status);

    const sw = await get('/sw.js', hosted.origin);
    if (sw.status !== 404) failures.push('sw.js should be 404 in desktop shell, got ' + sw.status);

    const blocked = await get('/server/index.js', hosted.origin);
    if (blocked.status !== 404) failures.push('server tree should not be served');
  } finally {
    await hosted.close();
  }

  if (failures.length) {
    console.error('SMOKE FAIL:');
    failures.forEach((f) => console.error(' -', f));
    process.exit(1);
  }
  console.log('SMOKE OK — static server serves planner + desktop API default');
  console.log('API default:', API);
  console.log('Planner root:', ROOT);
}

main().catch((err) => {
  console.error('SMOKE ERROR', err);
  process.exit(1);
});

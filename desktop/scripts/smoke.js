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

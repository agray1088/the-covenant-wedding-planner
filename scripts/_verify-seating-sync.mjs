/**
 * Second-device cloud sync proof (seating vertical).
 *
 * Two isolated Playwright storage contexts = two “devices”.
 * Device A: enable cloud → login demo → upload wedding → add unique seating table → sync
 * Device B: fresh context → enable cloud → same login → sync/pull → assert seating table present
 *
 * Requires sync API on host :18787 (docker compose up -d). For host `npm run server` on :8787, set COVENANT_CLOUD_API.
 * Requires root `npm install` + Playwright Chromium (see scripts/_ensure-playwright.mjs).
 *
 * Usage (from repo root):
 *   npm install
 *   npx playwright install chromium
 *   docker compose down -v && docker compose up -d
 *   npm run verify:seating-sync
 *
 * Or:
 *   node scripts/_verify-seating-sync.mjs
 *   COVENANT_CLOUD_API=http://127.0.0.1:18787 node scripts/_verify-seating-sync.mjs
 *
 * After schema changes (new seating_tables table + floor fixture columns): docker compose down -v && docker compose up -d
 */
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import {
  ensurePlaywrightPackage,
  ensurePlaywrightChromium
} from './_ensure-playwright.mjs';

if (!ensurePlaywrightPackage() || !ensurePlaywrightChromium()) {
  process.exit(1);
}

const { chromium } = await import('playwright');

const ROOT = process.cwd();
const PORT = Number(process.env.E2E_SEATING_SYNC_PORT || 8797);
const API = (process.env.COVENANT_CLOUD_API || 'http://127.0.0.1:18787').replace(/\/$/, '');
const DEMO_EMAIL = process.env.COVENANT_DEMO_EMAIL || 'demo@covenant.local';
const DEMO_PASSWORD = process.env.COVENANT_DEMO_PASSWORD || 'covenant-demo';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};

function startServer() {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let path = join(ROOT, url === '/' ? 'index.html' : url.replace(/^\//, ''));
    if (!path.startsWith(ROOT) || !existsSync(path) || statSync(path).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(readFileSync(path));
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function requireApi() {
  let health;
  try {
    const res = await fetch(API + '/health');
    health = await res.json();
  } catch (e) {
    throw new Error(
      `Sync API not reachable at ${API}. Start with: docker compose up -d  (API on host :18787). Keep Compose running while verifying.`
    );
  }
  if (!health || health.ok !== true) {
    throw new Error(`Sync API unhealthy at ${API}: ${JSON.stringify(health)}`);
  }
}

async function clearStorage(page) {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all((dbs || []).map((d) => d.name && new Promise((res, rej) => {
        const r = indexedDB.deleteDatabase(d.name);
        r.onsuccess = () => res(); r.onerror = () => rej(r.error); r.onblocked = () => res();
      })));
    }
  });
}

async function waitPlanner(page) {
  await page.waitForFunction(
    () => typeof window.data === 'object'
      && typeof window.save === 'function'
      && typeof window.CovenantCloudSync === 'object',
    null,
    { timeout: 30000 }
  );
  await page.waitForTimeout(400);
}

async function dismissOverlays(page) {
  await page.evaluate(() => {
    try {
      if (window.data) {
        window.data._onboarded = true;
        if (!window.data.setup) window.data.setup = {};
        window.data.setup.wizardDone = true;
        window.data.setup.bride = window.data.setup.bride || 'Ada';
        window.data.setup.groom = window.data.setup.groom || 'Alan';
        if (!window.data.onboard) window.data.onboard = {};
        window.data.onboard.backupEducationSeen = true;
        window.data.onboard.coachDone = true;
        if (typeof save === 'function') save();
      }
      document.querySelectorAll('.modal, .wizard, .wizard-modal, [role="dialog"], .cov-modal-overlay').forEach((el) => {
        el.style.display = 'none';
        el.classList.remove('open', 'active', 'visible', 'cov-modal-overlay--open');
      });
    } catch (e) { /* soft */ }
  });
}

async function openDevice(browser, label) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await clearStorage(page);
  await page.goto(`http://127.0.0.1:${PORT}/?v=seating-sync-${label}`, { waitUntil: 'domcontentloaded' });
  await waitPlanner(page);
  await dismissOverlays(page);
  await page.waitForTimeout(200);
  await dismissOverlays(page);
  return { context, page, errors, label };
}

async function enableCloud(page) {
  await page.evaluate((api) => {
    localStorage.setItem('covenant_cloud_api', api);
    localStorage.setItem('covenant_cloud_enabled', '1');
  }, API);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitPlanner(page);
  await dismissOverlays(page);
  const cfg = await page.evaluate(() => window.CovenantCloudSync.cfg());
  if (!cfg.enabled) throw new Error('Cloud sync failed to enable after flag + apiBase');
}

async function signInDemo(page) {
  const result = await page.evaluate(async ({ email, password }) => {
    const body = await window.CovenantCloudSync.signIn(email, password);
    return {
      email: body && body.user && body.user.email,
      hasToken: !!localStorage.getItem('covenant_cloud_token'),
      status: window.CovenantCloudSync.getStatus()
    };
  }, { email: DEMO_EMAIL, password: DEMO_PASSWORD });
  if (!result.hasToken) throw new Error('Sign-in did not store token: ' + JSON.stringify(result));
  return result;
}

async function uploadAndSyncSeating(page, tableName) {
  return page.evaluate(async (name) => {
    if (!Array.isArray(window.data.tables)) window.data.tables = [];
    const id = 'tbl_2dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    const updatedAt = new Date().toISOString();
    window.data.tables.push({
      id,
      _id: id,
      name,
      label: name + ' (sync proof)',
      capacity: 8,
      placement: 'Near dance floor — seating sync proof',
      type: 'guest',
      shape: 'circle',
      vip: false,
      facing: 'down',
      group: 'Friends',
      notes: 'Seating sync proof table',
      x: 220,
      y: 160,
      preset: '',
      updatedAt
    });
    if (!window.data.floorFixtures || typeof window.data.floorFixtures !== 'object') {
      window.data.floorFixtures = {};
    }
    window.data.floorFixtures.dj = { x: 30, y: 40, w: 78, h: 92, label: 'DJ\nBooth' };
    window.data.floorFixtures.cake = { x: 640, y: 40, w: 78, h: 92, label: 'Cake\nTable' };
    window.data.floorFixtures.dance = { x: 280, y: 360, w: 200, h: 70, label: 'Dance Floor' };
    window.data.floorFixturesUpdatedAt = updatedAt;
    save();

    const upload = await window.CovenantCloudSync.uploadWedding();
    const sync = await window.CovenantCloudSync.syncNow();
    return {
      tableId: id,
      tableName: name,
      weddingId: localStorage.getItem('covenant_cloud_wedding_id'),
      status: window.CovenantCloudSync.getStatus(),
      uploadReused: !!(upload && (upload.reused || upload.linkedExisting)),
      syncWeddingId: sync && sync.weddingId,
      localTableCount: (window.data.tables || []).length,
      pullSeating: sync && sync.pull && sync.pull.seating ? sync.pull.seating.pulled : null
    };
  }, tableName);
}

async function syncPullOnDeviceB(page) {
  return page.evaluate(async () => {
    const before = localStorage.getItem('covenant_cloud_wedding_id');
    const sync = await window.CovenantCloudSync.syncNow();
    const tables = (window.data && window.data.tables) || [];
    return {
      weddingIdBefore: before,
      weddingIdAfter: localStorage.getItem('covenant_cloud_wedding_id'),
      status: window.CovenantCloudSync.getStatus(),
      pulledSeating: sync && sync.pull && sync.pull.seating ? sync.pull.seating.pulled : null,
      tableNames: tables.map((t) => t && t.name).filter(Boolean),
      tableCount: tables.length,
      hasFloorFixtures: !!(window.data && window.data.floorFixtures && window.data.floorFixtures.dance),
      sync
    };
  });
}

function marker() {
  return `SecondDeviceSeating-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function main() {
  console.log('seating-sync: API', API);
  await requireApi();

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const tableName = marker();
  let deviceA;
  let deviceB;
  const report = {
    ok: false,
    api: API,
    demoEmail: DEMO_EMAIL,
    tableName,
    deviceA: null,
    deviceB: null,
    errors: []
  };

  try {
    deviceA = await openDevice(browser, 'A');
    await enableCloud(deviceA.page);
    await signInDemo(deviceA.page);
    const aResult = await uploadAndSyncSeating(deviceA.page, tableName);
    report.deviceA = aResult;
    if (!aResult.weddingId) report.errors.push('Device A: no cloud wedding id after upload/sync');
    if (aResult.status.state === 'error') report.errors.push('Device A: sync error — ' + (aResult.status.detail || ''));

    const tokenA = await deviceA.page.evaluate(() => localStorage.getItem('covenant_cloud_token'));
    const apiList = await fetch(API + '/weddings/' + aResult.weddingId + '/seating', {
      headers: { Authorization: 'Bearer ' + tokenA }
    }).then((r) => r.json());
    const onServer = Array.isArray(apiList.tables) && apiList.tables.some((c) => c.name === tableName);
    if (!onServer) {
      report.errors.push('Device A: seating table not present on API after sync — ' + JSON.stringify(apiList).slice(0, 500));
    } else {
      const row = apiList.tables.find((c) => c.name === tableName);
      if (row.x == null || row.y == null) {
        report.errors.push('Device A: seating table on API missing floor layout x/y');
      }
      if (!apiList.floorFixtures || !apiList.floorFixtures.dance) {
        report.errors.push('Device A: floor fixtures missing on API after sync');
      }
    }

    deviceB = await openDevice(browser, 'B');
    await enableCloud(deviceB.page);
    await signInDemo(deviceB.page);

    const weddingBeforeB = await deviceB.page.evaluate(() => localStorage.getItem('covenant_cloud_wedding_id'));
    if (weddingBeforeB) report.errors.push('Device B: expected fresh context with no wedding id, got ' + weddingBeforeB);

    const bResult = await syncPullOnDeviceB(deviceB.page);
    report.deviceB = bResult;

    if (!bResult.weddingIdAfter) {
      report.errors.push('Device B: sync did not link a cloud wedding id');
    }
    if (aResult.weddingId && bResult.weddingIdAfter && aResult.weddingId !== bResult.weddingIdAfter) {
      report.errors.push(
        `Device B linked different wedding (${bResult.weddingIdAfter}) than Device A (${aResult.weddingId})`
      );
    }
    if (!bResult.tableNames.includes(tableName)) {
      report.errors.push(
        `Device B missing seating table "${tableName}". Have: ${JSON.stringify(bResult.tableNames.slice(0, 20))}`
      );
    }
    const pulledRow = await deviceB.page.evaluate((name) => {
      const list = (window.data && window.data.tables) || [];
      return list.find((c) => c && c.name === name) || null;
    }, tableName);
    if (pulledRow && (pulledRow.x == null || pulledRow.y == null)) {
      report.errors.push('Device B: seating table pulled without floor layout x/y');
    }
    if (!bResult.hasFloorFixtures) {
      report.errors.push('Device B: floor fixtures not pulled');
    }
    if (bResult.status && bResult.status.state === 'error') {
      report.errors.push('Device B: sync error — ' + (bResult.status.detail || ''));
    }

    report.ok = report.errors.length === 0;
    if (!report.ok) {
      console.error('seating-sync FAILED');
      report.errors.forEach((e) => console.error(' -', e));
      console.error(JSON.stringify(report, null, 2));
      process.exitCode = 1;
    } else {
      console.log('seating-sync ok');
      console.log(JSON.stringify({
        ok: true,
        tableName,
        weddingId: aResult.weddingId,
        deviceATables: aResult.localTableCount,
        deviceBPulledSeating: bResult.pulledSeating,
        deviceBTables: bResult.tableCount,
        layout: pulledRow ? { x: pulledRow.x, y: pulledRow.y, shape: pulledRow.shape } : null
      }, null, 2));
    }
  } catch (e) {
    console.error('seating-sync FAILED:', e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    if (deviceA) await deviceA.context.close().catch(() => {});
    if (deviceB) await deviceB.context.close().catch(() => {});
    await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }
}

await main();

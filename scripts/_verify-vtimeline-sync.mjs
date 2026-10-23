/**
 * Second-device cloud sync proof (vendor arrivals / vtimeline vertical).
 *
 * Two isolated Playwright storage contexts = two “devices”.
 * Device A: enable cloud → login demo → upload wedding → add unique vendor arrival → sync
 * Device B: fresh context → enable cloud → same login → sync/pull → assert arrival present
 *
 * Requires sync API on host :18787 (docker compose up -d). For host `npm run server` on :8787, set COVENANT_CLOUD_API.
 * Requires root `npm install` + Playwright Chromium (see scripts/_ensure-playwright.mjs).
 *
 * Usage (from repo root):
 *   npm install
 *   npx playwright install chromium
 *   docker compose down -v && docker compose up -d
 *   npm run verify:vtimeline-sync
 *
 * Or:
 *   node scripts/_verify-vtimeline-sync.mjs
 *   COVENANT_CLOUD_API=http://127.0.0.1:18787 node scripts/_verify-vtimeline-sync.mjs
 *
 * After schema changes (new vendor_arrivals table): docker compose down -v && docker compose up -d
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
const PORT = Number(process.env.E2E_VTIMELINE_SYNC_PORT || 8804);
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
  await page.goto(`http://127.0.0.1:${PORT}/?v=vtimeline-sync-${label}`, { waitUntil: 'domcontentloaded' });
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

async function uploadAndSyncArrival(page, vendorName) {
  return page.evaluate(async (name) => {
    if (!Array.isArray(window.data.vtimeline)) window.data.vtimeline = [];
    const id = 'vtl_2dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    const updatedAt = new Date().toISOString();
    window.data.vtimeline.push({
      id,
      _id: id,
      vendor: name,
      time: '14:30',
      location: 'Loading Dock',
      contact: '555-0142',
      notes: 'Second-device vtimeline sync proof',
      event: 'Arrival & setup',
      status: 'Scheduled',
      description: 'Bring carts',
      updatedAt
    });
    save();

    const upload = await window.CovenantCloudSync.uploadWedding();
    const sync = await window.CovenantCloudSync.syncNow();
    return {
      arrivalId: id,
      vendorName: name,
      weddingId: localStorage.getItem('covenant_cloud_wedding_id'),
      status: window.CovenantCloudSync.getStatus(),
      uploadReused: !!(upload && (upload.reused || upload.linkedExisting)),
      syncWeddingId: sync && sync.weddingId,
      localArrivalCount: (window.data.vtimeline || []).length,
      pullVtimeline: sync && sync.pull && sync.pull.vtimeline ? sync.pull.vtimeline.pulled : null
    };
  }, vendorName);
}

async function syncPullOnDeviceB(page) {
  return page.evaluate(async () => {
    const before = localStorage.getItem('covenant_cloud_wedding_id');
    const sync = await window.CovenantCloudSync.syncNow();
    const rows = (window.data && window.data.vtimeline) || [];
    return {
      weddingIdBefore: before,
      weddingIdAfter: localStorage.getItem('covenant_cloud_wedding_id'),
      status: window.CovenantCloudSync.getStatus(),
      pulledArrivals: sync && sync.pull && sync.pull.vtimeline ? sync.pull.vtimeline.pulled : null,
      vendorNames: rows.map((r) => r && r.vendor).filter(Boolean),
      arrivalCount: rows.length,
      sync
    };
  });
}

function marker() {
  return `SecondDeviceArrival-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function main() {
  console.log('vtimeline-sync: API', API);
  await requireApi();

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const vendorName = marker();
  let deviceA;
  let deviceB;
  const report = {
    ok: false,
    api: API,
    demoEmail: DEMO_EMAIL,
    vendorName,
    deviceA: null,
    deviceB: null,
    errors: []
  };

  try {
    deviceA = await openDevice(browser, 'A');
    await enableCloud(deviceA.page);
    await signInDemo(deviceA.page);
    const aResult = await uploadAndSyncArrival(deviceA.page, vendorName);
    report.deviceA = aResult;
    if (!aResult.weddingId) report.errors.push('Device A: no cloud wedding id after upload/sync');
    if (aResult.status.state === 'error') report.errors.push('Device A: sync error — ' + (aResult.status.detail || ''));

    const tokenA = await deviceA.page.evaluate(() => localStorage.getItem('covenant_cloud_token'));
    const apiList = await fetch(API + '/weddings/' + aResult.weddingId + '/vtimeline', {
      headers: { Authorization: 'Bearer ' + tokenA }
    }).then((r) => r.json());
    const onServer = Array.isArray(apiList.vtimeline) && apiList.vtimeline.some((r) => r.vendor === vendorName);
    if (!onServer) {
      report.errors.push('Device A: arrival not present on API after sync — ' + JSON.stringify(apiList).slice(0, 500));
    } else {
      const row = apiList.vtimeline.find((r) => r.vendor === vendorName);
      if (!row || row.time !== '14:30') {
        report.errors.push('Device A: arrival on API missing/wrong time');
      }
      if (!row || row.location !== 'Loading Dock') {
        report.errors.push('Device A: arrival on API missing/wrong location');
      }
      if (!row || row.contact !== '555-0142') {
        report.errors.push('Device A: arrival on API missing/wrong contact');
      }
      if (!row || row.event !== 'Arrival & setup') {
        report.errors.push('Device A: arrival on API missing/wrong event');
      }
      if (!row || row.status !== 'Scheduled') {
        report.errors.push('Device A: arrival on API missing/wrong status');
      }
      if (!row || row.description !== 'Bring carts') {
        report.errors.push('Device A: arrival on API missing/wrong description meta');
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
    if (!bResult.vendorNames.includes(vendorName)) {
      report.errors.push(
        `Device B missing arrival vendor "${vendorName}". Have: ${JSON.stringify(bResult.vendorNames.slice(0, 20))}`
      );
    }
    const pulledRow = await deviceB.page.evaluate((name) => {
      const list = (window.data && window.data.vtimeline) || [];
      return list.find((r) => r && r.vendor === name) || null;
    }, vendorName);
    if (pulledRow && pulledRow.time !== '14:30') {
      report.errors.push('Device B: arrival pulled with wrong time');
    }
    if (pulledRow && pulledRow.location !== 'Loading Dock') {
      report.errors.push('Device B: arrival location not pulled');
    }
    if (pulledRow && pulledRow.contact !== '555-0142') {
      report.errors.push('Device B: arrival contact not pulled');
    }
    if (pulledRow && pulledRow.event !== 'Arrival & setup') {
      report.errors.push('Device B: arrival event not pulled');
    }
    if (pulledRow && pulledRow.description !== 'Bring carts') {
      report.errors.push('Device B: arrival description meta not pulled');
    }
    if (bResult.status && bResult.status.state === 'error') {
      report.errors.push('Device B: sync error — ' + (bResult.status.detail || ''));
    }

    report.ok = report.errors.length === 0;
    if (!report.ok) {
      console.error('vtimeline-sync FAILED');
      report.errors.forEach((e) => console.error(' -', e));
      console.error(JSON.stringify(report, null, 2));
      process.exitCode = 1;
    } else {
      console.log('vtimeline-sync ok');
      console.log(JSON.stringify({
        ok: true,
        vendorName,
        weddingId: aResult.weddingId,
        deviceAArrivals: aResult.localArrivalCount,
        deviceBPulledArrivals: bResult.pulledArrivals,
        deviceBArrivals: bResult.arrivalCount,
        fields: pulledRow ? {
          time: pulledRow.time,
          location: pulledRow.location,
          contact: pulledRow.contact,
          event: pulledRow.event,
          status: pulledRow.status,
          description: pulledRow.description
        } : null
      }, null, 2));
    }
  } catch (e) {
    console.error('vtimeline-sync FAILED:', e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    if (deviceA) await deviceA.context.close().catch(() => {});
    if (deviceB) await deviceB.context.close().catch(() => {});
    await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }
}

await main();

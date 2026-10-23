/**
 * Second-device cloud sync proof (packets vertical).
 *
 * Two isolated Playwright storage contexts = two “devices”.
 * Device A: enable cloud → login demo → upload wedding → add unique share packet → sync
 * Device B: fresh context → enable cloud → same login → sync/pull → assert packet present
 *
 * Requires sync API on host :18787 (docker compose up -d). For host `npm run server` on :8787, set COVENANT_CLOUD_API.
 * Requires root `npm install` + Playwright Chromium (see scripts/_ensure-playwright.mjs).
 *
 * Usage (from repo root):
 *   npm install
 *   npx playwright install chromium
 *   docker compose down -v && docker compose up -d
 *   npm run verify:packet-sync
 *
 * Or:
 *   node scripts/_verify-packet-sync.mjs
 *   COVENANT_CLOUD_API=http://127.0.0.1:18787 node scripts/_verify-packet-sync.mjs
 *
 * After schema changes (new packets table): docker compose down -v && docker compose up -d
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
const PORT = Number(process.env.E2E_PACKET_SYNC_PORT || 8800);
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
  await page.goto(`http://127.0.0.1:${PORT}/?v=packet-sync-${label}`, { waitUntil: 'domcontentloaded' });
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

async function uploadAndSyncPacket(page, packetName) {
  return page.evaluate(async (name) => {
    if (!Array.isArray(window.data.packets)) window.data.packets = [];
    const id = 'pkt_2dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    const updatedAt = new Date().toISOString();
    window.data.packets.push({
      id,
      _id: id,
      name,
      recipient: 'Grace Hall events',
      recipientType: 'Vendors',
      contains: 'Timeline · floor plan · contacts',
      sections: ['timeline', 'floor', 'contacts'],
      mode: 'Live',
      opens: 3,
      expires: '2026-12-08',
      status: 'Live',
      created: '2026-09-08',
      sent: '2026-09-08',
      contact: 'events@gracehall.local',
      link: 'vendor-portal.html?g=syncpf',
      passcode: 'None · anyone with the link',
      activity: [{ when: 'just now', where: 'lab', browser: 'Chrome' }],
      updatedAt
    });
    save();

    const upload = await window.CovenantCloudSync.uploadWedding();
    const sync = await window.CovenantCloudSync.syncNow();
    return {
      packetId: id,
      packetName: name,
      weddingId: localStorage.getItem('covenant_cloud_wedding_id'),
      status: window.CovenantCloudSync.getStatus(),
      uploadReused: !!(upload && (upload.reused || upload.linkedExisting)),
      syncWeddingId: sync && sync.weddingId,
      localPacketCount: (window.data.packets || []).length,
      pullPackets: sync && sync.pull && sync.pull.packets ? sync.pull.packets.pulled : null
    };
  }, packetName);
}

async function syncPullOnDeviceB(page) {
  return page.evaluate(async () => {
    const before = localStorage.getItem('covenant_cloud_wedding_id');
    const sync = await window.CovenantCloudSync.syncNow();
    const packets = (window.data && window.data.packets) || [];
    return {
      weddingIdBefore: before,
      weddingIdAfter: localStorage.getItem('covenant_cloud_wedding_id'),
      status: window.CovenantCloudSync.getStatus(),
      pulledPackets: sync && sync.pull && sync.pull.packets ? sync.pull.packets.pulled : null,
      packetNames: packets.map((p) => p && p.name).filter(Boolean),
      packetCount: packets.length,
      sync
    };
  });
}

function marker() {
  return `SecondDevicePacket-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function main() {
  console.log('packet-sync: API', API);
  await requireApi();

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const packetName = marker();
  let deviceA;
  let deviceB;
  const report = {
    ok: false,
    api: API,
    demoEmail: DEMO_EMAIL,
    packetName,
    deviceA: null,
    deviceB: null,
    errors: []
  };

  try {
    deviceA = await openDevice(browser, 'A');
    await enableCloud(deviceA.page);
    await signInDemo(deviceA.page);
    const aResult = await uploadAndSyncPacket(deviceA.page, packetName);
    report.deviceA = aResult;
    if (!aResult.weddingId) report.errors.push('Device A: no cloud wedding id after upload/sync');
    if (aResult.status.state === 'error') report.errors.push('Device A: sync error — ' + (aResult.status.detail || ''));

    const tokenA = await deviceA.page.evaluate(() => localStorage.getItem('covenant_cloud_token'));
    const apiList = await fetch(API + '/weddings/' + aResult.weddingId + '/packets', {
      headers: { Authorization: 'Bearer ' + tokenA }
    }).then((r) => r.json());
    const onServer = Array.isArray(apiList.packets) && apiList.packets.some((p) => p.name === packetName);
    if (!onServer) {
      report.errors.push('Device A: packet not present on API after sync — ' + JSON.stringify(apiList).slice(0, 500));
    } else {
      const row = apiList.packets.find((p) => p.name === packetName);
      if (!row || row.recipient !== 'Grace Hall events') {
        report.errors.push('Device A: packet on API missing/wrong recipient');
      }
      if (!row || row.recipientType !== 'Vendors') {
        report.errors.push('Device A: packet on API missing/wrong recipientType');
      }
      if (!row || row.mode !== 'Live') {
        report.errors.push('Device A: packet on API missing/wrong mode');
      }
      if (!row || !Array.isArray(row.sections) || row.sections.indexOf('timeline') < 0) {
        report.errors.push('Device A: packet sections missing timeline on API');
      }
      if (!row || !Array.isArray(row.activity) || row.activity.length < 1) {
        report.errors.push('Device A: packet activity missing on API');
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
    if (!bResult.packetNames.includes(packetName)) {
      report.errors.push(
        `Device B missing packet "${packetName}". Have: ${JSON.stringify(bResult.packetNames.slice(0, 20))}`
      );
    }
    const pulledRow = await deviceB.page.evaluate((name) => {
      const list = (window.data && window.data.packets) || [];
      return list.find((p) => p && p.name === name) || null;
    }, packetName);
    if (pulledRow && pulledRow.recipient !== 'Grace Hall events') {
      report.errors.push('Device B: packet pulled with wrong recipient');
    }
    if (pulledRow && pulledRow.recipientType !== 'Vendors') {
      report.errors.push('Device B: packet recipientType not pulled');
    }
    if (pulledRow && (!Array.isArray(pulledRow.sections) || pulledRow.sections.indexOf('timeline') < 0)) {
      report.errors.push('Device B: packet sections not pulled');
    }
    if (bResult.status && bResult.status.state === 'error') {
      report.errors.push('Device B: sync error — ' + (bResult.status.detail || ''));
    }

    report.ok = report.errors.length === 0;
    if (!report.ok) {
      console.error('packet-sync FAILED');
      report.errors.forEach((e) => console.error(' -', e));
      console.error(JSON.stringify(report, null, 2));
      process.exitCode = 1;
    } else {
      console.log('packet-sync ok');
      console.log(JSON.stringify({
        ok: true,
        packetName,
        weddingId: aResult.weddingId,
        deviceAPackets: aResult.localPacketCount,
        deviceBPulledPackets: bResult.pulledPackets,
        deviceBPackets: bResult.packetCount,
        fields: pulledRow ? {
          recipient: pulledRow.recipient,
          recipientType: pulledRow.recipientType,
          mode: pulledRow.mode,
          status: pulledRow.status,
          sections: pulledRow.sections,
          opens: pulledRow.opens
        } : null
      }, null, 2));
    }
  } catch (e) {
    console.error('packet-sync FAILED:', e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    if (deviceA) await deviceA.context.close().catch(() => {});
    if (deviceB) await deviceB.context.close().catch(() => {});
    await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }
}

await main();

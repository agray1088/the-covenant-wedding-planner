/**
 * P0 verification: empty means empty + guest survives hard reload.
 * Usage: node scripts/_verify-seed-persist-p0.mjs
 */
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PORT = 8791;
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
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(readFileSync(path));
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function clearStorage(page) {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all((dbs || []).map(d => d.name && new Promise((res, rej) => {
        const r = indexedDB.deleteDatabase(d.name);
        r.onsuccess = () => res(); r.onerror = () => rej(r.error); r.onblocked = () => res();
      })));
    } else {
      await new Promise((res, rej) => {
        const r = indexedDB.deleteDatabase('covenant_planner_db_v1');
        r.onsuccess = () => res(); r.onerror = () => rej(r.error); r.onblocked = () => res();
      });
    }
  });
}

async function waitPlanner(page) {
  await page.waitForFunction(() => typeof window.data === 'object' && typeof window.save === 'function' && typeof profileDataKey === 'function', null, { timeout: 30000 });
  // Wait until SQLite boot releases write-through suppression (or timeout soft).
  await page.waitForFunction(() => {
    try { return typeof _sqliteSyncSuppressed === 'undefined' || _sqliteSyncSuppressed === false; } catch (e) { return true; }
  }, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function openPanel(page, panel) {
  await page.evaluate((p) => {
    if (typeof showPanel === 'function') showPanel(p);
    else if (typeof window.showPanel === 'function') window.showPanel(p);
  }, panel);
  await page.waitForTimeout(400);
}

function countsFromData(d) {
  const len = (k) => Array.isArray(d[k]) ? d[k].length : 0;
  return {
    party: len('party'),
    partyDuties: len('partyDuties'),
    gifts: len('gifts'),
    tables: len('tables'),
    packets: len('packets'),
    appointments: len('appointments'),
    notesDetails: len('notesDetails'),
    prayer: len('prayer'),
    counseling: len('counseling'),
    essentials: len('essentials'),
    emailTemplates: len('emailTemplates'),
    entertainment: len('entertainment'),
    speeches: len('speeches'),
    homecoming: len('homecoming'),
    nameChange: len('nameChange'),
    firstMonthBudget: len('firstMonthBudget'),
    honeyTransport: len('honeyTransport'),
    honeyDetails: len('honeyDetails'),
    guests: len('guests'),
    moodPhotos: len('moodPhotos'),
    _historyLog: len('_historyLog')
  };
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const browserLogs = [];
  page.on('console', m => { const t = m.text(); if (/SQLite|Keep|hydrate|Skipping/i.test(t)) browserLogs.push(t); });
  const results = { empty: null, guestReload: null, ok: true, errors: [] };

  try {
    await clearStorage(page);
    await page.goto(`http://127.0.0.1:${PORT}/?v=seed-persist-p0`, { waitUntil: 'domcontentloaded' });
    await waitPlanner(page);

    // Dismiss any first-run overlays that might block
    await page.evaluate(() => {
      try {
        if (window.data) {
          window.data._onboarded = true;
          if (!window.data.setup) window.data.setup = {};
          window.data.setup.wizardDone = true;
          if (typeof save === 'function') save();
        }
        document.querySelectorAll('.modal, .wizard, [role="dialog"]').forEach(el => {
          el.style.display = 'none';
          el.classList.remove('open', 'active', 'visible');
        });
      } catch (e) {}
    });

    for (const panel of ['party', 'gifts', 'tables', 'packets', 'calendar', 'appointments', 'notes', 'prayer', 'counseling', 'essentials', 'emails', 'entertainment', 'homecoming', 'honeymoon', 'history', 'mood']) {
      await openPanel(page, panel);
    }

    const emptyCounts = await page.evaluate(() => {
      const d = window.data || {};
      const len = (k) => Array.isArray(d[k]) ? d[k].length : 0;
      return {
        party: len('party'), partyDuties: len('partyDuties'), gifts: len('gifts'), tables: len('tables'),
        packets: len('packets'), appointments: len('appointments'), notesDetails: len('notesDetails'),
        prayer: len('prayer'), counseling: len('counseling'), essentials: len('essentials'),
        emailTemplates: len('emailTemplates'), entertainment: len('entertainment'), speeches: len('speeches'),
        homecoming: len('homecoming'), nameChange: len('nameChange'), firstMonthBudget: len('firstMonthBudget'),
        honeyTransport: len('honeyTransport'), honeyDetails: len('honeyDetails'), guests: len('guests'),
        moodPhotos: len('moodPhotos'), _historyLog: len('_historyLog'),
        sampleNames: {
          party: (d.party || []).map(r => r.name).slice(0, 3),
          gifts: (d.gifts || []).map(r => r.from).slice(0, 3),
          packets: (d.packets || []).map(r => r.name).slice(0, 3),
          appointments: (d.appointments || []).map(r => r.title).slice(0, 3)
        }
      };
    });

    const fictionKeys = ['party', 'gifts', 'tables', 'packets', 'appointments', 'notesDetails', 'prayer',
      'counseling', 'essentials', 'emailTemplates', 'entertainment', 'speeches', 'homecoming',
      'nameChange', 'firstMonthBudget', 'honeyTransport', 'honeyDetails', 'moodPhotos'];
    const seeded = fictionKeys.filter(k => emptyCounts[k] > 0);
    // Real history from saves is OK; only fail if demo personas appear.
    const histDemo = (emptyCounts._historyLog > 0) && await page.evaluate(() => {
      const rows = data._historyLog || [];
      return rows.some(h => /Ama|Mary O\.|Efua Mensah/i.test(String(h.who || '') + ' ' + String(h.record || '') + ' ' + String(h.change || '')));
    });
    if (histDemo) seeded.push('_historyLog');
    results.empty = { counts: emptyCounts, seeded };
    if (seeded.length) {
      results.ok = false;
      results.errors.push('Demo fiction still present after clear+visit: ' + seeded.join(', '));
    }

    // --- Guest add → immediate hard reload ---
    await openPanel(page, 'guests');
    const guestName = 'PersistProbe Guest ' + Date.now();
    const preSave = await page.evaluate((name) => {
      if (!Array.isArray(data.guests)) data.guests = [];
      const row = { name, side: 'Bride', rsvp: 'Pending', household: 'Probe household' };
      if (typeof ensureRowId === 'function') ensureRowId(row, 'guests');
      else if (typeof nextRecordId === 'function') row._id = nextRecordId('guests');
      data.guests.push(row);
      save();
      const key = profileDataKey(activeProfile);
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return {
        key,
        lsFound: !!(parsed && Array.isArray(parsed.guests) && parsed.guests.some(g => g.name === name)),
        updatedAt: parsed && parsed.updatedAt
      };
    }, guestName);
    if (!preSave.lsFound) {
      results.ok = false;
      results.errors.push('Guest was not written to localStorage before reload');
    }

    // Immediate hard reload — do NOT wait for debounce (reproduces prior failure mode)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitPlanner(page);
    // Extra beat so async hydrate decision can finish (LS-newer skip or apply)
    await page.waitForTimeout(800);

    const after = await page.evaluate((name) => {
      const guests = (typeof data !== 'undefined' && data.guests) || (window.data && window.data.guests) || [];
      const key = profileDataKey(activeProfile);
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return {
        count: guests.length,
        found: guests.some(g => String(g.name || '') === name),
        foundLs: !!(parsed && Array.isArray(parsed.guests) && parsed.guests.some(g => g.name === name)),
        names: guests.map(g => g.name).slice(0, 5),
        updatedAt: (typeof data !== 'undefined' && data.updatedAt) || (window.data && window.data.updatedAt),
        sameRef: (typeof data !== 'undefined') && window.data === data,
        preSaveUpdatedAt: null
      };
    }, guestName);
    after.preSave = preSave;

    results.guestReload = after;
    if (!after.found && !after.foundLs) {
      results.ok = false;
      results.errors.push('Guest lost after immediate hard reload: ' + guestName);
    } else if (!after.found && after.foundLs) {
      results.ok = false;
      results.errors.push('Guest in LS but wiped from memory after reload (hydrate clobber): ' + guestName);
    }

    results.browserLogs = browserLogs;
    console.log(JSON.stringify(results, null, 2));
    if (!results.ok) process.exitCode = 1;
  } catch (e) {
    console.error('VERIFY_FAIL', e);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main();

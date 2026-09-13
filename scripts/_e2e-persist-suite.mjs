/**
 * E2E persistence suite — prove saves survive kill-tab / hard reload.
 *
 * Domains: guests, vendors, payments (+ installment), seating/tables,
 * and bonus: tasks, contracts, notes.
 *
 * Critical path covered: save → immediate hard reload (before debounce).
 *
 * Usage: node scripts/_e2e-persist-suite.mjs
 */
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PORT = Number(process.env.E2E_PERSIST_PORT || 8792);
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
  await page.waitForFunction(
    () => typeof window.data === 'object' && typeof window.save === 'function' && typeof profileDataKey === 'function',
    null,
    { timeout: 30000 }
  );
  await page.waitForFunction(() => {
    try { return typeof _sqliteSyncSuppressed === 'undefined' || _sqliteSyncSuppressed === false; }
    catch (e) { return true; }
  }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function dismissOverlays(page) {
  await page.evaluate(() => {
    try {
      if (window.data) {
        window.data._onboarded = true;
        if (!window.data.setup) window.data.setup = {};
        window.data.setup.wizardDone = true;
        if (!window.data.onboard) window.data.onboard = {};
        window.data.onboard.backupEducationSeen = true;
        window.data.onboard.coachDone = true;
        if (typeof save === 'function') save();
      }
      document.querySelectorAll('.modal, .wizard, .wizard-modal, [role="dialog"], .cov-modal-overlay').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('open', 'active', 'visible', 'cov-modal-overlay--open');
      });
    } catch (e) { /* soft */ }
  });
}

async function freshSession(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const logs = [];
  page.on('console', m => {
    const t = m.text();
    if (/SQLite|Keep|hydrate|Skipping|persist|IDB|clobber/i.test(t)) logs.push(t);
  });
  await clearStorage(page);
  await page.goto(`http://127.0.0.1:${PORT}/?v=e2e-persist-suite`, { waitUntil: 'domcontentloaded' });
  await waitPlanner(page);
  await dismissOverlays(page);
  // Second beat: overlays may re-open from first-run sequencer after save()
  await page.waitForTimeout(200);
  await dismissOverlays(page);
  return { context, page, logs };
}

async function hardReloadImmediate(page) {
  // Do NOT wait for debounce — reproduces prior kill-tab / instant-reload failure.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitPlanner(page);
  await page.waitForTimeout(800);
  await dismissOverlays(page);
}

function marker(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/** Write a row into data[key], call save(), return LS presence before reload. */
async function createAndSave(page, { key, row, matchFnSource }) {
  return page.evaluate(({ key, row, matchFnSource }) => {
    if (!Array.isArray(window.data[key])) window.data[key] = [];
    if (typeof ensureRowId === 'function') ensureRowId(row, key);
    else if (typeof nextRecordId === 'function' && !row._id) row._id = nextRecordId(key);
    window.data[key].push(row);
    save();
    const lsKey = profileDataKey(activeProfile);
    const parsed = JSON.parse(localStorage.getItem(lsKey) || 'null');
    const matchFn = new Function('row', 'return (' + matchFnSource + ')(row)');
    const lsFound = !!(parsed && Array.isArray(parsed[key]) && parsed[key].some(matchFn));
    return {
      lsKey,
      lsFound,
      updatedAt: parsed && parsed.updatedAt,
      memFound: Array.isArray(window.data[key]) && window.data[key].some(matchFn),
      count: (window.data[key] || []).length
    };
  }, { key, row, matchFnSource });
}

async function assertSurvived(page, { key, matchFnSource, label }) {
  return page.evaluate(({ key, matchFnSource, label }) => {
    const matchFn = new Function('row', 'return (' + matchFnSource + ')(row)');
    const rows = (window.data && window.data[key]) || [];
    const lsKey = profileDataKey(activeProfile);
    const parsed = JSON.parse(localStorage.getItem(lsKey) || 'null');
    const lsRows = (parsed && parsed[key]) || [];
    return {
      label,
      memFound: rows.some(matchFn),
      lsFound: Array.isArray(lsRows) && lsRows.some(matchFn),
      memCount: rows.length,
      lsCount: Array.isArray(lsRows) ? lsRows.length : 0,
      sample: rows.slice(0, 3).map(r => r.name || r.task || r.title || r.desc || r.label || r._id)
    };
  }, { key, matchFnSource, label });
}

function verdict(pre, post, domain) {
  const ok = !!(post.memFound && post.lsFound && pre.lsFound);
  const errors = [];
  if (!pre.lsFound) errors.push(`${domain}: not written to localStorage before reload`);
  if (!post.lsFound) errors.push(`${domain}: lost from localStorage after reload`);
  if (!post.memFound && post.lsFound) errors.push(`${domain}: in LS but wiped from memory (hydrate clobber)`);
  if (!post.memFound && !post.lsFound) errors.push(`${domain}: lost after immediate hard reload`);
  return { domain, ok, pre, post, errors };
}

async function runDomain(browser, domain, build) {
  const { context, page, logs } = await freshSession(browser);
  try {
    const built = await build(page);
    const pre = await createAndSave(page, built);
    await hardReloadImmediate(page);
    const post = await assertSurvived(page, {
      key: built.key,
      matchFnSource: built.matchFnSource,
      label: domain
    });
    const result = verdict(pre, post, domain);
    result.logs = logs.slice(-20);
    return result;
  } finally {
    await context.close();
  }
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const results = { ok: true, domains: {}, errors: [], startedAt: new Date().toISOString() };

  const scenarios = [
    {
      domain: 'guests',
      build: async () => {
        const name = marker('PersistGuest');
        return {
          key: 'guests',
          row: { name, side: 'Bride', rsvp: 'Pending', household: 'E2E household' },
          matchFnSource: `function(r){ return String(r.name||'') === ${JSON.stringify(name)}; }`
        };
      }
    },
    {
      domain: 'vendors',
      build: async () => {
        const name = marker('PersistVendor');
        return {
          key: 'vendors',
          row: { name, cat: 'Photography', status: 'Researching', contact: 'E2E', quote: 1200 },
          matchFnSource: `function(r){ return String(r.name||'') === ${JSON.stringify(name)}; }`
        };
      }
    },
    {
      domain: 'payments',
      build: async () => {
        const desc = marker('PersistPay');
        const instLabel = marker('Inst');
        return {
          key: 'payments',
          row: {
            vendor: 'E2E Vendor Co',
            desc,
            due: 500,
            paid: 100,
            status: 'Partial',
            date: '2026-09-07',
            installments: [{
              label: instLabel,
              dueDate: '2026-10-01',
              amountDue: 400,
              amountPaid: 0,
              status: 'Not Paid',
              paidDate: '',
              notes: 'e2e installment'
            }]
          },
          matchFnSource: `function(r){
            if (String(r.desc||'') !== ${JSON.stringify(desc)}) return false;
            const inst = Array.isArray(r.installments) ? r.installments : [];
            return inst.some(i => String(i.label||'') === ${JSON.stringify(instLabel)});
          }`
        };
      }
    },
    {
      domain: 'tables',
      build: async () => {
        const name = marker('PersistTable');
        const label = marker('SeatLabel');
        return {
          key: 'tables',
          row: {
            name,
            label,
            capacity: 8,
            shape: 'circle',
            group: 'E2E',
            notes: 'persist seating probe'
          },
          matchFnSource: `function(r){
            return String(r.name||'') === ${JSON.stringify(name)}
              || String(r.label||'') === ${JSON.stringify(label)};
          }`
        };
      }
    },
    {
      domain: 'tasks',
      build: async () => {
        const task = marker('PersistTask');
        return {
          key: 'tasks',
          row: {
            task,
            cat: 'Planning',
            phase: 'E2E',
            priority: 'Medium',
            status: 'Not Started',
            assigned: 'Both',
            notes: 'persist probe',
            subtasks: []
          },
          matchFnSource: `function(r){ return String(r.task||'') === ${JSON.stringify(task)}; }`
        };
      }
    },
    {
      domain: 'contracts',
      build: async () => {
        const name = marker('PersistContract');
        return {
          key: 'contracts',
          row: {
            name,
            vendor: 'E2E Venue',
            type: 'Contract',
            amount: 2500,
            status: 'Not Signed',
            notes: 'persist probe'
          },
          matchFnSource: `function(r){ return String(r.name||'') === ${JSON.stringify(name)}; }`
        };
      }
    },
    {
      domain: 'notes',
      build: async () => {
        const title = marker('PersistNote');
        return {
          key: 'notesDetails',
          row: {
            title,
            category: 'Planning',
            tags: 'e2e',
            pinned: false,
            status: 'Open',
            note: 'persist suite note body',
            nextStep: 'verify reload',
            icon: 'pencil'
          },
          matchFnSource: `function(r){ return String(r.title||'') === ${JSON.stringify(title)}; }`
        };
      }
    }
  ];

  // Extra scenario: seating assignment on an existing guest (table field change)
  const seatingScenario = {
    domain: 'seating',
    run: async () => {
      const { context, page, logs } = await freshSession(browser);
      try {
        const guestName = marker('SeatGuest');
        const tableName = marker('SeatTable');
        await page.evaluate(({ guestName, tableName }) => {
          if (!Array.isArray(data.guests)) data.guests = [];
          if (!Array.isArray(data.tables)) data.tables = [];
          const table = { name: tableName, label: 'Head', capacity: 10, shape: 'rect', group: 'Party' };
          if (typeof ensureRowId === 'function') ensureRowId(table, 'tables');
          data.tables.push(table);
          const guest = {
            name: guestName, side: 'Both', rsvp: 'Accepted', household: 'Seat HH',
            table: tableName, tableId: table._id
          };
          if (typeof ensureRowId === 'function') ensureRowId(guest, 'guests');
          data.guests.push(guest);
          save();
        }, { guestName, tableName });

        // Immediate edit then reload (no debounce wait)
        const pre = await page.evaluate(({ guestName, tableName }) => {
          const g = (data.guests || []).find(x => x.name === guestName);
          if (g) { g.seat = 'A1'; g.notes = 'seated-e2e'; }
          save();
          const parsed = JSON.parse(localStorage.getItem(profileDataKey(activeProfile)) || 'null');
          const pg = ((parsed && parsed.guests) || []).find(x => x.name === guestName);
          const pt = ((parsed && parsed.tables) || []).find(x => x.name === tableName);
          return {
            lsFound: !!(pg && pg.seat === 'A1' && pt),
            memFound: !!(g && g.seat === 'A1')
          };
        }, { guestName, tableName });

        await hardReloadImmediate(page);

        const post = await page.evaluate(({ guestName, tableName }) => {
          const g = (data.guests || []).find(x => x.name === guestName);
          const t = (data.tables || []).find(x => x.name === tableName);
          const parsed = JSON.parse(localStorage.getItem(profileDataKey(activeProfile)) || 'null');
          const pg = ((parsed && parsed.guests) || []).find(x => x.name === guestName);
          return {
            memFound: !!(g && g.seat === 'A1' && g.table === tableName && t),
            lsFound: !!(pg && pg.seat === 'A1' && pg.table === tableName),
            sample: { guest: g && { name: g.name, seat: g.seat, table: g.table }, table: t && t.name }
          };
        }, { guestName, tableName });

        const result = verdict(pre, post, 'seating');
        result.logs = logs.slice(-20);
        return result;
      } finally {
        await context.close();
      }
    }
  };

  // Extra: flush-via-pagehide path (save + dispatch pagehide before reload)
  const pagehideScenario = {
    domain: 'guests-pagehide-flush',
    run: async () => {
      const { context, page, logs } = await freshSession(browser);
      try {
        const name = marker('PagehideGuest');
        const pre = await page.evaluate((name) => {
          if (!Array.isArray(data.guests)) data.guests = [];
          const row = { name, side: 'Groom', rsvp: 'Pending' };
          if (typeof ensureRowId === 'function') ensureRowId(row, 'guests');
          data.guests.push(row);
          save();
          // Simulate kill-tab flush
          window.dispatchEvent(new Event('pagehide'));
          if (typeof flushSqliteSync === 'function') flushSqliteSync();
          const parsed = JSON.parse(localStorage.getItem(profileDataKey(activeProfile)) || 'null');
          return {
            lsFound: !!(parsed && (parsed.guests || []).some(g => g.name === name)),
            memFound: (data.guests || []).some(g => g.name === name)
          };
        }, name);

        await hardReloadImmediate(page);
        const post = await assertSurvived(page, {
          key: 'guests',
          matchFnSource: `function(r){ return String(r.name||'') === ${JSON.stringify(name)}; }`,
          label: 'guests-pagehide-flush'
        });
        const result = verdict(pre, post, 'guests-pagehide-flush');
        result.logs = logs.slice(-20);
        return result;
      } finally {
        await context.close();
      }
    }
  };

  try {
    for (const s of scenarios) {
      process.stdout.write(`… ${s.domain} `);
      const r = await runDomain(browser, s.domain, s.build);
      results.domains[s.domain] = r;
      if (!r.ok) {
        results.ok = false;
        results.errors.push(...r.errors);
        console.log('FAIL');
      } else {
        console.log('PASS');
      }
    }

    for (const s of [seatingScenario, pagehideScenario]) {
      process.stdout.write(`… ${s.domain} `);
      const r = await s.run();
      results.domains[s.domain] = r;
      if (!r.ok) {
        results.ok = false;
        results.errors.push(...r.errors);
        console.log('FAIL');
      } else {
        console.log('PASS');
      }
    }

    results.finishedAt = new Date().toISOString();
    console.log('\n=== E2E PERSIST SUITE SUMMARY ===');
    for (const [k, v] of Object.entries(results.domains)) {
      console.log(`  ${v.ok ? 'PASS' : 'FAIL'}  ${k}`);
    }
    if (results.errors.length) {
      console.log('\nErrors:');
      results.errors.forEach(e => console.log('  -', e));
    }
    console.log(JSON.stringify({
      ok: results.ok,
      domains: Object.fromEntries(
        Object.entries(results.domains).map(([k, v]) => [k, {
          ok: v.ok,
          memFound: v.post && v.post.memFound,
          lsFound: v.post && v.post.lsFound,
          errors: v.errors
        }])
      ),
      errors: results.errors
    }, null, 2));

    if (!results.ok) process.exitCode = 1;
  } catch (e) {
    console.error('SUITE_FAIL', e);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main();

/**
 * Full product-readiness audit — EMPTY STATE (no sample data).
 * Clears localStorage + IndexedDB, walks panels, probes core actions,
 * checks persistence across reload, captures screenshots + console errors.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = '/opt/cursor/artifacts/ship-audit';
const TMP = '/tmp/cursor/artifacts/ship-audit';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const BASE = 'http://127.0.0.1:8000';
const PANELS = [
  'instructions', 'guide', 'faq', 'setup', 'dashboard',
  'tasks', 'calendar', 'appointments', 'notes', 'logistics',
  'budget', 'payments', 'contracts',
  'vendors', 'catering',
  'guests', 'households', 'contacts', 'party', 'tables',
  'ceremony', 'timeline', 'entertainment', 'shotlist',
  'mood', 'essentials', 'gifts', 'emails', 'packets',
  'honeymoon', 'prayer', 'counseling',
  'venue', 'vision', 'firstmonth', 'homecoming', 'roles',
  'datahub', 'history', 'print'
];

const report = {
  startedAt: new Date().toISOString(),
  branch: 'cursor/dashboard-views-017e',
  emptyStateConfirmed: false,
  firstRun: {},
  panels: {},
  actions: {},
  persistence: {},
  chrome: {},
  vendorPortal: {},
  consoleErrors: [],
  pageErrors: [],
  screenshots: [],
  summary: { broken: [], emptyGaps: [], incomplete: [], persistFails: [], polish: [] }
};

function shot(name) {
  const p = path.join(OUT, `${name}.png`);
  report.screenshots.push(p);
  return p;
}

async function clearStorage(page) {
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(async () => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    try {
      if (indexedDB && indexedDB.databases) {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) await new Promise((res) => {
            const r = indexedDB.deleteDatabase(db.name);
            r.onsuccess = r.onerror = r.onblocked = () => res();
          });
        }
      } else {
        await new Promise((res) => {
          const r = indexedDB.deleteDatabase('covenant_planner_db_v1');
          r.onsuccess = r.onerror = r.onblocked = () => res();
        });
      }
    } catch {}
  });
}

async function bootEmpty(page) {
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => typeof window.showPanel === 'function' && typeof window.blankData === 'function', { timeout: 90000 });
  // Wait for SQLite / init
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => {
    const d = (typeof data !== 'undefined') ? data : (window.getCovenantPlannerData && window.getCovenantPlannerData());
    const counts = {};
    if (d) {
      for (const k of Object.keys(d)) {
        if (Array.isArray(d[k])) counts[k] = d[k].length;
      }
    }
    // Detect if sample was loaded
    const guestN = (d && d.guests && d.guests.length) || 0;
    const vendorN = (d && d.vendors && d.vendors.length) || 0;
    const wizard = document.querySelector('#wizard-modal, .wizard-modal, .cov-modal-overlay.open, [data-wizard]');
    const overlays = [...document.querySelectorAll('.cov-modal-overlay, .modal-overlay, [role="dialog"]')]
      .filter(el => {
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null;
      })
      .map(el => ({ id: el.id, class: String(el.className).slice(0,80), text: (el.textContent||'').replace(/\s+/g,' ').trim().slice(0,120) }));
    return {
      hasData: !!d,
      guestN, vendorN,
      budgetN: (d && d.budget && d.budget.length) || 0,
      setupKeys: d && d.setup ? Object.keys(d.setup).filter(k => d.setup[k] != null && d.setup[k] !== '') : [],
      bride: d?.setup?.bride || '',
      groom: d?.setup?.groom || '',
      wizardSeen: d?.onboard?.wizardSeen,
      localStorageKeys: Object.keys(localStorage),
      overlays,
      bodyClasses: document.body.className,
      title: document.title,
      sqliteEnabled: typeof COVENANT_SQLITE !== 'undefined' ? COVENANT_SQLITE.enabled : null,
      sqliteReady: typeof sqliteBackupReady === 'function' ? sqliteBackupReady() : null,
      arrayCounts: counts
    };
  });
  return state;
}

async function dismissOverlays(page) {
  await page.evaluate(() => {
    // Prefer proper close if available
    if (typeof closeSetupWizard === 'function') {
      try { closeSetupWizard(true); } catch {}
    }
    document.querySelectorAll('.cov-modal-overlay, .modal-overlay, #wizard-modal, [role="dialog"]').forEach(el => {
      el.classList.remove('open');
      el.style.display = 'none';
      el.hidden = true;
    });
  });
  await page.waitForTimeout(200);
}

async function panelInfo(page, panelId) {
  return page.evaluate((id) => {
    const panel = document.getElementById('panel-' + id);
    const visible = panel && getComputedStyle(panel).display !== 'none' && !panel.hidden;
    const text = panel ? (panel.innerText || '').replace(/\s+/g, ' ').trim() : '';
    const emptyHints = [];
    const emptySelectors = [
      '.rd-empty', '.empty-state', '.ued-empty', '[class*="empty"]', '.no-data',
      '.rd-state-empty', '.blank-state', '.starter-empty'
    ];
    if (panel) {
      for (const sel of emptySelectors) {
        panel.querySelectorAll(sel).forEach(el => {
          const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
          if (t && t.length < 400) emptyHints.push({ sel, text: t.slice(0, 200) });
        });
      }
    }
    const ctas = panel ? [...panel.querySelectorAll('button, a.btn, .add-row-btn, [data-action="add"]')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 25) : [];
    const inputs = panel ? panel.querySelectorAll('input, textarea, select').length : 0;
    const tables = panel ? panel.querySelectorAll('table, .rd-table, [role="table"]').length : 0;
    const errors = panel ? [...panel.querySelectorAll('.error, .rd-error, [class*="error"]')]
      .map(el => (el.textContent||'').trim().slice(0,100)).filter(Boolean).slice(0,5) : [];
    // Dead-end heuristic: no CTAs mentioning add/create/new/start and short content
    const hasAddCta = ctas.some(t => /add|new|create|start|import|upload|set up|begin/i.test(t));
    return {
      exists: !!panel,
      visible,
      textLen: text.length,
      textPreview: text.slice(0, 350),
      emptyHints,
      ctas,
      hasAddCta,
      inputs,
      tables,
      errors,
      panelClasses: panel ? String(panel.className).slice(0, 120) : null
    };
  }, panelId);
}

async function tryShowPanel(page, id) {
  const result = await page.evaluate((panelId) => {
    try {
      if (typeof showPanel === 'function') {
        showPanel(panelId);
        return { ok: true, method: 'showPanel' };
      }
      return { ok: false, error: 'showPanel missing' };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }, id);
  await page.waitForTimeout(600);
  return result;
}

const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    report.consoleErrors.push({ text: msg.text(), loc: msg.location() });
  }
});
page.on('pageerror', (err) => {
  report.pageErrors.push(String(err && err.message || err));
});

console.log('=== Clearing storage & booting empty ===');
await clearStorage(page);
const boot = await bootEmpty(page);
report.firstRun.boot = boot;
report.emptyStateConfirmed = boot.guestN === 0 && boot.vendorN === 0;
console.log('Empty confirmed:', report.emptyStateConfirmed, 'guests=', boot.guestN, 'vendors=', boot.vendorN);

await page.screenshot({ path: shot('00_first_load'), fullPage: false });

// Capture first-run overlays / wizard without dismissing yet
report.firstRun.overlaysBeforeDismiss = boot.overlays;
report.firstRun.wizardOrCoach = await page.evaluate(() => {
  const candidates = [...document.querySelectorAll('#wizard-modal, .setup-wizard, .onboard, .coach, [class*="wizard"], [class*="coach"], .cov-modal-overlay.open')];
  return candidates.map(el => ({
    id: el.id,
    class: String(el.className).slice(0,100),
    display: getComputedStyle(el).display,
    text: (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,400)
  }));
});
await page.screenshot({ path: shot('01_first_run_overlay'), fullPage: false });

// Explore first-run UX briefly before dismissing
report.firstRun.actionsAvailable = await page.evaluate(() => {
  return [...document.querySelectorAll('button, [role="button"]')]
    .filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    })
    .map(el => (el.textContent||'').replace(/\s+/g,' ').trim().slice(0,80))
    .filter(Boolean)
    .slice(0, 40);
});

await dismissOverlays(page);
await page.screenshot({ path: shot('02_after_dismiss_dashboard'), fullPage: false });

console.log('=== Walking all panels (empty) ===');
for (const panelId of PANELS) {
  const beforeErrors = report.consoleErrors.length;
  const beforePage = report.pageErrors.length;
  const show = await tryShowPanel(page, panelId);
  const info = await panelInfo(page, panelId);
  const newConsole = report.consoleErrors.slice(beforeErrors);
  const newPage = report.pageErrors.slice(beforePage);
  report.panels[panelId] = {
    show,
    ...info,
    newConsoleErrors: newConsole.map(e => e.text).slice(0, 5),
    newPageErrors: newPage.slice(0, 5)
  };
  // Screenshot key panels
  if (['setup','dashboard','guests','households','contacts','tasks','calendar','appointments',
       'budget','payments','contracts','vendors','catering','party','tables','gifts',
       'ceremony','prayer','counseling','entertainment','honeymoon','mood','essentials',
       'packets','emails','shotlist','notes','timeline','logistics','datahub'].includes(panelId)) {
    await page.screenshot({ path: shot(`panel_${panelId}`), fullPage: false });
  }
  // Flag gaps
  if (!info.exists) {
    report.summary.broken.push(`${panelId}: panel element missing (#panel-${panelId})`);
  } else if (!info.visible && show.ok) {
    report.summary.broken.push(`${panelId}: showPanel ran but panel not visible`);
  }
  if (info.exists && info.visible && !info.hasAddCta && info.textLen < 80 && info.emptyHints.length === 0) {
    report.summary.emptyGaps.push(`${panelId}: sparse content, no add CTA, no empty-state copy`);
  }
  if (info.exists && info.visible && info.emptyHints.length === 0 && info.tables === 0 && info.inputs === 0 && info.textLen < 200) {
    report.summary.emptyGaps.push(`${panelId}: looks underbuilt (no table/inputs, short copy)`);
  }
  if (newPage.length) {
    report.summary.broken.push(`${panelId}: pageerror — ${newPage[0]}`);
  }
  console.log(`  ${panelId}: exists=${info.exists} visible=${info.visible} ctas=${info.ctas.length} emptyHints=${info.emptyHints.length}`);
}

console.log('=== Core action probes (empty planner) ===');

// --- Setup: fill bride/groom/date ---
await tryShowPanel(page, 'setup');
await page.waitForTimeout(400);
report.actions.setup = await page.evaluate(() => {
  const out = { fieldsFound: [], saved: false, error: null };
  try {
    const bride = document.querySelector('#setup-bride, input[name="bride"], [data-field="bride"], #panel-setup input');
    const inputs = [...document.querySelectorAll('#panel-setup input[type="text"], #panel-setup input:not([type]), #panel-setup input[type="date"], #panel-setup input[type="number"]')];
    out.fieldsFound = inputs.slice(0, 15).map(el => ({ id: el.id, name: el.name, ph: el.placeholder, value: el.value }));
    // Try common setup setters
    if (typeof data !== 'undefined') {
      data.setup = data.setup || {};
      data.setup.bride = 'Audit Bride';
      data.setup.groom = 'Audit Groom';
      data.setup.date = '2027-06-15';
      data.setup.weddingDate = '2027-06-15';
      data.setup.budget = 25000;
      if (typeof save === 'function') save();
      out.saved = true;
      out.after = { bride: data.setup.bride, groom: data.setup.groom, date: data.setup.date || data.setup.weddingDate };
    }
    if (typeof renderSetup === 'function') renderSetup();
    else if (typeof showPanel === 'function') showPanel('setup');
  } catch (e) { out.error = String(e && e.message || e); }
  return out;
});
await page.waitForTimeout(300);
await page.screenshot({ path: shot('action_setup_filled'), fullPage: false });

// --- Add guest via API if available ---
report.actions.addGuest = await page.evaluate(() => {
  const out = { method: null, ok: false, countBefore: 0, countAfter: 0, error: null };
  try {
    out.countBefore = (data.guests || []).length;
    if (typeof logAdd === 'function') {
      out.method = 'logAdd';
      // Try common signatures
      try {
        logAdd('guests', { name: 'Test Guest One', side: 'Bride', rsvp: 'Pending', household: 'Guest Household' });
        out.ok = true;
      } catch (e1) {
        try { logAdd('guests'); out.ok = true; out.method = 'logAdd(guests)'; } catch (e2) {
          out.error = String(e2 && e2.message || e2);
        }
      }
    } else if (typeof addGuest === 'function') {
      out.method = 'addGuest';
      addGuest();
      out.ok = true;
    } else {
      // Direct mutate
      out.method = 'direct';
      data.guests = data.guests || [];
      data.guests.push({ _id: 'GST-AUDIT1', name: 'Test Guest One', side: 'Bride', rsvp: 'Pending', household: 'Guest Household', companions: [] });
      if (typeof save === 'function') save();
      out.ok = true;
    }
    out.countAfter = (data.guests || []).length;
    if (typeof showPanel === 'function') showPanel('guests');
  } catch (e) { out.error = String(e && e.message || e); }
  return out;
});
await page.waitForTimeout(500);
await page.screenshot({ path: shot('action_guest_added'), fullPage: false });

// --- Add vendor ---
report.actions.addVendor = await page.evaluate(() => {
  const out = { ok: false, countAfter: 0, error: null };
  try {
    data.vendors = data.vendors || [];
    data.vendors.push({ _id: 'VEN-AUDIT1', name: 'Audit Florist', cat: 'Florist', status: 'Researching', quote: 1200, phone: '555-0100', email: 'florist@example.com' });
    if (typeof ensurePlannerRecordModel === 'function') ensurePlannerRecordModel();
    if (typeof save === 'function') save();
    out.ok = true;
    out.countAfter = data.vendors.length;
    if (typeof showPanel === 'function') showPanel('vendors');
  } catch (e) { out.error = String(e && e.message || e); }
  return out;
});
await page.waitForTimeout(400);
await page.screenshot({ path: shot('action_vendor_added'), fullPage: false });

// --- Add task ---
report.actions.addTask = await page.evaluate(() => {
  const out = { ok: false, countAfter: 0 };
  try {
    data.tasks = data.tasks || [];
    data.tasks.push({ _id: 'TSK-AUDIT1', task: 'Book venue', title: 'Book venue', status: 'todo', due: '2026-12-01', cat: 'Venue' });
    if (typeof save === 'function') save();
    out.ok = true;
    out.countAfter = data.tasks.length;
    if (typeof showPanel === 'function') showPanel('tasks');
  } catch (e) { out.error = String(e); }
  return out;
});

// --- Add budget line ---
report.actions.addBudget = await page.evaluate(() => {
  const out = { ok: false, countAfter: 0 };
  try {
    data.budget = data.budget || [];
    data.budget.push({ _id: 'BUD-AUDIT1', cat: 'Venue', planned: 8000, actual: 0, items: [{ name: 'Hall rental', cost: 8000 }] });
    if (typeof save === 'function') save();
    out.ok = true;
    out.countAfter = data.budget.length;
    if (typeof showPanel === 'function') showPanel('budget');
  } catch (e) { out.error = String(e); }
  return out;
});

// --- Add payment linked to vendor ---
report.actions.addPayment = await page.evaluate(() => {
  const out = { ok: false };
  try {
    data.payments = data.payments || [];
    data.payments.push({ _id: 'PAY-AUDIT1', vendor: 'Audit Florist', vendorId: 'VEN-AUDIT1', amount: 400, status: 'Due', due: '2026-11-01', budgetCat: 'Florals' });
    if (typeof ensureRelationalDataModel === 'function') ensureRelationalDataModel();
    if (typeof save === 'function') save();
    out.ok = true;
    out.count = data.payments.length;
  } catch (e) { out.error = String(e); }
  return out;
});

// --- Add appointment ---
report.actions.addAppointment = await page.evaluate(() => {
  const out = { ok: false };
  try {
    data.appointments = data.appointments || [];
    data.appointments.push({ _id: 'APT-AUDIT1', title: 'Florist tasting', date: '2026-10-10', time: '14:00', vendor: 'Audit Florist', vendorId: 'VEN-AUDIT1' });
    if (typeof save === 'function') save();
    out.ok = true;
  } catch (e) { out.error = String(e); }
  return out;
});

// --- Add note ---
report.actions.addNote = await page.evaluate(() => {
  const out = { ok: false };
  try {
    data.notesDetails = data.notesDetails || [];
    data.notesDetails.push({ _id: 'NTD-AUDIT1', title: 'Audit note', body: 'Persisted note body', flagged: true, cat: 'General' });
    if (typeof save === 'function') save();
    out.ok = true;
  } catch (e) { out.error = String(e); }
  return out;
});

// --- Add table + seating ---
report.actions.addTable = await page.evaluate(() => {
  const out = { ok: false };
  try {
    data.tables = data.tables || [];
    data.tables.push({ _id: 'TBL-AUDIT1', name: 'Table 1', seats: 8, shape: 'round' });
    if (data.guests[0]) {
      data.guests[0].table = 'Table 1';
      data.guests[0].tableId = 'TBL-AUDIT1';
    }
    if (typeof save === 'function') save();
    out.ok = true;
  } catch (e) { out.error = String(e); }
  return out;
});

// --- UI click path: try Add buttons on guests ---
await tryShowPanel(page, 'guests');
await page.waitForTimeout(400);
report.actions.guestUiAdd = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#panel-guests button, #panel-guests .rd-link-quiet, #panel-guests a')]
    .filter(el => /add|new guest|import/i.test(el.textContent || ''));
  const labels = btns.map(b => (b.textContent||'').replace(/\s+/g,' ').trim().slice(0,50));
  let clicked = null;
  if (btns[0]) { btns[0].click(); clicked = labels[0]; }
  return { labels, clicked, guestCount: (data.guests||[]).length };
});
await page.waitForTimeout(500);
await page.screenshot({ path: shot('action_guest_ui_add'), fullPage: false });

// Close any drawer opened
await page.evaluate(() => {
  if (typeof closeRecordDrawer === 'function') try { closeRecordDrawer(); } catch {}
  if (typeof closeDrawer === 'function') try { closeDrawer(); } catch {}
  document.querySelectorAll('.rd-drawer.open, .drawer.open, .cov-drawer.open').forEach(el => el.classList.remove('open'));
});

// --- Quick Jump / command palette ---
report.chrome.quickJump = await page.evaluate(() => {
  const out = { opened: false, resultCount: 0, error: null };
  try {
    if (typeof openCommandPalette === 'function') openCommandPalette();
    else if (typeof toggleCommandPalette === 'function') toggleCommandPalette();
    else {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    }
    const pal = document.querySelector('.cmd-palette, #cmd-palette, .rd-cmd, [aria-label="Command palette"]');
    out.opened = !!(pal && getComputedStyle(pal).display !== 'none');
    out.resultCount = pal ? pal.querySelectorAll('[role="option"], .cmd-palette-item, .rd-cmd__item').length : 0;
    out.visibleText = pal ? (pal.innerText||'').replace(/\s+/g,' ').trim().slice(0,200) : '';
  } catch (e) { out.error = String(e); }
  return out;
});
await page.waitForTimeout(300);
await page.screenshot({ path: shot('chrome_quick_jump'), fullPage: false });
await page.keyboard.press('Escape');

// --- Dark mode smoke ---
report.chrome.darkMode = await page.evaluate(() => {
  const out = { before: document.body.classList.contains('dark-mode') };
  try {
    if (typeof applyDarkMode === 'function') applyDarkMode(true);
    else if (typeof toggleDarkMode === 'function') toggleDarkMode();
    else document.body.classList.add('dark-mode');
    out.after = document.body.classList.contains('dark-mode');
    out.ok = out.after === true;
  } catch (e) { out.error = String(e); }
  return out;
});
await page.screenshot({ path: shot('chrome_dark_mode'), fullPage: false });
await page.evaluate(() => { if (typeof applyDarkMode === 'function') applyDarkMode(false); });

// --- Settings / profile ---
report.chrome.settings = await page.evaluate(() => {
  const out = {};
  try {
    if (typeof openSettingsWindow === 'function') { openSettingsWindow(); out.settingsOpened = true; }
    else if (typeof showSettings === 'function') { showSettings(); out.settingsOpened = true; }
    const win = document.querySelector('.settings-window, #settings-window, [class*="settings"]');
    out.settingsVisible = !!(win && getComputedStyle(win).display !== 'none');
    out.settingsText = win ? (win.innerText||'').replace(/\s+/g,' ').trim().slice(0,250) : '';
  } catch (e) { out.error = String(e); }
  return out;
});
await page.waitForTimeout(300);
await page.screenshot({ path: shot('chrome_settings'), fullPage: false });
await page.keyboard.press('Escape');
await page.evaluate(() => {
  document.querySelectorAll('.settings-window, .cov-modal-overlay').forEach(el => {
    el.classList.remove('open'); el.style.display = 'none';
  });
});

// --- Profile drawer ---
report.chrome.profile = await page.evaluate(() => {
  const out = {};
  try {
    const btn = document.querySelector('#profile-btn, [aria-label*="Profile"], .profile-chip, #topbar-profile, button[onclick*="profile"]');
    if (btn) { btn.click(); out.clicked = true; }
    else if (typeof openProfileDrawer === 'function') { openProfileDrawer(); out.clicked = true; }
    const drawer = document.querySelector('.profile-drawer, #profile-drawer, [class*="profile-drawer"]');
    out.visible = !!(drawer && getComputedStyle(drawer).display !== 'none');
    out.text = drawer ? (drawer.innerText||'').replace(/\s+/g,' ').trim().slice(0,200) : '';
  } catch (e) { out.error = String(e); }
  return out;
});
await page.screenshot({ path: shot('chrome_profile'), fullPage: false });

// --- Data Hub ---
await tryShowPanel(page, 'datahub');
await page.waitForTimeout(500);
report.chrome.dataHub = await panelInfo(page, 'datahub');
// Also try alternate id
if (!report.chrome.dataHub.exists || !report.chrome.dataHub.visible) {
  const alt = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id^="panel-"]')].map(el => el.id);
    return ids.filter(id => /data|hub|database/i.test(id));
  });
  report.chrome.dataHubAltIds = alt;
  for (const id of alt) {
    const short = id.replace(/^panel-/, '');
    await tryShowPanel(page, short);
    report.chrome.dataHub = await panelInfo(page, short);
    if (report.chrome.dataHub.visible) break;
  }
}
await page.screenshot({ path: shot('chrome_datahub'), fullPage: false });

// --- Backup UI presence ---
report.chrome.backup = await page.evaluate(() => {
  const out = { hasDownloadFn: typeof downloadSqliteBackup === 'function', hasRestoreFn: typeof restoreSqliteBackup === 'function' || typeof importSqliteBackup === 'function' };
  const btns = [...document.querySelectorAll('button, a')].filter(el => /backup|restore|\.sqlite/i.test(el.textContent || el.title || ''));
  out.backupButtons = btns.slice(0, 10).map(b => (b.textContent||b.title||'').replace(/\s+/g,' ').trim().slice(0,60));
  out.sqliteReady = typeof sqliteBackupReady === 'function' ? sqliteBackupReady() : null;
  out.localStorageBytes = (localStorage.getItem('covenant_planner_v1') || '').length;
  return out;
});

// Snapshot data before reload
const preReload = await page.evaluate(() => {
  const d = data;
  return {
    bride: d.setup?.bride,
    groom: d.setup?.groom,
    guests: (d.guests||[]).map(g => g.name),
    vendors: (d.vendors||[]).map(v => v.name),
    tasks: (d.tasks||[]).length,
    budget: (d.budget||[]).length,
    payments: (d.payments||[]).length,
    appointments: (d.appointments||[]).length,
    notes: (d.notesDetails||[]).length,
    tables: (d.tables||[]).length,
    lsLen: (localStorage.getItem('covenant_planner_v1') || localStorage.getItem('covenant_planner_v1_' + (localStorage.getItem('covenant_active_profile')||'')) || '').length,
    profileKey: localStorage.getItem('covenant_active_profile'),
    allLsKeys: Object.keys(localStorage)
  };
});
report.persistence.beforeReload = preReload;

console.log('=== Persistence reload check ===');
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => typeof window.showPanel === 'function', { timeout: 90000 });
await page.waitForTimeout(2000);
await dismissOverlays(page);

const postReload = await page.evaluate(() => {
  const d = (typeof data !== 'undefined') ? data : null;
  return {
    bride: d?.setup?.bride,
    groom: d?.setup?.groom,
    guests: (d?.guests||[]).map(g => g.name),
    vendors: (d?.vendors||[]).map(v => v.name),
    tasks: (d?.tasks||[]).length,
    budget: (d?.budget||[]).length,
    payments: (d?.payments||[]).length,
    appointments: (d?.appointments||[]).length,
    notes: (d?.notesDetails||[]).length,
    tables: (d?.tables||[]).length,
    sqliteEnabled: typeof COVENANT_SQLITE !== 'undefined' ? COVENANT_SQLITE.enabled : null,
    hasDb: typeof COVENANT_SQLITE !== 'undefined' && !!COVENANT_SQLITE.db
  };
});
report.persistence.afterReload = postReload;
report.persistence.persisted = {
  setup: postReload.bride === 'Audit Bride' && postReload.groom === 'Audit Groom',
  guests: (postReload.guests || []).includes('Test Guest One'),
  vendors: (postReload.vendors || []).includes('Audit Florist'),
  tasks: postReload.tasks >= 1,
  budget: postReload.budget >= 1,
  payments: postReload.payments >= 1,
  appointments: postReload.appointments >= 1,
  notes: postReload.notes >= 1,
  tables: postReload.tables >= 1
};
for (const [k, v] of Object.entries(report.persistence.persisted)) {
  if (!v) report.summary.persistFails.push(`${k} did not persist across reload`);
}
await page.screenshot({ path: shot('persistence_after_reload'), fullPage: false });
console.log('Persisted:', JSON.stringify(report.persistence.persisted));

// --- UI wire checks on empty-ish panels: click Add on several domains ---
console.log('=== UI Add-button wire checks ===');
const uiProbePanels = ['guests','vendors','tasks','budget','payments','contracts','party','tables','appointments','gifts','notes','catering','ceremony','prayer','counseling','entertainment','shotlist','essentials','honeymoon','emails','packets','mood','timeline','contacts','households'];
report.actions.uiAddProbes = {};
for (const pid of uiProbePanels) {
  await tryShowPanel(page, pid);
  await page.waitForTimeout(350);
  const probe = await page.evaluate((id) => {
    const panel = document.getElementById('panel-' + id);
    if (!panel) return { exists: false };
    const addBtns = [...panel.querySelectorAll('button, a, .rd-link-quiet, [role="button"]')]
      .filter(el => {
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && /^(?:\+|Add|New|Create|Start|Import)/i.test(t);
      });
    const labels = addBtns.map(b => (b.textContent||'').replace(/\s+/g,' ').trim().slice(0,50));
    let drawerOpened = false;
    let rowAdded = false;
    const beforeRows = panel.querySelectorAll('tr, .rd-row, .list-row, [data-row-id]').length;
    if (addBtns[0]) {
      addBtns[0].click();
      // allow sync handlers
    }
    return { exists: true, labels, clicked: labels[0] || null, beforeRows };
  }, pid);
  await page.waitForTimeout(450);
  const after = await page.evaluate((id) => {
    const panel = document.getElementById('panel-' + id);
    const drawer = document.querySelector('.rd-drawer.open, .drawer.open, .record-drawer.open, .cov-drawer.open, [class*="drawer"].open, .rd-sheet.open');
    const modal = document.querySelector('.cov-modal-overlay.open, .modal-overlay.open, [role="dialog"]:not([hidden])');
    const afterRows = panel ? panel.querySelectorAll('tr, .rd-row, .list-row, [data-row-id]').length : 0;
    return {
      drawerOpen: !!(drawer && getComputedStyle(drawer).display !== 'none'),
      drawerText: drawer ? (drawer.innerText||'').replace(/\s+/g,' ').trim().slice(0,150) : '',
      modalOpen: !!(modal && getComputedStyle(modal).display !== 'none'),
      afterRows,
      emptyStill: panel ? !!(panel.querySelector('.rd-empty, .empty-state, .ued-empty')) : false
    };
  }, pid);
  const wired = !!(probe.clicked && (after.drawerOpen || after.modalOpen || after.afterRows > (probe.beforeRows || 0)));
  report.actions.uiAddProbes[pid] = { ...probe, ...after, wired };
  if (probe.labels && probe.labels.length && !wired) {
    report.summary.incomplete.push(`${pid}: Add CTA "${probe.clicked}" did not open drawer/modal or add row`);
  }
  if (!probe.labels || !probe.labels.length) {
    report.summary.emptyGaps.push(`${pid}: no visible Add/New CTA in empty-or-sparse state`);
  }
  // cleanup
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    document.querySelectorAll('.rd-drawer.open, .drawer.open, .cov-modal-overlay.open').forEach(el => {
      el.classList.remove('open'); el.style.display = 'none';
    });
    if (typeof closeRecordDrawer === 'function') try { closeRecordDrawer(); } catch {}
  });
}

// --- Full editor / drawers smoke ---
report.chrome.fullEditor = await page.evaluate(() => {
  const out = { hasOpenRecord: typeof openRecordDrawer === 'function' || typeof openRecordEditor === 'function' };
  try {
    if (data.guests && data.guests[0]) {
      const g = data.guests[0];
      if (typeof openRecordDrawer === 'function') openRecordDrawer('guests', g);
      else if (typeof editRecord === 'function') editRecord('guests', 0);
      else if (typeof openGuestDrawer === 'function') openGuestDrawer(g._id || 0);
    }
    const drawer = document.querySelector('.rd-drawer.open, .drawer.open, [class*="drawer"].open');
    out.opened = !!(drawer && getComputedStyle(drawer).display !== 'none');
    out.text = drawer ? (drawer.innerText||'').replace(/\s+/g,' ').trim().slice(0,300) : '';
  } catch (e) { out.error = String(e); }
  return out;
});
await page.screenshot({ path: shot('chrome_full_editor'), fullPage: false });
await page.keyboard.press('Escape');

// --- Dashboard empty-ish after data ---
await tryShowPanel(page, 'dashboard');
await page.waitForTimeout(500);
report.chrome.dashboardWithData = await panelInfo(page, 'dashboard');
await page.screenshot({ path: shot('dashboard_with_minimal_data'), fullPage: false });

// --- Vendor portal ---
console.log('=== Vendor portal ===');
const vp = await context.newPage();
vp.on('console', (msg) => { if (msg.type() === 'error') report.consoleErrors.push({ text: '[vp] ' + msg.text() }); });
vp.on('pageerror', (err) => report.pageErrors.push('[vp] ' + String(err)));
await vp.goto(`${BASE}/vendor-portal.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await vp.waitForTimeout(1000);
report.vendorPortal.noToken = await vp.evaluate(() => {
  return {
    title: document.title,
    text: (document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,500),
    hasApp: !!document.querySelector('#vp-app') && (document.querySelector('#vp-app').children.length > 0)
  };
});
await vp.screenshot({ path: shot('vendor_portal_no_token'), fullPage: false });

await vp.goto(`${BASE}/vendor-portal.html?expired=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await vp.waitForTimeout(800);
report.vendorPortal.expired = await vp.evaluate(() => ({
  text: (document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,400)
}));
await vp.screenshot({ path: shot('vendor_portal_expired'), fullPage: false });

await vp.goto(`${BASE}/vendor-portal.html?g=demo`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await vp.waitForTimeout(800);
report.vendorPortal.demoToken = await vp.evaluate(() => ({
  text: (document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,500),
  tabs: [...document.querySelectorAll('button, [role="tab"]')].map(b => (b.textContent||'').trim()).filter(Boolean).slice(0,12)
}));
await vp.screenshot({ path: shot('vendor_portal_demo'), fullPage: false });
await vp.close();

// Architecture snapshot from live page
report.architecture = await page.evaluate(() => {
  const out = {
    storageKey: typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : null,
    sqlite: typeof COVENANT_SQLITE !== 'undefined' ? {
      enabled: COVENANT_SQLITE.enabled,
      hasDb: !!COVENANT_SQLITE.db,
      profileId: COVENANT_SQLITE.profileId,
      tableCount: null
    } : null,
    blankKeys: typeof blankData === 'function' ? Object.keys(blankData()) : [],
    registry: typeof PLANNER_DATA_REGISTRY !== 'undefined' ? Object.keys(PLANNER_DATA_REGISTRY) : [],
    relationalKeys: typeof RELATIONAL_ARRAY_KEYS !== 'undefined' ? RELATIONAL_ARRAY_KEYS.slice() : [],
    authPresent: typeof login === 'function' || typeof signIn === 'function' || !!document.querySelector('[data-auth], #login'),
    profiles: typeof profiles !== 'undefined' ? profiles : null,
    activeProfile: typeof activeProfile !== 'undefined' ? activeProfile : null
  };
  try {
    if (COVENANT_SQLITE && COVENANT_SQLITE.db) {
      const r = COVENANT_SQLITE.db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
      out.sqlite.tables = r[0] ? r[0].values.map(v => v[0]) : [];
      out.sqlite.tableCount = out.sqlite.tables.length;
    }
  } catch (e) { out.sqliteError = String(e); }
  return out;
});

// SeedDefaults check — what does empty actually get?
report.seedDefaults = await page.evaluate(() => {
  // Re-clear conceptually: inspect what seedDefaults adds
  const d = data;
  return {
    note: 'Current session after our writes — for reference of non-empty arrays from seed',
    arrayLens: Object.fromEntries(Object.entries(d).filter(([,v]) => Array.isArray(v)).map(([k,v]) => [k, v.length])),
    setup: d.setup,
    onboard: d.onboard
  };
});

// Final empty-state re-test on FRESH context (true empty screenshots for a few panels)
console.log('=== Fresh empty screenshots (new context) ===');
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await p2.evaluate(async () => {
  localStorage.clear();
  try {
    await new Promise((res) => { const r = indexedDB.deleteDatabase('covenant_planner_db_v1'); r.onsuccess=r.onerror=r.onblocked=()=>res(); });
  } catch {}
});
await p2.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await p2.waitForFunction(() => typeof window.showPanel === 'function', { timeout: 90000 });
await p2.waitForTimeout(1500);
const emptyBoot2 = await p2.evaluate(() => ({
  guests: (data.guests||[]).length,
  vendors: (data.vendors||[]).length,
  budget: (data.budget||[]).length,
  tasks: (data.tasks||[]).length,
  plan: (data.plan||[]).length,
  essentials: (data.essentials||[]).length,
  emailTemplates: (data.emailTemplates||[]).length,
  setup: data.setup,
  onboard: data.onboard,
  overlays: [...document.querySelectorAll('.cov-modal-overlay.open, [role="dialog"]')].filter(el => getComputedStyle(el).display!=='none').map(el => (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,200))
}));
report.firstRun.freshEmptyBoot = emptyBoot2;
await p2.screenshot({ path: shot('fresh_empty_load'), fullPage: false });

// Dismiss and capture empty panels
await p2.evaluate(() => {
  if (typeof closeSetupWizard === 'function') try { closeSetupWizard(true); } catch {}
  document.querySelectorAll('.cov-modal-overlay, [role="dialog"]').forEach(el => { el.classList.remove('open'); el.style.display='none'; });
});

const emptyShotPanels = ['dashboard','guests','budget','vendors','tasks','calendar','tables','packets','emails','datahub','setup','honeymoon','mood','party'];
report.firstRun.emptyPanelSnaps = {};
for (const id of emptyShotPanels) {
  await p2.evaluate((pid) => { if (typeof showPanel==='function') showPanel(pid); }, id);
  await p2.waitForTimeout(500);
  const info = await p2.evaluate((pid) => {
    const panel = document.getElementById('panel-' + pid);
    return {
      text: panel ? (panel.innerText||'').replace(/\s+/g,' ').trim().slice(0,400) : null,
      empty: panel ? [...panel.querySelectorAll('.rd-empty,.empty-state,.ued-empty,[class*="empty"]')].map(e=>(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,150)) : [],
      ctas: panel ? [...panel.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0).map(b=>(b.textContent||'').replace(/\s+/g,' ').trim().slice(0,40)).filter(t=>/add|new|start|import|create|set/i.test(t)).slice(0,8) : []
    };
  }, id);
  report.firstRun.emptyPanelSnaps[id] = info;
  await p2.screenshot({ path: shot(`empty_${id}`), fullPage: false });
}
await ctx2.close();

report.finishedAt = new Date().toISOString();
report.consoleErrorCount = report.consoleErrors.length;
report.pageErrorCount = report.pageErrors.length;
// Dedupe console errors
const seen = new Set();
report.consoleErrorsDeduped = [];
for (const e of report.consoleErrors) {
  const k = e.text.slice(0, 160);
  if (seen.has(k)) continue;
  seen.add(k);
  report.consoleErrorsDeduped.push(e.text.slice(0, 300));
}

fs.writeFileSync(path.join(OUT, 'audit-report.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(TMP, 'audit-report.json'), JSON.stringify(report, null, 2));
console.log('=== DONE ===');
console.log('Panels walked:', Object.keys(report.panels).length);
console.log('Broken:', report.summary.broken.length);
console.log('Empty gaps:', report.summary.emptyGaps.length);
console.log('Incomplete:', report.summary.incomplete.length);
console.log('Persist fails:', report.summary.persistFails.length);
console.log('Console errors (deduped):', report.consoleErrorsDeduped.length);
console.log('Report:', path.join(OUT, 'audit-report.json'));

await browser.close();

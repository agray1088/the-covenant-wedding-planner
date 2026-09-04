import { chromium } from 'playwright';
import fs from 'fs';

const OUT = '/opt/cursor/artifacts/ship-audit';
const BASE = 'http://127.0.0.1:8000';
const follow = { findings: [], console404: [], persistenceGuest: {}, wizard: {}, seededInventory: {}, restore: {}, packetShare: {}, uiGuestAdd: {}, panelExtra: {}, blockingModals: [] };

const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const failedRequests = [];
page.on('requestfailed', r => failedRequests.push({ url: r.url(), err: r.failure()?.errorText }));
page.on('response', r => { if (r.status() === 404) follow.console404.push(r.url()); });
page.on('console', msg => { if (msg.type() === 'error') follow.findings.push('console: ' + msg.text()); });

async function wipe(p) {
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.evaluate(async () => {
    localStorage.clear();
    try { await new Promise(res => { const r = indexedDB.deleteDatabase('covenant_planner_db_v1'); r.onsuccess=r.onerror=r.onblocked=()=>res(); }); } catch {}
  });
}

async function dismissBlocking(p) {
  return p.evaluate(() => {
    const found = [];
    document.querySelectorAll('.cov-modal-overlay, .modal-overlay, [role="dialog"]').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return;
      const text = (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,200);
      const id = el.id || el.className;
      // Keep wizard for later inspection unless it's not wizard
      const isWizard = /wizard/i.test(el.id + el.className) || /3-Minute Setup|WELCOME/i.test(text);
      found.push({ id: String(id).slice(0,80), text, isWizard });
      if (!isWizard) {
        // click primary dismiss if present
        const btn = [...el.querySelectorAll('button')].find(b => /ok|got it|close|dismiss|understand|continue|skip/i.test(b.textContent||''));
        if (btn) btn.click();
        else { el.classList.remove('open','cov-modal-overlay--open'); el.style.display='none'; el.hidden=true; }
      }
    });
    return found;
  });
}

await wipe(page);
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => typeof showPanel === 'function', { timeout: 90000 });
await page.waitForTimeout(2500);

follow.blockingModals = await dismissBlocking(page);
await page.waitForTimeout(400);
follow.blockingModals2 = await dismissBlocking(page);

follow.seededInventory = await page.evaluate(() => {
  const d = data;
  const lens = {};
  for (const [k,v] of Object.entries(d)) if (Array.isArray(v) && v.length) lens[k] = v.length;
  return {
    lens,
    appointments: (d.appointments||[]).map(a => ({ title:a.title, vendor:a.vendor })),
    partySample: (d.party||[]).slice(0,8).map(p => ({ name:p.name, role:p.role })),
    tablesSample: (d.tables||[]).slice(0,8).map(t => ({ name:t.name, capacity:t.capacity||t.seats })),
    giftsSample: (d.gifts||[]).slice(0,5).map(g => ({ from:g.from, item:g.item||g.name })),
    notesSample: (d.notesDetails||[]).slice(0,5).map(n => n.title),
    prayerSample: (d.prayer||[]).slice(0,3).map(p => p.title || p.prompt || String(p.text||'').slice(0,50)),
    counselingSample: (d.counseling||[]).slice(0,3).map(c => c.title || c.topic || c.session),
    essentialsSample: (d.essentials||[]).slice(0,5).map(e => e.item || e.name),
    packetsLen: (d.packets||[]).length,
    packetsSample: (d.packets||[]).slice(0,3),
    counselor: d.setup?.counselor,
    theme: d.setup?.theme,
    simpleMode: d.setup?.simpleMode,
    hiddenPages: d.setup?.hiddenMenuPages,
    developerMode: document.body.classList.contains('developer-mode'),
    title: document.title,
    guestEvents: (d.guestEvents||[]).map(e => e.name || e.event || e.title)
  };
});

follow.wizard.step1 = await page.evaluate(() => {
  const overlay = document.getElementById('wizard-modal');
  return {
    open: overlay?.classList.contains('open'),
    hasSampleCta: /sample data/i.test(overlay?.innerText||''),
    buttons: [...(overlay?.querySelectorAll('button')||[])].map(b => (b.textContent||'').trim()).filter(Boolean)
  };
});
await page.screenshot({ path: OUT + '/wizard_step1.png', fullPage: false });

// Walk wizard via JS (avoid overlay interception)
follow.wizard.walk = await page.evaluate(() => {
  const out = { steps: [] };
  try {
    const inputs = [...document.querySelectorAll('#wizard-step1 input, .wizard-step.active input')];
    if (inputs[0]) { inputs[0].value = 'Sarah'; inputs[0].dispatchEvent(new Event('input',{bubbles:true})); }
    if (inputs[1]) { inputs[1].value = 'David'; inputs[1].dispatchEvent(new Event('input',{bubbles:true})); }
    if (typeof wizardGoStep === 'function') wizardGoStep(2);
    out.steps.push({ n:2, text: (document.querySelector('.wizard-step.active')?.innerText||'').replace(/\s+/g,' ').trim().slice(0,150) });
    if (typeof wizardGoStep === 'function') wizardGoStep(3);
    out.steps.push({ n:3, text: (document.querySelector('.wizard-step.active')?.innerText||'').replace(/\s+/g,' ').trim().slice(0,150) });
    if (typeof wizardGoStep === 'function') wizardGoStep(4);
    out.steps.push({ n:4, text: (document.querySelector('.wizard-step.active')?.innerText||'').replace(/\s+/g,' ').trim().slice(0,150) });
    if (typeof wizardGoStep === 'function') wizardGoStep(5);
    out.steps.push({ n:5, text: (document.querySelector('.wizard-step.active')?.innerText||'').replace(/\s+/g,' ').trim().slice(0,200) });
    out.brideAfter = data.setup?.bride;
    out.groomAfter = data.setup?.groom;
  } catch (e) { out.error = String(e); }
  return out;
});
await page.screenshot({ path: OUT + '/wizard_step_last.png', fullPage: false });

await page.evaluate(() => {
  if (typeof closeSetupWizard === 'function') closeSetupWizard(true);
  const w = document.getElementById('wizard-modal');
  if (w) { w.classList.remove('open'); w.style.display='none'; }
});
await dismissBlocking(page);

// Guest add: understand logAdd + use UI New guest properly
follow.uiGuestAdd.logAdd = await page.evaluate(() => {
  const src = typeof logAdd === 'function' ? Function.prototype.toString.call(logAdd).slice(0,800) : null;
  const before = data.guests.length;
  let result, err;
  try { result = logAdd('guests'); } catch (e) { err = String(e); }
  return { src, before, after: data.guests.length, result: result && typeof result === 'object' ? Object.keys(result) : result, err,
    first: data.guests[data.guests.length-1] };
});

await page.evaluate(() => showPanel('guests'));
await page.waitForTimeout(500);
// Click + New guest via JS to avoid overlays
follow.uiGuestAdd.clickNew = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('#panel-guests button')].find(b => /\+?\s*New guest/i.test(b.textContent||''));
  if (btn) btn.click();
  return { clicked: !!(btn), label: btn ? (btn.textContent||'').trim() : null };
});
await page.waitForTimeout(500);
follow.uiGuestAdd.afterNew = await page.evaluate(() => {
  const modal = [...document.querySelectorAll('.cov-modal-overlay, .modal-overlay, [role="dialog"]')].find(el => getComputedStyle(el).display !== 'none' && el.offsetParent !== null);
  const drawer = [...document.querySelectorAll('.rd-drawer, [class*="drawer"]')].find(el => el.classList.contains('open') || getComputedStyle(el).display !== 'none');
  return {
    guestCount: data.guests.length,
    lastGuest: data.guests[data.guests.length-1],
    modalText: modal ? (modal.innerText||'').replace(/\s+/g,' ').trim().slice(0,400) : null,
    drawerOpen: !!(drawer && (drawer.classList.contains('open') || (drawer.innerText||'').length > 40)),
    drawerText: drawer ? (drawer.innerText||'').replace(/\s+/g,' ').trim().slice(0,300) : null
  };
});
await page.screenshot({ path: OUT + '/guest_new_modal.png', fullPage: false });

// Force a named guest and save
follow.uiGuestAdd.forcePersist = await page.evaluate(() => {
  // Clear empty/blank guests from logAdd
  data.guests = (data.guests || []).filter(g => String(g.name||'').trim());
  data.guests.push({
    name: 'Persist Guest',
    side: 'Bride',
    rsvp: 'Pending',
    household: 'Persist House',
    meal: '',
    companions: [],
    invited: true,
    phone: '555-0199',
    email: 'persist@example.com'
  });
  if (typeof ensurePlannerRecordModel === 'function') ensurePlannerRecordModel();
  if (typeof ensureRelationalDataModel === 'function') ensureRelationalDataModel();
  if (typeof syncRelationshipIdsForRow === 'function') syncRelationshipIdsForRow('guests', data.guests[data.guests.length-1]);
  save();
  return {
    count: data.guests.length,
    names: data.guests.map(g => g.name),
    lsHas: (localStorage.getItem('covenant_planner_v1')||'').includes('Persist Guest'),
    id: data.guests.find(g => g.name === 'Persist Guest')?._id
  };
});

await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => typeof showPanel === 'function', { timeout: 90000 });
await page.waitForTimeout(2000);
await page.evaluate(() => { if (typeof closeSetupWizard==='function') try{closeSetupWizard(true)}catch{}; });
await dismissBlocking(page);

follow.persistenceGuest = await page.evaluate(() => {
  let sqliteCount = null, sqliteNames = [];
  try {
    if (COVENANT_SQLITE?.db) {
      const r = COVENANT_SQLITE.db.exec('SELECT name FROM guest');
      sqliteNames = r[0] ? r[0].values.map(v => v[0]) : [];
      sqliteCount = sqliteNames.length;
    }
  } catch (e) { sqliteCount = String(e); }
  return {
    guests: (data.guests||[]).map(g => g.name),
    lsHas: (localStorage.getItem('covenant_planner_v1')||'').includes('Persist Guest'),
    bride: data.setup?.bride,
    groom: data.setup?.groom,
    sqliteCount,
    sqliteNames
  };
});
await page.screenshot({ path: OUT + '/guest_after_reload.png', fullPage: false });

for (const id of ['print-centre', 'data-hub', 'vendor']) {
  await page.evaluate((pid) => { try { showPanel(pid); } catch(e) {} }, id);
  await page.waitForTimeout(600);
  follow.panelExtra[id] = await page.evaluate((pid) => {
    const panel = document.getElementById('panel-' + pid);
    return {
      exists: !!panel,
      visible: panel ? getComputedStyle(panel).display !== 'none' : false,
      text: panel ? (panel.innerText||'').replace(/\s+/g,' ').trim().slice(0,400) : null,
      ctas: panel ? [...panel.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0).map(b=>(b.textContent||'').replace(/\s+/g,' ').trim().slice(0,40)).filter(t=>/add|new|print|export|share|download|restore/i.test(t)).slice(0,12) : []
    };
  }, id);
  await page.screenshot({ path: OUT + `/extra_${id}.png`, fullPage: false });
}

follow.restore = await page.evaluate(() => {
  const names = Object.getOwnPropertyNames(window).filter(n => /restore|import.*[Ss]ql|loadBackup|uploadBackup|importSqlite/i.test(n));
  return {
    fnNames: names.slice(0, 25),
    restoreButtons: [...document.querySelectorAll('button')].filter(b => /restore/i.test(b.textContent||'')).slice(0,8).map(b => ({ text:(b.textContent||'').trim().slice(0,50), onclick: b.getAttribute('onclick') }))
  };
});

follow.packetShare = await page.evaluate(() => {
  if (typeof showPanel === 'function') showPanel('packets');
  const panel = document.getElementById('panel-packets');
  return {
    packetsLen: (data.packets||[]).length,
    packets: (data.packets||[]).slice(0,5),
    text: panel ? (panel.innerText||'').replace(/\s+/g,' ').trim().slice(0,500) : null,
    shareFns: Object.getOwnPropertyNames(window).filter(n => /packet|portal|shareVendor|vendorLink|vendorPortal/i.test(n)).slice(0,40)
  };
});
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '/packets_panel.png', fullPage: false });

follow.storageSize = await page.evaluate(() => {
  let total = 0; const keys = {};
  for (let i=0;i<localStorage.length;i++) {
    const k = localStorage.key(i); const v = localStorage.getItem(k)||'';
    keys[k]=v.length; total += k.length+v.length;
  }
  return { totalChars: total, approxKB: Math.round(total/1024), keys };
});

// Where do party/tables/gifts get seeded? Check flags
follow.seedFlags = await page.evaluate(() => ({
  appointmentsSeeded: data.appointmentsSeeded,
  notesSeeded: data.notesSeeded,
  ceremonySeeded: data.ceremonySeeded,
  phase3: data.setup?.phase3DefaultsApplied,
  onboarding: data.setup?.onboarding,
  bannerSeeded: data.bannerSeeded
}));

// Find seeder call sites by checking if ensureDefaultTables exists
follow.tableSeeder = await page.evaluate(() => {
  const fns = Object.getOwnPropertyNames(window).filter(n => /table|party|gift|prayer|essential|packet/i.test(n) && typeof window[n]==='function').filter(n => /seed|ensure|default|starter|init/i.test(n));
  return fns.slice(0, 50);
});

follow.failedRequests = [...new Set(failedRequests.map(f => f.url))].slice(0, 20);
follow.console404 = [...new Set(follow.console404)].slice(0, 30);

fs.writeFileSync(OUT + '/audit-followup.json', JSON.stringify(follow, null, 2));
console.log(JSON.stringify({
  blocking: follow.blockingModals,
  seededLens: follow.seededInventory.lens,
  appointments: follow.seededInventory.appointments,
  party: follow.seededInventory.partySample,
  tables: follow.seededInventory.tablesSample,
  gifts: follow.seededInventory.giftsSample,
  notes: follow.seededInventory.notesSample,
  counselor: follow.seededInventory.counselor,
  hiddenPages: follow.seededInventory.hiddenPages,
  developerMode: follow.seededInventory.developerMode,
  wizard: follow.wizard,
  logAddAfter: follow.uiGuestAdd.logAdd?.after,
  logAddFirst: follow.uiGuestAdd.logAdd?.first,
  guestNew: follow.uiGuestAdd.afterNew,
  forcePersist: follow.uiGuestAdd.forcePersist,
  persistGuest: follow.persistenceGuest,
  panels: Object.fromEntries(Object.entries(follow.panelExtra).map(([k,v]) => [k, {exists:v.exists, visible:v.visible, preview:(v.text||'').slice(0,100)}])),
  storageKB: follow.storageSize.approxKB,
  restore: follow.restore,
  packetsText: (follow.packetShare.text||'').slice(0,250),
  packetsLen: follow.packetShare.packetsLen,
  seedFlags: follow.seedFlags,
  tableSeeder: follow.tableSeeder,
  missing404: follow.console404
}, null, 2));

await browser.close();

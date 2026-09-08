#!/usr/bin/env node
/**
 * Smoke: optional cloud sync API (guests vertical).
 * Skips live API checks when server is down — still asserts scaffold files exist
 * and that the client bridge defaults to disabled (offline GA safe).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const issues = [];
function ok(label, cond) {
  if (!cond) issues.push(label);
}

ok('docs/OFFLINE_CLOUD_SYNC.md', fs.existsSync(path.join(root, 'docs/OFFLINE_CLOUD_SYNC.md')));
ok('server/index.js', fs.existsSync(path.join(root, 'server/index.js')));
ok('server/schema.sql', fs.existsSync(path.join(root, 'server/schema.sql')));
ok('docker-compose.yml', fs.existsSync(path.join(root, 'docker-compose.yml')));
ok('js/cloud-sync.js', fs.existsSync(path.join(root, 'js/cloud-sync.js')));
ok('server README', /Quick start/.test(read('server/README.md')));
ok('schema has guests', /CREATE TABLE IF NOT EXISTS guests/.test(read('server/schema.sql')));
ok('schema has vendors', /CREATE TABLE IF NOT EXISTS vendors/.test(read('server/schema.sql')));
ok('schema has payments', /CREATE TABLE IF NOT EXISTS payments/.test(read('server/schema.sql')));
ok('schema has budget_categories', /CREATE TABLE IF NOT EXISTS budget_categories/.test(read('server/schema.sql')));
ok('schema has seating_tables', /CREATE TABLE IF NOT EXISTS seating_tables/.test(read('server/schema.sql')));
ok('schema has contracts', /CREATE TABLE IF NOT EXISTS contracts/.test(read('server/schema.sql')));
ok('schema has timeline_events', /CREATE TABLE IF NOT EXISTS timeline_events/.test(read('server/schema.sql')));
ok('schema has sessions', /CREATE TABLE IF NOT EXISTS sessions/.test(read('server/schema.sql')));
ok('client default off', /enabledFlag && api/.test(read('js/cloud-sync.js')));
ok('client pushes vendors', /\/vendors\/bulk/.test(read('js/cloud-sync.js')));
ok('client pushes payments', /\/payments\/bulk/.test(read('js/cloud-sync.js')));
ok('client pushes budget', /\/budget\/bulk/.test(read('js/cloud-sync.js')));
ok('client pushes seating', /\/seating\/bulk/.test(read('js/cloud-sync.js')));
ok('client pushes contracts', /\/contracts\/bulk/.test(read('js/cloud-sync.js')));
ok('client pushes timeline', /\/timeline\/bulk/.test(read('js/cloud-sync.js')));
ok('vendors route file', fs.existsSync(path.join(root, 'server/routes/vendors.js')));
ok('payments route file', fs.existsSync(path.join(root, 'server/routes/payments.js')));
ok('budget route file', fs.existsSync(path.join(root, 'server/routes/budget.js')));
ok('seating route file', fs.existsSync(path.join(root, 'server/routes/seating.js')));
ok('contracts route file', fs.existsSync(path.join(root, 'server/routes/contracts.js')));
ok('timeline route file', fs.existsSync(path.join(root, 'server/routes/timeline.js')));
ok('honest beta label', /Cloud sync \(beta\)/.test(read('js/settings-window-redesign.js')));
ok('settings mentions timeline', /guests \+ vendors \+ payments \+ budget \+ seating \+ contracts \+ timeline/.test(read('js/settings-window-redesign.js')));

const API = process.env.COVENANT_CLOUD_API || 'http://127.0.0.1:8787';

async function live() {
  let health;
  try {
    const res = await fetch(API + '/health');
    health = await res.json();
  } catch (e) {
    console.log('cloud-sync smoke: API not reachable at ' + API + ' — scaffold checks only.');
    return;
  }
  ok('health ok', health && health.ok === true);

  const email = 'smoke_' + Date.now() + '@covenant.local';
  const password = 'smoke-test-password';
  const reg = await fetch(API + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: 'Smoke' })
  }).then((r) => r.json());
  ok('register returns token', !!(reg && reg.token));
  const token = reg.token;
  const auth = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

  const wed = await fetch(API + '/weddings', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      name: 'Smoke Wedding',
      bride: 'Ada',
      groom: 'Alan',
      clientKey: 'smoke:' + Date.now()
    })
  }).then((r) => r.json());
  ok('wedding created', !!(wed && wed.wedding && wed.wedding.id));
  const weddingId = wed.wedding.id;

  const guestId = 'g_smoke_' + Date.now();
  const put = await fetch(API + '/weddings/' + weddingId + '/guests/' + guestId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({
      id: guestId,
      name: 'Offline Guest',
      household: 'Test',
      group: 'Friends',
      rsvp: 'Pending',
      updatedAt: new Date().toISOString()
    })
  }).then((r) => r.json());
  ok('guest upsert ack', put && put.ack === true && put.guest && put.guest.name === 'Offline Guest');

  const list = await fetch(API + '/weddings/' + weddingId + '/guests', { headers: auth })
    .then((r) => r.json());
  ok('guest appears in list', Array.isArray(list.guests) && list.guests.some((g) => g.id === guestId));

  const vendorId = 'v_smoke_' + Date.now();
  const putVendor = await fetch(API + '/weddings/' + weddingId + '/vendors/' + vendorId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({
      id: vendorId,
      name: 'Smoke Photography',
      cat: 'Photography',
      contact: 'Studio',
      quote: 1000,
      deposit: 250,
      balance: 750,
      status: 'Booked',
      contract: true,
      updatedAt: new Date().toISOString()
    })
  }).then((r) => r.json());
  ok('vendor upsert ack', putVendor && putVendor.ack === true && putVendor.vendor && putVendor.vendor.name === 'Smoke Photography');

  const vlist = await fetch(API + '/weddings/' + weddingId + '/vendors', { headers: auth })
    .then((r) => r.json());
  ok('vendor appears in list', Array.isArray(vlist.vendors) && vlist.vendors.some((v) => v.id === vendorId));

  const paymentId = 'p_smoke_' + Date.now();
  const putPayment = await fetch(API + '/weddings/' + weddingId + '/payments/' + paymentId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({
      id: paymentId,
      vendor: 'Smoke Photography',
      desc: 'Smoke deposit',
      due: 250,
      paid: 250,
      status: 'Paid',
      ptype: 'Zelle',
      date: '2026-05-01',
      installments: [
        { label: 'Deposit', amountDue: 250, amountPaid: 250, status: 'Paid', dueDate: '2026-05-01' }
      ],
      updatedAt: new Date().toISOString()
    })
  }).then((r) => r.json());
  ok('payment upsert ack', putPayment && putPayment.ack === true && putPayment.payment && putPayment.payment.desc === 'Smoke deposit');
  ok('payment installments round-trip', putPayment && putPayment.payment && Array.isArray(putPayment.payment.installments) && putPayment.payment.installments.length === 1);

  const plist = await fetch(API + '/weddings/' + weddingId + '/payments', { headers: auth })
    .then((r) => r.json());
  ok('payment appears in list', Array.isArray(plist.payments) && plist.payments.some((p) => p.id === paymentId));

  const budgetId = 'bc_smoke_' + Date.now();
  const putBudget = await fetch(API + '/weddings/' + weddingId + '/budget/' + budgetId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({
      id: budgetId,
      cat: 'Smoke Florals',
      target: 10,
      planned: 2000,
      tip: 'Smoke tip',
      items: [
        { name: 'Bouquet', budgeted: 500, actual: 100, status: 'Partial', paid: false, due: '2026-05-01' }
      ],
      updatedAt: new Date().toISOString()
    })
  }).then((r) => r.json());
  ok('budget upsert ack', putBudget && putBudget.ack === true && putBudget.category && putBudget.category.cat === 'Smoke Florals');
  ok('budget items round-trip', putBudget && putBudget.category && Array.isArray(putBudget.category.items) && putBudget.category.items.length === 1);

  const blist = await fetch(API + '/weddings/' + weddingId + '/budget', { headers: auth })
    .then((r) => r.json());
  ok('budget appears in list', Array.isArray(blist.budget) && blist.budget.some((c) => c.id === budgetId));

  const seatingId = 'tbl_smoke_' + Date.now();
  const putSeating = await fetch(API + '/weddings/' + weddingId + '/seating/' + seatingId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({
      id: seatingId,
      name: 'Smoke Table 7',
      capacity: 8,
      type: 'guest',
      shape: 'circle',
      placement: 'Near windows',
      x: 120,
      y: 80,
      updatedAt: new Date().toISOString()
    })
  }).then((r) => r.json());
  ok('seating upsert ack', putSeating && putSeating.ack === true && putSeating.table && putSeating.table.name === 'Smoke Table 7');
  ok('seating layout round-trip', putSeating && putSeating.table && putSeating.table.x === 120 && putSeating.table.y === 80);

  const bulkSeating = await fetch(API + '/weddings/' + weddingId + '/seating/bulk', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      tables: [],
      floorFixtures: {
        dance: { x: 200, y: 300, w: 180, h: 70, label: 'Dance Floor' }
      },
      floorFixturesUpdatedAt: new Date().toISOString()
    })
  }).then((r) => r.json());
  ok('floor fixtures ack', bulkSeating && bulkSeating.floorFixturesAck === true && bulkSeating.floorFixtures && bulkSeating.floorFixtures.dance);

  const slist = await fetch(API + '/weddings/' + weddingId + '/seating', { headers: auth })
    .then((r) => r.json());
  ok('seating appears in list', Array.isArray(slist.tables) && slist.tables.some((c) => c.id === seatingId));
  ok('floor fixtures in list', slist.floorFixtures && slist.floorFixtures.dance);

  const contractId = 'con_smoke_' + Date.now();
  const putContract = await fetch(API + '/weddings/' + weddingId + '/contracts/' + contractId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({
      id: contractId,
      name: 'Smoke venue agreement',
      vendor: 'Smoke Hall',
      type: 'Contract',
      date: '2026-05-01',
      amount: 2500,
      total: 2500,
      deposit: 500,
      status: 'Signed',
      where: 'Drive',
      contractFile: { name: 'smoke.pdf', type: 'application/pdf' },
      notes: 'Smoke contract',
      updatedAt: new Date().toISOString()
    })
  }).then((r) => r.json());
  ok('contract upsert ack', putContract && putContract.ack === true && putContract.contract && putContract.contract.name === 'Smoke venue agreement');
  ok('contract file metadata round-trip', putContract && putContract.contract && putContract.contract.contractFile && putContract.contract.contractFile.name === 'smoke.pdf');

  const clist = await fetch(API + '/weddings/' + weddingId + '/contracts', { headers: auth })
    .then((r) => r.json());
  ok('contract appears in list', Array.isArray(clist.contracts) && clist.contracts.some((c) => c.id === contractId));

  const timelineId = 'wdy_smoke_' + Date.now();
  const putTimeline = await fetch(API + '/weddings/' + weddingId + '/timeline/' + timelineId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({
      id: timelineId,
      time: '16:00',
      event: 'Smoke ceremony starts',
      location: 'Sanctuary',
      responsible: 'Officiant',
      duration: '45 min',
      notes: 'Smoke timeline',
      date: '2026-06-06',
      status: 'Confirmed',
      description: 'Smoke meta',
      updatedAt: new Date().toISOString()
    })
  }).then((r) => r.json());
  ok('timeline upsert ack', putTimeline && putTimeline.ack === true && putTimeline.event && putTimeline.event.event === 'Smoke ceremony starts');
  ok('timeline meta round-trip', putTimeline && putTimeline.event && putTimeline.event.description === 'Smoke meta');

  const tlist = await fetch(API + '/weddings/' + weddingId + '/timeline', { headers: auth })
    .then((r) => r.json());
  ok('timeline appears in list', Array.isArray(tlist.timeline) && tlist.timeline.some((e) => e.id === timelineId));

  // Second context: login again and fetch
  const login = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then((r) => r.json());
  ok('second login', !!(login && login.token));
  const list2 = await fetch(API + '/weddings/' + weddingId + '/guests', {
    headers: { Authorization: 'Bearer ' + login.token }
  }).then((r) => r.json());
  ok('second context sees guest', Array.isArray(list2.guests) && list2.guests.some((g) => g.id === guestId));
  const vlist2 = await fetch(API + '/weddings/' + weddingId + '/vendors', {
    headers: { Authorization: 'Bearer ' + login.token }
  }).then((r) => r.json());
  ok('second context sees vendor', Array.isArray(vlist2.vendors) && vlist2.vendors.some((v) => v.id === vendorId));
  const plist2 = await fetch(API + '/weddings/' + weddingId + '/payments', {
    headers: { Authorization: 'Bearer ' + login.token }
  }).then((r) => r.json());
  ok('second context sees payment', Array.isArray(plist2.payments) && plist2.payments.some((p) => p.id === paymentId));
  const blist2 = await fetch(API + '/weddings/' + weddingId + '/budget', {
    headers: { Authorization: 'Bearer ' + login.token }
  }).then((r) => r.json());
  ok('second context sees budget', Array.isArray(blist2.budget) && blist2.budget.some((c) => c.id === budgetId));
  const slist2 = await fetch(API + '/weddings/' + weddingId + '/seating', {
    headers: { Authorization: 'Bearer ' + login.token }
  }).then((r) => r.json());
  ok('second context sees seating', Array.isArray(slist2.tables) && slist2.tables.some((c) => c.id === seatingId));
  const clist2 = await fetch(API + '/weddings/' + weddingId + '/contracts', {
    headers: { Authorization: 'Bearer ' + login.token }
  }).then((r) => r.json());
  ok('second context sees contract', Array.isArray(clist2.contracts) && clist2.contracts.some((c) => c.id === contractId));
  const tlist2 = await fetch(API + '/weddings/' + weddingId + '/timeline', {
    headers: { Authorization: 'Bearer ' + login.token }
  }).then((r) => r.json());
  ok('second context sees timeline', Array.isArray(tlist2.timeline) && tlist2.timeline.some((e) => e.id === timelineId));
}

await live();

if (issues.length) {
  console.error('cloud-sync smoke FAILED:');
  issues.forEach((i) => console.error(' -', i));
  process.exit(1);
}
console.log('cloud-sync smoke ok');

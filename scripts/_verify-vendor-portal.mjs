#!/usr/bin/env node
/**
 * Verify vendor portal tokens (create → public GET → revoke → rotate).
 * Scaffold checks + live API against demo account when reachable.
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

ok('docs/VENDOR_PORTAL.md', fs.existsSync(path.join(root, 'docs/VENDOR_PORTAL.md')));
ok('roadmap mentions VENDOR_PORTAL', /VENDOR_PORTAL\.md/.test(read('docs/PRODUCT_ROADMAP.md')));
ok('schema vendor_portal_tokens', /CREATE TABLE IF NOT EXISTS vendor_portal_tokens/.test(read('server/schema.sql')));
ok('schema vendor_portal email kind', /vendor_portal/.test(read('server/schema.sql')));
ok('vendor-portal routes', fs.existsSync(path.join(root, 'server/routes/vendor-portal.js')));
ok('index mounts vendor portal', /vendorPortalPublicRoutes|vendorPortalRoutes/.test(read('server/index.js')));
ok('feature vendorTokens default on', /vendorTokens:\s*flagDefaultOn\('FEATURE_VENDOR_TOKENS'\)/.test(read('server/index.js')));
ok('client createVendorPortalToken', /createVendorPortalToken/.test(read('js/cloud-sync.js')));
ok('client listVendorPortalTokens', /listVendorPortalTokens/.test(read('js/cloud-sync.js')));
ok('client revokeVendorPortalToken', /revokeVendorPortalToken/.test(read('js/cloud-sync.js')));
ok('client rotateVendorPortalToken', /rotateVendorPortalToken/.test(read('js/cloud-sync.js')));
ok('settings vendors-portal pane', /id: 'vendors-portal'/.test(read('js/settings-window-redesign.js')));
ok('settings Vendor portal label', /Vendor portal/.test(read('js/settings-window-redesign.js')));
ok('vendor-portal.js fetchCloudSession', /fetchCloudSession/.test(read('js/vendor-portal.js')));
ok('package verify:vendor-portal', /verify:vendor-portal/.test(read('package.json')));

const API = process.env.COVENANT_CLOUD_API || 'http://127.0.0.1:18787';
const DEMO_EMAIL = process.env.COVENANT_DEMO_EMAIL || 'demo@covenant.local';
const DEMO_PASS = process.env.COVENANT_DEMO_PASSWORD || 'covenant-demo';

async function live() {
  let health;
  try {
    const res = await fetch(API + '/health');
    health = await res.json();
  } catch {
    console.log('vendor-portal verify: API not reachable at ' + API + ' — scaffold checks only.');
    return;
  }
  ok('health ok', health && health.ok === true && health.db === 'up');
  ok('feature vendorTokens on', health.features && health.features.vendorTokens === true);

  const login = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASS })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('demo login', login.status === 200 && !!login.body.token);
  if (!login.body.token) return;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + login.body.token
  };

  const stamp = Date.now().toString(36);
  const wedding = await fetch(API + '/weddings', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Vendor Portal Verify ' + stamp,
      bride: 'Ama',
      groom: 'Kwesi',
      weddingDate: '2027-11-08',
      clientKey: 'verify-vp-' + stamp
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('create wedding', (wedding.status === 200 || wedding.status === 201) && wedding.body.wedding);
  const weddingId = wedding.body.wedding && wedding.body.wedding.id;
  if (!weddingId) return;

  const vendorId = 'v-portal-' + stamp;
  const upsert = await fetch(
    API + '/weddings/' + encodeURIComponent(weddingId) + '/vendors/' + encodeURIComponent(vendorId),
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        id: vendorId,
        name: 'Adom Catering',
        category: 'Catering',
        email: 'vendor-' + stamp + '@covenant.local',
        quote: 12780,
        deposit: 3000,
        balance: 9780,
        updatedAt: new Date().toISOString()
      })
    }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('upsert vendor', upsert.status === 200 || upsert.status === 201);

  const created = await fetch(
    API + '/weddings/' + encodeURIComponent(weddingId) + '/vendor-portal/tokens',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vendorId,
        label: 'Day-of verify',
        sendEmail: true
      })
    }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('create token', created.status === 201 && created.body.portalUrl);
  ok('portal url shape', /\/vendor\/portal\//.test(created.body.portalUrl || ''));
  ok(
    'email skip or send',
    created.body.email
      && (created.body.email.sent === true
        || created.body.email.smtpConfigured === false
        || created.body.email.sent === false
        || created.body.email.error === 'no_email')
  );
  const tokenId = created.body.token && created.body.token.id;
  const rawToken = created.body.token && created.body.token.token;
  ok('token id returned', !!tokenId);
  ok('raw token returned', !!rawToken && String(rawToken).length >= 16);

  const listed = await fetch(
    API + '/weddings/' + encodeURIComponent(weddingId) + '/vendor-portal/tokens',
    { headers }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok(
    'list tokens',
    listed.status === 200 && (listed.body.tokens || []).some((t) => t.id === tokenId)
  );

  const publicGet = await fetch(
    API + '/vendor/portal/' + encodeURIComponent(rawToken) + '?format=json',
    { headers: { Accept: 'application/json' } }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('public packet ok', publicGet.status === 200 && publicGet.body.ok === true);
  ok('packet scoped vendor', publicGet.body.vendor && publicGet.body.vendor.name === 'Adom Catering');
  ok('packet has wedding', publicGet.body.wedding && /Ama/.test(publicGet.body.wedding.coupleNames || ''));
  ok('no guest names field dump', publicGet.body.privacy && publicGet.body.privacy.guestNames === false);
  ok('counts without identities', publicGet.body.counts && typeof publicGet.body.counts.covers === 'number');

  const bad = await fetch(API + '/vendor/portal/not-a-real-token-zzzzzzzzzzzz', {
    headers: { Accept: 'application/json' }
  }).then(async (r) => ({ status: r.status }));
  ok('unknown token 404', bad.status === 404);

  const rotated = await fetch(
    API
      + '/weddings/'
      + encodeURIComponent(weddingId)
      + '/vendor-portal/tokens/'
      + encodeURIComponent(tokenId)
      + '/rotate',
    { method: 'POST', headers, body: '{}' }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('rotate ok', rotated.status === 200 && rotated.body.portalUrl);
  const newToken = rotated.body.token && rotated.body.token.token;
  ok('new token different', !!newToken && newToken !== rawToken);

  const oldDead = await fetch(
    API + '/vendor/portal/' + encodeURIComponent(rawToken) + '?format=json',
    { headers: { Accept: 'application/json' } }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('old token revoked', oldDead.status === 410 || oldDead.body.status === 'revoked');

  const newLive = await fetch(
    API + '/vendor/portal/' + encodeURIComponent(newToken) + '?format=json',
    { headers: { Accept: 'application/json' } }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('new token live', newLive.status === 200 && newLive.body.ok === true);

  const newId = rotated.body.token && rotated.body.token.id;
  const revoke = await fetch(
    API
      + '/weddings/'
      + encodeURIComponent(weddingId)
      + '/vendor-portal/tokens/'
      + encodeURIComponent(newId)
      + '/revoke',
    { method: 'POST', headers, body: '{}' }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('revoke ok', revoke.status === 200 && revoke.body.token && revoke.body.token.status === 'revoked');

  const afterRevoke = await fetch(
    API + '/vendor/portal/' + encodeURIComponent(newToken) + '?format=json',
    { headers: { Accept: 'application/json' } }
  ).then(async (r) => ({ status: r.status }));
  ok('revoked blocked', afterRevoke.status === 410);
}

await live();

if (issues.length) {
  console.error('verify:vendor-portal FAILED');
  issues.forEach((i) => console.error(' - ' + i));
  process.exit(1);
}
console.log('verify:vendor-portal OK');

#!/usr/bin/env node
/**
 * Verify partner invites (create → pending → accept → members → revoke).
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

ok('docs/PARTNER_INVITES.md', fs.existsSync(path.join(root, 'docs/PARTNER_INVITES.md')));
ok('roadmap mentions PARTNER_INVITES', /PARTNER_INVITES\.md/.test(read('docs/PRODUCT_ROADMAP.md')));
ok('schema memberships status', /status.*pending.*accepted.*revoked|pending.*accepted.*revoked/.test(read('server/schema.sql')));
ok('schema invite_token_hash', /invite_token_hash/.test(read('server/schema.sql')));
ok('schema invited_email', /invited_email/.test(read('server/schema.sql')));
ok('schema partner_invite kind', /partner_invite/.test(read('server/schema.sql')));
ok('invites routes', fs.existsSync(path.join(root, 'server/routes/invites.js')));
ok('index mounts invites', /invitePublicRoutes|weddingInviteRoutes/.test(read('server/index.js')));
ok('invite page html', /invitePageHtml/.test(read('server/lib/guest-pages.js')));
ok('client createInvite', /createInvite/.test(read('js/cloud-sync.js')));
ok('client pendingInvites', /pendingInvites/.test(read('js/cloud-sync.js')));
ok('client acceptInvite', /acceptInvite/.test(read('js/cloud-sync.js')));
ok('settings partners pane', /id: 'partners'/.test(read('js/settings-window-redesign.js')));
ok('settings Partner invites', /Partner invites/.test(read('js/settings-window-redesign.js')));
ok('package verify:partner-invite', /verify:partner-invite/.test(read('package.json')));

const API = process.env.COVENANT_CLOUD_API || 'http://127.0.0.1:18787';
const DEMO_EMAIL = process.env.COVENANT_DEMO_EMAIL || 'demo@covenant.local';
const DEMO_PASS = process.env.COVENANT_DEMO_PASSWORD || 'covenant-demo';

async function live() {
  let health;
  try {
    const res = await fetch(API + '/health');
    health = await res.json();
  } catch {
    console.log('partner-invite verify: API not reachable at ' + API + ' — scaffold checks only.');
    return;
  }
  ok('health ok', health && health.ok === true && health.db === 'up');
  ok('feature partnerInvites on', health.features && health.features.partnerInvites === true);

  const ownerLogin = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASS })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('demo login', ownerLogin.status === 200 && !!ownerLogin.body.token);
  if (!ownerLogin.body.token) return;

  const ownerHeaders = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + ownerLogin.body.token
  };

  const stamp = Date.now().toString(36);
  const partnerEmail = `partner-${stamp}@covenant.local`;
  const partnerUser = 'partner_' + stamp.slice(-8);
  const partnerPass = 'covenant-partner-1';

  const reg = await fetch(API + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: partnerEmail,
      password: partnerPass,
      username: partnerUser,
      displayName: 'Verify Partner'
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('partner register', (reg.status === 200 || reg.status === 201) && !!reg.body.token);
  const partnerToken = reg.body.token;
  if (!partnerToken) return;

  const wedding = await fetch(API + '/weddings', {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({
      name: 'Partner Invite Verify ' + stamp,
      bride: 'Alex',
      groom: 'Jordan',
      weddingDate: '2027-09-18',
      clientKey: 'verify-partner-' + stamp
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('create wedding', (wedding.status === 200 || wedding.status === 201) && wedding.body.wedding);
  const weddingId = wedding.body.wedding && wedding.body.wedding.id;
  if (!weddingId) return;

  const invite = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/invites', {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({
      email: partnerEmail,
      username: partnerUser,
      role: 'partner',
      sendEmail: true
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('create invite', invite.status === 201 && invite.body.inviteUrl);
  ok('invite url shape', /\/invite\//.test(invite.body.inviteUrl || ''));
  ok(
    'email skip or send',
    invite.body.email
      && (invite.body.email.sent === true
        || invite.body.email.smtpConfigured === false
        || invite.body.email.sent === false)
  );
  const inviteToken = invite.body.invite && invite.body.invite.inviteToken;
  const inviteId = invite.body.invite && invite.body.invite.id;
  ok('invite token returned', !!inviteToken);
  ok('invite id returned', !!inviteId);

  const pendingList = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/invites', {
    headers: ownerHeaders
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('list pending', pendingList.status === 200 && (pendingList.body.invites || []).some((i) => i.id === inviteId));

  const inbox = await fetch(API + '/invites/pending', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + partnerToken
    }
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('partner inbox', inbox.status === 200 && (inbox.body.invites || []).some((i) => i.id === inviteId));

  const preview = await fetch(API + '/invite/' + encodeURIComponent(inviteToken) + '?format=json', {
    headers: { Accept: 'application/json' }
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('invite preview', preview.status === 200 && preview.body.role === 'partner');

  const accept = await fetch(API + '/invites/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + partnerToken
    },
    body: JSON.stringify({ token: inviteToken })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('accept invite', accept.status === 200 && accept.body.ok === true && accept.body.weddingId === weddingId);

  const members = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/members', {
    headers: ownerHeaders
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('members include partner', members.status === 200
    && (members.body.members || []).some((m) => m.role === 'partner' && m.status === 'accepted'));

  const partnerHeaders = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + partnerToken
  };
  const partnerGet = await fetch(API + '/weddings/' + encodeURIComponent(weddingId), {
    headers: partnerHeaders
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('partner can access wedding', partnerGet.status === 200 && partnerGet.body.role === 'partner');

  const guestId = 'g-partner-' + stamp;
  const upsert = await fetch(
    API + '/weddings/' + encodeURIComponent(weddingId) + '/guests/' + encodeURIComponent(guestId),
    {
      method: 'PUT',
      headers: partnerHeaders,
      body: JSON.stringify({
        id: guestId,
        name: 'Partner Edited Guest',
        updatedAt: new Date().toISOString()
      })
    }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('partner can edit guests', upsert.status === 200 || upsert.status === 201);

  const ownerMem = (members.body.members || []).find((m) => m.role === 'owner');
  if (ownerMem) {
    const revokeOwner = await fetch(
      API + '/weddings/' + encodeURIComponent(weddingId) + '/invites/' + encodeURIComponent(ownerMem.id) + '/revoke',
      { method: 'POST', headers: partnerHeaders, body: '{}' }
    ).then(async (r) => ({ status: r.status, body: await r.json() }));
    ok('partner cannot revoke owner', revokeOwner.status === 403);
  }

  const partnerMem = (members.body.members || []).find((m) => m.role === 'partner');
  const revokePartner = await fetch(
    API + '/weddings/' + encodeURIComponent(weddingId) + '/invites/' + encodeURIComponent(partnerMem.id) + '/revoke',
    { method: 'POST', headers: ownerHeaders, body: '{}' }
  ).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('owner can revoke partner', revokePartner.status === 200 && revokePartner.body.invite
    && revokePartner.body.invite.status === 'revoked');

  const after = await fetch(API + '/weddings/' + encodeURIComponent(weddingId), {
    headers: partnerHeaders
  }).then(async (r) => ({ status: r.status }));
  ok('revoked partner blocked', after.status === 403);
}

await live();

if (issues.length) {
  console.error('verify:partner-invite FAILED');
  issues.forEach((i) => console.error(' - ' + i));
  process.exit(1);
}
console.log('verify:partner-invite OK');

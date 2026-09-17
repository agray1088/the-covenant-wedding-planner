#!/usr/bin/env node
/**
 * Auth foundation verify (roadmap step 2).
 * Live checks against COVENANT_CLOUD_API (default http://127.0.0.1:18787).
 * Skips live section when API is down — still asserts scaffold files.
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

ok('docs/AUTH.md', fs.existsSync(path.join(root, 'docs/AUTH.md')));
ok('auth routes', /forgot-password/.test(read('server/routes/auth.js')));
ok('google oauth lib', fs.existsSync(path.join(root, 'server/lib/google-oauth.js')));
ok('mail lib', fs.existsSync(path.join(root, 'server/lib/mail.js')));
ok('schema username', /username/.test(read('server/schema.sql')));
ok('schema google_sub', /google_sub/.test(read('server/schema.sql')));
ok('schema auth_tokens', /CREATE TABLE IF NOT EXISTS auth_tokens/.test(read('server/schema.sql')));
ok('client forgotPassword', /forgotPassword/.test(read('js/cloud-sync.js')));
ok('client googleSignIn', /startGoogleSignIn/.test(read('js/cloud-sync.js')));
ok('settings Google button', /rdCloudGoogle/.test(read('js/settings-window-redesign.js')));
ok('settings forgot password', /rdCloudForgotPassword/.test(read('js/settings-window-redesign.js')));
ok('roadmap mentions AUTH', /AUTH\.md/.test(read('docs/PRODUCT_ROADMAP.md')));

const API = process.env.COVENANT_CLOUD_API || 'http://127.0.0.1:18787';
const DEMO_EMAIL = process.env.COVENANT_DEMO_EMAIL || 'demo@covenant.local';
const DEMO_USER = process.env.COVENANT_DEMO_USERNAME || 'demo';
const DEMO_PASS = process.env.COVENANT_DEMO_PASSWORD || 'covenant-demo';

async function live() {
  let health;
  try {
    const res = await fetch(API + '/health');
    health = await res.json();
  } catch (e) {
    console.log('auth verify: API not reachable at ' + API + ' — scaffold checks only.');
    return;
  }
  ok('health ok', health && health.ok === true && health.db === 'up');

  const cfgRes = await fetch(API + '/auth/config');
  const cfg = await cfgRes.json();
  ok('auth config', cfgRes.ok && cfg && cfg.auth && cfg.auth.password === true);

  const loginEmail = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASS })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('demo email login', loginEmail.status === 200 && !!loginEmail.body.token);

  const loginUser = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: DEMO_USER, password: DEMO_PASS })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('demo username login', loginUser.status === 200 && !!loginUser.body.token);

  const me = await fetch(API + '/auth/me', {
    headers: { Authorization: 'Bearer ' + loginEmail.body.token }
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('me', me.status === 200 && me.body.user && me.body.user.email === DEMO_EMAIL);

  const stamp = Date.now().toString(36);
  const regEmail = `test-${stamp}@covenant.local`;
  const regUser = `u_${stamp}`.slice(0, 32);
  const reg = await fetch(API + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: regEmail,
      password: 'test-pass-12',
      username: regUser,
      displayName: 'Verify User'
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('register', reg.status === 201 && !!reg.body.token && reg.body.user && reg.body.user.username === regUser);

  const relogin = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: regUser, password: 'test-pass-12' })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('login new username', relogin.status === 200 && !!relogin.body.token);

  const forgot = await fetch(API + '/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: regEmail })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  if (cfg.auth && cfg.auth.email && cfg.auth.email.configured) {
    ok('forgot-password with SMTP', forgot.status === 200 && forgot.body.ok === true);
  } else {
    ok('forgot-password smtp_not_configured', forgot.status === 503
      && forgot.body.error === 'smtp_not_configured');
  }

  const forgotUser = await fetch(API + '/auth/forgot-username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: regEmail })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  if (cfg.auth && cfg.auth.email && cfg.auth.email.configured) {
    ok('forgot-username with SMTP', forgotUser.status === 200 && forgotUser.body.ok === true);
  } else {
    ok('forgot-username smtp_not_configured', forgotUser.status === 503
      && forgotUser.body.error === 'smtp_not_configured');
  }

  const google = await fetch(API + '/auth/google', { redirect: 'manual' });
  if (cfg.auth && cfg.auth.google && cfg.auth.google.configured) {
    ok('google start redirect', google.status === 302 || google.status === 301);
  } else {
    const gBody = await google.json().catch(() => ({}));
    ok('google not configured', google.status === 503 && gBody.error === 'google_not_configured');
  }

  await fetch(API + '/auth/logout', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + loginEmail.body.token }
  });
}

await live();

if (issues.length) {
  console.error('auth verify FAILED:');
  issues.forEach((i) => console.error(' -', i));
  process.exit(1);
}
console.log('auth verify ok');

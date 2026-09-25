#!/usr/bin/env node
/**
 * Hosted secrets checklist verify (polish #1).
 * Scaffold checks always; live API checks when COVENANT_CLOUD_API is up.
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

const indexJs = read('server/index.js');
const settingsJs = read('js/settings-window-redesign.js');
const cloudJs = read('js/cloud-sync.js');

ok('setup/status route', /app\.get\(['"]\/setup\/status['"]/.test(indexJs));
ok('setupStatusPayload', /function setupStatusPayload/.test(indexJs));
ok('setup payload uses googleConfigured()', /googleConfigured:\s*google/.test(indexJs)
  || /googleConfigured:\s*googleConfigured\(\)/.test(indexJs));
ok('client fetchSetupStatus', /fetchSetupStatus/.test(cloudJs));
ok('settings Hosted setup checklist', /Hosted setup checklist/.test(settingsJs));
ok('settings rdHostedSetupRefresh', /rdHostedSetupRefresh/.test(settingsJs));
ok('settings hydrateHostedSetup', /hydrateHostedSetup/.test(settingsJs));
ok('settings disables Google when missing', /googleConfigured/.test(settingsJs)
  && /rdCloudGoogle/.test(settingsJs));
ok('settings disables RSVP send when SMTP missing', /rdRsvpSend/.test(settingsJs)
  && /smtpConfigured/.test(settingsJs));
ok('docs AUTH setup/status', /\/setup\/status/.test(read('docs/AUTH.md')));
ok('docs HOSTED_DEPLOY setup/status', /\/setup\/status/.test(read('docs/HOSTED_DEPLOY.md')));
ok('docs PRODUCT_ROADMAP checklist', /Hosted secrets checklist/.test(read('docs/PRODUCT_ROADMAP.md')));

const API = process.env.COVENANT_CLOUD_API || 'http://127.0.0.1:18787';

function assertNoSecrets(obj, label) {
  const raw = JSON.stringify(obj);
  ok(label + ' no GOOGLE_CLIENT_SECRET key', !/"GOOGLE_CLIENT_SECRET"\s*:/.test(raw));
  ok(label + ' no SMTP_PASS key', !/"SMTP_PASS"\s*:/.test(raw));
  ok(label + ' no SESSION_SECRET key', !/"SESSION_SECRET"\s*:/.test(raw));
  ok(label + ' no clientSecret key', !/"clientSecret"\s*:/.test(raw));
}

async function live() {
  let health;
  try {
    const res = await fetch(API + '/health');
    health = await res.json();
  } catch (e) {
    console.log('setup-status verify: API not reachable at ' + API + ' — scaffold checks only.');
    return;
  }
  ok('health ok', health && health.ok === true && health.db === 'up');
  ok('health has googleConfigured boolean', typeof health.features?.googleConfigured === 'boolean');
  ok('health has smtpConfigured boolean', typeof health.features?.smtpConfigured === 'boolean');

  const setupRes = await fetch(API + '/setup/status');
  const setup = await setupRes.json();
  ok('setup/status 200', setupRes.ok && setup && setup.ok === true);
  ok('setup publicUrlConfigured boolean', typeof setup.publicUrlConfigured === 'boolean');
  ok('setup googleConfigured boolean', typeof setup.googleConfigured === 'boolean');
  ok('setup smtpConfigured boolean', typeof setup.smtpConfigured === 'boolean');
  ok('setup enables object', setup.enables && typeof setup.enables.googleSignIn === 'boolean'
    && typeof setup.enables.rsvpEmail === 'boolean');
  assertNoSecrets(setup, 'setup/status');

  // Align with /auth/config booleans (may include non-secret host/from — not asserted here).
  const cfgRes = await fetch(API + '/auth/config');
  const cfg = await cfgRes.json();
  if (cfgRes.ok && cfg.auth) {
    ok('setup google matches auth/config', setup.googleConfigured === !!(cfg.auth.google && cfg.auth.google.configured));
    ok('setup smtp matches auth/config', setup.smtpConfigured === !!(cfg.auth.email && cfg.auth.email.configured));
  }
}

await live();

if (issues.length) {
  console.error('setup-status verify FAILED:');
  issues.forEach((i) => console.error(' -', i));
  process.exit(1);
}
console.log('setup-status verify ok');

#!/usr/bin/env node
/**
 * Verify RSVP + gated guest portal foundation (roadmap steps 6–7).
 * Static scaffold checks + live API: token create → submit → guest update.
 * SMTP send is mocked/skipped: expects 503 when SMTP unset.
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

ok('docs/RSVP_AND_GUEST_PORTAL.md', fs.existsSync(path.join(root, 'docs/RSVP_AND_GUEST_PORTAL.md')));
ok('roadmap mentions RSVP doc', /RSVP_AND_GUEST_PORTAL\.md/.test(read('docs/PRODUCT_ROADMAP.md')));
ok('schema rsvp_token', /rsvp_token/.test(read('server/schema.sql')));
ok('schema outbound_emails', /CREATE TABLE IF NOT EXISTS outbound_emails/.test(read('server/schema.sql')));
ok('schema portal_slug', /portal_slug/.test(read('server/schema.sql')));
ok('schema portal_published_json', /portal_published_json/.test(read('server/schema.sql')));
ok('rsvp routes', /rsvp\/tokens/.test(read('server/routes/rsvp.js')) || /\/tokens/.test(read('server/routes/rsvp.js')));
ok('guest public routes', /guestPublicRoutes/.test(read('server/routes/rsvp.js')));
ok('portal routes', /portal_access_mode|accessMode/.test(read('server/routes/portal.js')));
ok('portal sanitize registryLinks', /registryLinks/.test(read('server/routes/portal.js')));
ok('portal sanitize faqs', /faqs/.test(read('server/routes/portal.js')));
ok('portal sanitize heroImageUrl', /heroImageUrl/.test(read('server/routes/portal.js')));
ok('guest pages hero/faq render', /pub-hero|pub-faq|Registry/.test(read('server/lib/guest-pages.js')));
ok('guest pages lib', fs.existsSync(path.join(root, 'server/lib/guest-pages.js')));
ok('index mounts /guest', /\/guest/.test(read('server/index.js')));
ok('index mounts /p', /portalPublicRoutes/.test(read('server/index.js')));
ok('client rsvpStatus', /rsvpStatus/.test(read('js/cloud-sync.js')));
ok('client portalUpdate', /portalUpdate/.test(read('js/cloud-sync.js')));
ok('settings RSVP pane', /id: 'rsvp'/.test(read('js/settings-window-redesign.js')));
ok('settings Generate tokens', /rdRsvpTokens/.test(read('js/settings-window-redesign.js')));
ok('settings portal block toggles', /rd-portal-blk-welcome/.test(read('js/settings-window-redesign.js')));
ok('settings portal travel/faq', /rd-portal-travel/.test(read('js/settings-window-redesign.js')) && /rd-portal-faq/.test(read('js/settings-window-redesign.js')));
ok('package verify:rsvp', /verify:rsvp/.test(read('package.json')));

const API = process.env.COVENANT_CLOUD_API || 'http://127.0.0.1:18787';
const DEMO_EMAIL = process.env.COVENANT_DEMO_EMAIL || 'demo@covenant.local';
const DEMO_PASS = process.env.COVENANT_DEMO_PASSWORD || 'covenant-demo';

async function live() {
  let health;
  try {
    const res = await fetch(API + '/health');
    health = await res.json();
  } catch {
    console.log('rsvp verify: API not reachable at ' + API + ' — scaffold checks only.');
    return;
  }
  ok('health ok', health && health.ok === true && health.db === 'up');
  ok('feature rsvp on', health.features && health.features.rsvp === true);
  ok('feature landing on', health.features && health.features.landing === true);

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
      name: 'RSVP Verify ' + stamp,
      bride: 'Ava',
      groom: 'Ben',
      weddingDate: '2027-06-12',
      clientKey: 'verify-rsvp-' + stamp
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('create wedding', (wedding.status === 200 || wedding.status === 201) && wedding.body.wedding);
  const weddingId = wedding.body.wedding && wedding.body.wedding.id;
  if (!weddingId) return;

  const guestId = 'g-rsvp-' + stamp;
  const guestEmail = `guest-${stamp}@covenant.local`;
  const upsert = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/guests/' + encodeURIComponent(guestId), {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      id: guestId,
      name: 'Casey Guest',
      email: guestEmail,
      rsvp: '',
      meal: '',
      updatedAt: new Date().toISOString()
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('upsert guest', upsert.status === 200 || upsert.status === 201);

  const tokens = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/rsvp/tokens', {
    method: 'POST',
    headers,
    body: JSON.stringify({ guestIds: [guestId] })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('generate token', tokens.status === 200 && tokens.body.created >= 1);
  const rsvpUrl = tokens.body.guests && tokens.body.guests[0] && tokens.body.guests[0].rsvpUrl;
  ok('rsvp url present', !!rsvpUrl);
  const tokenMatch = /\/guest\/rsvp\/([^/?#]+)/.exec(rsvpUrl || '');
  const token = tokenMatch && tokenMatch[1];
  ok('token parseable', !!token);
  if (!token) return;

  const formGet = await fetch(API + '/guest/rsvp/' + encodeURIComponent(token) + '?format=json', {
    headers: { Accept: 'application/json' }
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('public form get', formGet.status === 200 && formGet.body.guest && formGet.body.guest.name === 'Casey Guest');

  const submit = await fetch(API + '/guest/rsvp/' + encodeURIComponent(token), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      rsvp: 'yes',
      meal: 'vegetarian',
      dietary: 'no nuts',
      plusOne: true,
      notes: 'Excited to celebrate!'
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('submit rsvp', submit.status === 200 && submit.body.ok === true);
  ok('submit fields', submit.body.guest
    && submit.body.guest.rsvp === 'yes'
    && submit.body.guest.meal === 'vegetarian'
    && submit.body.guest.plusOne === true);

  const status = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/rsvp/status', {
    headers
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('status endpoint', status.status === 200 && status.body.ok === true);
  const g = (status.body.guests || []).find((x) => x.id === guestId);
  ok('guest updated in status', g && g.rsvp === 'yes' && g.respondedAt);

  const guestsPull = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/guests', {
    headers
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  const pulled = (guestsPull.body.guests || []).find((x) => x.id === guestId);
  ok('guest writeback on sync table', pulled && pulled.rsvp === 'yes' && pulled.meal === 'vegetarian' && pulled.plusone === true);

  const send = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/rsvp/send', {
    method: 'POST',
    headers,
    body: JSON.stringify({ guestIds: [guestId], kind: 'rsvp_invite' })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  if (health.features && health.features.smtpConfigured) {
    ok('send with SMTP', send.status === 200 && send.body.ok === true);
  } else {
    ok('send smtp_not_configured', send.status === 503 && send.body.error === 'smtp_not_configured');
  }

  const slug = 'verify-' + stamp;
  const portal = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/portal', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      enabled: true,
      slug,
      accessMode: 'code',
      accessCode: 'rose-garden',
      published: {
        headline: 'Ava & Ben',
        subhead: 'A garden celebration',
        date: 'June 12, 2027',
        venue: 'Cedar Hall',
        dressCode: 'Garden formal',
        message: 'We cannot wait to celebrate with you.',
        schedule: '3pm ceremony · 5pm cocktails · 6pm dinner',
        travel: 'Fly into Cedar Regional.',
        lodging: 'Hotel block under Ava-Ben.',
        rsvpHint: 'Use your email RSVP link.',
        heroImageUrl: 'https://example.com/hero.jpg',
        registryLinks: [{ label: 'Registry', url: 'https://example.com/registry' }],
        faqs: [{ q: 'Plus-ones?', a: 'Please RSVP with your guest name.' }],
        blocks: {
          welcome: true,
          event: true,
          schedule: true,
          travel: true,
          lodging: true,
          registry: true,
          faq: true,
          hero: true
        }
      }
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('portal save', portal.status === 200 && portal.body.portal && portal.body.portal.slug === slug);
  const savedPub = portal.body.portal && portal.body.portal.published;
  ok(
    'portal richer published',
    savedPub
      && savedPub.travel === 'Fly into Cedar Regional.'
      && savedPub.lodging === 'Hotel block under Ava-Ben.'
      && Array.isArray(savedPub.registryLinks)
      && savedPub.registryLinks[0]
      && savedPub.registryLinks[0].label === 'Registry'
      && Array.isArray(savedPub.faqs)
      && savedPub.faqs[0]
      && savedPub.faqs[0].q === 'Plus-ones?'
      && savedPub.heroImageUrl === 'https://example.com/hero.jpg'
  );

  const badHero = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/portal', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      enabled: true,
      slug,
      accessMode: 'code',
      accessCode: 'rose-garden',
      published: {
        headline: 'Ava & Ben',
        heroImageUrl: 'javascript:alert(1)',
        travel: 'Keep travel'
      }
    })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok(
    'portal rejects javascript hero',
    badHero.status === 200
      && badHero.body.portal
      && badHero.body.portal.published
      && !badHero.body.portal.published.heroImageUrl
  );

  const locked = await fetch(API + '/p/' + encodeURIComponent(slug) + '?format=json', {
    headers: { Accept: 'application/json' }
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('portal locked json', locked.status === 200 && locked.body.locked === true);

  const bad = await fetch(API + '/p/' + encodeURIComponent(slug) + '/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'wrong' })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('portal bad code', bad.status === 403);

  const good = await fetch(API + '/p/' + encodeURIComponent(slug) + '/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'rose-garden' })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('portal good code', good.status === 200 && good.body.token);

  // Restore richer published for unlocked HTML check
  await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/portal', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      enabled: true,
      slug,
      accessMode: 'unlisted',
      published: {
        headline: 'Ava & Ben',
        message: 'Welcome friends.',
        schedule: '3pm ceremony',
        travel: 'Shuttle from hotel.',
        lodging: 'Cedar Inn',
        registryLinks: [{ label: 'Gifts', url: 'https://example.com/gifts' }],
        faqs: [{ q: 'Kids?', a: 'Adults only, thank you.' }],
        blocks: { welcome: true, schedule: true, travel: true, lodging: true, registry: true, faq: true }
      }
    })
  });

  const portalHtml = await fetch(API + '/p/' + encodeURIComponent(slug), {
    headers: { Accept: 'text/html' }
  });
  const portalHtmlText = await portalHtml.text();
  ok(
    'portal html richer blocks',
    portalHtml.status === 200
      && /Welcome/.test(portalHtmlText)
      && /Schedule/.test(portalHtmlText)
      && /Travel/.test(portalHtmlText)
      && /Lodging/.test(portalHtmlText)
      && /Registry/.test(portalHtmlText)
      && /FAQ/.test(portalHtmlText)
      && /noindex/.test(portalHtmlText)
  );

  const emailGate = await fetch(API + '/weddings/' + encodeURIComponent(weddingId) + '/portal', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ enabled: true, slug, accessMode: 'email' })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('portal email mode', emailGate.status === 200);

  const emailOk = await fetch(API + '/p/' + encodeURIComponent(slug) + '/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: guestEmail })
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok('portal email gate', emailOk.status === 200 && emailOk.body.unlocked === true);

  const html = await fetch(API + '/guest/rsvp/' + encodeURIComponent(token), {
    headers: { Accept: 'text/html' }
  });
  const htmlText = await html.text();
  ok('rsvp html page', html.status === 200 && /RSVP/.test(htmlText) && /noindex/.test(htmlText));
}

await live();

if (issues.length) {
  console.error('verify:rsvp FAILED');
  issues.forEach((i) => console.error(' - ' + i));
  process.exit(1);
}
console.log('verify:rsvp OK');

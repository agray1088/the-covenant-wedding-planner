/* Offline check: stale cached wedding id (other user / API) must not cause a 403 trap. No API/Postgres needed. */
import vm from 'vm';
import { readFileSync } from 'fs';
import assert from 'assert';

const store = {
  covenant_cloud_enabled: '1',
  covenant_cloud_api: 'https://api.example',
  covenant_cloud_token: 'tok-b',
  covenant_cloud_user: JSON.stringify({ id: 'user-b' }),
  covenant_cloud_wedding_id: 'wedding-of-user-a'
};
const calls = [];
let created = 0;
const fetchMock = async (url, o = {}) => {
  const path = url.replace('https://api.example', '');
  const method = o.method || 'GET';
  calls.push(method + ' ' + path);
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
  if (path === '/weddings' && method === 'GET') return json(200, { weddings: [] });
  if (path === '/weddings' && method === 'POST') { created++; return json(200, { wedding: { id: 'wedding-b' } }); }
  if (path.startsWith('/weddings/wedding-of-user-a')) return json(403, { error: 'forbidden', message: 'Not a member of this wedding.' });
  if (path.startsWith('/weddings/wedding-b')) return json(200, { guests: [], results: [] });
  return json(404, {});
};
const window = { COVENANT_CLOUD: undefined };
const ctx = {
  window, fetch: fetchMock, navigator: { onLine: true }, console,
  setTimeout, clearTimeout, URL, Promise,
  document: { readyState: 'complete', addEventListener() {} },
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync('js/cloud-sync.js', 'utf8'), ctx);
const CS = window.CovenantCloudSync;

// 1) No scope marker => cached id is untrusted and dropped.
assert.strictEqual(CS.getStatus().weddingId, null, 'unscoped id must be ignored');

// 2) Even with a matching scope, a 403 triggers one relink + retry.
store.covenant_cloud_wedding_id = 'wedding-of-user-a';
store.covenant_cloud_wedding_scope = 'https://api.example|user-b';
const body = await CS.api('/weddings/wedding-of-user-a/guests');
assert.deepStrictEqual(body.guests, []);
assert.strictEqual(store.covenant_cloud_wedding_id, 'wedding-b');
assert.strictEqual(created, 1);
assert.ok(calls.filter((c) => c === 'GET /weddings/wedding-of-user-a/guests').length === 1, 'no retry loop on stale id');

// 3) Full sync recovers.
store.covenant_cloud_wedding_id = 'wedding-of-user-a';
await CS.syncNow().catch((e) => { throw e; });
assert.strictEqual(store.covenant_cloud_wedding_id, 'wedding-b');

// 4) Sign-out clears the id.
await CS.signOut();
assert.strictEqual(store.covenant_cloud_wedding_id, undefined);
console.log('verify:stale-wedding OK');
process.exit(0);

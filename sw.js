/* The Covenant Wedding Planner - service worker (offline app shell).
   The PRECACHE block and VERSION are rewritten by `node scripts/gen-sw-manifest.mjs`
   (run at docker build and committed). Do not edit them by hand.
   Never touches: non-GET requests, cross-origin API calls, /auth /weddings /setup etc. */

/* GEN:BEGIN */
const VERSION = 'testbump';
const PRECACHE = [
  "./",
  "Redesign/autofit-columns.js",
  "Redesign/redesign-components.css",
  "Redesign/redesign-layouts.css",
  "Redesign/redesign-shell.css",
  "Redesign/redesign-tokens.css",
  "assets/icons/apple-touch-icon.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-192.png",
  "assets/icons/icon-maskable-512.png",
  "config.js",
  "css/phase-data-hub.css",
  "css/phase-guest-insight-cards.css",
  "css/phase-record-cards.css",
  "css/phase2-roadmap.css",
  "css/phase3-roadmap.css",
  "css/phase4-roadmap.css",
  "css/planner-components.css",
  "css/planner-context-sidebar.css",
  "css/planner-page-gutters.css",
  "css/planner-shell.css",
  "css/planner-spacing-premium.css",
  "css/planner-tokens.css",
  "css/planner.css",
  "css/redesign-dark-sweep.css",
  "css/redesign-furniture.css",
  "css/redesign-overrides.css",
  "css/vendor-portal.css",
  "index.html",
  "js/budget-redesign.js",
  "js/catering-redesign.js",
  "js/ceremony-redesign.js",
  "js/chrome-menus-redesign.js",
  "js/cloud-sync.js",
  "js/contacts-redesign.js",
  "js/contracts-redesign.js",
  "js/counseling-redesign.js",
  "js/covenant-zip.js",
  "js/dashboard-redesign.js",
  "js/data-hub-redesign.js",
  "js/db-repository.js",
  "js/emails-redesign.js",
  "js/entertainment-redesign.js",
  "js/essentials-redesign.js",
  "js/firstmonth-redesign.js",
  "js/gifts-redesign.js",
  "js/guide-redesign.js",
  "js/history-redesign.js",
  "js/homecoming-redesign.js",
  "js/honeymoon-redesign.js",
  "js/households-redesign.js",
  "js/json-to-sqlite-migrate.js",
  "js/logistics-views-redesign.js",
  "js/migration-map.js",
  "js/mood-redesign.js",
  "js/notes-redesign.js",
  "js/packets-redesign.js",
  "js/party-redesign.js",
  "js/payments-redesign.js",
  "js/photo-store.js",
  "js/planner-context-sidebar.js",
  "js/planner-pill-scheme.js",
  "js/planner.js",
  "js/prayer-redesign.js",
  "js/print-centre-redesign.js",
  "js/profile-drawer-redesign.js",
  "js/pwa.js",
  "js/rd-depth.js",
  "js/rd-furniture.js",
  "js/rd-states.js",
  "js/rd-table-controls.js",
  "js/redesign-shell.js",
  "js/responsive-redesign.js",
  "js/roles-redesign.js",
  "js/settings-window-redesign.js",
  "js/setup-redesign.js",
  "js/shotlist-redesign.js",
  "js/sqlite-backup.js",
  "js/sqlite-init.js",
  "js/tables-redesign.js",
  "js/timeline-redesign.js",
  "js/ux-kit.js",
  "js/vendor-portal.js",
  "js/vendor-redesign.js",
  "js/vendor/sql-wasm.js",
  "js/vendor/sql-wasm.wasm",
  "js/vendors-redesign.js",
  "js/venue-redesign.js",
  "js/viewer-prefs-redesign.js",
  "js/vision-redesign.js",
  "manifest.webmanifest",
  "vendor-portal.html"
];
/* GEN:END */

const CACHE_PREFIX = 'covenant-shell-';
const CACHE = CACHE_PREFIX + VERSION;
const RUNTIME = 'covenant-runtime-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const SHELL_DIRS = /^(js|css|Redesign|assets|vendor|img|fonts)\//;
const SHELL_TOP = /^(index\.html|vendor-portal\.html|config\.js|manifest\.webmanifest|favicon\.ico)?$/;

function scopePath() { return new URL(self.registration.scope).pathname; }

/* Allowlist: only static app-shell paths under the SW scope are ever handled.
   Everything else (API routes such as /auth, /weddings, /setup, even same-origin) passes through untouched. */
function isShellRequest(url) {
  if (url.origin !== self.location.origin) return false;
  if (!url.pathname.startsWith(scopePath())) return false;
  const rel = url.pathname.slice(scopePath().length);
  return SHELL_DIRS.test(rel) || SHELL_TOP.test(rel);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(PRECACHE.map(async (p) => {
      const req = new Request(p, { cache: 'reload' });
      const res = await fetch(req);
      if (!res.ok) throw new Error('precache failed: ' + p + ' ' + res.status);
      await cache.put(new URL(p, self.registration.scope).href, res);
    }));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const d = event.data;
  if (d === 'SKIP_WAITING' || (d && d.type === 'SKIP_WAITING')) self.skipWaiting();
  if (d && d.type === 'GET_VERSION' && event.source) event.source.postMessage({ type: 'VERSION', version: VERSION });
});

async function matchShell(req, ignoreSearch) {
  const cache = await caches.open(CACHE);
  return cache.match(req, { ignoreSearch: !!ignoreSearch });
}

async function networkFirst(req, fallbackKey) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(fallbackKey || req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match(fallbackKey || req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName, ignoreSearch) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreSearch: !!ignoreSearch });
  const refresh = fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  if (hit) { refresh.catch(() => {}); return hit; }
  const res = await refresh;
  return res || Response.error();
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    if (FONT_HOSTS.includes(url.hostname)) {
      event.respondWith(staleWhileRevalidate(req, RUNTIME, false));
    }
    return;
  }
  if (!isShellRequest(url)) return;
  if (url.pathname.endsWith('/sw.js')) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'))) {
          const cache = await caches.open(CACHE);
          cache.put(new URL('./index.html', self.registration.scope).href, res.clone()).catch(() => {});
        }
        return res;
      } catch (err) {
        const page = url.pathname.endsWith('/vendor-portal.html')
          ? await matchShell(new URL('./vendor-portal.html', self.registration.scope).href, true) : null;
        return page || (await matchShell(new URL('./index.html', self.registration.scope).href, true))
          || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.endsWith('/config.js')) {
    event.respondWith(networkFirst(req, new URL('./config.js', self.registration.scope).href));
    return;
  }

  event.respondWith((async () => {
    const hit = await matchShell(req, true);
    if (hit) return hit;
    const res = await fetch(req);
    if (res && res.ok) (await caches.open(CACHE)).put(req, res.clone()).catch(() => {});
    return res;
  })());
});

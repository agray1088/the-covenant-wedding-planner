# Install the planner as an app (PWA) and use it offline

The hosted planner is an installable Progressive Web App. After one online visit it opens with no internet. Planner data stays in the browser (localStorage / SQLite / IndexedDB); cloud sync is unchanged and optional. The service worker never caches or intercepts API/cloud-sync calls (cross-origin API, `/auth`, `/weddings`, `/setup`, ...) or non-GET requests.

Want a native Windows `.exe` instead (or in addition)? See [`DESKTOP_APP.md`](./DESKTOP_APP.md) — Electron installer under `desktop/`; the PWA stays available.

Requirements: HTTPS (the Railway static host) or `http://localhost`. It does not register from `file://`.

## Install
- **Windows (Edge or Chrome, e.g. Surface Pro X):** open the planner URL, hard refresh (Ctrl+Shift+R), then click the **Install** icon at the right end of the address bar, or menu (...) > **Apps** > **Install this site as an app** (Chrome: menu > **Cast, save and share** > **Install page as app**). You can also use Settings > **Install app** inside the planner. Pin it to Start/taskbar if you like.
- **Android (Chrome):** menu > **Install app** / **Add to Home screen**.
- **iPhone / iPad (Safari):** Share > **Add to Home Screen**. (iOS shows no install button; Settings > Install app shows this hint.)

## Verify offline
1. Open the planner online once and wait a few seconds. Settings > **Install app** should say "Ready - the planner opens without internet".
2. Chrome/Edge DevTools (F12) > **Application** > **Service Workers**: status "activated and running". Tick **Offline**, reload: the planner still loads. Application > **Cache Storage** lists `covenant-shell-<version>`.
3. Note: web fonts from Google are cached after first use; before that, offline falls back to system fonts.

## How updates roll out
- `sw.js` carries a content-hash `VERSION` and the precache list. Any change to a shipped file changes the version, so every user gets a new cache.
- Regenerate after changing any shipped file: `node scripts/gen-sw-manifest.mjs` (CI/pre-commit check: `node scripts/gen-sw-manifest.mjs --check`). `Dockerfile.hosted` also regenerates it at build from the files actually copied into the image and fails the build if one is missing. The list is derived from the `<script src>` / `<link href>` tags in `index.html` and `vendor-portal.html`, plus the sql.js `.wasm`, manifest and icons.
- Running apps check for updates on launch and when the window regains focus. When a new version is ready an **Update available - Reload** banner appears; clicking Reload activates it and reloads. Old caches are deleted on activation. `?v=` query strings are ignored for cache matching, so the version bump is what rolls updates out.
- `sw.js` and `manifest.webmanifest` are served `no-cache`; `config.js` is network-first (it holds the API base set by `API_BASE_URL`).
- Regenerate icons (rarely) with `node scripts/gen-pwa-icons.mjs`.

## Backups still matter
Browser storage can be cleared (clearing site data, uninstalling the app in some browsers, storage pressure, switching browser/device). Installing does not make a backup. Use **Backup & restore** to download backups regularly, or turn on cloud sync.

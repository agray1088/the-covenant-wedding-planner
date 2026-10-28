# Desktop app (Windows `.exe`) — The Covenant Wedding Planner

Installable **Windows desktop** shell (Electron) around the same offline-first planner UI. The **PWA / hosted Railway static site is unchanged** — this lives under `desktop/` only.

Optional cloud sync still talks to the Railway API when online (same Settings → Cloud sync flow). Offline planning never requires a network.

## What you get

| Artifact | Purpose |
|----------|---------|
| **NSIS installer** (`.exe`) | Start Menu + Desktop shortcuts, uninstall entry |
| **Portable** (`.exe`) | Run without installing (good for a quick try) |
| **Zip** (`.zip`) | Unpacked app folder (works as a Linux cross-build fallback when Wine/NSIS is unavailable) |

**Architectures**

| Arch | Who needs it |
|------|----------------|
| **arm64** | Surface Pro X and other Windows on ARM PCs |
| **x64** | Typical Intel/AMD Windows PCs |

This repo’s `desktop:build:win` script asks electron-builder for **both** `x64` and `arm64` NSIS + portable + zip targets. A Linux CI/agent can usually produce **zip** (and unpacked dirs) for both archs; **NSIS/portable need Wine** on Linux and are most reliable when built on Windows. Always check `desktop/dist/` for which files were actually produced.

## Build on Windows (recommended for Surface Pro X)

Requirements: [Node.js 20+](https://nodejs.org/) (LTS), git, ~1 GB free disk.

```bat
git clone https://github.com/agray1088/the-covenant-wedding-planner.git
cd the-covenant-wedding-planner
git checkout cursor/desktop-electron-017e
git pull origin cursor/desktop-electron-017e

npm install
npm install --prefix desktop

REM Both archs (x64 + arm64), NSIS + portable:
npm run desktop:build:win

REM Or only the arch you need:
npm run desktop:build:win:arm64
npm run desktop:build:win:x64
```

Outputs land in **`desktop/dist/`**, for example:

- `The Covenant Wedding Planner-1.0.0-win-arm64.exe` — NSIS installer (Surface Pro X)
- `The Covenant Wedding Planner-1.0.0-win-arm64-portable.exe` — portable
- `The Covenant Wedding Planner-1.0.0-win-arm64.zip` — unzip and run the `.exe` inside
- Same names with `x64` for Intel/AMD PCs

### Dev run (no installer)

```bat
npm run desktop:dev
```

Opens Electron against the repo’s local `index.html` / `js` / `css` / `Redesign` / `assets` (not a remote-only URL).

## Install the `.exe` (Surface Pro X)

1. Build with **`arm64`** on Windows (or copy an `*-win-arm64*.exe` from a machine that produced it).
2. Run the **NSIS** installer `.exe` (not the portable one, unless you want portable).
3. If **SmartScreen** / “Windows protected your PC” appears: **More info** → **Run anyway**. Builds are **not code-signed** yet (no certificate in this repo).
4. Launch **The Covenant Wedding Planner** from the Start Menu or Desktop shortcut.

Portable: double-click `*-portable.exe`; no Start Menu entry.

## How the shell works

- Main process starts a **loopback-only** static server (`127.0.0.1`, ephemeral port) that serves the packaged planner files from disk.
- **No network is required** to open the UI or use offline planning data.
- Cloud sync (optional) uses HTTPS to the API when you enable it and are online.
- Default API base for packaged builds:  
  `https://the-covenant-wedding-planner-production.up.railway.app`  
  (same pattern as hosted `COVENANT_API_DEFAULT` / Settings cloud API field).
- Override API base:
  - Environment: `COVENANT_API_BASE` or `COVENANT_API_DEFAULT`
  - File: `%APPDATA%\covenant-wedding-planner-desktop\api-base.txt` (one `https://…` URL)
  - Menu: **File → Set Cloud API Base…**
  - In-app: **Settings → Cloud sync** (saved in the app’s localStorage, same as the web app)

The desktop shell does **not** register the PWA service worker (unnecessary inside Electron). Hosted PWA install is unchanged — see [`PWA_INSTALL.md`](./PWA_INSTALL.md).

## Where data lives

| Kind | Location |
|------|----------|
| Electron profile / Chromium storage (localStorage, IndexedDB, SQLite via sql.js, etc.) | `%APPDATA%\covenant-wedding-planner-desktop\` (Electron `userData`) |
| Optional API override file | `%APPDATA%\covenant-wedding-planner-desktop\api-base.txt` |

Menu **File → Open Data Folder** opens `userData`.

Uninstalling the NSIS app may leave `userData` behind (normal for Electron). Deleting that folder wipes on-device planner data for the desktop app.

### Backup reminder

Desktop install does **not** replace backups. Use **Backup & restore** in the planner regularly, or enable optional cloud sync. Clearing `userData`, OS resets, or a broken disk can lose local-only data.

## Code signing / SmartScreen

**Not included.** Unsigned installers often trigger SmartScreen on first run. That is expected until you add an Authenticode certificate and configure `electron-builder` signing (`CSC_LINK` / `CSC_KEY_PASSWORD` or Azure Trusted Signing). Do not commit certificates or passwords to the repo.

## Linux / CI agent notes

- `npm install --prefix desktop` and `npm run desktop:smoke` (static server smoke) work on Linux.
- Electron GUI smoke can run under `xvfb-run` when a display is unavailable.
- Full Windows **NSIS / portable** packaging from Linux needs Wine; without Wine, use `npm run desktop:build:win:zip` (or expect NSIS to fail after unpacked/zip succeed).
- Prefer **`npm run desktop:build:win` on your Windows PC** for the signed-ready NSIS `.exe` you will install.
- Cloud agent verification (this workstream): host arch **x86_64**; produced **win-x64** and **win-arm64** unpacked dirs + **zip** artifacts; NSIS installer finalization failed without Wine. ARM64 runtime verification belongs on a Surface / Windows on ARM device.

## Scripts

| Command | Where | What |
|---------|--------|------|
| `npm run desktop:dev` | repo root | Electron against local static tree |
| `npm run desktop:build:win` | repo root | NSIS + portable + zip, x64 + arm64 |
| `npm run desktop:build:win:arm64` | repo root | arm64 only (Surface) |
| `npm run desktop:build:win:x64` | repo root | x64 only |
| `npm run desktop:build:win:zip` | repo root | Zip only (Linux-friendly cross-build) |
| `npm run desktop:smoke` | repo root | Node smoke test (no GUI) |
| `npm start` / `npm run build:win` | `desktop/` | Same as above without the `desktop:` prefix |

## Isolation

- All Electron / electron-builder code is under **`desktop/`**.
- Root Railway Dockerfiles, `scripts/static-server.mjs`, `sw.js`, and PWA assets are not required for desktop packaging logic beyond being **copied as resources** into the Windows build.
- Do not put Railway API secrets into the desktop app; the client only needs the public API base URL.

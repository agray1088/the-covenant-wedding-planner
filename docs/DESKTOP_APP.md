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

- `The Covenant Wedding Planner-1.0.0-win-arm64-setup.exe` — NSIS installer (Surface Pro X)
- `The Covenant Wedding Planner-1.0.0-win-arm64-portable.exe` — portable
- `The Covenant Wedding Planner-1.0.0-win-arm64.zip` — unzip and run `CovenantWeddingPlanner.exe` inside
- Same names with `x64` for Intel/AMD PCs

### Packaging names (important for shortcuts)

| Field | Value | Why |
|-------|--------|-----|
| `productName` | `The Covenant Wedding Planner` | Display / branding |
| `executableName` | `CovenantWeddingPlanner` | Actual `.exe` filename (**no spaces**) |
| `nsis.shortcutName` | `The Covenant Wedding Planner` | Start Menu + Desktop shortcut **label** only |
| `nsis.include` | `desktop/build/installer.nsh` | Custom NSIS: always recreate shortcuts → `$INSTDIR\CovenantWeddingPlanner.exe` |
| `nsis.differentialPackage` | `false` | Full self-contained setup (no differential/web package quirks) |
| Install folder (per-user default) | `%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\` | `APP_FILENAME` from `executableName` when `oneClick: false` |

**Installed binary (current-user install — verify this path after every install):**

```text
%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\CovenantWeddingPlanner.exe
```

Per-machine (“all users”): typically

```text
%ProgramFiles%\CovenantWeddingPlanner\CovenantWeddingPlanner.exe
```

Do **not** rely on an `.exe` named `The Covenant Wedding Planner.exe` (spaced). Do **not** treat `desktop\dist\win-arm64-unpacked\CovenantWeddingPlanner.exe` as the installed app — that is the **build** tree only.

### Dev run (no installer)

```bat
npm run desktop:dev
```

Opens Electron against the repo’s local `index.html` / `js` / `css` / `Redesign` / `assets` (not a remote-only URL).

### Application menu (Windows / Linux)

The collapsible in-app **planner footer** was removed. Use the native menu bar instead:

| Menu | Highlights |
|------|------------|
| **File** | Export / Import backup, Export CSV, Print Section, Preview Mode, Set Cloud API Base, Settings, Open Data Folder, Exit |
| **Edit** | Undo / Redo / Cut / Copy / Paste / Select All (Electron roles) |
| **View** | Reload, zoom, full screen; Toggle DevTools only in unpackaged/dev builds |
| **Go** | Dashboard, Calendar, Budget, Guests, Payments, Packets, Get Started, Guide, FAQ, Setup |
| **Help** | Backup help, local docs (`docs/` bundled in the installer), connect/legal links, Enter License… (stub), Check for Updates… (“Coming soon”), About |

After changing menu or shell code on Windows x64:

```bat
npm run desktop:build:win:x64
```

Then install/run the new artifact from `desktop/dist/`.

## Install the `.exe` (Surface Pro X)

1. Build with **`arm64`** on Windows (or copy an `*-win-arm64*-setup.exe` from a machine that produced it). Prefer a **full** `*-setup.exe` (tens of MB), not a tiny stub.
2. Run the **NSIS** installer `.exe` (not the portable one, unless you want portable). Prefer **current user** install (default). Accept the default install dir under `%LOCALAPPDATA%\Programs\CovenantWeddingPlanner`.
3. If **SmartScreen** / “Windows protected your PC” appears: **More info** → **Run anyway**. Builds are **not code-signed** yet (no certificate in this repo).
4. Finish the wizard (optionally leave **Run** checked). Then **verify the Programs install** (next section) before trusting Start Menu / Desktop icons.

Portable: double-click `*-portable.exe`; no Start Menu entry — good interim while fixing shortcuts.

### Post-install verification (do this once)

In **File Explorer** address bar or **PowerShell**:

```bat
dir "%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\CovenantWeddingPlanner.exe"
dir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\The Covenant Wedding Planner.lnk"
dir "%USERPROFILE%\Desktop\The Covenant Wedding Planner.lnk"
```

PowerShell — confirm the `.lnk` target is **Programs**, not the repo/`dist` folder:

```powershell
$sh = New-Object -ComObject WScript.Shell
$lnk = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\The Covenant Wedding Planner.lnk"
if (Test-Path $lnk) { $sh.CreateShortcut($lnk).TargetPath } else { "Start Menu .lnk missing" }
# Expect:
#   ...\AppData\Local\Programs\CovenantWeddingPlanner\CovenantWeddingPlanner.exe
# Bad (build tree — do not use / do not "Fix" toward this):
#   ...\the-covenant-wedding-planner\desktop\dist\win-arm64-unpacked\CovenantWeddingPlanner.exe
```

If the `dir` for the Programs `.exe` fails, the installer did **not** place files — re-run `*-setup.exe`, or use **portable** / **zip** until that succeeds.

### “Problem with Shortcut” dialog (CovenantWeddingPlanner.exe)

If Windows shows **Problem with Shortcut** and the nearest match is truncated like:

`C:\Users\…\the-covenant-we…\CovenantWeddingPlanner.exe`

that path is the **dev/build tree** (repo / `desktop\dist\…`), **not** `%LOCALAPPDATA%\Programs\…`.

| Button | What to do |
|--------|------------|
| **Delete it** | **Prefer this.** Removes the broken `.lnk`. Do **not** keep a shortcut aimed at the build folder. |
| **Fix it** | **Avoid** when the nearest match is under your repo / `desktop\dist`. “Fix” would retarget the shortcut at the **build** copy; the next rebuild/clean breaks it again. |
| **Cancel** | Leaves the broken shortcut in place. |

Then:

1. Confirm Programs install exists (verification commands above). If missing → run `*-win-arm64-setup.exe` again.
2. Remove leftover broken icons (Desktop, Start Menu, Taskbar pin):
   - Desktop: `The Covenant Wedding Planner.lnk`
   - Start Menu: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\The Covenant Wedding Planner.lnk`
   - Unpin any Taskbar / Start pin that still points at `desktop\dist\…`
3. Optionally remove stale install folders:
   - `%LOCALAPPDATA%\Programs\The Covenant Wedding Planner\` (legacy spaced name)
   - `%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\` (only if you intend a clean reinstall)
4. Reinstall a fresh `*-setup.exe` from this branch (includes `desktop/build/installer.nsh` shortcut retarget). Use the **new** Start Menu / Desktop shortcuts after verifying their Target Path.

Planner data under `%APPDATA%\covenant-wedding-planner-desktop\` is **not** removed by a normal uninstall — keep that folder unless you intend to wipe local data.

**Why this happens:** Running or pinning `desktop\dist\win-arm64-unpacked\CovenantWeddingPlanner.exe` creates Windows shortcuts to the **build** folder. Separately, electron-builder’s default `KeepShortcuts` path can **rename** an old `.lnk` without rewriting its target across exe/path changes. The custom `installer.nsh` always recreates Start Menu + Desktop links to `$INSTDIR\CovenantWeddingPlanner.exe`.

### Create a working shortcut manually

If Programs install is verified but Start Menu/Desktop icons are still wrong:

1. File Explorer → `%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\`
2. Right-click `CovenantWeddingPlanner.exe` → **Show more options** → **Create shortcut** (or drag to Desktop with Alt).
3. Rename the new shortcut to **The Covenant Wedding Planner** if you like.
4. Optional: copy that `.lnk` into `%APPDATA%\Microsoft\Windows\Start Menu\Programs\`

### Launch **now** without waiting for a rebuild (workaround)

Skip broken shortcuts and run a known-good binary:

```bat
REM Preferred — current-user NSIS install:
"%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\CovenantWeddingPlanner.exe"

REM Legacy spaced install (only if that folder still exists):
"%LOCALAPPDATA%\Programs\The Covenant Wedding Planner\The Covenant Wedding Planner.exe"

REM Per-machine:
"%ProgramFiles%\CovenantWeddingPlanner\CovenantWeddingPlanner.exe"
```

Also:

- **Portable:** `The Covenant Wedding Planner-1.0.0-win-arm64-portable.exe` — no Start Menu entry; fine for daily use until shortcuts are clean.
- **Zip:** unzip `The Covenant Wedding Planner-1.0.0-win-arm64.zip` and run `CovenantWeddingPlanner.exe` inside (do not pin that path long-term if you will rebuild).

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

# Desktop (Electron)

Windows installer shell for The Covenant Wedding Planner. See **[`../docs/DESKTOP_APP.md`](../docs/DESKTOP_APP.md)** for build, install, post-install verification, ARM64 vs x64, SmartScreen notes, “Problem with Shortcut” recovery (**Delete**, not **Fix** when nearest match is the repo/`dist` tree), manual shortcut creation, and portable/zip workarounds.

**Packaging:** `productName` = `The Covenant Wedding Planner` (display / shortcut label). `executableName` = `CovenantWeddingPlanner` (no spaces). Custom `build/installer.nsh` always creates Start Menu + Desktop shortcuts to `$INSTDIR\CovenantWeddingPlanner.exe` (default: `%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\CovenantWeddingPlanner.exe`). `nsis.differentialPackage` is `false` so the setup is a full installer.

```bat
npm install
npm start
npm run build:win:arm64
```

After install, verify:

```bat
dir "%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\CovenantWeddingPlanner.exe"
```

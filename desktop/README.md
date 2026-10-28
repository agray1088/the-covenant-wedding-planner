# Desktop (Electron)

Windows installer shell for The Covenant Wedding Planner. See **[`../docs/DESKTOP_APP.md`](../docs/DESKTOP_APP.md)** for build, install, data location, ARM64 vs x64, SmartScreen notes, shortcut troubleshooting, and “launch without reinstall” workarounds.

**Packaging:** `productName` stays `The Covenant Wedding Planner` (display / shortcut label). `executableName` is `CovenantWeddingPlanner` (no spaces) so NSIS Start Menu + Desktop shortcuts target `%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\CovenantWeddingPlanner.exe` by default.

```bat
npm install
npm start
npm run build:win:arm64
```

# Vendored Dependencies

This folder contains third-party assets that ship with the planner. They are
vendored (committed in-tree) rather than fetched at runtime so the app works
fully offline and as a single-file build. This file records provenance and
integrity fingerprints so the assets can be verified against upstream.

## sql.js

- **Library:** sql.js (SQLite compiled to WebAssembly)
- **Version:** 1.10.3
- **Upstream source:** https://github.com/sql-js/sql.js
- **Release:** https://github.com/sql-js/sql.js/releases/tag/v1.10.3
- **License:** MIT
- **Role:** Provides the in-browser SQLite engine used by `js/sqlite-init.js`
  (loaded before `js/planner.js`). SQLite is the authoritative data store; a
  localStorage/JSON copy is kept only as a crash-safety mirror.

### Files & integrity (SHA-256)

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `sql-wasm.js` | 49857 | `558a72c3ab3415d0e6d243cfd23f9d61543600d59054b4b7b8da3cd65f6b9fd4` |
| `sql-wasm.wasm` | 655300 | `d7e61b828523001f26ce0b3f88dabcf6c12e5e6edf80eb4f08b26ac7b946ff88` |

Hashes were computed with `Get-FileHash -Algorithm SHA256`. To re-verify:

```powershell
Get-FileHash -Algorithm SHA256 "js\vendor\sql-wasm.js","js\vendor\sql-wasm.wasm"
```

> Note: the minified `sql-wasm.js` does not embed a human-readable version
> string, so the `1.10.3` version above reflects the release these files were
> obtained from; the SHA-256 hashes are the authoritative fingerprint for
> matching against an upstream download.

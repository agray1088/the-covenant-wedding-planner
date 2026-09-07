# Ship checklist — single-device offline GA

Honest positioning for **one device + local backups**. Multi-device Postgres + auth + sync is **out of scope** for this pass.

## Ready for offline GA

| Area | Status |
|------|--------|
| Production defaults | Developer mode **off** unless `?dev=1` or `localStorage.covenant_developer_mode=1`. Title is **The Covenant Wedding Planner** (not “Developer Editable Version”). |
| Demo auto-seeds | Gated — empty planner stays empty; sample data is opt-in via **Load Sample Data**. |
| Persist | SQLite + IDB race fixed; E2E persist suite **9/9** (`node scripts/_e2e-persist-suite.mjs`). |
| First-run | Overlays sequenced (backup → wizard → coach); one at a time. |
| Backup education | Banner + first-run modal tell the truth: data lives on **this device**; download `.sqlite` before clearing browser / switching devices. |
| Get Started / Guide | Explicit “cannot sync between devices”; partner workflow is **file exchange** (backup / partner packet). |
| Share Packets | Prepare + print/PDF handoff on this device. “Live/Linked” means refreshes from **local** planner data when reopened here — not cloud sync. New links use `vendor-portal.html?g=…`. |
| Vendor Portal | Labeled **Local / Demo only**. Demo theatre when no planner data; actions do not pretend to message a remote vendor. |
| Preview Mode | Local edit lock for presenting on this device. |

## Requires Postgres + auth later (not this GA)

Offline GA defaults stay unchanged. Optional cloud scaffolding lives on a separate track — see `docs/OFFLINE_CLOUD_SYNC.md` (**Cloud sync (beta)**, guests vertical). Feature-flagged off until an API base is configured.

Still later / not claimed as done:

- Real multi-user Vendor Portal (hosted links, opens tracking, remote uploads)
- Full multi-device sync beyond guests + true live multi-user editing
- Hosted `covenant.link`-style packet URLs with passcodes
- True “message vendor / request access” delivery
- Server-side email / RSVP collection

## Smoke before release

1. Hard refresh with a clean profile (or Reset All Data).
2. Confirm title is **The Covenant Wedding Planner** (no Developer Editable).
3. Complete first-run backup prompt without stacking overlays.
4. Add one guest, one vendor, one task → reload → still there.
5. Open **Vendor** → banner says local/demo only → **Open local portal preview**.
6. Open Share Packets empty state → prepare → print/PDF path clear.
7. Run: `node scripts/_verify-firstrun-seq.mjs` and `node scripts/_verify-offline-ga.mjs`.

## Pull

```bash
git pull origin cursor/dashboard-views-017e
```

Then hard refresh (Ctrl+Shift+R).

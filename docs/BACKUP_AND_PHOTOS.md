# Backup + photos foundation

Offline-first file backup and a local photo library, plus honest privacy copy and online scaffolding (metadata in Postgres, blobs in object storage). Users never need Postgres installed on their machine.

Reconnect / demo auth are **unchanged**:
- Demo: `demo@covenant.local` / `covenant-demo` (username `demo`)
- Local API: `http://localhost:18787`
- Reconnect after reboot: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md)

## Privacy (honest)

| Claim | Truth |
|-------|--------|
| Local by default | Planner data + photo blobs live in this browser (localStorage + SQLite + IndexedDB). No account required. |
| Optional cloud | Cloud sync is opt-in. When enabled, **wedding rows you sync are stored** on the API’s managed Postgres. |
| We do not sell data | Product stance. |
| Not “we store nothing” | Once cloud backup / sync is on, we store what you upload. File backups you download stay under your control. |

UI surfaces this in **Settings → Privacy**, the Settings banner, About, and the Cloud sync pane.

## Offline file backup

| Action | Format | Contents |
|--------|--------|----------|
| **Download backup** | `.sqlite` | Full planner database (existing path). Hero / vision base64 already inside SQLite when present. |
| **Download full backup** | `.zip` (`covenant-backup-v1`) | `planner.sqlite` (or `planner.json`) + `photos/*` + `photos-index.json` + `manifest.json` |
| **Restore** | `.zip` / `.sqlite` / `.db` / `.json` | Auto-detect; zip restores planner then re-imports photo blobs into IndexedDB |

Settings → **Backup & restore** (and Overview → Save & backup) wire both download actions and Restore (file input accepts `.zip`).

### Zip layout

```
manifest.json          # format, createdAt, photoCount
planner.sqlite         # preferred
planner.json           # fallback if SQLite not ready
photos-index.json      # id → file + mime + meta
photos/<id>.jpg|png…   # binary blobs (IDB library + extracted data-URL pins/hero)
```

Zip uses STORE (no compression) via `js/covenant-zip.js` — no JSZip dependency.

## Local photos foundation

| Piece | Role |
|-------|------|
| `js/photo-store.js` | IndexedDB `covenant-photos-v1` blob store; `data.photoLibrary[]` metadata |
| Settings → **Photos** | Add / list / remove library photos |
| Refs | `idb:<photoId>` in metadata; legacy `data:image/…` still supported and included in full zip export |
| Hero upload | Still stores a display data URL; also copies into the IDB library for zip backups |

Online sync of photo **binaries** is not required for offline GA. Metadata + storage strategy are scaffolded on the API (below).

## Online scaffolding (API)

Postgres table `photos` — **metadata only** (`name`, `mime`, `size_bytes`, `storage_key`, `storage_backend`, …). No base64 blob columns.

Routes (auth + wedding membership required):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/weddings/:id/photos` | List metadata |
| POST / PUT | `/weddings/:id/photos[/:photoId]` | Upsert metadata |
| POST | `/weddings/:id/photos/:photoId/upload-url` | Upload strategy (local API path or S3/R2 placeholder) |
| GET | `/weddings/:id/photos/:photoId/download-url` | Download strategy |
| PUT/GET | `/weddings/:id/photos/:photoId/content` | Local-backend blob put/get |
| DELETE | `/weddings/:id/photos/:photoId` | Delete metadata (+ best-effort blob) |
| GET | `/weddings/:id/photos/storage` | Storage config summary (no secrets) |

### Env (placeholders — do not require provisioning to develop offline)

```bash
FEATURE_PHOTOS=0          # health flag; routes exist for scaffolding
PHOTO_STORAGE=local       # local | s3 | r2
PHOTO_LOCAL_DIR=          # default server/.photo-blobs
S3_BUCKET= S3_REGION= S3_ACCESS_KEY_ID= S3_SECRET_ACCESS_KEY= S3_ENDPOINT=
R2_BUCKET= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_ENDPOINT= R2_REGION=auto
```

`server/lib/object-storage.js` implements local disk put/get and returns honest placeholders for S3/R2 until the AWS SDK is wired and buckets are provisioned. `/health` includes `features.photoStorage`.

## Client modules

- `js/covenant-zip.js` — STORE zip encode/decode
- `js/photo-store.js` — IndexedDB photo blobs + backup collect/import
- `js/sqlite-backup.js` — `.sqlite` + full `.zip` export/import

## Verify

```bash
node scripts/_verify-backup-photos.mjs
npm run verify:cloud-sync   # must stay green
npm run verify:auth         # must stay green (when API up)
```

## What’s next (roadmap)

1. **Portal polish** / richer published blocks  
2. **Vendor portal tokens** (partner invites shipped — [`PARTNER_INVITES.md`](./PARTNER_INVITES.md))  
3. Later: wire real S3/R2 presigned uploads; optional cloud pull of photo metadata alongside other sync domains  

RSVP + gated guest portal foundation: [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md). See [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).

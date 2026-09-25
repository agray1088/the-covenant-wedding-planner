# Backup + photos foundation

Offline-first file backup and a local photo library, plus honest privacy copy and **optional** online object storage (AWS S3 or Cloudflare R2). Users never need Postgres or a bucket on their machine.

Reconnect / demo auth are **unchanged**:
- Demo: `demo@covenant.local` / `covenant-demo` (username `demo`)
- Local API: `http://localhost:18787`
- Reconnect after reboot: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md)

## Privacy (honest)

| Claim | Truth |
|-------|--------|
| Local by default | Planner data + photo blobs live in this browser (localStorage + SQLite + IndexedDB). No account required. |
| Optional cloud | Cloud sync is opt-in. When enabled, **wedding rows you sync are stored** on the API’s managed Postgres. |
| Optional object storage | S3/R2 uploads happen only for opted-in cloud users with a linked wedding. There is **no public listing** of all photos — routes are auth + wedding-membership scoped. |
| We do not sell data | Product stance. |
| Not “we store nothing” | Once cloud backup / sync / object storage is on, we store what you upload. File backups you download stay under your control. |

UI surfaces this in **Settings → Privacy**, the Settings banner, About, and the Cloud sync pane.

## Offline file backup

| Action | Format | Contents |
|--------|--------|----------|
| **Download backup** | `.sqlite` | Full planner database (existing path). Hero / vision base64 already inside SQLite when present. |
| **Download full backup** | `.zip` (`covenant-backup-v1`) | `planner.sqlite` (or `planner.json`) + `photos/*` + `photos-index.json` + `manifest.json` |
| **Restore** | `.zip` / `.sqlite` / `.db` / `.json` | Auto-detect; zip restores planner then re-imports photo blobs into IndexedDB |

Settings → **Backup & restore** (and Overview → Save & backup) wire both download actions and Restore (file input accepts `.zip`).

**Object storage does not replace zip backup.** Full `.zip` still includes local IndexedDB photo binaries.

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
| Cloud upload (optional) | When cloud sync is on + wedding linked, `putFromFile` also calls `CovenantCloudSync.uploadPhoto` — IndexedDB always kept |

## Online object storage (S3 / R2) — polish #2

Postgres table `photos` — **metadata only** (`name`, `mime`, `size_bytes`, `storage_key`, `storage_backend`, `public_url`, …). No base64 blob columns.

When **configured** (`PHOTO_STORAGE=s3|r2` + bucket + access key + secret):
- Upload blobs via authenticated API content PUT **or** presigned S3/R2 PUT
- Store metadata in Postgres
- Return HTTPS `publicUrl` when `S3_PUBLIC_BASE_URL` / `R2_PUBLIC_BASE_URL` / `PHOTO_PUBLIC_BASE_URL` is set
- Guest portal `heroImageUrl` and vendor packet `packetImageUrl` accept those HTTPS URLs (or a wedding-scoped photo id / `idb:…` that resolves to `public_url`)

When **not configured** (`PHOTO_STORAGE=local` or missing credentials):
- Client keeps IndexedDB / local blob store behavior
- `GET /setup/status` reports `objectStorageConfigured: false`
- Offline zip backup unchanged

Routes (auth + wedding membership required — **no public photo directory**):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/weddings/:id/photos` | List metadata for this wedding only |
| POST / PUT | `/weddings/:id/photos[/:photoId]` | Upsert metadata |
| POST | `/weddings/:id/photos/:photoId/upload-url` | Upload strategy (local API path or presigned S3/R2) |
| GET | `/weddings/:id/photos/:photoId/download-url` | Download strategy (public URL or presigned GET) |
| PUT/GET | `/weddings/:id/photos/:photoId/content` | Blob put/get (local disk or server-side S3 PutObject) |
| DELETE | `/weddings/:id/photos/:photoId` | Delete metadata (+ best-effort blob) |
| GET | `/weddings/:id/photos/storage` | Storage config summary (no secrets) |

### Env

```bash
FEATURE_PHOTOS=0          # health flag; routes exist regardless
PHOTO_STORAGE=local       # local | s3 | r2
PHOTO_LOCAL_DIR=          # default server/.photo-blobs

# AWS S3
S3_BUCKET=
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=              # optional custom endpoint
S3_PUBLIC_BASE_URL=       # e.g. https://cdn.example.com — stable guest-facing URLs

# Cloudflare R2 (S3-compatible)
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_REGION=auto
R2_PUBLIC_BASE_URL=       # e.g. https://photos.example.com
# PHOTO_PUBLIC_BASE_URL=  # alias for either
```

Placeholders live in `server/.env.example` and `server/.env.production.example`. **Do not** create the user’s bucket here — operators provision R2/S3, then paste secrets in Railway Variables / `fly secrets set` (see [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)).

`server/lib/object-storage.js` uses `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. `/setup/status` and `/health` expose `objectStorageConfigured` (boolean only — never keys).

## Client modules

- `js/covenant-zip.js` — STORE zip encode/decode
- `js/photo-store.js` — IndexedDB photo blobs + backup collect/import + optional cloud upload
- `js/sqlite-backup.js` — `.sqlite` + full `.zip` export/import
- `js/cloud-sync.js` — `uploadPhoto` / `photosStorage` / `listPhotos`

## Verify

```bash
node scripts/_verify-backup-photos.mjs
node scripts/_verify-object-storage.mjs   # scaffold always; live mocks when no credentials
npm run verify:setup-status               # expects objectStorageConfigured boolean
npm run verify:cloud-sync                 # must stay green
npm run verify:auth                       # must stay green (when API up)
```

## What’s next (roadmap)

1. ~~S3/R2 photo storage foundation~~ (shipped)  
2. ~~Railway/Fly production secrets wiring~~ (shipped — [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md); operator pastes real secrets)  
3. Optional: cloud pull of photo metadata alongside other sync domains  

Vendor portal tokens: [`VENDOR_PORTAL.md`](./VENDOR_PORTAL.md). Partner invites: [`PARTNER_INVITES.md`](./PARTNER_INVITES.md).  
RSVP + gated guest portal: [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md). See [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).

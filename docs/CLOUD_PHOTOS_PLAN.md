# Cloud photos (S3 / Cloudflare R2) — implementation plan

Phased plan for **operator-ready** object storage: portal hero / packet images, optional online photo backup, offline IndexedDB still first. **Docs / plan only** — do not implement new code in a docs pass.

**Align with (do not contradict):**

- Current foundation: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md)
- Env wiring: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md) § optional `PHOTO_STORAGE`
- Privacy / local-first: roadmap step 5 in [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)
- Secret hygiene: [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md)

---

## Status legend

| Mark | Meaning |
|------|---------|
| `[x]` | **DONE** — already in repo |
| `[ ]` | **TODO** — future agent / operator work |
| `(ops)` | Operator dashboard work (bucket / Railway vars), not app code |

---

## Current state (DONE foundation)

Do not rebuild these — extend them.

- [x] Local photo library: IndexedDB (`js/photo-store.js`) + Settings → Photos
- [x] Full backup `.zip` includes `photos/*` + `photos-index.json` (object storage does **not** replace zip)
- [x] Postgres `photos` table = **metadata only** (`storage_key`, `public_url`, …) — no base64 blob columns
- [x] `server/lib/object-storage.js` — `@aws-sdk/client-s3` + presigner; `PHOTO_STORAGE=local|s3|r2`
- [x] Auth + wedding-membership scoped photo routes (no public photo directory)
- [x] Guest portal `heroImageUrl` / vendor `packetImageUrl` can use HTTPS `public_url` when configured
- [x] `/setup/status` → `objectStorageConfigured` boolean; `verify:object-storage` scaffold
- [x] Env placeholders in `server/.env.example` / `.env.production.example` + [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)
- [ ] `(ops)` Real R2/S3 bucket + keys pasted in Railway (out of scope for agents)
- [ ] Optional: richer client “pull all photo metadata on sync” polish
- [ ] Optional: ensure every backup/export path documents cloud vs local clearly in UI copy

When `PHOTO_STORAGE` is unset / `local` / missing credentials: client keeps IndexedDB; zip backup unchanged; `objectStorageConfigured: false`.

---

## Goals

| Goal | Notes |
|------|--------|
| Portal hero / packet images | Stable HTTPS URLs for gated guest portal + vendor packet |
| Online backup of photos | Opt-in cloud users with linked wedding; blobs in private-ish bucket + metadata in Postgres |
| Offline still works | IndexedDB + local zip remain default; no account required for local photos |
| Honest privacy | Once object storage is on, we store what you upload — already in backup/privacy docs |

Non-goals: public wedding photo gallery / SEO index; requiring S3 for desktop-only users; replacing `.zip` backup.

---

## Phases

### Phase 1 — Choose R2 vs S3 `(ops)`

**Goal:** Pick one backend for production.

| Option | When to prefer |
|--------|----------------|
| **Cloudflare R2** | No egress fees for many setups; S3-compatible; common with Railway + custom domain |
| **AWS S3** | Already in AWS; need regional controls / existing IAM |

**Work**

- [ ] `(ops)` Create bucket (private by default)
- [ ] `(ops)` Create API access key with least privilege (Put/Get/Delete on that bucket only)
- [ ] `(ops)` Decide public access path: custom domain / CDN (`R2_PUBLIC_BASE_URL` or `S3_PUBLIC_BASE_URL`) **or** short-lived presigned GET only
- [ ] Record choice in operator notes (not in git secrets)

**Acceptance**

- [ ] Bucket exists; test PutObject / GetObject from a local AWS CLI or dashboard works
- [ ] Public base URL (if any) serves a test object **or** you commit to presigned-only and leave public base empty

**Recommendation:** Prefer **R2** for this product unless the operator is already standardized on AWS.

---

### Phase 2 — Railway / host env `(ops)`

**Goal:** API service reports `objectStorageConfigured: true`.

On the **API** service only (never on `romantic-perception` planner — see [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md)):

**R2 example**

```bash
PHOTO_STORAGE=r2
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_REGION=auto
R2_PUBLIC_BASE_URL=https://photos.example.com
# PHOTO_PUBLIC_BASE_URL=   # optional alias
```

**S3 example**

```bash
PHOTO_STORAGE=s3
S3_BUCKET=
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=https://cdn.example.com
# S3_ENDPOINT=             # only if custom
```

- [ ] `(ops)` Paste vars in Railway Variables (not chat)
- [ ] Redeploy API
- [ ] `GET /setup/status` → `objectStorageConfigured: true`
- [ ] Settings → Cloud sync → Hosted setup checklist shows photos ready

**Acceptance**

- [ ] Health/setup flags true; no keys appear in API JSON responses
- [ ] Misconfigured keys fail clearly in server logs without crashing unrelated routes

---

### Phase 3 — Upload API hardening / gaps

**Goal:** Close any remaining gaps vs [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md) route table. Foundation routes already exist — verify and fill holes only.

Existing routes (auth + membership):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/weddings/:id/photos` | List metadata |
| POST/PUT | `/weddings/:id/photos[/:photoId]` | Upsert metadata |
| POST | `/weddings/:id/photos/:photoId/upload-url` | Presigned or strategy |
| GET | `/weddings/:id/photos/:photoId/download-url` | Public or presigned GET |
| PUT/GET | `/weddings/:id/photos/:photoId/content` | Server-mediated blob |
| DELETE | `/weddings/:id/photos/:photoId` | Metadata + best-effort blob |
| GET | `/weddings/:id/photos/storage` | Config summary (no secrets) |

**Work (only if verify finds gaps)**

- [ ] Confirm size / MIME limits and clear 413/415 errors
- [ ] Confirm delete removes both Postgres row and object (best-effort documented)
- [ ] Confirm wedding membership enforced on every verb
- [ ] Add/adjust `verify:object-storage` live cases when credentials present in CI secrets (optional)

**Acceptance**

- [ ] Authenticated member can upload → list → download URL → delete
- [ ] Non-member receives 401/403
- [ ] `PHOTO_STORAGE=local` path still passes existing verifies

---

### Phase 4 — Client wiring

**Goal:** Opt-in cloud users seamlessly keep IndexedDB **and** upload when configured.

Already partially shipped: `putFromFile` can call `CovenantCloudSync.uploadPhoto` when sync + wedding linked.

**Work**

- [ ] Audit Settings → Photos + hero upload for consistent cloud upload when `objectStorageConfigured`
- [ ] Surface upload failures without wiping local IDB blob
- [ ] Resolve `idb:<photoId>` → `public_url` when publishing portal / vendor packet
- [ ] Optional: pull photo metadata on sync alongside other domains
- [ ] UI copy: “Online photo backup” only when cloud + storage configured; else local-only honesty

**Acceptance**

- [ ] Offline: add/remove photos still works with API down
- [ ] Online + configured: new library photo appears in `GET …/photos` with `storage_key` / `public_url`
- [ ] Failed cloud upload leaves local photo intact + user-visible error

---

### Phase 5 — Backup zip inclusion (unchanged contract)

**Goal:** Keep the offline backup promise.

- [x] Full `.zip` still packs local IndexedDB binaries (`covenant-backup-v1`)
- [ ] Document in Settings that cloud object storage is **additional**, not a substitute for Download full backup
- [ ] Optional later: zip manifest note `cloudPhotoCount` vs local (nice-to-have)

**Acceptance**

- [ ] Restore from `.zip` on a clean profile recovers photos without needing R2/S3
- [ ] Turning object storage on does not empty or skip zip photo entries

---

### Phase 6 — Guest portal + vendor packet URLs

**Goal:** Published hero / packet images load for guests/vendors over HTTPS.

- [x] Foundation accepts HTTPS `public_url` / wedding-scoped photo id
- [ ] Operator verifies CDN/public base or presigned GET works in an incognito window
- [ ] Prefer stable public/CDN URLs for portal (presigned expiry is painful for shared links)
- [ ] Ensure unpublished / draft images are not guessable (unlisted portal already gated — do not list bucket)

**Acceptance**

- [ ] Guest portal shows hero when couple published a cloud-backed image
- [ ] Vendor packet image loads with valid token
- [ ] Direct bucket listing disabled; random key guess returns AccessDenied / 404

---

### Phase 7 — Security / private buckets

**Goal:** Least privilege + no public dump.

- [ ] Bucket **private**; only specific objects readable via CDN rule or presigned URL
- [ ] No `*` principal ListBucket on the internet
- [ ] Keys never in client JS bundles or `/setup/status`
- [ ] Rotate access keys via [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md) if leaked
- [ ] CORS on bucket only if browser PUT-to-presigned is used (restrict to planner origins)
- [ ] Content-Type fixed server-side; block HTML/JS uploads if feasible (serve as attachment / safe types)

**Acceptance**

- [ ] Unauthenticated `GET` of bucket root fails
- [ ] Only wedding members can create upload URLs
- [ ] Guest can fetch **published** image URL only (or token-gated packet), not browse all wedding photos

---

## Acceptance criteria (overall)

- [ ] Local-only users never need a bucket
- [ ] Configured deploy: portal hero + vendor packet can use HTTPS object URLs
- [ ] Offline IndexedDB + full zip backup remain green (`verify:backup-photos`, cloud-sync, auth)
- [ ] `/setup/status.objectStorageConfigured` matches reality
- [ ] Secrets only on API Railway service; never in chat/git/planner static service

---

## Suggested agent / operator order

1. [ ] Read [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md) + this plan  
2. [ ] Phase 1 — choose R2 (recommended) or S3 `(ops)`  
3. [ ] Phase 2 — Railway env + setup status `(ops)`  
4. [ ] Phase 3 — API gap verify / harden  
5. [ ] Phase 4 — client wiring polish  
6. [ ] Phase 5 — confirm zip contract + Settings copy  
7. [ ] Phase 6 — portal / packet URL smoke  
8. [ ] Phase 7 — bucket security review  
9. [ ] Mark checkboxes DONE when complete  

---

## Explicit non-goals (now)

- Implementing new storage backends in a docs-only pass  
- Creating the operator’s Cloudflare/AWS account for them  
- Public multi-wedding photo marketplace  
- Storing photo binaries in Postgres  
- Requiring cloud photos for desktop license ([`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) / [`PRICING_AND_PLANS.md`](./PRICING_AND_PLANS.md) — cloud add-on is separate)

Related: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) · [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md) · [`VENDOR_PORTAL.md`](./VENDOR_PORTAL.md)

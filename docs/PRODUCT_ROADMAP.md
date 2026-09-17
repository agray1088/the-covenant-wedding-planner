# Product roadmap — The Covenant Wedding Planner

Ordered delivery track. Offline-first never regresses: local save + file backup remain the default; cloud is opt-in.

| Step | Theme | Outcome |
|------|--------|---------|
| **1** | **Hosted deploy** | Public HTTPS sync API (+ optional static hosting). Managed Postgres. Users never install a database. **Shipped** (see [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)). |
| **2** | **Real accounts** | Password accounts + Google Sign-In + forgot password/username via email (`PUBLIC_URL` + SMTP / provider). **Foundation shipped** (see [`AUTH.md`](./AUTH.md)): password register/login/username, Google OAuth + SMTP scaffolding; operator still creates Google Cloud / SMTP accounts. |
| **3** | **Offline + backup clarity** | Offline-first preserved; file backup (`.sqlite` + full `.zip` with photos); optional cloud Postgres backup documented honestly. **Shipped** (see [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md)). |
| **4** | **Privacy model** | Local-first, cloud opt-in, no selling data. Honest copy when cloud backup exists (we store what you sync). **Shipped** (Settings → Privacy + banner/About/cloud copy). |
| **5** | **Photos** | Local library (IndexedDB) + zip backup inclusion **shipped**; online object-storage scaffolding (metadata in Postgres, S3/R2 env placeholders) **shipped** — full hosted blob provisioning later. |
| **6** | **RSVP + guest portal** | RSVP emails, guest portal, couple send/monitor controls. Links rooted at `PUBLIC_URL`. *Next.* |
| **7** | **Gated wedding landing** | Unlisted link and/or guest email and/or custom couple code — **not** a public wedding directory. |
| **(+)** | **Partner + vendor** | Partner invites; vendor tokens / portal access (after accounts). |

## Steps 3–5 status (this pass)

| Item | Status |
|------|--------|
| Download `.sqlite` backup + restore | Done (existing; kept) |
| Full `.zip` backup with photos + restore | Done |
| Privacy copy (local default / opt-in cloud / no selling / honest storage) | Done |
| Local photo library (IndexedDB) + Settings → Photos | Done |
| Photos included in file backup export/import | Done |
| Server `photos` metadata table + upload/download strategy | Done |
| S3/R2 env placeholders + local disk backend | Done (SDK/presign wiring later) |
| Demo auth + reconnect docs unchanged | Done |

## Non-goals for this pass

- Fully provisioning S3/R2 buckets or shipping the AWS SDK  
- Full RSVP portal / gated wedding site  
- Breaking existing sync domains  

## Docs

- Backup + photos: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md)  
- Auth (accounts + Google + SMTP): [`AUTH.md`](./AUTH.md)  
- Hosted deploy: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)  
- Offline + cloud sync: [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md)  
- Local reconnect: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md)

# Product roadmap — The Covenant Wedding Planner

Ordered delivery track. Offline-first never regresses: local save + file backup remain the default; cloud is opt-in.

| Step | Theme | Outcome |
|------|--------|---------|
| **1** | **Hosted deploy** | Public HTTPS sync API (+ optional static hosting). Managed Postgres. Users never install a database. **Shipped** (see [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)). |
| **2** | **Real accounts** | Password accounts + Google Sign-In + forgot password/username via email (`PUBLIC_URL` + SMTP / provider). **Foundation shipped** (see [`AUTH.md`](./AUTH.md)): password register/login/username, Google OAuth + SMTP scaffolding; operator still creates Google Cloud / SMTP accounts. |
| **3** | **Offline + backup clarity** | Offline-first preserved; file backup (`.sqlite` + full `.zip` with photos); optional cloud Postgres backup documented honestly. **Shipped** (see [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md)). |
| **4** | **Privacy model** | Local-first, cloud opt-in, no selling data. Honest copy when cloud backup exists (we store what you sync). **Shipped** (Settings → Privacy + banner/About/cloud copy). |
| **5** | **Photos** | Local library (IndexedDB) + zip backup inclusion **shipped**; online object-storage scaffolding (metadata in Postgres, S3/R2 env placeholders) **shipped** — full hosted blob provisioning later. |
| **6** | **RSVP + guest portal** | RSVP emails, guest token forms, couple send/monitor controls. Links rooted at `PUBLIC_URL`. **Foundation shipped** (see [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md)). |
| **7** | **Gated wedding landing** | Unlisted link and/or guest email and/or custom couple code — **not** a public wedding directory. **Foundation shipped** (same doc). |
| **(+)** | **Partner + vendor** | Partner invites; vendor tokens / portal access (after accounts). |

## Steps 6–7 status (this pass)

| Item | Status |
|------|--------|
| Guest `rsvp_token` + generate/rotate | Done |
| Public RSVP HTML/JSON + POST write-back to guests | Done |
| Couple send/remind (user action only) + `outbound_emails` log | Done |
| SMTP reuse + clear 503 when unset | Done |
| Gated portal (`/p/:slug`) — unlisted / email / code | Done |
| Published fields only (`portal_published_json`) | Done |
| Settings UI: RSVP & guest portal | Done |
| `verify:rsvp` | Done |
| Fancy multi-template website builder | Out of scope |
| Partner invites / vendor tokens | Later |
| Provisioning user SMTP/Google in cloud | Out of scope |

## Non-goals for this pass

- Fully provisioning S3/R2 buckets or shipping the AWS SDK  
- Multi-template wedding site builder / marketing redesign  
- Breaking existing sync domains  

## Docs

- RSVP + gated portal: [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md)  
- Backup + photos: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md)  
- Auth (accounts + Google + SMTP): [`AUTH.md`](./AUTH.md)  
- Hosted deploy: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)  
- Offline + cloud sync: [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md)  
- Local reconnect: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md)

# Product roadmap — The Covenant Wedding Planner

Ordered delivery track. Offline-first never regresses: local save + file backup remain the default; cloud is opt-in.

| Step | Theme | Outcome |
|------|--------|---------|
| **1** | **Hosted deploy** | Public HTTPS sync API (+ optional static hosting). Managed Postgres. Users never install a database. **Shipped** (see [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)). |
| **2** | **Real accounts** | Password accounts + Google Sign-In + forgot password/username via email (`PUBLIC_URL` + SMTP / provider). **Foundation shipped** (see [`AUTH.md`](./AUTH.md)): password register/login/username, Google OAuth + SMTP scaffolding; operator still creates Google Cloud / SMTP accounts. |
| **3** | **Offline + backup clarity** | Offline-first preserved; file backup (`.sqlite` + full `.zip` with photos); optional cloud Postgres backup documented honestly. **Shipped** (see [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md)). |
| **4** | **Privacy model** | Local-first, cloud opt-in, no selling data. Honest copy when cloud backup exists (we store what you sync). **Shipped** (Settings → Privacy + banner/About/cloud copy). |
| **5** | **Photos** | Local library (IndexedDB) + zip backup inclusion **shipped**; S3/R2 object storage (metadata in Postgres, HTTPS public URLs for portal hero / packet assets) **shipped** — operator still provisions the bucket. |
| **6** | **RSVP + guest portal** | RSVP emails, guest token forms, couple send/monitor controls. Links rooted at `PUBLIC_URL`. **Foundation shipped** (see [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md)). |
| **7** | **Gated wedding landing** | Unlisted link and/or guest email and/or custom couple code — **not** a public wedding directory. **Foundation shipped** (same doc). |
| **8** | **Partner invites** | Invite spouse/planner to the same wedding (`owner` / `partner` / `planner`). **Shipped** (see [`PARTNER_INVITES.md`](./PARTNER_INVITES.md)). |
| **9** | **Vendor portal** | Vendor tokens / scoped portal access. **Shipped** (see [`VENDOR_PORTAL.md`](./VENDOR_PORTAL.md)). |

## Vendor portal status (this pass)

| Item | Status |
|------|--------|
| `vendor_portal_tokens` schema | Done |
| Create / list / revoke / rotate APIs | Done |
| Public GET scoped packet by token | Done |
| Email when SMTP set; portal URL always returned | Done |
| Settings → Vendor portal UI | Done |
| Wire `vendor-portal.html` to cloud tokens | Done |
| Richer packet blocks (arrival / parking / day notes + scopes) | Done |
| `verify:vendor-portal` | Done |
| Vendor password accounts | Out of scope |
| Payment processing | Out of scope |

## Partner invites status

| Item | Status |
|------|--------|
| Extend `memberships` (token, status, invited_email, role) | Done |
| Create / list / accept / revoke / list members APIs | Done |
| Email when SMTP set; invite URL always returned | Done |
| Settings → Partner invites UI | Done |
| Partner cannot revoke owner | Done |
| `verify:partner-invite` | Done |
| Complex RBAC matrix | Out of scope |

## Steps 6–7 status

| Item | Status |
|------|--------|
| Guest `rsvp_token` + generate/rotate | Done |
| Public RSVP HTML/JSON + POST write-back to guests | Done |
| Couple send/remind (user action only) + `outbound_emails` log | Done |
| SMTP reuse + clear 503 when unset | Done |
| Gated portal (`/p/:slug`) — unlisted / email / code | Done |
| Published fields only (`portal_published_json`) | Done |
| Richer published blocks (travel, lodging, registry, FAQ, hero URL, toggles) | Done |
| Settings UI: RSVP & guest portal | Done |
| `verify:rsvp` | Done |
| Fancy multi-template website builder | Out of scope |

## Non-goals for this pass

- Creating the operator’s cloud accounts or pasting their real Railway/Fly/Google/SMTP/R2 secrets (docs + templates only)  
- Buying custom domains  
- Multi-template wedding site builder / marketing redesign  
- Breaking existing sync domains or offline zip backup  
- Vendor password accounts / payment processing  

## Cloud track — major polish trio complete

Major cloud roadmap items (hosted deploy, accounts, backup/photos clarity, privacy, RSVP + gated landing, partner invites, vendor portal tokens) are **shipped as foundations**. Guest + vendor portals support **richer published blocks**. **Polish trio done:** (1) hosted secrets checklist UX, (2) S3/R2 photo storage foundation, (3) Railway/Fly deploy wiring docs + config. Operator still pastes Google + SMTP (+ optional R2/S3) secrets in the host dashboard — see [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md).

## Hosted secrets checklist (polish #1)

| Item | Status |
|------|--------|
| `GET /setup/status` (booleans only — no secret values) | Done |
| Settings → Cloud sync → Hosted setup checklist | Done |
| Disable / explain Google Sign-In when OAuth unset | Done |
| Disable / explain RSVP send when SMTP unset | Done |
| Docs cross-links (`AUTH.md`, `HOSTED_DEPLOY.md`) | Done |
| `verify:setup-status` | Done |
| S3/R2 photo storage (`objectStorageConfigured`) | **Done** (polish #2) |
| Railway/Fly production secrets wiring | **Done** (polish #3) |

## S3 / R2 photo storage (polish #2)

| Item | Status |
|------|--------|
| Env placeholders (bucket, region, endpoint, keys, public base URL) | Done |
| `@aws-sdk/client-s3` PutObject / GetObject / DeleteObject + presigned URLs | Done |
| Postgres `photos.public_url` metadata | Done |
| Portal hero + vendor `packetImageUrl` resolve cloud HTTPS URLs | Done |
| Local IndexedDB offline path preserved; zip backup still includes local photos | Done |
| `/setup/status` → `objectStorageConfigured` | Done |
| `verify:object-storage` (scaffold + skip without credentials) | Done |
| Operator creates R2/S3 bucket | Out of scope (operator) |
| Railway/Fly secret injection docs + templates | **Done** (polish #3) |

## Railway / Fly deploy wiring (polish #3)

| Item | Status |
|------|--------|
| End-to-end `HOSTED_DEPLOY.md` (Railway preferred + Fly) | Done |
| `railway.toml` / `fly.toml` comment checklists for every required var | Done |
| `server/.env.production.example` + Dockerfile env comments | Done |
| Google redirect URI + SMTP + optional PHOTO_STORAGE steps | Done |
| Verify `/health` + `/setup/status`; point planner at HTTPS `PUBLIC_URL` | Done |
| Settings checklist deploy tips | Done |
| Operator pastes real secrets in host dashboard | Out of scope (operator) |
| Buying domains / creating cloud accounts for the user | Out of scope |

## Docs

- Vendor portal: [`VENDOR_PORTAL.md`](./VENDOR_PORTAL.md)  
- Partner invites: [`PARTNER_INVITES.md`](./PARTNER_INVITES.md)  
- RSVP + gated portal: [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md)  
- Backup + photos: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md)  
- Auth (accounts + Google + SMTP): [`AUTH.md`](./AUTH.md)  
- Hosted deploy: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)  
- Offline + cloud sync: [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md)  
- Local reconnect: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md)

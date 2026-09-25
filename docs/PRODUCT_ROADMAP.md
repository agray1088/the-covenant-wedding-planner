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

- Fully provisioning S3/R2 buckets or shipping the AWS SDK  
- Multi-template wedding site builder / marketing redesign  
- Breaking existing sync domains  
- Vendor password accounts / payment processing  

## Cloud track — largely complete

Major cloud roadmap items (hosted deploy, accounts, backup/photos clarity, privacy, RSVP + gated landing, partner invites, vendor portal tokens) are **shipped as foundations**. Guest + vendor portals now support **richer published blocks**. **Hosted secrets checklist UX shipped** (Settings → Cloud sync → live `GET /setup/status` for PUBLIC_URL / Google / SMTP). Remaining polish: optional S3/R2 provisioning for portal hero photos, then actual Railway/Fly deploy wiring with real secrets.

## Hosted secrets checklist (polish #1)

| Item | Status |
|------|--------|
| `GET /setup/status` (booleans only — no secret values) | Done |
| Settings → Cloud sync → Hosted setup checklist | Done |
| Disable / explain Google Sign-In when OAuth unset | Done |
| Disable / explain RSVP send when SMTP unset | Done |
| Docs cross-links (`AUTH.md`, `HOSTED_DEPLOY.md`) | Done |
| `verify:setup-status` | Done |
| S3/R2 photo storage provisioning | **Next** (not this pass) |
| Railway/Fly production secrets wiring | **Next** after S3 |

## Docs

- Vendor portal: [`VENDOR_PORTAL.md`](./VENDOR_PORTAL.md)  
- Partner invites: [`PARTNER_INVITES.md`](./PARTNER_INVITES.md)  
- RSVP + gated portal: [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md)  
- Backup + photos: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md)  
- Auth (accounts + Google + SMTP): [`AUTH.md`](./AUTH.md)  
- Hosted deploy: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)  
- Offline + cloud sync: [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md)  
- Local reconnect: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md)

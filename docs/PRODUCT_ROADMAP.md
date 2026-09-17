# Product roadmap — The Covenant Wedding Planner

Ordered delivery track. Offline-first never regresses: local save + file backup remain the default; cloud is opt-in.

| Step | Theme | Outcome |
|------|--------|---------|
| **1** | **Hosted deploy** | Public HTTPS sync API (+ optional static hosting). Managed Postgres. Users never install a database. **Shipped** (see [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)). |
| **2** | **Real accounts** | Password accounts + Google Sign-In + forgot password/username via email (`PUBLIC_URL` + SMTP / provider). **In progress — foundation shipped** (see [`AUTH.md`](./AUTH.md)): password register/login/username, Google OAuth + SMTP scaffolding; operator still creates Google Cloud / SMTP accounts. |
| **3** | **Offline + backup clarity** | Offline-first preserved; file backup (no Postgres on client); optional cloud Postgres backup documented honestly. *Next.* |
| **4** | **Privacy model** | Local-first, cloud opt-in, no selling data. Honest copy when cloud backup exists (we store what you sync). |
| **5** | **Photos** | Local library first; online object-storage backup later. |
| **6** | **RSVP + guest portal** | RSVP emails, guest portal, couple send/monitor controls. Links rooted at `PUBLIC_URL`. |
| **7** | **Gated wedding landing** | Unlisted link and/or guest email and/or custom couple code — **not** a public wedding directory. |
| **(+)** | **Partner + vendor** | Partner invites; vendor tokens / portal access (after accounts). |

## Step 2 status (this pass)

| Item | Status |
|------|--------|
| Email/username + password register & login | Done |
| Demo account (`demo@covenant.local` / `covenant-demo`) | Done (local) |
| Google Sign-In code path + env + docs | Done (needs operator secrets) |
| Forgot password / forgot username API + UI | Done (needs SMTP) |
| Offline without login | Preserved |

## Non-goals for step 2

- Creating the operator’s Google Cloud or SMTP accounts for them  
- Full RSVP portal / wedding site / photo object storage / partner invites  

## Docs

- Auth (accounts + Google + SMTP): [`AUTH.md`](./AUTH.md)  
- Hosted deploy: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)  
- Offline + cloud sync: [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md)  
- Local reconnect: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md)

# Product roadmap — The Covenant Wedding Planner

Ordered delivery track. Offline-first never regresses: local save + file backup remain the default; cloud is opt-in.

| Step | Theme | Outcome |
|------|--------|---------|
| **1** | **Hosted deploy** | Public HTTPS sync API (+ optional static hosting). Managed Postgres. Users never install a database. *This pass.* |
| **2** | **Real accounts** | Password accounts + Google Sign-In + forgot password/username via email (`PUBLIC_URL` + SMTP / provider). |
| **3** | **Offline + backup clarity** | Offline-first preserved; file backup (no Postgres on client); optional cloud Postgres backup documented honestly. |
| **4** | **Privacy model** | Local-first, cloud opt-in, no selling data. Honest copy when cloud backup exists (we store what you sync). |
| **5** | **Photos** | Local library first; online object-storage backup later. |
| **6** | **RSVP + guest portal** | RSVP emails, guest portal, couple send/monitor controls. Links rooted at `PUBLIC_URL`. |
| **7** | **Gated wedding landing** | Unlisted link and/or guest email and/or custom couple code — **not** a public wedding directory. |
| **(+)** | **Partner + vendor** | Partner invites; vendor tokens / portal access (after accounts). |

## Non-goals for step 1

- Full Google OAuth UI/flows  
- Full email sending / RSVP portal UI  
- Photo object storage  
- Provisioning the operator’s cloud account for them (secrets checklist only)

## Docs

- Hosted deploy: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)  
- Offline + cloud sync: [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md)  
- Local reconnect: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md)

# Secret rotation plan (operator checklist)

Checkbox runbook for rotating secrets after a **Railway incident (Oct 2025 / 2026)** and/or **secrets pasted into chat**. Written for a non-expert Windows operator. Do **not** implement app code here — only rotate credentials and verify.

**Related:** [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md) · [`DEPLOY_WALKTHROUGH.md`](./DEPLOY_WALKTHROUGH.md) · [`AUTH.md`](./AUTH.md) · [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md) · [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) (when Stripe exists)

---

## Before you start — read this

1. **Never paste secrets into Cursor chat, GitHub issues, Discord, email drafts, or screenshots.** Generate or copy them only inside Railway / Google / Resend dashboards (or a local password manager).
2. Two Railway services are **not** the same:
   - **API** (`the-covenant-wedding-planner` or similar) — needs `DATABASE_URL`, `SESSION_SECRET`, Google, Resend/SMTP, optional photo keys, later Stripe.
   - **Planner page** (`romantic-perception` or similar) — **static only**. Usually only `API_BASE_URL`. Do **not** put `DATABASE_URL`, `SESSION_SECRET`, Google, Resend, or Stripe secrets on the planner service.
3. **Postgres recreate = data loss** for cloud-synced wedding rows unless you restore a backup first. Prefer **password rotate** when Railway allows it. Recreate only if the DB may be compromised and you accept wiping cloud data (local desktop zip backups are separate).
4. Work one secret at a time when possible; redeploy; verify; then next secret.

---

## Status legend

| Mark | Meaning |
|------|---------|
| `[ ]` | Still to do |
| `[x]` | Done (check off as you go) |

---

## A. Prep (Windows)

- [ ] Open Railway dashboard in a browser (signed in as the project owner)
- [ ] Open a Notepad / password-manager note **offline** if you must stage values — delete after paste into Railway
- [ ] Download a **local** wedding backup from the planner (**Settings → Backup & restore → Download full backup**) before touching Postgres
- [ ] Confirm which service is API vs planner (`romantic-perception` = planner static)
- [ ] Optional: open GitHub → repo → **Settings → Secrets** / **Security → log** if you also stored cloud secrets in Actions (usually you should not)

---

## B. Postgres (`DATABASE_URL`)

### Prefer: rotate password (keeps data)

- [ ] In Railway → Postgres plugin → credentials / variables → **rotate password** or change password if the UI offers it
- [ ] Confirm the **API** service still has:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

  (or the Railway “reference” to the Postgres variable — do **not** paste a raw URL into chat)

- [ ] Set / keep `DATABASE_SSL=1` on the API
- [ ] Redeploy API
- [ ] Hit `https://<your-api-host>/health` → expect `ok`

### Only if required: recreate Postgres (**destroys cloud DB data**)

- [ ] Confirm you have local `.zip` / `.sqlite` backups for any wedding you care about
- [ ] Delete / recreate Railway Postgres **or** provision a new Postgres and re-link
- [ ] Re-link so API gets `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- [ ] Redeploy API (schema should migrate on boot if the app does that)
- [ ] Re-create any cloud accounts / re-sync from clients as needed
- [ ] Accept that previous cloud rows / sessions / tokens are gone unless restored from a DB dump you already had

---

## C. `SESSION_SECRET`

- [ ] On a machine with OpenSSL (Git Bash / WSL on Windows is fine), generate a new value:

```bash
openssl rand -hex 32
```

- [ ] Railway → **API** service → Variables → set `SESSION_SECRET` to the new value (paste only in Railway)
- [ ] Redeploy API
- [ ] **Expect:** existing browser / app cloud sessions invalidate — users sign in again
- [ ] Verify `/health` still `ok`
- [ ] Sign in again (password or Google) and confirm sync still works

**Do not** set `SESSION_SECRET` on the `romantic-perception` planner service.

---

## D. Google OAuth (`GOOGLE_CLIENT_SECRET`)

- [ ] [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth **Web** client
- [ ] Reset / rotate **Client secret** (create new secret; disable old if offered)
- [ ] Copy **Client ID** (usually unchanged) + **new Client secret** into Railway **API** Variables:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- [ ] Confirm redirect URI still exactly: `https://<API-PUBLIC_URL>/auth/google/callback`
- [ ] Redeploy API
- [ ] Planner → Settings → Cloud sync → **Continue with Google** → succeeds
- [ ] `GET /setup/status` (or Settings hosted checklist) shows Google configured

---

## E. Email — prefer Resend; remove SMTP if unused

### Resend API (recommended on Railway)

- [ ] Resend dashboard → API Keys → **create new key**; revoke the old key
- [ ] Railway **API** → set `RESEND_API_KEY` to the new key
- [ ] Set / confirm `EMAIL_FROM` (verified domain), e.g. `The Covenant <noreply@your-domain>`
- [ ] If you are **not** using SMTP anymore:
  - [ ] Delete `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE` from the API service (avoids stale leaked SMTP creds)
- [ ] Redeploy API
- [ ] Settings → Cloud sync → Hosted setup checklist → **Send test email** (signed in)
- [ ] Confirm `/setup/status` → `emailTransport: "resend-api"` (or checklist shows Resend)

### If you still need SMTP instead

- [ ] Rotate SMTP password / API key at the provider
- [ ] Update `SMTP_USER` / `SMTP_PASS` (and host/port/from) on API only
- [ ] Redeploy + send test email

---

## F. Optional photo storage keys

Only if `PHOTO_STORAGE=s3|r2` is in use ([`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md), [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)):

- [ ] Rotate R2 or S3 access key at Cloudflare / AWS
- [ ] Update matching `R2_*` or `S3_*` vars on the **API** service
- [ ] Redeploy; confirm `/setup/status` → `objectStorageConfigured: true`
- [ ] Upload or open a portal hero URL still works

If photos were never configured, skip this section.

---

## G. Stripe (when commerce exists)

If Stripe keys were ever leaked or you completed [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md):

- [ ] Stripe Dashboard → Developers → API keys → roll secret key
- [ ] Roll webhook signing secret; update endpoint if needed
- [ ] Update Railway API: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price ids if changed
- [ ] Redeploy; run a **test-mode** Checkout smoke

---

## H. Verify end-to-end (after rotations)

Do these from the planner pointed at your HTTPS API:

- [ ] `GET https://<API>/health` → `ok`
- [ ] `GET https://<API>/setup/status` → expected booleans (Google, email, object storage)
- [ ] Password or Google **sign-in** works
- [ ] **Send test email** succeeds
- [ ] **Cloud sync** push/pull for a test wedding succeeds
- [ ] Planner page (`romantic-perception`) still loads; its Variables still **lack** API secrets
- [ ] Optional: RSVP / invite send if you use those features

---

## I. Planner vs API variables (do not mix)

| Variable | API service | Planner (`romantic-perception`) |
|----------|-------------|----------------------------------|
| `DATABASE_URL` | Yes (`${{Postgres.DATABASE_URL}}`) | **No** |
| `SESSION_SECRET` | Yes | **No** |
| `GOOGLE_CLIENT_*` | Yes | **No** |
| `RESEND_API_KEY` / `SMTP_*` / `EMAIL_FROM` | Yes | **No** |
| `PHOTO_STORAGE` / `R2_*` / `S3_*` | Yes (optional) | **No** |
| `STRIPE_*` | Yes (when commerce) | **No** |
| `PUBLIC_URL` / `CORS_ORIGIN` / `CLIENT_APP_URL` | Yes | **No** |
| `API_BASE_URL` | No (or unused) | **Yes** (planner → API origin) |

If the planner logs show `[covenant-sync]` or `SESSION_SECRET is unset`, the planner is on the wrong Docker/config — fix Config-as-code per [`DEPLOY_WALKTHROUGH.md`](./DEPLOY_WALKTHROUGH.md) §14; do not “fix” it by pasting API secrets onto the planner.

---

## J. Optional hygiene

- [ ] GitHub → review recent commits / Actions logs for accidentally committed `.env` (remove + rotate if found)
- [ ] Railway → account / project tokens: rotate personal Railway tokens if they were shared in chat
- [ ] Revoke old Google client secrets left enabled
- [ ] Revoke old Resend keys
- [ ] Clear chat transcripts that contain secrets (treat them as compromised — rotation above is the real fix)
- [ ] Update any local `server/.env` copies on your PC (never commit); match new values or delete local prod copies

---

## Quick order (copy this)

1. [ ] Local full backup download  
2. [ ] Postgres password rotate **or** recreate (know the data-loss risk) + `DATABASE_URL=${{Postgres.DATABASE_URL}}`  
3. [ ] New `SESSION_SECRET` on API  
4. [ ] New `GOOGLE_CLIENT_SECRET`  
5. [ ] New `RESEND_API_KEY` + `EMAIL_FROM`; remove unused `SMTP_*`  
6. [ ] Optional R2/S3 + Stripe rotations  
7. [ ] Verify `/health`, Google sign-in, test email, sync  
8. [ ] Confirm planner service has **no** API secrets  

---

## Explicit non-goals

- Agents logging into your Railway / Google / Resend for you  
- Committing real secrets into the repo  
- Mixing planner (`romantic-perception`) and API env vars  
- “Fixing” a leak by only deleting the chat message without rotating keys  

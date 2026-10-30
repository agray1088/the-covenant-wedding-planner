# Real accounts (roadmap step 2)

Password accounts, Google Sign-In, and email recovery for optional cloud sync. The planner stays **offline-first** — auth is only needed when a couple opts into cloud.

Local demo still works:

| Field | Value |
|-------|--------|
| Email | `demo@covenant.local` |
| Username | `demo` |
| Password | `covenant-demo` |
| API | `http://localhost:18787` (Docker Compose host port) |

## What shipped

| Capability | Status |
|------------|--------|
| Email/username + password register / login / logout / me | **Done** |
| Demo bootstrap user | **Done** (local Docker) |
| Google Sign-In (OAuth authorization code) | **Scaffold + code path** — needs your Google Cloud client |
| Forgot password (request + confirm) | **Done** — needs SMTP to send mail |
| Forgot username | **Done** — needs SMTP to send mail |
| Offline without login | **Unchanged** |

## API surface

| Method | Path | Notes |
|--------|------|--------|
| GET | `/setup/status` | Public: hosted secrets checklist flags (`googleConfigured`, `smtpConfigured`, `publicUrlConfigured`, `publicUrl`, `objectStorageConfigured`) — **booleans / PUBLIC_URL only**, never secret values |
| GET | `/health` | Liveness + same capability flags under `features` |
| GET | `/auth/config` | Public: password/google/smtp capability flags + redirect hints |
| POST | `/auth/register` | `{ email, password, username?, displayName? }` |
| POST | `/auth/login` | `{ email\|username\|login, password }` |
| POST | `/auth/logout` | Bearer token |
| GET | `/auth/me` | Current user |
| POST | `/auth/forgot-password` | `{ email }` → 503 `smtp_not_configured` if SMTP unset |
| POST | `/auth/reset-password` | `{ token, password }` |
| GET | `/auth/reset-password?token=` | Minimal HTML form on the API host |
| POST | `/auth/forgot-username` | `{ email }` → 503 if SMTP unset |
| GET | `/auth/google` | Redirects to Google (503 if not configured) |
| GET | `/auth/google/callback` | OAuth callback → redirects to planner with `?cloudToken=` |

Sessions remain opaque bearer tokens in `sessions` (same as step 1). Passwords are bcrypt-hashed. Reset / OAuth state tokens are stored hashed in `auth_tokens`.

## Env vars

See `server/.env.example` and `server/.env.production.example`.

### Core (already required for hosted)

- `PUBLIC_URL` — HTTPS (or local `http://127.0.0.1:18787`) origin of the **API**, no trailing slash  
- `CORS_ORIGIN` — planner UI origin(s)  
- `CLIENT_APP_URL` — optional; where Google redirects after login (defaults to first `CORS_ORIGIN`)  
- `SESSION_DAYS` — session lifetime (default 30)

### Google Sign-In

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=          # optional override; default ${PUBLIC_URL}/auth/google/callback
FEATURE_GOOGLE_AUTH=1         # optional; omit to auto-enable when ID+secret are set
                              # set 0 to force-disable even if secrets exist
```

### SMTP (password reset + username reminder)

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@example.com
SMTP_SECURE=0                 # set 1 for port 465
FEATURE_EMAIL=1               # optional; omit to auto-enable when SMTP_HOST is set
                              # set 0 to force-disable
```

The API uses a built-in SMTP client (STARTTLS on 587, implicit TLS on 465) with timeouts, or the Resend HTTPS API when `RESEND_API_KEY` is set.

```
RESEND_API_KEY=               # preferred when set; HTTPS, not blocked like SMTP ports
EMAIL_FROM=The Covenant <noreply@your-domain>   # falls back to SMTP_FROM
```

## Google Cloud Console checklist

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Configure the **OAuth consent screen** (External or Internal). Add scopes: `openid`, `email`, `profile`.
3. Create **OAuth client ID** → Application type **Web application**.
4. **Authorized JavaScript origins** (optional for this server-side flow): your planner origin(s), e.g. `http://localhost:8000`, `https://app.example.com`.
5. **Authorized redirect URIs** — must match exactly:
   - Local: `http://127.0.0.1:18787/auth/google/callback`
   - Hosted: `https://<your-PUBLIC_URL>/auth/google/callback`
6. Copy Client ID + Client Secret into Railway/Fly/Compose env.
7. Set `PUBLIC_URL` to the same origin used in the redirect URI (no trailing slash).
8. Set `CLIENT_APP_URL` (or `CORS_ORIGIN`) to the planner origin so the callback can return `?cloudToken=…`.
9. Restart the API. `GET /auth/config` should show `google.configured: true`.
10. In the planner: Settings → Cloud sync → **Continue with Google**.

Do **not** put production Google secrets in the local demo compose file committed to git.

## SMTP checklist

1. Use any transactional SMTP (SendGrid, Mailgun, Amazon SES, Postmark, workspace SMTP, etc.).
2. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
3. Ensure `PUBLIC_URL` is reachable from the user’s browser (reset emails include `${PUBLIC_URL}/auth/reset-password?token=…`).
4. Restart API. `GET /auth/config` → `email.configured: true`.
5. Settings → Cloud sync → **Send reset email** / **Send username reminder**.

Without SMTP, those endpoints return **503** with `error: "smtp_not_configured"` and a clear message. The UI still exposes the buttons so wiring secrets is enough — no further code deploy required.

## Email transport, test email, and troubleshooting

Transport selection (`GET /setup/status` -> `emailTransport`): `resend-api` when `RESEND_API_KEY` is set (preferred, plain HTTPS to `https://api.resend.com/emails`), else `smtp` when `SMTP_HOST` is set, else `none`. Set `EMAIL_FROM` (falls back to `SMTP_FROM`) for the sender. `smtpConfigured` in `/setup/status` means "some email transport works"; `resendConfigured` / `smtpHostConfigured` show which.

- **Timeouts:** SMTP connect fails after 10s (`SMTP_CONNECT_TIMEOUT_MS`), each SMTP reply after 15s (`SMTP_IO_TIMEOUT_MS`); the Resend API call after 15s (`EMAIL_API_TIMEOUT_MS`).
- **Logging:** every attempt writes `[covenant-mail] kind=... to=j***@domain transport=... result=attempt|sent|failed code=... message=...`. Recipient is masked; keys, passwords, tokens, and reset links are never logged.
- **Forgot password / username** always return the generic "If an account exists..." message. Failures are logged and recorded in `outbound_emails` (`status=failed`, `error`) instead of being shown to the caller.
- **Send test email:** Settings -> Cloud sync -> Hosted setup checklist -> **Send test email** (sign in first) calls authenticated `POST /setup/test-email`, sends to your own account email, and shows the real result/error.
- **Resend test sender:** `onboarding@resend.dev` only delivers to the email address of the Resend account owner until you verify a domain.
- **Railway SMTP caveat:** outbound SMTP ports may be blocked on some plans (e.g. Free/Trial/Hobby), which shows up as timeouts. HTTPS (`RESEND_API_KEY`) is not affected.
- Where to look: Railway -> your service -> **Deployments -> View logs** (search `covenant-mail`), and Resend dashboard -> **Logs** / **Emails**.

| Symptom (server log `[covenant-mail] ... result=failed`) | Likely cause | Fix |
|---|---|---|
| `code=smtp_connect_timeout` / `smtp_timeout` / `smtp_connect_failed` | Host may block outbound SMTP ports (25/465/587) on some plans (Railway has restricted SMTP on some plan tiers — check current docs) | Set `RESEND_API_KEY` to use HTTPS instead, or upgrade/choose a host that allows SMTP |
| `code=smtp_auth_failed` (535) or `resend_rejected` with 401 | Wrong `SMTP_USER`/`SMTP_PASS`, or revoked/mistyped API key | Re-create the key in the provider dashboard and update Railway Variables |
| `resend_rejected` 403 "only send testing emails to your own email address" / SMTP 550 | Using `onboarding@resend.dev` with a recipient that is not the Resend account owner | Verify a domain in Resend and set `EMAIL_FROM=The Covenant <noreply@your-domain>`; or test with the account owner's email |
| `resend_rejected` 403 "domain is not verified" | `EMAIL_FROM` domain not verified | Finish DNS verification in Resend |
| `result=sent` but nothing in inbox | Spam folder, or provider-side bounce | Check spam; check Resend dashboard -> Logs / Emails for delivery status |
| No `[covenant-mail]` line at all | Account does not exist for that address (forgot-password stays generic by design), or no transport configured (`/setup/status` -> `emailTransport: "none"`) | Use **Send test email** (signed in) to verify the transport |

## Security notes

- Prefer HTTPS `PUBLIC_URL` for any internet-facing deploy.
- Never enable `BOOTSTRAP_PASSWORD` on a public multi-tenant host used by real couples.
- Reset tokens are single-use, hashed at rest, short-lived (default 2 hours via `PASSWORD_RESET_HOURS`).
- Google-only accounts may have `password_hash = NULL`; they sign in via Google until a password is set through a future “set password” flow (not in this pass).
- CORS still restricts browser origins; OAuth state is one-time to mitigate CSRF.
- **No support backdoor:** never unlock accounts or share passwords because someone claims they lost access in chat — use forgot-password (email ownership) or audited admin only. Full policy: [`SECURITY_PLAN.md`](./SECURITY_PLAN.md). Rotate leaked secrets with [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md).

## Client (Settings → Cloud sync)

- **Hosted setup checklist** — live readiness for `PUBLIC_URL`, Google OAuth, SMTP, and optional S3/R2 (`objectStorageConfigured` from `GET /setup/status`). Disables Continue with Google / forgot-password email when those secrets are missing, with links to this doc and [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md).
- Sign in with **email or username** + password  
- Register with email + password + optional username  
- **Continue with Google** (redirect; disabled in UI until configured)  
- Forgot password / forgot username (disabled in UI until SMTP)  
- Reset-with-token fields (also picks up `?cloudResetToken=` / `?cloudToken=` from redirects)

Session storage keys unchanged: `covenant_cloud_token`, `covenant_cloud_user`, etc.

## Verify

```bash
# Docker API up
curl -s http://127.0.0.1:18787/health
curl -s http://127.0.0.1:18787/setup/status
curl -s http://127.0.0.1:18787/auth/config

# Demo login
curl -s -X POST http://127.0.0.1:18787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@covenant.local","password":"covenant-demo"}'

# Or: node scripts/_verify-auth.mjs
# Or: node scripts/_verify-setup-status.mjs
```

Google / live SMTP paths are manual once secrets exist (see checklists above).

## What’s next

**Polish trio done** (hosted checklist + S3/R2 foundation + Railway/Fly deploy wiring). Paste Google + SMTP (+ optional R2/S3) secrets in your host dashboard — guided: [`DEPLOY_WALKTHROUGH.md`](./DEPLOY_WALKTHROUGH.md); reference: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md). RSVP portal: [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md). Backup/photos: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md). Security / social-engineering policy: [`SECURITY_PLAN.md`](./SECURITY_PLAN.md). See [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).

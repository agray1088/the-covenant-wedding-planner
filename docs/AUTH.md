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

Optional: install `nodemailer` in `server/` for a more robust SMTP client. Without it, the API uses a built-in STARTTLS sender.

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

## Security notes

- Prefer HTTPS `PUBLIC_URL` for any internet-facing deploy.
- Never enable `BOOTSTRAP_PASSWORD` on a public multi-tenant host used by real couples.
- Reset tokens are single-use, hashed at rest, short-lived (default 2 hours via `PASSWORD_RESET_HOURS`).
- Google-only accounts may have `password_hash = NULL`; they sign in via Google until a password is set through a future “set password” flow (not in this pass).
- CORS still restricts browser origins; OAuth state is one-time to mitigate CSRF.

## Client (Settings → Cloud sync)

- Sign in with **email or username** + password  
- Register with email + password + optional username  
- **Continue with Google** (redirect)  
- Forgot password / forgot username  
- Reset-with-token fields (also picks up `?cloudResetToken=` / `?cloudToken=` from redirects)

Session storage keys unchanged: `covenant_cloud_token`, `covenant_cloud_user`, etc.

## Verify

```bash
# Docker API up
curl -s http://127.0.0.1:18787/health
curl -s http://127.0.0.1:18787/auth/config

# Demo login
curl -s -X POST http://127.0.0.1:18787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@covenant.local","password":"covenant-demo"}'

# Or: node scripts/_verify-auth.mjs
```

Google / live SMTP paths are manual once secrets exist (see checklists above).

## What’s next

Roadmap **steps 6–7 foundation shipped** — RSVP + gated guest portal: [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md). Backup/photos: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md). See [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).

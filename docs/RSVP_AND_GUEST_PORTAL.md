# RSVP + gated guest portal

Foundation for **roadmap steps 6–7**: couple-controlled RSVP emails, token RSVP forms, and a **gated** wedding landing (not a public SEO directory).

Offline-first is unchanged: the planner works without a network. Sending email and opening guest links need the sync API (+ SMTP / `PUBLIC_URL` when you use those).

## What shipped

| Piece | Behavior |
|-------|----------|
| Guest `rsvp_token` | Unique hard-to-guess token per guest (generate or rotate) |
| RSVP form | `GET/POST /guest/rsvp/:token` — attending, meal, dietary, +1, notes |
| Write-back | Responses update `guests` in Postgres (`updated_at = now()`) so cloud sync pulls them |
| Send / remind | `POST …/rsvp/send` — **user action only**; no automatic blasts |
| Message log | `outbound_emails` rows for invite/reminder attempts |
| Portal | `GET/PUT …/portal` + public `/p/:slug` with access modes |
| Gate modes | `unlisted` · `email` · `code` · `email_or_code` |
| Published blocks | Only `portal_published_json` — welcome, event, schedule, travel, lodging, registry links, FAQ, optional hero URL, RSVP hint. Planner-private guest notes stay private |
| Block toggles | `published.blocks.{welcome,event,schedule,travel,lodging,registry,faq,hero}` — empty sections omitted even when enabled |
| SMTP | Reuses auth mail helper; **503** `smtp_not_configured` when unset |
| Links | Built from `PUBLIC_URL` (local: `http://localhost:18787` / `http://127.0.0.1:18787`) |

## Couple API (auth + wedding membership)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/weddings/:id/rsvp/status` | Tokens, sent/responded, recent outbound log, SMTP probe |
| POST | `/weddings/:id/rsvp/tokens` | `{ guestIds?, rotate? }` — create tokens (no email) |
| POST | `/weddings/:id/rsvp/send` | `{ guestIds?, kind?: rsvp_invite\|rsvp_reminder, subject?, message? }` |
| GET | `/weddings/:id/portal` | Portal settings + URL |
| PUT | `/weddings/:id/portal` | `{ enabled, slug?, generateSlug?, accessMode?, accessCode?, clearAccessCode?, published? }` |
| POST | `/weddings/:id/portal/rotate-code` | New code (plaintext returned **once**) |

### `published` shape (sanitized server-side)

```json
{
  "headline": "Alex & Jordan",
  "subhead": "June celebration",
  "message": "Welcome note…",
  "date": "June 12, 2027",
  "venue": "Cedar Hall",
  "dressCode": "Garden formal",
  "schedule": "3pm ceremony · 5pm cocktails",
  "travel": "Fly into…",
  "lodging": "Hotel block under…",
  "rsvpHint": "Check your email for a personal RSVP link",
  "heroImageUrl": "https://… or /local/path.jpg",
  "registryLinks": [{ "label": "Registry", "url": "https://…" }],
  "faqs": [{ "q": "Plus-ones?", "a": "Please RSVP with your guest name." }],
  "blocks": {
    "welcome": true,
    "event": true,
    "schedule": true,
    "travel": true,
    "lodging": true,
    "registry": true,
    "faq": true,
    "hero": true
  }
}
```

`heroImageUrl` accepts **http(s)** or same-origin **relative `/path`** only (no `javascript:` / `data:`).

## Public / guest API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/guest/rsvp/:token` | HTML form (browser) or JSON (`Accept: application/json` / `?format=json`) |
| POST | `/guest/rsvp/:token` | Submit RSVP → updates guest row |
| GET | `/r/:token` | Short redirect → `/guest/rsvp/:token` |
| GET | `/p/:slug` | Gated landing HTML/JSON (`robots: noindex`) — published blocks only when unlocked |
| POST | `/p/:slug/verify` | `{ email?, code? }` → unlock token cookie |

## Planner UI

**Settings → RSVP & guest portal** (also linked from Cloud sync when signed in):

1. Refresh status  
2. Generate tokens (share links manually if SMTP is missing)  
3. Send invites / reminders (503 + clear message without SMTP)  
4. Configure portal slug, access mode, code  
5. Toggle published **blocks** and edit content (welcome, event, schedule, travel/lodging, registry, FAQ, hero URL)  

Client helpers on `CovenantCloudSync`: `rsvpStatus`, `rsvpGenerateTokens`, `rsvpSend`, `portalGet`, `portalUpdate`, `portalRotateCode`.

## Env

```bash
PUBLIC_URL=http://127.0.0.1:18787   # required for correct links in email + UI
SMTP_HOST=…                         # required to actually send mail
SMTP_PORT=587
SMTP_USER=…
SMTP_PASS=…
SMTP_FROM=noreply@example.com
# FEATURE_RSVP=0                    # optional force-off (defaults on)
# FEATURE_LANDING=0                 # optional force-off (defaults on)
```

Without SMTP you can still generate tokens and open `/guest/rsvp/…` in a browser. Without `PUBLIC_URL`, links fall back to the request host (fine on local API).

## Schema note (existing Docker volumes)

New columns/tables are applied via `ALTER … IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS` on API boot (`initSchema`).

If a CHECK constraint fails on an old volume, recreate:

```bash
docker compose down -v
docker compose up -d
# or re-run server against a wiped Postgres
```

## Verify

```bash
npm run verify:rsvp
```

Exercises token create → guest submit → Postgres guest update → richer published blocks on `/p/:slug`. SMTP send is asserted as **503** when unset (or success when configured).

## Honest limits / next

- Not a multi-template wedding website builder  
- Does not provision your SMTP/Google accounts in the cloud  
- LWW guest sync: RSVP responses stamp `updated_at` so they normally win over older local rows; sync after guests reply  
- Hero images accept HTTPS URLs (and wedding-scoped photo ids that resolve to `photos.public_url` when S3/R2 is configured)

**S3/R2 portal hero URLs shipped** — see [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md). Vendor portal: [`VENDOR_PORTAL.md`](./VENDOR_PORTAL.md). Partner invites: [`PARTNER_INVITES.md`](./PARTNER_INVITES.md).

## Demo

- Account: `demo@covenant.local` / `covenant-demo` (username `demo`)  
- API: `http://localhost:18787`  
- Health should show `features.rsvp` / `features.landing` true unless forced off  

Related: [`AUTH.md`](./AUTH.md), [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md), [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md), [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md).

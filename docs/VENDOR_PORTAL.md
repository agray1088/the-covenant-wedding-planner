# Vendor portal tokens

Cloud feature: the couple creates an **unguessable portal link** for a specific synced vendor. The vendor opens the link and sees a **scoped packet** (brief, schedule slice, paperwork) — not the full planner. Offline-first local use is unchanged.

## Privacy

- **No public directory** — link/token required  
- Guest names, budget totals, other vendors’ pricing, and planner-private notes are **not** exposed  
- Revoke stops the live link immediately (downloaded files cannot be recalled)

## Schema (`vendor_portal_tokens`)

| Column | Purpose |
|--------|---------|
| `wedding_id` | Cloud wedding |
| `vendor_id` | Synced vendor row id |
| `token` | Opaque unique token (URL segment) |
| `label` | Optional couple label |
| `scopes_json` | Permissions (brief / schedule / paperwork / uploads / counts / contacts) |
| `created_at` / `revoked_at` / `last_used_at` / `expires_at` | Lifecycle |

## API

### Couple (auth + accepted membership)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/weddings/:id/vendor-portal/tokens` | List tokens (`?all=1` includes revoked) |
| POST | `/weddings/:id/vendor-portal/tokens` | `{ vendorId, label?, scopes?, sendEmail?, email? }` |
| POST | `/weddings/:id/vendor-portal/tokens/:tokenId/revoke` | Revoke |
| POST | `/weddings/:id/vendor-portal/tokens/:tokenId/rotate` | Revoke old + issue new URL |

Create always returns `portalUrl` (from `PUBLIC_URL`). Optional email when SMTP is configured and `sendEmail: true`.

### Public (token required)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/vendor/portal/:token` | JSON scoped packet (`?format=json`) or redirect browsers to `vendor-portal.html?g=…` |

Feature flag: `FEATURE_VENDOR_TOKENS` (on by default; set `0` to disable).

## Planner UI

**Settings → Vendor portal** (also linked from Cloud sync when signed in):

1. Refresh vendors & tokens (vendors must be synced to the cloud wedding)  
2. Create link → copy URL (email optional if SMTP)  
3. Revoke or rotate  

Existing UI: `vendor-portal.html` + `js/vendor-portal.js` loads the cloud packet when `?g=` matches a live token (falls back to local/demo preview otherwise).

## Verify

```bash
npm run verify:vendor-portal
```

Demo: `demo@covenant.local` / `covenant-demo` · API `http://localhost:18787`

## Out of scope

- Vendor accounts with passwords  
- Payment processing / uploads write-back  
- Fancy multi-template vendor sites  

Related: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md), [`PARTNER_INVITES.md`](./PARTNER_INVITES.md), [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md), [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md).

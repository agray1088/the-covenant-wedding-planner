# Vendor portal tokens

Cloud feature: the couple creates an **unguessable portal link** for a specific synced vendor. The vendor opens the link and sees a **scoped packet** (brief, schedule slice, paperwork, arrival/parking/day notes) — not the full planner. Offline-first local use is unchanged.

## Privacy

- **No public directory** — link/token required  
- Guest names, budget totals, other vendors’ pricing, and planner-private notes are **not** exposed  
- Day-of notes on the portal come from **couple-published** `published_json` on the token — never a dump of `vendors.notes`  
- Revoke stops the live link immediately (downloaded files cannot be recalled)

## Schema (`vendor_portal_tokens`)

| Column | Purpose |
|--------|---------|
| `wedding_id` | Cloud wedding |
| `vendor_id` | Synced vendor row id |
| `token` | Opaque unique token (URL segment) |
| `label` | Optional couple label |
| `scopes_json` | Permissions (brief / schedule / paperwork / uploads / counts / contacts / arrival / parking / notes) |
| `published_json` | Couple-written packet fields for this link (arrival window, parking, day notes, contact…) |
| `created_at` / `revoked_at` / `last_used_at` / `expires_at` | Lifecycle |

## API

### Couple (auth + accepted membership)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/weddings/:id/vendor-portal/tokens` | List tokens (`?all=1` includes revoked) |
| POST | `/weddings/:id/vendor-portal/tokens` | `{ vendorId, label?, scopes?, published?, sendEmail?, email? }` |
| PUT | `/weddings/:id/vendor-portal/tokens/:tokenId` | Update `scopes` / `published` / `label` on a live token (URL unchanged) |
| POST | `/weddings/:id/vendor-portal/tokens/:tokenId/revoke` | Revoke |
| POST | `/weddings/:id/vendor-portal/tokens/:tokenId/rotate` | Revoke old + issue new URL (copies scopes + published) |

Create always returns `portalUrl` (from `PUBLIC_URL`). Optional email when SMTP is configured and `sendEmail: true`.

### Scopes (defaults all on)

`brief` · `schedule` · `paperwork` · `uploads` · `counts` · `contacts` · `arrival` · `parking` · `notes`

### `published` shape (sanitized)

```json
{
  "arrivalWindow": "2:00–3:00pm",
  "loadIn": "Loading bay B",
  "parking": "Staff lot behind venue",
  "venueAccess": "Side door code …",
  "dayNotes": "Service at 6:30 · plated",
  "contactName": "Sam Planner",
  "contactPhone": "+1…",
  "contactRole": "Planner"
}
```

Fields are only returned on the public packet when the matching scope is enabled.

### Public (token required)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/vendor/portal/:token` | JSON scoped packet (`?format=json`) or redirect browsers to `vendor-portal.html?g=…` |

Feature flag: `FEATURE_VENDOR_TOKENS` (on by default; set `0` to disable).

Public JSON includes `published`, `blocks` (arrival / parking / notes when scoped + filled), timeline `slice`, contacts, paperwork — still **no** guest names or internal notes.

## Planner UI

**Settings → Vendor portal** (also linked from Cloud sync when signed in):

1. Refresh vendors & tokens (vendors must be synced to the cloud wedding)  
2. Set scopes + published packet fields (arrival, parking, day notes, day-of contact)  
3. Create link → copy URL (email optional if SMTP)  
4. Revoke or rotate  

Existing UI: `vendor-portal.html` + `js/vendor-portal.js` loads the cloud packet when `?g=` matches a live token and renders arrival / parking / notes on the Brief tab (falls back to local/demo preview otherwise).

Client helpers: `listVendorPortalTokens`, `createVendorPortalToken`, `updateVendorPortalToken`, `revokeVendorPortalToken`, `rotateVendorPortalToken`.

## Verify

```bash
npm run verify:vendor-portal
```

Demo: `demo@covenant.local` / `covenant-demo` · API `http://localhost:18787`

## Out of scope

- Vendor accounts with passwords  
- Payment processing / uploads write-back  
- Fancy multi-template vendor sites  

**Next polish:** hosted secrets checklist UX; optional S3/R2 for couple photo assets shared into packets.

Related: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md), [`PARTNER_INVITES.md`](./PARTNER_INVITES.md), [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md), [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md).

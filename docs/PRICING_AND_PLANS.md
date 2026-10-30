# Pricing and packaging plan

Product-owner decisions for how The Covenant Wedding Planner is sold and unlocked. **Docs / plan only** — do not implement Stripe Checkout, license issuance, or paid gates until a dedicated build pass.

**Related**

- License UI stubs + Phase G: [`DESKTOP_NATIVE_POLISH_PLAN.md`](./DESKTOP_NATIVE_POLISH_PLAN.md) (Phase G — license activation)
- Roadmap pointer: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)
- Desktop shell overview: [`DESKTOP_APP.md`](./DESKTOP_APP.md)
- Cloud sync (optional add-on value): [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md)
- RSVP / portals (cloud-tier features): [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md), [`PARTNER_INVITES.md`](./PARTNER_INVITES.md)

---

## Recommended model

**Primary:** one-time app license + optional cloud subscription.

| Offer | Price | Notes |
|-------|-------|--------|
| Full app (launch) | **$59** one-time | Unlocks the planner permanently offline |
| Early bird / promo | **$39** one-time | Launch promo; same entitlements as full app |
| Cloud add-on | **$5 / month** or **$49 / year** | Optional; both can be offered |
| Pro bundle (optional alternative) | **$79** one-time | Only if sync + RSVP + portals are clearly bundled into a higher one-time tier later |

### Locked preference

- Ship **$59 + cloud add-on** as the primary packaging story.
- Prefer advertising the **yearly** cloud price ($49/year) for the wedding-planning horizon; still offer monthly ($5/mo) for couples who want a short window.
- Treat **$79 Pro** as a **optional alternative**, not the launch default. Revisit only if marketing needs a single SKU that includes sync/RSVP/portals without a subscription story.

### Why not subscription-only for the app

Couples plan one wedding. A one-time license matches that mental model; cloud is the recurring cost for hosted sync, partner access, and email/portal features.

---

## What each tier includes

### App license (one-time purchase)

- Full planner **tabs unlocked**
- Offline desktop / tablet use (Electron + PWA / tablet path)
- Local backup import / export (`.sqlite` / zip)
- Seat / install limit: about **1–2 device installs** (see Licensing)
- No requirement to sign up for hosted sync

### Without cloud (app only)

- Offline-first planning remains the default
- No hosted sync required
- Local file backup remains sufficient
- Partner invites, RSVP send, guest/vendor portals that depend on a public host are unavailable (or limited to whatever local/dev flows already exist without a paid cloud entitlement)

### Cloud add-on (subscription)

Requires an active `cloud_active` entitlement (see Licensing):

- Railway (or equivalent) **hosted sync**
- **Partner access** to the same wedding
- **RSVP / portal emails** and gated guest / vendor portal hosting
- **Hosted backup** path (cloud Postgres / operator-hosted backup — honest copy already in product privacy docs)

App license and cloud are independent: cloud alone does not replace the desktop license story; the app alone does not require cloud.

---

## Trial

Choose one launch policy (product can pick at implementation time; both are acceptable):

1. **Limited tabs free** — core planning visible; premium tabs gated until license; or
2. **14-day full access**, then fall back to limited tabs

**Unlock path:** after Stripe purchase, email a **license serial**; user enters it via Help → Enter License… (today a stub; real validation in Phase G / licensing backend).

Do not fake activation in shipping stubs before the server and key format exist.

---

## Licensing

Aligns with earlier product intent for desktop unlocks and cloud entitlements.

### Codes

- **16-character** license codes
- **Server-issued**, stored **hashed** (never log plaintext after issue)
- **Emailed via Resend** after successful Stripe payment (reuse existing mail stack: `RESEND_API_KEY` preferred)

### Code kinds

| Kind | Typical use |
|------|-------------|
| `purchase` | Paid Stripe Checkout (app and/or cloud) |
| `promo` | Early bird / influencer / launch codes |
| `support` | Comp / recovery for customers |
| `test` | QA and internal builds |

Promo, support, and test codes may grant **app only**, **cloud only**, or **both**.

### Seats and abuse

- Soft seat limit ≈ **2 installs** per app license
- Ability to **revoke** leaked or abused codes
- Device binding details left to implementation (fingerprint vs signed install count); plan for revoke + re-issue from support

### Entitlements

| Flag | Meaning |
|------|---------|
| `app_licensed` | Full app unlocked (one-time; no expiry unless revoked) |
| `cloud_active` | Cloud features unlocked; **has expiry** tied to subscription period (or time-boxed promo) |

Client and server should treat these as separate gates. Offline app use depends on `app_licensed` (or trial). Sync / partner / RSVP / hosted backup depend on `cloud_active` and a configured host.

---

## Market context (brief)

- Comparable one-time full wedding planners often land in roughly the **$49–$79** range; **$59** sits in the middle with room for a **$39** early-bird story.
- Couples prefer **one-time** spend for a single wedding rather than a long SaaS commitment for the whole planner.
- Recurring **$5/mo or $49/yr** is easier to justify when framed as sync + email + portals + hosted backup — not as rent on the core checklist app.

---

## Implementation notes (plan only)

Do **not** build Stripe or paid gates in the polish-doc pass. When commerce is scheduled:

1. **Stripe Checkout**
   - One product / price for the **app license** (one-time)
   - Separate **subscription** product for cloud ($5/mo and $49/yr prices)
2. **Webhook** on successful payment → create license row (hashed code, kind, entitlements, seat limit) → **email code via Resend**
3. **Desktop / app**
   - Replace Help → Enter License… stub (see Phase G in [`DESKTOP_NATIVE_POLISH_PLAN.md`](./DESKTOP_NATIVE_POLISH_PLAN.md))
   - Validate code against server; persist `app_licensed` / `cloud_active` (+ cloud expiry) locally for offline checks where safe
4. **Ops**
   - Support tooling to issue promo/support/test codes and revoke leaked ones
   - Document Stripe webhook secrets and Resend from-address alongside hosted deploy secrets (not in this file)

Until that pass, desktop builds remain full local planners with honest stub messaging for license entry.

---

## Decision summary

| Decision | Locked recommendation |
|----------|----------------------|
| Primary packaging | One-time app + optional cloud subscription |
| App price | **$59** (promo **$39**) |
| Cloud price | **$5/mo** or **$49/yr** (lean yearly in messaging) |
| $79 Pro | Optional later alternative only |
| Trial | Limited tabs **or** 14-day full → limited; unlock by emailed serial |
| License format | 16-char, hashed, Resend after Stripe; kinds purchase/promo/support/test |
| Entitlements | `app_licensed` + `cloud_active` (expiring) |
| Seats | ~2 installs; revoke leaked codes |

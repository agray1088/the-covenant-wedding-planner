# Licensing + Stripe — implementation plan

Checkbox / phased build plan for trial, serial codes, Stripe Checkout, entitlements, and desktop unlock wiring. **Follow this file** when implementing commerce; do **not** invent a parallel pricing model.

**Docs / plan only until a dedicated commerce pass.** Align prices and packaging with [`PRICING_AND_PLANS.md`](./PRICING_AND_PLANS.md). Desktop Help → Enter License stub: [`DESKTOP_NATIVE_POLISH_PLAN.md`](./DESKTOP_NATIVE_POLISH_PLAN.md) Phase G. Mail stack: [`AUTH.md`](./AUTH.md). Hosted env: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md).

**Status legend**

| Mark | Meaning |
|------|---------|
| `[x]` | **DONE** — already in repo / docs / stubs |
| `[ ]` | **TODO** — implement in the listed phase |
| `(depends)` | Needs existing auth / mailer / hosted API before or during the phase |

---

## Product summary (locked)

| Item | Decision |
|------|----------|
| App license | **$59** one-time (promo **$39**) |
| Cloud add-on | **$5 / month** or **$49 / year** (prefer yearly in messaging) |
| Trial (pick one at implement) | Limited tabs free **or** 14-day full → then limited |
| Serial format | **16-character** codes |
| Code kinds | `purchase`, `promo`, `support`, `test` |
| Storage | Server-issued, **hashed** (never log plaintext after issue) |
| Delivery | Email via **Resend** after Stripe success |
| Seats | Soft limit ≈ **2** installs; support can **revoke** |
| Entitlements | `app_licensed` (no expiry unless revoked) + `cloud_active` (**expiring**) |

Do not ship a client-side “master key” or offline-only unlock that bypasses hashed server validation for first activation.

---

## What already exists (DONE)

- [x] Pricing / packaging decisions documented — [`PRICING_AND_PLANS.md`](./PRICING_AND_PLANS.md)
- [x] Desktop **Help → Enter License…** menu item `(stub)` — message box only; no validation
- [x] Auth foundation: password + Google OAuth + sessions — [`AUTH.md`](./AUTH.md) `(depends for account-linked cloud)`
- [x] Mailer: `RESEND_API_KEY` preferred; SMTP fallback; `EMAIL_FROM` — [`AUTH.md`](./AUTH.md) / [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md) `(depends for license email)`
- [x] Hosted Railway/Fly deploy + `GET /setup/status` / `/health` capability flags
- [x] Offline-first planner; cloud sync opt-in — no paid gates yet (full local tabs today)

---

## What does not exist yet (TODO)

- [ ] Stripe products / prices / Checkout / webhooks
- [ ] License DB tables + hashed code issue / redeem / revoke / seat tracking
- [ ] Admin API or ops path to create `promo` / `support` / `test` codes
- [ ] Entitlement persistence (`app_licensed`, `cloud_active` + expiry)
- [ ] Real Help → Enter License validation + local cache for offline checks
- [ ] Grey-out / gate locked tabs under trial or unlicensed state
- [ ] Railway vars: `STRIPE_*`, webhook secret; Resend already required for email delivery

---

## Architecture sketch

```
Stripe Checkout (app one-time ± cloud subscription)
        │
        ▼
Webhook (signed) ──► issue 16-char code (hashed at rest)
        │                 kind=purchase|… entitlements + seats
        ▼
Resend email ──► buyer receives plaintext once
        │
        ▼
Desktop Help → Enter License ──► POST redeem (or activate)
        │
        ▼
Server: verify hash, seat count, not revoked
        │
        ▼
Client stores entitlements: app_licensed, cloud_active(+expiresAt)
        │
        ├── Offline tabs: honour app_licensed / trial locally
        └── Cloud features: require cloud_active + signed-in sync host
```

**Security notes (non-negotiable)**

- [ ] No master unlock key in Electron / renderer / shipped assets
- [ ] Store only **hashes** of serials (e.g. SHA-256 of normalized code + server pepper); pepper in Railway env, never in client
- [ ] Stripe webhook signature verification (`STRIPE_WEBHOOK_SECRET`); reject unsigned events
- [ ] Rate-limit redeem attempts; do not echo whether a code “almost” matched
- [ ] Revoke sets a server flag; next online redeem / entitlement refresh fails; local cache TTL should expire so revoke eventually sticks
- [ ] Never log full serials, Stripe secrets, or Resend keys (same discipline as auth mailer)
- [ ] Admin create-code endpoints require operator auth (session or separate ops secret) — not public

---

## Phases

### Phase 0 — Confirm product knobs

**Goal:** Lock trial policy and Stripe SKU map before schema work.

- [ ] Choose trial: **limited tabs** **or** **14-day full → limited** (both allowed by pricing doc)
- [ ] List which sidebar sections are free vs gated under “limited”
- [ ] Confirm Stripe account + tax / receipt email settings (operator)
- [ ] Confirm Resend domain verified + `EMAIL_FROM` on API service `(depends)`

**Acceptance**

- [ ] One short decision note in this file or `PRICING_AND_PLANS.md` records which trial variant shipped
- [ ] Free vs gated tab list written and agreed

---

### Phase 1 — Data model + issue / redeem APIs

**Goal:** Server can create hashed codes and redeem them into entitlements.

**Depends on:** hosted Postgres + API deploy `(depends)`

**Suggested tables (names flexible)**

| Table | Purpose |
|-------|---------|
| `license_codes` | `id`, `code_hash`, `kind`, entitlements JSON/flags, `seat_limit`, `revoked_at`, `stripe_checkout_session_id` / `stripe_subscription_id` nullable, `created_at`, `expires_at` (for cloud-only / timed promo) |
| `license_redemptions` / `license_seats` | device or install fingerprint, `license_id`, `activated_at`, `last_seen_at` |
| `entitlements` (per user or per device) | `app_licensed`, `cloud_active`, `cloud_expires_at`, linked `license_id` |

**Work**

- [ ] Migration for license + seat + entitlement tables
- [ ] Server helpers: generate 16-char alphabet (avoid ambiguous `0/O`, `1/I` if product prefers), hash, compare
- [ ] `POST` admin/internal: create code (`promo` / `support` / `test` / manual `purchase`)
- [ ] `POST` public-ish: redeem / activate (auth optional for app-only; prefer linked user when cloud)
- [ ] `POST` admin: revoke code; optional release seat
- [ ] Unit / script verify: hash round-trip, revoke blocks redeem, seat limit ≈ 2

**Acceptance**

- [ ] Creating a `test` code and redeeming it grants expected flags in API response
- [ ] Third seat activation rejected (or oldest seat policy documented)
- [ ] Revoked code cannot activate; plaintext never stored after issue
- [ ] `verify:` script or integration test covers happy path + revoke

---

### Phase 2 — Stripe Checkout + webhooks

**Goal:** Paid Checkout creates a `purchase` code and emails it.

**Depends on:** Phase 1 + Resend (or SMTP) configured `(depends)`

**Stripe catalog**

| Product | Price | Mode |
|---------|-------|------|
| App license | $59 | one-time Checkout |
| App license (promo price) | $39 | one-time (promo Coupon or separate Price — pick one) |
| Cloud monthly | $5 / mo | subscription |
| Cloud yearly | $49 / yr | subscription |

Optional later: $79 Pro bundle — **out of scope** for launch (see pricing doc).

**Work**

- [ ] Env on **API** Railway service only: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_APP`, `STRIPE_PRICE_APP_PROMO` (or coupon id), `STRIPE_PRICE_CLOUD_MONTHLY`, `STRIPE_PRICE_CLOUD_YEARLY`, `STRIPE_PUBLISHABLE_KEY` if client needs it
- [ ] Create Checkout Session endpoint (authenticated or email-capture guest flow — document choice)
- [ ] Webhook handler: `checkout.session.completed`, subscription `customer.subscription.updated` / `deleted` (and invoice paid as needed)
- [ ] On app payment: issue `kind=purchase` with `app_licensed`; email serial via existing mailer
- [ ] On cloud subscription active: grant / extend `cloud_active` expiry; email or attach to same customer
- [ ] On subscription canceled / unpaid: clear or expire `cloud_active` (keep `app_licensed`)
- [ ] Idempotent webhook handling (Stripe event id unique)

**Acceptance**

- [ ] Test-mode Checkout → webhook → DB row hashed → Resend delivers serial
- [ ] Cloud cancel → `cloud_active` no longer true after refresh
- [ ] Forged webhook without signature rejected
- [ ] `/setup/status` optionally exposes `stripeConfigured` boolean (no secrets)

---

### Phase 3 — Admin promo / support / test codes

**Goal:** Operator can issue non-Stripe codes without Checkout.

- [ ] Authenticated admin route or CLI documented for operators (no secrets in chat)
- [ ] Create with kind + entitlements (`app` / `cloud` / both) + optional expiry + seat limit
- [ ] List / revoke / show redemption count (never show full plaintext after create response)
- [ ] Document one-time display of plaintext at create time (copy now)

**Acceptance**

- [ ] Operator can mint a `promo` early-bird code granting `app_licensed`
- [ ] Support can revoke a leaked code in one action
- [ ] `test` codes blocked or clearly labeled in production (feature flag or env)

---

### Phase 4 — Desktop Help → Enter License + tab gating

**Goal:** Replace stub; grey out locked tabs; honour trial.

**Depends on:** Phase 1 redeem API; Phase 2 optional for purchase path; Phase G shell in [`DESKTOP_NATIVE_POLISH_PLAN.md`](./DESKTOP_NATIVE_POLISH_PLAN.md)

**Work**

- [ ] Replace Help → Enter License… stub with dialog: paste 16-char code → call redeem API (File → Set Cloud API Base for host)
- [ ] Persist entitlements locally (secure-ish storage / localStorage with signature or expiry) for **offline** `app_licensed` checks
- [ ] Implement chosen trial: limited tabs **or** 14-day clock then limited
- [ ] Grey-out / disable locked sidebar sections; clear copy: “Enter license” / “Trial ended”
- [ ] Cloud panes (sync, partner, RSVP send, portals) require `cloud_active` **and** signed-in host — do not unlock cloud with app license alone
- [ ] Honest messaging when API unreachable: cannot activate new serial offline; existing cached `app_licensed` still works offline

**Acceptance**

- [ ] Unlicensed / post-trial: gated tabs visibly locked; core free tabs still work offline
- [ ] Valid serial unlocks gated tabs after redeem
- [ ] Invalid / revoked serial shows clear error; no crash
- [ ] Stub-only builds without commerce still allowed until this phase lands — do not fake “activated”

---

### Phase 5 — Ops hardening + docs

**Goal:** Production checklist matches Railway reality.

- [ ] Update [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md) / `.env.production.example` with Stripe vars
- [ ] Document webhook endpoint URL in Stripe dashboard (`https://<PUBLIC_URL>/…`)
- [ ] Cross-check prices still match [`PRICING_AND_PLANS.md`](./PRICING_AND_PLANS.md)
- [ ] Support runbook: revoke, re-issue, seat reset
- [ ] Confirm no Stripe secrets on `romantic-perception` static planner service (API only) — see [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md)

**Acceptance**

- [ ] Fresh operator can configure Stripe + Resend from docs alone
- [ ] Test purchase + redeem + tab unlock verified on Windows desktop build

---

## Railway / env checklist (API service)

Paste in Railway **Variables** for the sync API only — never in chat or git:

| Variable | Required when | Notes |
|----------|---------------|--------|
| `STRIPE_SECRET_KEY` | commerce | `sk_test_…` then live |
| `STRIPE_WEBHOOK_SECRET` | commerce | `whsec_…` |
| `STRIPE_PRICE_APP` | commerce | $59 price id |
| `STRIPE_PRICE_APP_PROMO` or coupon | promo | $39 path |
| `STRIPE_PRICE_CLOUD_MONTHLY` | cloud | $5/mo |
| `STRIPE_PRICE_CLOUD_YEARLY` | cloud | $49/yr |
| `STRIPE_PUBLISHABLE_KEY` | if Checkout.js | optional |
| `LICENSE_CODE_PEPPER` | Phase 1 | random secret for hashing |
| `RESEND_API_KEY` | email serials | preferred `(depends)` |
| `EMAIL_FROM` | email | verified domain |
| Existing `SESSION_SECRET`, `DATABASE_URL`, `PUBLIC_URL`, … | always | unchanged |

Planner static service (`romantic-perception`): **do not** set Stripe / DB / session secrets there.

---

## Dependency map

| Capability | Status | Licensing use |
|------------|--------|----------------|
| Postgres + API | Done (hosted) | Store codes / seats |
| Auth sessions | Done | Tie cloud entitlements to user |
| Resend / SMTP mailer | Done (ops must configure) | Email serial after Stripe |
| Desktop Enter License menu | Stub only | Phase 4 wiring |
| Stripe | Not started | Phase 2 |
| Tab gating UI | Not started | Phase 4 |
| Secret rotation discipline | See [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md) | Rotate Stripe/Resend if leaked |

---

## Explicit non-goals (this plan)

- Implementing Stripe or gates in a polish-only / docs-only pass
- $79 Pro bundle as launch default
- Client-side master key or crackable offline generator
- Replacing local zip backup with a license check
- Pasting live Stripe / Resend secrets into chat or git

---

## Suggested agent order

1. [ ] Read this plan + [`PRICING_AND_PLANS.md`](./PRICING_AND_PLANS.md) + Phase G in polish plan  
2. [ ] Phase 0 trial / gate list  
3. [ ] Phase 1 schema + redeem  
4. [ ] Phase 2 Stripe + Resend email  
5. [ ] Phase 3 admin codes  
6. [ ] Phase 4 desktop + tab grey-out  
7. [ ] Phase 5 docs / Railway checklist  
8. [ ] Mark checkboxes DONE in this file when each phase lands  

Related: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) · [`DESKTOP_APP.md`](./DESKTOP_APP.md) · [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md)

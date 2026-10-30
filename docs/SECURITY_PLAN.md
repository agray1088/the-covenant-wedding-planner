# Security plan — The Covenant Wedding Planner

Owner-facing security policy and agent-facing control checklist. **Docs / plan only** until a dedicated security pass implements the planned rows.

**Related:** [`AUTH.md`](./AUTH.md) · [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md) · [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md) · [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) · [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md) · [`CLOUD_PHOTOS_PLAN.md`](./CLOUD_PHOTOS_PLAN.md) · [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)

**Status legend**

| Mark | Meaning |
|------|---------|
| `[x]` | **Current** — already in the stack / docs |
| `[ ]` | **Planned** — future agent / operator work (do not invent parallel policy) |

---

## Principles (locked)

These are non-negotiable product rules. Agents and support must not “helpfully” violate them.

1. **No backdoors.** No hidden master passwords, undocumented admin bypasses, support “god mode,” or emergency unlock in the Electron binary, planner JS, or API that lets unauthorized people into accounts or weddings without a normal verified flow.
2. **No master unlock in the client.** License / trial gates are enforced by **server** validation (hashed codes, revoke, seats). Client-side checks are convenience only — reverse-engineering the desktop app must not yield a secret that unlocks cloud or bypasses auth.
3. **Least privilege.** Secrets live only in **Railway Variables** (API service) — never in git, Cursor chat, GitHub issues, Discord, or the static planner service (`romantic-perception`). See [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md).
4. **Server is source of truth** for authentication, wedding membership, and licenses. Opaque sessions, bcrypt passwords, hashed reset tokens, and (planned) hashed license codes live on the API + Postgres.
5. **Support never unlocks accounts via chat/email claim alone.** Password resets and license re-issues require a **verified** path: forgot-password email ownership, Stripe receipt + matching purchase email, or a signed-in owner admin action with logging. No “I lost my key — just let me in.”

---

## Threat model (brief)

| Threat | What it looks like | Primary mitigations |
|--------|--------------------|---------------------|
| **Stolen Railway secrets** | Leaked `SESSION_SECRET`, `DATABASE_URL`, Google/Resend/Stripe keys (chat paste, screenshot, compromised laptop) | Secrets only in Railway; rotate per [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md); never commit `.env` |
| **Phishing** | Fake “reset your Covenant password” / “security team needs your license” emails or DMs | Official reset only via in-app forgot-password; staff never ask for passwords or full serials in chat |
| **XSS** | Malicious script in planner origin steals `covenant_cloud_token` or wedding data | Keep sync API CORS allowlisted; treat user HTML carefully; prefer HTTPS planner + API |
| **CSRF / session abuse** | Attacker tricks browser into calling API as the user; stolen bearer token | CORS allowlist; OAuth one-time state; opaque sessions; logout + rotate `SESSION_SECRET` on incident |
| **Stolen / shared license codes** | Serial posted online or shared beyond seat limit | Hash at rest (planned); soft seat ≈ 2; **revoke**; rate-limit redeem; never log plaintext after issue — [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) |
| **Support impersonation / social engineering** | “I’m a security tester” or “customer who lost the key” asking staff/agents to unlock | Playbook below — **no** access grants from claims alone; disclosure email only for researchers |
| **Physical device access** | Someone opens the couple’s PC / phone with the planner already unlocked locally | Local data is on-device by design (offline-first); OS login + screen lock; cloud still needs account; zip backups are the user’s responsibility to store safely |

**Honest limit:** any Electron/web client can be reverse-engineered. Security for cloud wedding data and licenses depends on **server authorization**, **no backdoors**, **revocation**, and **secret hygiene** — not on hiding logic in the client.

---

## Controls — current vs planned

### Already in place `[x]`

| Control | Where |
|---------|--------|
| Passwords bcrypt-hashed | [`AUTH.md`](./AUTH.md) |
| Opaque bearer sessions in `sessions` | Auth + sync API |
| Google OAuth (authorization code) + one-time OAuth state | [`AUTH.md`](./AUTH.md) |
| Forgot-password / reset tokens single-use, hashed, short-lived | [`AUTH.md`](./AUTH.md) |
| Wedding access scoped by membership (`owner` / `partner` / `planner`) | [`PARTNER_INVITES.md`](./PARTNER_INVITES.md) |
| Guest / vendor portals use unguessable tokens — not a public directory | [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md), [`VENDOR_PORTAL.md`](./VENDOR_PORTAL.md) |
| Photo API routes auth + wedding-membership scoped | [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md) |
| CORS allowlist (`CORS_ORIGIN`) | [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md) |
| Safe OAuth return to planner (`CLIENT_APP_URL` / first `CORS_ORIGIN`; no open redirect to arbitrary hosts) | [`AUTH.md`](./AUTH.md) |
| Resend HTTPS preferred for mail (avoids blocked SMTP) | [`AUTH.md`](./AUTH.md) |
| Mailer never logs passwords, keys, tokens, or reset links | [`AUTH.md`](./AUTH.md) |
| `GET /setup/status` exposes **booleans only** — never secret values | Auth / deploy docs |
| TLS via Railway (and Fly force HTTPS) | [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md) |
| `BOOTSTRAP_*` documented as **not** for public multi-tenant prod | [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md), [`AUTH.md`](./AUTH.md) |
| Secret rotation runbook after leak / incident | [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md) |
| License plan: hashed codes, seats, revoke, no client master key | [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) |

### Planned gaps `[ ]`

| Control | Intent |
|---------|--------|
| **MFA for admin / owner account** | TOTP or Google Advanced Protection–style second factor before license-create / revoke |
| **Rate limits** on `/auth/login`, register, forgot-password, license redeem | Slow credential stuffing and serial guessing |
| **Admin audit log** | Persist who created/revoked licenses, changed memberships, or ran privileged ops (actor, action, time, target id) |
| **No-support-backdoor policy (documented + enforced in code reviews)** | This file is the policy; reject PRs that add undocumented bypass routes |
| **Backup encryption at rest notes** | Document Railway/Postgres and R2/S3 encryption defaults; optional customer-side zip passphrase later |
| **Photo bucket private by default** | Prefer private bucket + short-lived presigned URLs; public base URL only for intentionally published portal assets — see [`CLOUD_PHOTOS_PLAN.md`](./CLOUD_PHOTOS_PLAN.md) |
| **`SECURITY.md` + disclosure process** | Public repo (or site) security contact; no credentials shared with “researchers” |
| **`security.txt`** | Well-known contact for responsible disclosure |

---

## Social engineering / “lost my key” policy (critical)

This section answers the owner’s #1 operational fear: someone posing as a customer or security tester to get into data or licenses.

### Staff / owner / agent playbook — NEVER

- [ ] **Never** email a new license serial, temporary password, session token, or “admin unlock link” based only on a DM, Discord, email, Cursor chat, or phone claim.
- [ ] **Never** disable auth, add a master password, or ship a support god-mode because someone says it is an emergency.
- [ ] **Never** paste Railway / Google / Stripe / Resend / license pepper secrets into chat to “help debug.”
- [ ] **Never** grant cloud wedding access because the requester knows a couple’s names, date, or venue.

### Require one of these verified paths

| Situation | Allowed recovery |
|-----------|------------------|
| User forgot password | In-app **forgot-password** → link to account email only ([`AUTH.md`](./AUTH.md)). Generic response always (“If an account exists…”). |
| User lost license serial | **Stripe receipt** (or dashboard purchase) with **matching purchase email** → re-send via normal Resend path **or** owner creates a replacement code in an authenticated admin console **with audit log** (planned). Prefer revoke old + issue new when the old code may be leaked. |
| Seat / device change | Authenticated user or audited admin **revoke seat / revoke code**, then re-redeem — not a chat unlock. |
| Suspected account takeover | Rotate `SESSION_SECRET` / force re-login; reset password via email ownership; revoke licenses if needed ([`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md)). |

### “Security researcher” / “I’m testing your site” claims

- Do **not** grant account, admin, or database access.
- Do **not** share credentials, sample couples’ data, or live license codes “for testing.”
- Point them to the **documented disclosure contact** (planned `SECURITY.md` / `security.txt` — until that exists, owner’s private ops email only, never a backdoor).
- Legitimate reports get acknowledgment and a fix timeline — **not** a login.

### No emergency backdoor

There is **no** planned emergency backdoor in the app binary or API. If the owner is locked out of Railway, recovery is through **Railway account recovery / Google account recovery / password manager** — not through a secret route in Covenant. If the owner is locked out of the app admin account, use forgot-password to the **owner’s** email or Railway console access to set a password hash via a **logged, one-off ops procedure** — never a permanent undocumented bypass left in code.

---

## Admin access

| Rule | Detail |
|------|--------|
| **Single owner admin** | Prefer one operator account for production. Strong unique password **and** Google Sign-In when configured. |
| **Plan MFA** | Before multi-tenant paying customers, add MFA (or equivalent) for admin license-create / revoke. |
| **License create** | Only via authenticated admin/API (see [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) Phase 3) — **audited**. Plaintext serial shown once at create; never stored. |
| **`BOOTSTRAP_EMAIL` / `BOOTSTRAP_PASSWORD`** | Local Docker / smoke only. **Do not** enable on public multi-tenant production used by real couples ([`AUTH.md`](./AUTH.md), [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)). |
| **No shared “support” login** | Do not create a second god account for freelancers; use audited actions or temporary access you can revoke. |

---

## Operational checklist

Owner / operator hygiene (ongoing):

- [ ] After any leak or chat paste of secrets → run [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md) end-to-end
- [ ] **Never** paste secrets into Cursor, chat, GitHub issues/PRs, or screenshots
- [ ] Keep **Postgres not publicly exposed** — use Railway private networking / plugin link; API talks to DB via `DATABASE_URL`; do not open a public Postgres port “for convenience”
- [ ] Confirm planner static service has **no** `DATABASE_URL` / `SESSION_SECRET` / Stripe / Google secrets
- [ ] Confirm no production `BOOTSTRAP_PASSWORD`
- [ ] Prefer private photo bucket; rotate R2/S3 keys if leaked ([`CLOUD_PHOTOS_PLAN.md`](./CLOUD_PHOTOS_PLAN.md), [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md))
- [ ] Regular dependency updates (high level): periodically `npm audit` / Dependabot or equivalent on `server` and desktop; patch high/critical CVEs; redeploy API after upgrades
- [ ] Download local full zip backups for weddings you care about before destructive DB ops
- [ ] Treat shared license codes posted online as compromised → **revoke** and re-issue to the verified buyer

---

## Phased implementation todos

Agents execute these in a **dedicated security pass** — check boxes here when done. Docs-only until then.

### Phase S0 — Policy lock-in (docs)

- [x] This file: principles, social-engineering playbook, no-backdoor rule
- [x] Cross-link from roadmap / auth / deploy / licensing / rotation (same PR as this file)
- [ ] Add short “no support backdoor” note to support/ops section of licensing plan when commerce ships

### Phase S1 — Abuse resistance

- [ ] Rate-limit `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/forgot-username` (per IP + per account where applicable)
- [ ] Rate-limit license redeem / activate endpoints when commerce exists
- [ ] Uniform error messages (no user enumeration beyond existing forgot-password generics)
- [ ] Optional: lockout / backoff after repeated failures (document chosen thresholds)

**Acceptance:** scripted burst of login/redeem attempts gets `429` or equivalent; legitimate single attempts still work.

### Phase S2 — Admin audit + MFA

- [ ] `admin_audit_log` (or equivalent): actor user id, action, target type/id, metadata JSON, `created_at`
- [ ] Log license create / revoke / seat release; optional: membership force-changes
- [ ] MFA (TOTP or provider) required for admin license mutations
- [ ] Reject undocumented bypass routes in code review checklist

**Acceptance:** creating and revoking a test code writes audit rows; admin action without MFA fails when MFA is enabled.

### Phase S3 — Disclosure + hardening docs

- [ ] Add `SECURITY.md` at repo root: how to report vulnerabilities, response expectations, **no** credential requests
- [ ] Add `/.well-known/security.txt` (or static host equivalent) pointing at the same contact
- [ ] Document backup encryption-at-rest: Railway Postgres / volume defaults; R2/S3 SSE; optional future zip passphrase
- [ ] Photo bucket: default private + presigned GET; document when public base URL is acceptable (portal hero only)

**Acceptance:** a stranger can find how to report a bug without being offered a login; photo plan and this file agree on private-bucket default.

### Phase S4 — License theft controls (with commerce)

Align with [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) — do not duplicate a second licensing design.

- [ ] Hashed serials + pepper in Railway only
- [ ] Seat limit ≈ 2; revoke API; local entitlement cache TTL so revoke sticks
- [ ] Re-issue only via Stripe-matched email or audited admin create
- [ ] Never log full serials after issue

**Acceptance:** revoked or over-seat codes cannot activate online; leaked paste-bin serial can be killed in one admin action.

### Phase S5 — Ongoing ops

- [ ] Schedule reminder to run dependency updates quarterly (or on Dependabot alerts)
- [ ] Confirm Postgres remains non-public after any Railway networking change
- [ ] Practice one dry-run of [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md) (rotate a non-prod or staging secret first if available)

---

## Mapping user concerns → this plan

| Owner concern | Where addressed |
|---------------|-----------------|
| Hackers stealing wedding / user data | Threat model + current scoped auth/membership/CORS/TLS; planned rate limits, MFA, private photo bucket, secret rotation |
| Social engineering (“lost my key / I’m a tester”) | **Social engineering policy** — verified reset only; researchers → disclosure, no access |
| No backdoor / no god mode | **Principles** + Admin access + Phase S2 code-review rule |
| License code theft / shared online | Licensing controls (hashed, seats, revoke) + Phase S4 + re-issue only after verification |

---

## Explicit non-goals

- Implementing rate limits / MFA / audit tables in a docs-only pass
- Client-side DRM that “cannot be cracked” (impossible; do not promise it)
- Granting agents login to the owner’s Railway / Google / Stripe
- Shipping `BOOTSTRAP_*` or master passwords for production convenience
- Pasting live secrets into chat “just this once”

---

## Suggested agent order (when implementing)

1. [ ] Re-read this plan + [`AUTH.md`](./AUTH.md) + [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md)  
2. [ ] Phase S1 rate limits  
3. [ ] Phase S2 audit log (+ MFA when admin license APIs exist)  
4. [ ] Phase S3 `SECURITY.md` / `security.txt` + encryption notes  
5. [ ] Phase S4 with commerce pass  
6. [ ] Mark checkboxes DONE in this file when each phase lands  

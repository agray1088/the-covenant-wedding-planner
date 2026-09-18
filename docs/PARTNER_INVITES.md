# Partner invites

Cloud feature: invite a spouse or planner to the **same wedding account** with controlled access. Offline-first local use is unchanged.

## Roles

| Role | Access |
|------|--------|
| `owner` | Full access; invite members; revoke accepted partners/planners |
| `partner` (alias: editor) | Sync + edit planner data for that wedding; cannot remove the owner |
| `planner` | Same edit access as partner (coordinator label) |

Invites grant **only that wedding**. There is no public member directory.

## Schema (`memberships`)

Extended (not a separate table):

- `status`: `pending` · `accepted` · `revoked`
- `invited_email`, `invited_username` (optional)
- `invite_token_hash`, `invite_expires_at`, `invited_by`
- `accepted_at`, `revoked_at`
- `user_id` nullable while pending (filled on accept)

Owner rows created on wedding upload are `status = accepted`.

## API

### Couple (auth + accepted membership)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/weddings/:id/members` | Accepted members |
| GET | `/weddings/:id/invites` | Pending invites (`?all=1` for history) |
| POST | `/weddings/:id/invites` | `{ email, username?, role?, sendEmail? }` |
| POST | `/weddings/:id/invites/:inviteId/revoke` | Revoke pending or (owner) remove partner/planner |

Create always returns `inviteUrl` (built from `PUBLIC_URL`). When SMTP is configured, email is sent; when not, copy/paste the URL.

### Invitee (auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/invites/pending` | Pending invites for this account (email / username) |
| POST | `/invites/accept` | `{ token }` or `{ inviteId }` |

### Public preview

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/invite/:token` | HTML accept page (`noindex`) or JSON (`?format=json`) |
| GET | `/invites/:token` | Same preview under `/invites` |

Accept still requires a signed-in user matching the invited email/username.

## Planner UI

**Settings → Partner invites** (also linked from Cloud sync):

1. Refresh inbox — accept invites sent to you  
2. Invite by email (+ optional username, role)  
3. Copy link when SMTP is unset  
4. List members / revoke pending  

## Verify

```bash
npm run verify:partner-invite
```

Demo: `demo@covenant.local` / `covenant-demo` · API `http://localhost:18787`

## Out of scope

- Complex RBAC beyond owner / partner / planner  
- Transferring ownership / deleting weddings via partner  

Vendor portal tokens: [`VENDOR_PORTAL.md`](./VENDOR_PORTAL.md).

Related: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md), [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md), [`AUTH.md`](./AUTH.md), [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md).

/**
 * Partner / planner invites — couple can share a wedding account with controlled roles.
 * Cloud-only; offline planner unchanged. Invite grants that wedding only (no public listing).
 */
import { Router } from 'express';
import { query } from '../lib/db.js';
import {
  clientAppUrl,
  hashToken,
  normalizeEmail,
  normalizeUsername,
  newToken,
  publicUrl,
  requireAuth,
  requireWeddingMember,
  validUsername
} from '../lib/auth.js';
import { sendMail, smtpConfigured, smtpStatus } from '../lib/mail.js';
import { invitePageHtml, simpleMessagePage } from '../lib/guest-pages.js';

const INVITE_DAYS = Number(process.env.PARTNER_INVITE_DAYS || 14);
const INVITE_ROLES = new Set(['partner', 'planner']);

const weddingRouter = Router({ mergeParams: true });
const publicRouter = Router();

function wantsHtml(req) {
  const accept = String(req.headers.accept || '');
  if (req.query.format === 'json') return false;
  if (req.query.format === 'html') return true;
  return accept.includes('text/html') && !accept.includes('application/json');
}

function inviteLink(req, rawToken) {
  return `${publicUrl(req)}/invite/${encodeURIComponent(rawToken)}`;
}

function mapInvite(row, { includeUrl = false, rawToken = null, req = null } = {}) {
  if (!row) return null;
  const out = {
    id: row.id,
    weddingId: row.wedding_id,
    weddingName: row.wedding_name || row.name || null,
    userId: row.user_id || null,
    role: row.role,
    status: row.status,
    invitedEmail: row.invited_email || null,
    invitedUsername: row.invited_username || null,
    displayName: row.display_name || null,
    email: row.member_email || null,
    username: row.member_username || null,
    invitedBy: row.invited_by || null,
    expiresAt: row.invite_expires_at
      ? new Date(row.invite_expires_at).toISOString()
      : null,
    acceptedAt: row.accepted_at ? new Date(row.accepted_at).toISOString() : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
  };
  if (includeUrl && rawToken && req) {
    out.inviteUrl = inviteLink(req, rawToken);
    out.inviteToken = rawToken;
  }
  return out;
}

async function logOutbound({ weddingId, kind, toEmail, subject, status, error, meta }) {
  await query(
    `INSERT INTO outbound_emails (
       wedding_id, guest_id, kind, to_email, subject, status, error, meta_json, sent_at
     ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7::jsonb,
               CASE WHEN $5 = 'sent' THEN now() ELSE NULL END)`,
    [
      weddingId,
      kind,
      toEmail,
      subject || null,
      status,
      error || null,
      JSON.stringify(meta || {})
    ]
  );
}

async function findInviteByRawToken(raw) {
  if (!raw) return null;
  const { rows } = await query(
    `SELECT m.*, w.name AS wedding_name, w.bride, w.groom, w.wedding_date,
            u.email AS member_email, u.username AS member_username, u.display_name
       FROM memberships m
       JOIN weddings w ON w.id = m.wedding_id
       LEFT JOIN users u ON u.id = m.user_id
      WHERE m.invite_token_hash = $1`,
    [hashToken(raw)]
  );
  return rows[0] || null;
}

function inviteMatchesUser(row, user) {
  if (!row || !user) return false;
  if (row.user_id && row.user_id === user.id) return true;
  const email = normalizeEmail(user.email);
  if (row.invited_email && normalizeEmail(row.invited_email) === email) return true;
  const uname = normalizeUsername(user.username);
  if (row.invited_username && uname && normalizeUsername(row.invited_username) === uname) {
    return true;
  }
  return false;
}

async function renderInviteToken(req, res, next) {
  try {
    const raw = String(req.params.token || '').trim();
    const row = await findInviteByRawToken(raw);
    if (!row || row.status === 'revoked') {
      if (wantsHtml(req)) {
        res.status(404).type('html').send(
          simpleMessagePage('Invite not found', 'This partner invite is missing or was revoked.', true)
        );
        return;
      }
      res.status(404).json({ error: 'invite_not_found' });
      return;
    }
    if (row.status === 'accepted') {
      if (wantsHtml(req)) {
        res.type('html').send(
          simpleMessagePage(
            'Already accepted',
            'This invite was already accepted. Sign in to the planner to sync.'
          )
        );
        return;
      }
      res.status(410).json({ error: 'already_accepted' });
      return;
    }
    if (row.invite_expires_at && new Date(row.invite_expires_at).getTime() < Date.now()) {
      if (wantsHtml(req)) {
        res.status(410).type('html').send(
          simpleMessagePage('Invite expired', 'Ask the couple to send a new partner invite.', true)
        );
        return;
      }
      res.status(410).json({ error: 'invite_expired' });
      return;
    }

    const preview = {
      ok: true,
      role: row.role,
      weddingName: row.wedding_name,
      weddingDate: row.wedding_date || null,
      invitedEmail: row.invited_email,
      expiresAt: row.invite_expires_at
        ? new Date(row.invite_expires_at).toISOString()
        : null,
      acceptHint: 'Sign in with the invited email, then POST /invites/accept with this token.',
      clientAppUrl: clientAppUrl()
    };

    if (wantsHtml(req)) {
      res.type('html').send(
        invitePageHtml({
          weddingName: row.wedding_name,
          weddingDate: row.wedding_date,
          role: row.role,
          invitedEmail: row.invited_email,
          token: raw,
          clientAppUrl: clientAppUrl(),
          expiresAt: preview.expiresAt
        })
      );
      return;
    }
    res.json(preview);
  } catch (e) {
    next(e);
  }
}

/** GET /weddings/:weddingId/members — accepted members only */
weddingRouter.get('/members', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT m.id, m.wedding_id, m.user_id, m.role, m.status, m.invited_email,
              m.invited_username, m.invited_by, m.accepted_at, m.created_at,
              u.email AS member_email, u.username AS member_username, u.display_name
         FROM memberships m
         LEFT JOIN users u ON u.id = m.user_id
        WHERE m.wedding_id = $1 AND m.status = 'accepted'
        ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'partner' THEN 1 ELSE 2 END,
                 m.created_at ASC`,
      [req.params.weddingId]
    );
    res.json({
      ok: true,
      role: req.membershipRole,
      members: rows.map((r) => mapInvite(r))
    });
  } catch (e) {
    next(e);
  }
});

/** GET /weddings/:weddingId/invites — pending (+ optionally all) */
weddingRouter.get('/invites', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const includeAll = String(req.query.all || '') === '1';
    const { rows } = await query(
      `SELECT m.*, u.email AS member_email, u.username AS member_username, u.display_name
         FROM memberships m
         LEFT JOIN users u ON u.id = m.user_id
        WHERE m.wedding_id = $1
          AND ($2::boolean OR m.status = 'pending')
        ORDER BY m.created_at DESC`,
      [req.params.weddingId, includeAll]
    );
    res.json({
      ok: true,
      role: req.membershipRole,
      smtp: smtpStatus(),
      publicUrl: publicUrl(req),
      invites: rows.map((r) => mapInvite(r))
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /weddings/:weddingId/invites
 * Body: { email, username?, role?: partner|planner, sendEmail?: boolean }
 * Without SMTP, returns inviteUrl for copy/paste (always includes URL when created).
 */
weddingRouter.post('/invites', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const usernameRaw = body.username != null ? String(body.username).trim() : '';
    const username = usernameRaw ? normalizeUsername(usernameRaw) : null;
    let role = String(body.role || 'partner').trim().toLowerCase();
    if (role === 'editor') role = 'partner';
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'invalid_email', message: 'A valid invite email is required.' });
      return;
    }
    if (!INVITE_ROLES.has(role)) {
      res.status(400).json({
        error: 'invalid_role',
        message: 'Invite role must be partner or planner (not owner).'
      });
      return;
    }
    if (username && !validUsername(username)) {
      res.status(400).json({
        error: 'invalid_username',
        message: 'Username must be 3–32 chars (letters, numbers, . _ -).'
      });
      return;
    }

    let targetUser = null;
    if (username) {
      const found = await query(
        `SELECT id, email, username, display_name FROM users WHERE lower(username) = $1 LIMIT 1`,
        [username]
      );
      targetUser = found.rows[0] || null;
      if (!targetUser) {
        res.status(404).json({
          error: 'username_not_found',
          message: 'No account with that username yet — invite by email instead, or omit username.'
        });
        return;
      }
    }
    if (!targetUser) {
      const found = await query(
        `SELECT id, email, username, display_name FROM users WHERE lower(email) = $1 LIMIT 1`,
        [email]
      );
      targetUser = found.rows[0] || null;
    }

    if (targetUser && targetUser.id === req.user.id) {
      res.status(400).json({ error: 'self_invite', message: 'You are already on this wedding.' });
      return;
    }

    if (targetUser) {
      const existing = await query(
        `SELECT id, status, role FROM memberships
          WHERE wedding_id = $1 AND user_id = $2`,
        [req.params.weddingId, targetUser.id]
      );
      if (existing.rows[0]?.status === 'accepted') {
        res.status(409).json({
          error: 'already_member',
          message: 'That person is already a member of this wedding.'
        });
        return;
      }
      if (existing.rows[0]?.status === 'pending') {
        res.status(409).json({
          error: 'invite_pending',
          message: 'An invite is already pending for that account.',
          inviteId: existing.rows[0].id
        });
        return;
      }
    }

    const pendingEmail = await query(
      `SELECT id FROM memberships
        WHERE wedding_id = $1 AND status = 'pending' AND lower(invited_email) = $2
        LIMIT 1`,
      [req.params.weddingId, email]
    );
    if (pendingEmail.rows[0]) {
      res.status(409).json({
        error: 'invite_pending',
        message: 'An invite is already pending for that email.',
        inviteId: pendingEmail.rows[0].id
      });
      return;
    }

    const rawToken = newToken();
    const expires = new Date(Date.now() + INVITE_DAYS * 86400000);

    let row;
    if (targetUser) {
      const revived = await query(
        `UPDATE memberships SET
            role = $3,
            status = 'pending',
            invited_email = $4,
            invited_username = $5,
            invite_token_hash = $6,
            invited_by = $7,
            invite_expires_at = $8,
            accepted_at = NULL,
            revoked_at = NULL
          WHERE wedding_id = $1 AND user_id = $2 AND status = 'revoked'
          RETURNING *`,
        [
          req.params.weddingId,
          targetUser.id,
          role,
          email,
          username || targetUser.username || null,
          hashToken(rawToken),
          req.user.id,
          expires.toISOString()
        ]
      );
      row = revived.rows[0];
    }
    if (!row) {
      const inserted = await query(
        `INSERT INTO memberships (
           wedding_id, user_id, role, status, invited_email, invited_username,
           invite_token_hash, invited_by, invite_expires_at
         ) VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.params.weddingId,
          targetUser ? targetUser.id : null,
          role,
          email,
          username || (targetUser && targetUser.username) || null,
          hashToken(rawToken),
          req.user.id,
          expires.toISOString()
        ]
      );
      row = inserted.rows[0];
    }

    const url = inviteLink(req, rawToken);
    const wedding = await query(`SELECT name, bride, groom FROM weddings WHERE id = $1`, [
      req.params.weddingId
    ]);
    const w = wedding.rows[0] || {};
    const couple = [w.bride, w.groom].filter(Boolean).join(' & ') || w.name || 'a wedding';
    const subject = `You're invited to plan ${couple} on The Covenant`;
    const appUrl = clientAppUrl();
    const text = [
      `You've been invited as ${role} to plan ${couple} on The Covenant Wedding Planner.`,
      '',
      `Accept: ${url}`,
      '',
      `Or sign in at ${appUrl} and open Settings → Partner invites.`,
      `This invite expires ${expires.toISOString().slice(0, 10)}.`
    ].join('\n');
    const html = `<p>You've been invited as <b>${role}</b> to plan <b>${couple}</b>.</p>
      <p><a href="${url}">Accept the invite</a></p>
      <p>Or sign in at <a href="${appUrl}">${appUrl}</a> and open <b>Settings → Partner invites</b>.</p>
      <p style="color:#78716c;font-size:0.9rem">Expires ${expires.toISOString().slice(0, 10)}.</p>`;

    const wantSend = body.sendEmail !== false;
    let emailResult = { sent: false, smtpConfigured: smtpConfigured() };
    if (wantSend && smtpConfigured()) {
      try {
        await sendMail({ to: email, subject, text, html });
        await logOutbound({
          weddingId: req.params.weddingId,
          kind: 'partner_invite',
          toEmail: email,
          subject,
          status: 'sent',
          meta: { inviteId: row.id, role }
        });
        emailResult = { sent: true, smtpConfigured: true };
      } catch (e) {
        await logOutbound({
          weddingId: req.params.weddingId,
          kind: 'partner_invite',
          toEmail: email,
          subject,
          status: 'failed',
          error: String(e.message || e),
          meta: { inviteId: row.id, role }
        });
        emailResult = {
          sent: false,
          smtpConfigured: true,
          error: String(e.message || e)
        };
      }
    } else {
      await logOutbound({
        weddingId: req.params.weddingId,
        kind: 'partner_invite',
        toEmail: email,
        subject,
        status: 'skipped_no_smtp',
        meta: { inviteId: row.id, role, reason: wantSend ? 'smtp_not_configured' : 'send_disabled' }
      });
    }

    res.status(201).json({
      ok: true,
      invite: mapInvite(row, { includeUrl: true, rawToken, req }),
      inviteUrl: url,
      email: emailResult,
      smtp: smtpStatus(),
      message: emailResult.sent
        ? 'Invite created and email sent.'
        : 'Invite created. Copy the invite URL — email was not sent (SMTP unset or disabled).'
    });
  } catch (e) {
    next(e);
  }
});

/** POST /weddings/:weddingId/invites/:inviteId/revoke */
weddingRouter.post(
  '/invites/:inviteId/revoke',
  requireAuth,
  requireWeddingMember,
  async (req, res, next) => {
    try {
      const { rows } = await query(
        `SELECT * FROM memberships WHERE id = $1 AND wedding_id = $2`,
        [req.params.inviteId, req.params.weddingId]
      );
      const row = rows[0];
      if (!row) {
        res.status(404).json({ error: 'not_found', message: 'Invite or membership not found.' });
        return;
      }
      if (row.role === 'owner') {
        res.status(403).json({
          error: 'cannot_revoke_owner',
          message: 'Partners cannot remove the owner. Ownership is not transferred via revoke.'
        });
        return;
      }
      if (row.status === 'accepted' && req.membershipRole !== 'owner') {
        res.status(403).json({
          error: 'forbidden',
          message: 'Only the owner can remove an accepted partner or planner.'
        });
        return;
      }
      if (row.status === 'revoked') {
        res.json({ ok: true, invite: mapInvite(row), already: true });
        return;
      }
      const updated = await query(
        `UPDATE memberships
            SET status = 'revoked', revoked_at = now(), invite_token_hash = NULL
          WHERE id = $1
          RETURNING *`,
        [row.id]
      );
      res.json({ ok: true, invite: mapInvite(updated.rows[0]) });
    } catch (e) {
      next(e);
    }
  }
);

/** GET /invites/pending — invites for the signed-in user (by email / user id) */
publicRouter.get('/pending', requireAuth, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.user.email);
    const uname = normalizeUsername(req.user.username);
    const { rows } = await query(
      `SELECT m.*, w.name AS wedding_name, w.bride, w.groom, w.wedding_date
         FROM memberships m
         JOIN weddings w ON w.id = m.wedding_id
        WHERE m.status = 'pending'
          AND (
            m.user_id = $1
            OR lower(m.invited_email) = $2
            OR ($3::text IS NOT NULL AND lower(m.invited_username) = $3)
          )
          AND (m.invite_expires_at IS NULL OR m.invite_expires_at > now())
        ORDER BY m.created_at DESC`,
      [req.user.id, email, uname]
    );
    res.json({
      ok: true,
      invites: rows.map((r) => mapInvite(r))
    });
  } catch (e) {
    next(e);
  }
});

/** POST /invites/accept — { token } or { inviteId } (auth required) */
publicRouter.post('/accept', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    let row = null;
    if (body.token) {
      row = await findInviteByRawToken(String(body.token).trim());
    } else if (body.inviteId) {
      const found = await query(
        `SELECT m.*, w.name AS wedding_name
           FROM memberships m
           JOIN weddings w ON w.id = m.wedding_id
          WHERE m.id = $1`,
        [body.inviteId]
      );
      row = found.rows[0] || null;
    } else {
      res.status(400).json({ error: 'missing_token', message: 'Provide token or inviteId.' });
      return;
    }
    if (!row || row.status !== 'pending') {
      res.status(404).json({ error: 'invite_not_found', message: 'Invite not found or already used.' });
      return;
    }
    if (row.invite_expires_at && new Date(row.invite_expires_at).getTime() < Date.now()) {
      res.status(410).json({ error: 'invite_expired', message: 'This invite has expired.' });
      return;
    }
    if (!inviteMatchesUser(row, req.user)) {
      res.status(403).json({
        error: 'invite_email_mismatch',
        message: 'Sign in with the email (or username) this invite was sent to.'
      });
      return;
    }

    const clash = await query(
      `SELECT id FROM memberships
        WHERE wedding_id = $1 AND user_id = $2 AND status = 'accepted' AND id <> $3`,
      [row.wedding_id, req.user.id, row.id]
    );
    if (clash.rows[0]) {
      res.status(409).json({
        error: 'already_member',
        message: 'You are already a member of this wedding.'
      });
      return;
    }

    const updated = await query(
      `UPDATE memberships SET
          user_id = $2,
          status = 'accepted',
          accepted_at = now(),
          invite_token_hash = NULL,
          revoked_at = NULL
        WHERE id = $1
        RETURNING *`,
      [row.id, req.user.id]
    );
    res.json({
      ok: true,
      membership: mapInvite({ ...updated.rows[0], wedding_name: row.wedding_name }),
      weddingId: row.wedding_id
    });
  } catch (e) {
    next(e);
  }
});

/** GET /invites/:token — JSON/HTML preview (alias of /invite/:token) */
publicRouter.get('/:token', renderInviteToken);

export const inviteTokenPage = renderInviteToken;
export { weddingRouter as weddingInviteRoutes, publicRouter as invitePublicRoutes };
export default weddingRouter;

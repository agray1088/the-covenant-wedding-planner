/**
 * Couple RSVP controls + public token-scoped guest RSVP endpoints.
 * Sends are always user-initiated (no automatic blasts).
 */
import crypto from 'crypto';
import { Router } from 'express';
import { query } from '../lib/db.js';
import { publicUrl, requireAuth, requireWeddingMember } from '../lib/auth.js';
import { sendMail, smtpConfigured, smtpStatus } from '../lib/mail.js';
import { rsvpPageHtml, simpleMessagePage } from '../lib/guest-pages.js';

const router = Router({ mergeParams: true });
const publicRouter = Router();

function newRsvpToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function wantsHtml(req) {
  const accept = String(req.headers.accept || '');
  if (req.query.format === 'json') return false;
  if (req.query.format === 'html') return true;
  return accept.includes('text/html') && !accept.includes('application/json');
}

function normalizeRsvp(v) {
  const s = String(v || '').trim().toLowerCase();
  if (['yes', 'attending', 'accepted', 'y'].includes(s)) return 'yes';
  if (['no', 'declined', 'unable', 'n'].includes(s)) return 'no';
  if (['maybe', 'pending', 'tentative'].includes(s)) return 'maybe';
  return s || null;
}

async function logOutbound({ weddingId, guestId, kind, toEmail, subject, status, error, meta }) {
  const { rows } = await query(
    `INSERT INTO outbound_emails (
       wedding_id, guest_id, kind, to_email, subject, status, error, meta_json, sent_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb, CASE WHEN $6 = 'sent' THEN now() ELSE NULL END)
     RETURNING *`,
    [
      weddingId,
      guestId || null,
      kind,
      toEmail,
      subject || null,
      status,
      error || null,
      JSON.stringify(meta || {})
    ]
  );
  return rows[0];
}

function rsvpLink(req, token) {
  return `${publicUrl(req)}/guest/rsvp/${encodeURIComponent(token)}`;
}

function guestStatusRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    rsvp: row.rsvp || '',
    meal: row.meal || '',
    dietary: row.dietary || '',
    plusOne: !!row.plus_one,
    hasToken: !!row.rsvp_token,
    tokenCreatedAt: row.rsvp_token_created_at
      ? new Date(row.rsvp_token_created_at).toISOString()
      : null,
    sentAt: row.rsvp_sent_at ? new Date(row.rsvp_sent_at).toISOString() : null,
    remindedAt: row.rsvp_reminded_at ? new Date(row.rsvp_reminded_at).toISOString() : null,
    respondedAt: row.rsvp_responded_at
      ? new Date(row.rsvp_responded_at).toISOString()
      : null,
    rsvpUrl: row.rsvp_token ? null : null // filled by caller when needed
  };
}

/** GET /weddings/:weddingId/rsvp/status */
router.get('/status', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, rsvp, meal, dietary, plus_one, notes,
              rsvp_token, rsvp_token_created_at, rsvp_sent_at, rsvp_reminded_at, rsvp_responded_at
         FROM guests WHERE wedding_id = $1
         ORDER BY name ASC, id ASC`,
      [req.params.weddingId]
    );
    const base = publicUrl(req);
    const guests = rows.map((row) => {
      const g = guestStatusRow(row);
      g.rsvpUrl = row.rsvp_token ? `${base}/guest/rsvp/${encodeURIComponent(row.rsvp_token)}` : null;
      return g;
    });
    const { rows: logs } = await query(
      `SELECT id, guest_id, kind, to_email, subject, status, error, created_at, sent_at
         FROM outbound_emails
        WHERE wedding_id = $1 AND kind IN ('rsvp_invite', 'rsvp_reminder')
        ORDER BY created_at DESC
        LIMIT 100`,
      [req.params.weddingId]
    );
    res.json({
      ok: true,
      smtp: smtpStatus(),
      publicUrl: base,
      summary: {
        total: guests.length,
        withEmail: guests.filter((g) => g.email).length,
        withToken: guests.filter((g) => g.hasToken).length,
        sent: guests.filter((g) => g.sentAt).length,
        responded: guests.filter((g) => g.respondedAt || (g.rsvp && g.rsvp !== '')).length
      },
      guests,
      recentSends: logs.map((l) => ({
        id: l.id,
        guestId: l.guest_id,
        kind: l.kind,
        toEmail: l.to_email,
        subject: l.subject,
        status: l.status,
        error: l.error,
        createdAt: l.created_at ? new Date(l.created_at).toISOString() : null,
        sentAt: l.sent_at ? new Date(l.sent_at).toISOString() : null
      }))
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /weddings/:weddingId/rsvp/tokens
 * Body: { guestIds?: string[], rotate?: boolean }
 * Generates unique RSVP tokens. Does not send email.
 */
router.post('/tokens', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const guestIds = Array.isArray(req.body?.guestIds)
      ? req.body.guestIds.map((id) => String(id || '').trim()).filter(Boolean)
      : null;
    const rotate = !!req.body?.rotate;

    let rows;
    if (guestIds && guestIds.length) {
      const q = await query(
        `SELECT id, name, email, rsvp_token FROM guests
          WHERE wedding_id = $1 AND id = ANY($2::text[])`,
        [weddingId, guestIds]
      );
      rows = q.rows;
    } else {
      const q = await query(
        `SELECT id, name, email, rsvp_token FROM guests WHERE wedding_id = $1`,
        [weddingId]
      );
      rows = q.rows;
    }

    const created = [];
    const skipped = [];
    for (const row of rows) {
      if (row.rsvp_token && !rotate) {
        skipped.push({ id: row.id, reason: 'already_has_token' });
        continue;
      }
      let token = newRsvpToken();
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await query(
            `UPDATE guests
                SET rsvp_token = $3,
                    rsvp_token_created_at = now()
              WHERE wedding_id = $1 AND id = $2`,
            [weddingId, row.id, token]
          );
          created.push({
            id: row.id,
            name: row.name,
            email: row.email || '',
            rsvpUrl: rsvpLink(req, token)
          });
          break;
        } catch (e) {
          if (e && e.code === '23505') {
            token = newRsvpToken();
            continue;
          }
          throw e;
        }
      }
    }

    res.json({
      ok: true,
      created: created.length,
      skipped: skipped.length,
      guests: created,
      skippedGuests: skipped
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /weddings/:weddingId/rsvp/send
 * Body: { guestIds?: string[], kind?: 'rsvp_invite'|'rsvp_reminder', subject?, message? }
 * User-action only. Returns 503 when SMTP is not configured.
 */
router.post('/send', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    if (!smtpConfigured()) {
      res.status(503).json({
        error: 'smtp_not_configured',
        message:
          'Email is not configured on this server. Set SMTP_HOST (and usually SMTP_USER / SMTP_PASS / SMTP_FROM) to send RSVP emails. You can still generate links and share them manually.',
        smtp: smtpStatus()
      });
      return;
    }

    const weddingId = req.params.weddingId;
    const kind = req.body?.kind === 'rsvp_reminder' ? 'rsvp_reminder' : 'rsvp_invite';
    const guestIds = Array.isArray(req.body?.guestIds)
      ? req.body.guestIds.map((id) => String(id || '').trim()).filter(Boolean)
      : null;
    const customSubject = String(req.body?.subject || '').trim();
    const customMessage = String(req.body?.message || '').trim();

    const { rows: wedRows } = await query(
      `SELECT name, bride, groom, wedding_date FROM weddings WHERE id = $1`,
      [weddingId]
    );
    const wedding = wedRows[0];
    if (!wedding) {
      res.status(404).json({ error: 'not_found', message: 'Wedding not found.' });
      return;
    }

    let guests;
    if (guestIds && guestIds.length) {
      const q = await query(
        `SELECT * FROM guests WHERE wedding_id = $1 AND id = ANY($2::text[])`,
        [weddingId, guestIds]
      );
      guests = q.rows;
    } else {
      const q = await query(`SELECT * FROM guests WHERE wedding_id = $1`, [weddingId]);
      guests = q.rows;
    }

    const results = [];
    for (const g of guests) {
      const email = String(g.email || '').trim().toLowerCase();
      if (!email) {
        await logOutbound({
          weddingId,
          guestId: g.id,
          kind,
          toEmail: '(none)',
          subject: customSubject || null,
          status: 'skipped_no_email',
          error: 'Guest has no email'
        });
        results.push({ id: g.id, status: 'skipped_no_email' });
        continue;
      }

      let token = g.rsvp_token;
      if (!token) {
        token = newRsvpToken();
        await query(
          `UPDATE guests SET rsvp_token = $3, rsvp_token_created_at = now()
            WHERE wedding_id = $1 AND id = $2`,
          [weddingId, g.id, token]
        );
      }

      const link = rsvpLink(req, token);
      const couple = [wedding.bride, wedding.groom].filter(Boolean).join(' & ') || wedding.name;
      const subject =
        customSubject ||
        (kind === 'rsvp_reminder'
          ? `Reminder: RSVP for ${wedding.name || 'our wedding'}`
          : `You're invited — please RSVP for ${wedding.name || 'our wedding'}`);
      const text = [
        `Hi ${g.name || 'friend'},`,
        '',
        customMessage ||
          (kind === 'rsvp_reminder'
            ? `Just a friendly reminder to RSVP for ${couple}.`
            : `${couple} would love your RSVP.`),
        '',
        `Open your personal link: ${link}`,
        '',
        wedding.wedding_date ? `Wedding date: ${wedding.wedding_date}` : '',
        '',
        'This link is unique to you — please do not forward it publicly.'
      ]
        .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
        .join('\n')
        .trim();

      const html = `<p>Hi ${escapeHtml(g.name || 'friend')},</p>
<p>${escapeHtml(
        customMessage ||
          (kind === 'rsvp_reminder'
            ? `Just a friendly reminder to RSVP for ${couple}.`
            : `${couple} would love your RSVP.`)
      )}</p>
<p><a href="${escapeHtml(link)}">Open your personal RSVP link</a></p>
${wedding.wedding_date ? `<p>Wedding date: ${escapeHtml(wedding.wedding_date)}</p>` : ''}
<p style="color:#78716c;font-size:12px">This link is unique to you — please do not forward it publicly.</p>`;

      try {
        await sendMail({ to: email, subject, text, html });
        await logOutbound({
          weddingId,
          guestId: g.id,
          kind,
          toEmail: email,
          subject,
          status: 'sent',
          meta: { link }
        });
        if (kind === 'rsvp_reminder') {
          await query(
            `UPDATE guests SET rsvp_reminded_at = now() WHERE wedding_id = $1 AND id = $2`,
            [weddingId, g.id]
          );
        } else {
          await query(
            `UPDATE guests SET rsvp_sent_at = COALESCE(rsvp_sent_at, now()) WHERE wedding_id = $1 AND id = $2`,
            [weddingId, g.id]
          );
        }
        results.push({ id: g.id, status: 'sent', email, rsvpUrl: link });
      } catch (err) {
        await logOutbound({
          weddingId,
          guestId: g.id,
          kind,
          toEmail: email,
          subject,
          status: 'failed',
          error: String(err.message || err),
          meta: { link }
        });
        results.push({
          id: g.id,
          status: 'failed',
          email,
          error: String(err.message || err)
        });
      }
    }

    res.json({
      ok: true,
      kind,
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => String(r.status).startsWith('skipped')).length,
      results
    });
  } catch (e) {
    next(e);
  }
});

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadGuestByToken(token) {
  const raw = String(token || '').trim();
  if (!raw || raw.length < 16) return null;
  const { rows } = await query(
    `SELECT g.*, w.name AS wedding_name, w.bride, w.groom, w.wedding_date
       FROM guests g
       JOIN weddings w ON w.id = g.wedding_id
      WHERE g.rsvp_token = $1`,
    [raw]
  );
  return rows[0] || null;
}

/** Public: GET /guest/rsvp/:token */
publicRouter.get('/rsvp/:token', async (req, res, next) => {
  try {
    const row = await loadGuestByToken(req.params.token);
    if (!row) {
      if (wantsHtml(req)) {
        res.status(404).type('html').send(
          simpleMessagePage('Link not found', 'This RSVP link is invalid or has been rotated.', true)
        );
        return;
      }
      res.status(404).json({ error: 'not_found', message: 'Invalid or expired RSVP link.' });
      return;
    }

    const payload = {
      ok: true,
      guest: {
        name: row.name || '',
        rsvp: row.rsvp || '',
        meal: row.meal || '',
        dietary: row.dietary || '',
        plusOne: !!row.plus_one,
        notes: row.notes || '',
        respondedAt: row.rsvp_responded_at
          ? new Date(row.rsvp_responded_at).toISOString()
          : null
      },
      wedding: {
        name: row.wedding_name || '',
        date: row.wedding_date || '',
        couple: [row.bride, row.groom].filter(Boolean).join(' & ')
      }
    };

    if (wantsHtml(req)) {
      res.type('html').send(
        rsvpPageHtml({
          guestName: row.name,
          weddingName: row.wedding_name,
          weddingDate: row.wedding_date,
          token: req.params.token,
          existing: {
            rsvp: row.rsvp || '',
            meal: row.meal || '',
            dietary: row.dietary || '',
            plusOne: !!row.plus_one,
            notes: row.notes || ''
          }
        })
      );
      return;
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

/** Public: POST /guest/rsvp/:token — write back onto guests (Postgres). */
publicRouter.post('/rsvp/:token', async (req, res, next) => {
  try {
    const row = await loadGuestByToken(req.params.token);
    if (!row) {
      res.status(404).json({ error: 'not_found', message: 'Invalid or expired RSVP link.' });
      return;
    }

    const body = req.body || {};
    // Also accept form-urlencoded style if middleware parsed it
    const rsvp = normalizeRsvp(body.rsvp ?? body.attending);
    if (!rsvp || !['yes', 'no', 'maybe'].includes(rsvp)) {
      res.status(400).json({
        error: 'invalid',
        message: 'Please choose attending: yes, no, or maybe.'
      });
      return;
    }

    const meal = String(body.meal ?? '').trim().slice(0, 120);
    const dietary = String(body.dietary ?? '').trim().slice(0, 200);
    const notes = String(body.notes ?? '').trim().slice(0, 1000);
    const plusOne = body.plusOne === true || body.plusOne === '1' || body.plus_one === true
      || body.plusone === true;

    const { rows } = await query(
      `UPDATE guests SET
         rsvp = $3,
         meal = $4,
         dietary = $5,
         plus_one = $6,
         notes = $7,
         invited = TRUE,
         rsvp_responded_at = now(),
         updated_at = now()
       WHERE wedding_id = $1 AND id = $2
       RETURNING id, name, rsvp, meal, dietary, plus_one, notes, rsvp_responded_at, updated_at`,
      [row.wedding_id, row.id, rsvp, meal || null, dietary || null, plusOne, notes || null]
    );

    const updated = rows[0];
    res.json({
      ok: true,
      message: 'Thank you — your RSVP was saved.',
      guest: {
        id: updated.id,
        name: updated.name,
        rsvp: updated.rsvp,
        meal: updated.meal || '',
        dietary: updated.dietary || '',
        plusOne: !!updated.plus_one,
        notes: updated.notes || '',
        respondedAt: updated.rsvp_responded_at
          ? new Date(updated.rsvp_responded_at).toISOString()
          : null,
        updatedAt: updated.updated_at
          ? new Date(updated.updated_at).toISOString()
          : null
      }
    });
  } catch (e) {
    next(e);
  }
});

export { publicRouter as guestPublicRoutes };
export default router;

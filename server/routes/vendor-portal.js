/**
 * Vendor portal tokens — couple-controlled opaque links for a scoped vendor packet.
 * Not a public directory. Offline planner is unchanged; this is cloud/hosted only.
 */
import crypto from 'crypto';
import { Router } from 'express';
import { query } from '../lib/db.js';
import {
  clientAppUrl,
  publicUrl,
  requireAuth,
  requireWeddingMember
} from '../lib/auth.js';
import { sendMail, smtpConfigured, smtpStatus } from '../lib/mail.js';
import { simpleMessagePage } from '../lib/guest-pages.js';

const router = Router({ mergeParams: true });
const publicRouter = Router();

const DEFAULT_SCOPES = {
  brief: true,
  schedule: true,
  paperwork: true,
  uploads: true,
  counts: true,
  contacts: true
};

function featureOn() {
  const raw = process.env.FEATURE_VENDOR_TOKENS;
  if (raw == null || String(raw).trim() === '') return true;
  return !['0', 'false', 'no', 'off'].includes(String(raw).trim().toLowerCase());
}

function requireFeature(req, res, next) {
  if (!featureOn()) {
    res.status(503).json({
      error: 'feature_disabled',
      message: 'Vendor portal tokens are disabled on this API (FEATURE_VENDOR_TOKENS).'
    });
    return;
  }
  next();
}

function newPortalToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function wantsHtml(req) {
  const accept = String(req.headers.accept || '');
  if (req.query.format === 'json') return false;
  if (req.query.format === 'html') return true;
  return accept.includes('text/html') && !accept.includes('application/json');
}

function portalLink(req, token) {
  return `${publicUrl(req)}/vendor/portal/${encodeURIComponent(token)}`;
}

function clientPortalPageUrl(token) {
  const app = clientAppUrl();
  return `${app}/vendor-portal.html?g=${encodeURIComponent(token)}`;
}

function sanitizeScopes(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = { ...DEFAULT_SCOPES };
  for (const key of Object.keys(DEFAULT_SCOPES)) {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      out[key] = !!src[key];
    }
  }
  return out;
}

async function logOutbound({ weddingId, kind, toEmail, subject, status, error, meta }) {
  const { rows } = await query(
    `INSERT INTO outbound_emails (
       wedding_id, guest_id, kind, to_email, subject, status, error, meta_json, sent_at
     ) VALUES ($1,NULL,$2,$3,$4,$5,$6,$7::jsonb, CASE WHEN $5 = 'sent' THEN now() ELSE NULL END)
     RETURNING *`,
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
  return rows[0];
}

function mapTokenRow(row, { includeUrl = false, req = null } = {}) {
  if (!row) return null;
  const scopes =
    row.scopes_json && typeof row.scopes_json === 'object'
      ? row.scopes_json
      : DEFAULT_SCOPES;
  const out = {
    id: row.id,
    weddingId: row.wedding_id,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name || null,
    vendorCategory: row.vendor_category || null,
    vendorEmail: row.vendor_email || null,
    label: row.label || null,
    scopes,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    status: row.revoked_at
      ? 'revoked'
      : row.expires_at && new Date(row.expires_at) < new Date()
        ? 'expired'
        : 'live'
  };
  if (includeUrl && row.token && req) {
    out.portalUrl = portalLink(req, row.token);
    out.clientUrl = clientPortalPageUrl(row.token);
    out.token = row.token;
  }
  return out;
}

function money(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function coupleNames(w) {
  const b = String(w?.bride || '').trim();
  const g = String(w?.groom || '').trim();
  if (b && g) return `${b} & ${g}`;
  return b || g || w?.name || 'Your wedding';
}

function fmtLong(iso) {
  if (!iso) return '—';
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dietaryCounts(guests) {
  let covers = 0;
  let veg = 0;
  let nut = 0;
  for (const g of guests || []) {
    covers += 1;
    const meal = String(g.meal || g.dietary || '').toLowerCase();
    const notes = String(g.notes || '').toLowerCase();
    if (/veg|plant/.test(meal) || /veg/.test(notes)) veg += 1;
    if (/nut/.test(meal) || /nut/.test(notes)) nut += 1;
  }
  return { covers, vegetarian: veg, nutAllergy: nut, serviceAt: '—' };
}

async function buildScopedPacket(tokenRow) {
  const weddingId = tokenRow.wedding_id;
  const vendorId = tokenRow.vendor_id;
  const scopes = sanitizeScopes(tokenRow.scopes_json);

  const weddingQ = await query(
    `SELECT id, name, bride, groom, wedding_date FROM weddings WHERE id = $1`,
    [weddingId]
  );
  const wedding = weddingQ.rows[0];
  if (!wedding) return null;

  const vendorQ = await query(
    `SELECT id, name, category, contact, phone, email, quote, deposit, balance,
            status, has_contract, notes
       FROM vendors WHERE wedding_id = $1 AND id = $2`,
    [weddingId, vendorId]
  );
  const vendor = vendorQ.rows[0];
  if (!vendor) return null;

  const guestsQ = scopes.counts
    ? await query(
        `SELECT meal, dietary, notes FROM guests WHERE wedding_id = $1`,
        [weddingId]
      )
    : { rows: [] };

  const timelineQ = scopes.schedule
    ? await query(
        `SELECT event, start_time, location, responsible, notes
           FROM timeline_events WHERE wedding_id = $1
           ORDER BY start_time ASC NULLS LAST, updated_at ASC`,
        [weddingId]
      )
    : { rows: [] };

  const contractsQ = scopes.paperwork
    ? await query(
        `SELECT id, name, vendor, vendor_id, status, amount, total, deposit, doc_date, notes
           FROM contracts
          WHERE wedding_id = $1
            AND (vendor_id = $2 OR lower(coalesce(vendor,'')) = lower($3))
          ORDER BY updated_at DESC`,
        [weddingId, vendorId, vendor.name || '']
      )
    : { rows: [] };

  const paymentsQ = scopes.paperwork
    ? await query(
        `SELECT id, descr, due_amount, paid_amount, due_date, paid_date, status, method
           FROM payments
          WHERE wedding_id = $1
            AND (vendor_id = $2 OR lower(coalesce(vendor,'')) = lower($3))
          ORDER BY due_date ASC NULLS LAST, updated_at ASC`,
        [weddingId, vendorId, vendor.name || '']
      )
    : { rows: [] };

  const hayVendor = String(vendor.name || '')
    .toLowerCase()
    .split(/\s+/)[0];
  const slice = [];
  for (const r of timelineQ.rows) {
    const hay = [r.event, r.responsible, r.notes, r.location].join(' ').toLowerCase();
    if (hayVendor && hay.includes(hayVendor)) {
      const kind = /load|access|setup|clear|strike/i.test(hay) ? 'loadin' : 'service';
      slice.push({
        title: String(r.event || 'Cue'),
        meta: String(r.responsible || r.notes || r.location || 'On the day'),
        time: String(r.start_time || '—').slice(0, 5),
        kind
      });
    }
  }
  if (!slice.length && scopes.schedule) {
    slice.push({
      title: 'No timeline cues yet',
      meta: 'Day-of rows that name this vendor will appear here',
      time: '—',
      kind: 'service'
    });
  }

  const contract = contractsQ.rows[0];
  const quote = vendor.quote != null ? Number(vendor.quote) : null;
  const deposit = vendor.deposit != null ? Number(vendor.deposit) : null;
  const balance = vendor.balance != null ? Number(vendor.balance) : null;
  const contractAmount =
    contract && (contract.total != null || contract.amount != null)
      ? Number(contract.total != null ? contract.total : contract.amount)
      : null;
  const paidSum = paymentsQ.rows.reduce(
    (s, p) => s + (p.paid_amount != null ? Number(p.paid_amount) : 0),
    0
  );
  const dueSum = paymentsQ.rows.reduce(
    (s, p) => s + (p.due_amount != null ? Number(p.due_amount) : 0),
    0
  );

  const instalments = paymentsQ.rows.map((p) => {
    const paid = p.paid_amount != null && Number(p.paid_amount) > 0;
    return {
      title: String(p.descr || 'Payment'),
      meta: paid
        ? `Paid ${p.paid_date || ''}`.trim()
        : `Due ${p.due_date || '—'}`,
      amount: money(p.due_amount ?? p.paid_amount),
      tone: paid ? 'ok' : p.status === 'overdue' ? 'danger' : 'warn'
    };
  });

  const weddingDate = String(wedding.wedding_date || '').slice(0, 10);
  let expires = tokenRow.expires_at
    ? new Date(tokenRow.expires_at).toISOString().slice(0, 10)
    : '';
  if (!expires && weddingDate) {
    const expDt = new Date(`${weddingDate}T00:00:00`);
    if (!Number.isNaN(expDt.getTime())) {
      expDt.setDate(expDt.getDate() + 4);
      expires = expDt.toISOString().slice(0, 10);
    }
  }

  const contacts = [];
  if (scopes.contacts) {
    contacts.push({
      name: coupleNames(wedding),
      role: 'Couple · day-of',
      phone: '—'
    });
  }

  const status = tokenRow.revoked_at
    ? 'revoked'
    : expires && new Date(`${expires}T00:00:00`) < new Date(new Date().toDateString())
      ? 'expired'
      : 'live';

  return {
    ok: true,
    mode: 'Cloud',
    isDemo: false,
    isCloud: true,
    token: tokenRow.token,
    status,
    sharedBy: coupleNames(wedding),
    sharedOn: tokenRow.created_at
      ? new Date(tokenRow.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short'
        })
      : '—',
    expires: expires || null,
    label: tokenRow.label || null,
    scopes,
    wedding: {
      id: wedding.id,
      name: wedding.name || '',
      coupleNames: coupleNames(wedding),
      date: weddingDate || '',
      dateLabel: weddingDate ? fmtLong(weddingDate) : 'Date TBD'
    },
    vendor: {
      id: vendor.id,
      name: vendor.name || 'Vendor',
      category: vendor.category || 'Vendor',
      contact: vendor.contact || '',
      phone: scopes.brief ? vendor.phone || '' : '',
      email: scopes.brief ? vendor.email || '' : ''
    },
    counts: scopes.counts ? dietaryCounts(guestsQ.rows) : null,
    slice: scopes.schedule ? slice : [],
    scheduleGantt: null,
    deps: [],
    owed: [],
    contacts: scopes.contacts ? contacts : [],
    paperwork: scopes.paperwork
      ? {
          contractValue: money(quote ?? contractAmount),
          paid: money(deposit != null ? deposit : paidSum || null),
          outstanding: money(
            balance != null ? balance : Math.max(0, (dueSum || 0) - (paidSum || 0)) || null
          ),
          nextDue:
            (paymentsQ.rows.find(
              (p) => !(p.paid_amount != null && Number(p.paid_amount) > 0)
            ) || {}).due_date || '—',
          contract: {
            title:
              (contract && contract.name)
              || (vendor.has_contract ? 'Contract on file' : 'No contract linked yet'),
            meta: contract
              ? `Status: ${contract.status || '—'} · dated ${contract.doc_date || '—'}`
              : 'Scoped vendor packet',
            headMeta: 'cloud portal'
          },
          clauses: [],
          instalments,
          invoices: instalments
        }
      : null,
    uploads: scopes.uploads
      ? { outstanding: [], done: [] }
      : null,
    // Never expose planner-private fields
    privacy: {
      guestNames: false,
      budgetTotals: false,
      otherVendors: false,
      internalNotes: false
    }
  };
}

/** GET /weddings/:weddingId/vendor-portal/tokens */
router.get(
  '/tokens',
  requireFeature,
  requireAuth,
  requireWeddingMember,
  async (req, res, next) => {
    try {
      const includeRevoked = String(req.query.all || '') === '1';
      const { rows } = await query(
        `SELECT t.*, v.name AS vendor_name, v.category AS vendor_category, v.email AS vendor_email
           FROM vendor_portal_tokens t
           LEFT JOIN vendors v
             ON v.wedding_id = t.wedding_id AND v.id = t.vendor_id
          WHERE t.wedding_id = $1
            ${includeRevoked ? '' : 'AND t.revoked_at IS NULL'}
          ORDER BY t.created_at DESC`,
        [req.params.weddingId]
      );
      res.json({
        ok: true,
        smtp: smtpStatus(),
        publicUrl: publicUrl(req),
        tokens: rows.map((r) => mapTokenRow(r, { includeUrl: true, req }))
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /weddings/:weddingId/vendor-portal/tokens
 * Body: { vendorId, label?, scopes?, expiresAt?, sendEmail?, email? }
 */
router.post(
  '/tokens',
  requireFeature,
  requireAuth,
  requireWeddingMember,
  async (req, res, next) => {
    try {
      const body = req.body || {};
      const vendorId = String(body.vendorId || body.vendor_id || '').trim();
      if (!vendorId) {
        res.status(400).json({
          error: 'vendor_required',
          message: 'vendorId is required.'
        });
        return;
      }

      const vendorQ = await query(
        `SELECT id, name, email, category FROM vendors
          WHERE wedding_id = $1 AND id = $2`,
        [req.params.weddingId, vendorId]
      );
      const vendor = vendorQ.rows[0];
      if (!vendor) {
        res.status(404).json({
          error: 'vendor_not_found',
          message: 'Sync that vendor to the cloud wedding first, then create a portal link.'
        });
        return;
      }

      const label = String(body.label || '').trim().slice(0, 120) || null;
      const scopes = sanitizeScopes(body.scopes);
      let expiresAt = null;
      if (body.expiresAt) {
        const d = new Date(body.expiresAt);
        if (!Number.isNaN(d.getTime())) expiresAt = d.toISOString();
      }

      const raw = newPortalToken();
      const { rows } = await query(
        `INSERT INTO vendor_portal_tokens (
           wedding_id, vendor_id, token, label, scopes_json, created_by, expires_at
         ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)
         RETURNING *`,
        [
          req.params.weddingId,
          vendorId,
          raw,
          label,
          JSON.stringify(scopes),
          req.user.id,
          expiresAt
        ]
      );
      const row = {
        ...rows[0],
        vendor_name: vendor.name,
        vendor_category: vendor.category,
        vendor_email: vendor.email
      };
      const url = portalLink(req, raw);
      const clientUrl = clientPortalPageUrl(raw);

      const toEmail = String(body.email || vendor.email || '')
        .trim()
        .toLowerCase();
      const wantSend = body.sendEmail === true;
      let emailResult = { sent: false, smtpConfigured: smtpConfigured() };

      if (wantSend) {
        if (!toEmail) {
          emailResult = {
            sent: false,
            smtpConfigured: smtpConfigured(),
            error: 'no_email'
          };
          await logOutbound({
            weddingId: req.params.weddingId,
            kind: 'vendor_portal',
            toEmail: '(none)',
            subject: 'Vendor portal link',
            status: 'skipped_no_email',
            meta: { tokenId: row.id, vendorId }
          });
        } else if (!smtpConfigured()) {
          await logOutbound({
            weddingId: req.params.weddingId,
            kind: 'vendor_portal',
            toEmail,
            subject: 'Vendor portal link',
            status: 'skipped_no_smtp',
            meta: { tokenId: row.id, vendorId }
          });
          emailResult = { sent: false, smtpConfigured: false };
        } else {
          const wedding = await query(
            `SELECT name, bride, groom, wedding_date FROM weddings WHERE id = $1`,
            [req.params.weddingId]
          );
          const w = wedding.rows[0] || {};
          const couple = coupleNames(w);
          const subject = `Your vendor portal for ${couple}`;
          const text = [
            `Hi${vendor.name ? ` ${vendor.name}` : ''},`,
            '',
            `${couple} shared a vendor portal link for your day-of packet.`,
            '',
            `Open: ${url}`,
            '',
            'This link is private — do not post it publicly. It shows only your scoped packet, not the full planner.',
            expiresAt ? `Access ends around ${String(expiresAt).slice(0, 10)}.` : ''
          ]
            .filter(Boolean)
            .join('\n');
          const html = `<p>Hi${vendor.name ? ` <b>${vendor.name}</b>` : ''},</p>
            <p><b>${couple}</b> shared a vendor portal for your day-of packet.</p>
            <p><a href="${url}">Open your vendor portal</a></p>
            <p style="color:#78716c;font-size:0.9rem">Private link — scoped packet only, not the full planner.</p>`;
          try {
            await sendMail({ to: toEmail, subject, text, html });
            await logOutbound({
              weddingId: req.params.weddingId,
              kind: 'vendor_portal',
              toEmail,
              subject,
              status: 'sent',
              meta: { tokenId: row.id, vendorId }
            });
            emailResult = { sent: true, smtpConfigured: true };
          } catch (e) {
            await logOutbound({
              weddingId: req.params.weddingId,
              kind: 'vendor_portal',
              toEmail,
              subject,
              status: 'failed',
              error: String(e.message || e),
              meta: { tokenId: row.id, vendorId }
            });
            emailResult = {
              sent: false,
              smtpConfigured: true,
              error: String(e.message || e)
            };
          }
        }
      }

      res.status(201).json({
        ok: true,
        token: mapTokenRow(row, { includeUrl: true, req }),
        portalUrl: url,
        clientUrl,
        email: emailResult,
        smtp: smtpStatus(),
        message: emailResult.sent
          ? 'Portal link created and emailed.'
          : 'Portal link created — copy the URL to share (email needs SMTP).'
      });
    } catch (e) {
      next(e);
    }
  }
);

/** POST /weddings/:weddingId/vendor-portal/tokens/:tokenId/revoke */
router.post(
  '/tokens/:tokenId/revoke',
  requireFeature,
  requireAuth,
  requireWeddingMember,
  async (req, res, next) => {
    try {
      const { rows } = await query(
        `UPDATE vendor_portal_tokens
            SET revoked_at = now()
          WHERE wedding_id = $1 AND id = $2 AND revoked_at IS NULL
          RETURNING *`,
        [req.params.weddingId, req.params.tokenId]
      );
      if (!rows[0]) {
        const exists = await query(
          `SELECT id, revoked_at FROM vendor_portal_tokens
            WHERE wedding_id = $1 AND id = $2`,
          [req.params.weddingId, req.params.tokenId]
        );
        if (!exists.rows[0]) {
          res.status(404).json({ error: 'not_found', message: 'Token not found.' });
          return;
        }
        res.json({
          ok: true,
          token: mapTokenRow(exists.rows[0]),
          message: 'Already revoked.'
        });
        return;
      }
      res.json({
        ok: true,
        token: mapTokenRow(rows[0]),
        message: 'Portal link revoked — the live URL stops immediately.'
      });
    } catch (e) {
      next(e);
    }
  }
);

/** POST /weddings/:weddingId/vendor-portal/tokens/:tokenId/rotate */
router.post(
  '/tokens/:tokenId/rotate',
  requireFeature,
  requireAuth,
  requireWeddingMember,
  async (req, res, next) => {
    try {
      const existing = await query(
        `SELECT * FROM vendor_portal_tokens
          WHERE wedding_id = $1 AND id = $2`,
        [req.params.weddingId, req.params.tokenId]
      );
      const old = existing.rows[0];
      if (!old) {
        res.status(404).json({ error: 'not_found', message: 'Token not found.' });
        return;
      }
      if (old.revoked_at) {
        res.status(400).json({
          error: 'revoked',
          message: 'Cannot rotate a revoked token — create a new one.'
        });
        return;
      }

      const raw = newPortalToken();
      await query(
        `UPDATE vendor_portal_tokens SET revoked_at = now()
          WHERE wedding_id = $1 AND id = $2`,
        [req.params.weddingId, req.params.tokenId]
      );

      const { rows } = await query(
        `INSERT INTO vendor_portal_tokens (
           wedding_id, vendor_id, token, label, scopes_json, created_by, expires_at
         ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)
         RETURNING *`,
        [
          old.wedding_id,
          old.vendor_id,
          raw,
          old.label,
          JSON.stringify(sanitizeScopes(old.scopes_json)),
          req.user.id,
          old.expires_at
        ]
      );

      const vendorQ = await query(
        `SELECT name, category, email FROM vendors
          WHERE wedding_id = $1 AND id = $2`,
        [old.wedding_id, old.vendor_id]
      );
      const v = vendorQ.rows[0] || {};
      const row = {
        ...rows[0],
        vendor_name: v.name,
        vendor_category: v.category,
        vendor_email: v.email
      };
      const url = portalLink(req, raw);

      res.json({
        ok: true,
        revokedId: old.id,
        token: mapTokenRow(row, { includeUrl: true, req }),
        portalUrl: url,
        clientUrl: clientPortalPageUrl(raw),
        message: 'Rotated — old link revoked; share the new URL.'
      });
    } catch (e) {
      next(e);
    }
  }
);

async function loadToken(raw) {
  const token = String(raw || '').trim();
  if (!token || token.length < 16) return null;
  const { rows } = await query(
    `SELECT * FROM vendor_portal_tokens WHERE token = $1`,
    [token]
  );
  return rows[0] || null;
}

/**
 * Public: GET /vendor/portal/:token
 * JSON scoped packet, or redirect browsers to vendor-portal.html?g=…
 */
publicRouter.get('/portal/:token', requireFeature, async (req, res, next) => {
  try {
    const row = await loadToken(req.params.token);
    if (!row) {
      if (wantsHtml(req)) {
        res
          .status(404)
          .type('html')
          .send(
            simpleMessagePage(
              'Link not found',
              'This vendor portal link is invalid or was rotated.',
              true
            )
          );
        return;
      }
      res.status(404).json({
        error: 'not_found',
        message: 'Invalid or unknown vendor portal link.'
      });
      return;
    }

    if (row.revoked_at) {
      if (wantsHtml(req)) {
        res
          .status(410)
          .type('html')
          .send(
            simpleMessagePage(
              'Link revoked',
              'The couple revoked this vendor portal link.',
              true
            )
          );
        return;
      }
      res.status(410).json({
        error: 'revoked',
        message: 'This vendor portal link was revoked.',
        status: 'revoked'
      });
      return;
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      if (wantsHtml(req)) {
        res
          .status(410)
          .type('html')
          .send(
            simpleMessagePage(
              'Link expired',
              'This vendor portal link has expired. Ask the couple for a new one.',
              true
            )
          );
        return;
      }
      res.status(410).json({
        error: 'expired',
        message: 'This vendor portal link has expired.',
        status: 'expired'
      });
      return;
    }

    if (wantsHtml(req) && req.query.format !== 'embed') {
      // Prefer the existing vendor portal UI with the token in ?g=
      const dest = clientPortalPageUrl(row.token);
      // Also support same-origin static when SERVE_STATIC hosts the planner.
      const sameOrigin = `${publicUrl(req)}/vendor-portal.html?g=${encodeURIComponent(row.token)}`;
      const target = process.env.CLIENT_APP_URL ? dest : sameOrigin;
      res.redirect(302, target);
      return;
    }

    const packet = await buildScopedPacket(row);
    if (!packet) {
      res.status(404).json({
        error: 'vendor_missing',
        message: 'Vendor record is no longer on this wedding.'
      });
      return;
    }

    await query(
      `UPDATE vendor_portal_tokens SET last_used_at = now() WHERE id = $1`,
      [row.id]
    );

    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    res.json(packet);
  } catch (e) {
    next(e);
  }
});

export { publicRouter as vendorPortalPublicRoutes, featureOn as vendorPortalFeatureOn };
export default router;

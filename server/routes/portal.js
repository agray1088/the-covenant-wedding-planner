/**
 * Gated wedding landing / guest portal.
 * NOT a public SEO directory — unlisted slug + optional email/code gate.
 * Only portal_published_json fields are exposed to guests.
 */
import crypto from 'crypto';
import { Router } from 'express';
import { query } from '../lib/db.js';
import {
  hashPassword,
  hashToken,
  publicUrl,
  requireAuth,
  requireWeddingMember,
  verifyPassword
} from '../lib/auth.js';
import { portalPageHtml, simpleMessagePage } from '../lib/guest-pages.js';
import { publicObjectUrl } from '../lib/object-storage.js';

const router = Router({ mergeParams: true });
const publicRouter = Router();

const ACCESS_MODES = new Set(['unlisted', 'email', 'code', 'email_or_code']);

/** Short-lived unlock tokens stored hashed in-process is not durable —
 *  we use signed cookie value = sha256(secret|slug|exp) verified against hash. */
function portalUnlockSecret() {
  return process.env.SESSION_SECRET || process.env.PUBLIC_URL || 'covenant-local-portal';
}

function makeUnlockToken(slug) {
  const exp = Date.now() + 24 * 3600 * 1000;
  const raw = `${slug}|${exp}|${crypto.randomBytes(8).toString('hex')}`;
  const sig = hashToken(`${portalUnlockSecret()}|${raw}`);
  return Buffer.from(JSON.stringify({ raw, sig, exp })).toString('base64url');
}

function verifyUnlockToken(slug, token) {
  try {
    const parsed = JSON.parse(Buffer.from(String(token || ''), 'base64url').toString('utf8'));
    if (!parsed || !parsed.raw || !parsed.sig || !parsed.exp) return false;
    if (Number(parsed.exp) < Date.now()) return false;
    if (!String(parsed.raw).startsWith(`${slug}|`)) return false;
    return parsed.sig === hashToken(`${portalUnlockSecret()}|${parsed.raw}`);
  } catch {
    return false;
  }
}

function cookieName(slug) {
  return `covenant_portal_${slug}`;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const parts = String(raw).split(';');
  for (const p of parts) {
    const i = p.indexOf('=');
    if (i < 0) continue;
    const k = p.slice(0, i).trim();
    if (k === name) return decodeURIComponent(p.slice(i + 1).trim());
  }
  return null;
}

function slugify(input) {
  const s = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return s || `w-${crypto.randomBytes(4).toString('hex')}`;
}

/** Allow http(s) or same-origin relative paths only (no javascript: / data:). */
function safePublicUrl(u) {
  const s = String(u || '').trim().slice(0, 500);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//') && !s.includes('\\')) return s;
  try {
    const parsed = new URL(s);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return s;
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * Resolve a portal/packet asset reference to an HTTPS (or relative) URL.
 * Accepts: https URL, relative path, photo id, or idb:<photoId>.
 * Looks up wedding-scoped photos.public_url (no cross-wedding listing).
 */
async function resolveAssetUrl(weddingId, raw) {
  const direct = safePublicUrl(raw);
  if (direct) return direct;
  const s = String(raw || '').trim();
  if (!s || !weddingId) return '';
  const photoId = /^idb:/i.test(s) ? s.replace(/^idb:/i, '') : s;
  // Photo ids are uuid-ish or ph_… — reject obvious junk / path traversal.
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(photoId)) return '';
  try {
    const { rows } = await query(
      `SELECT public_url, storage_key FROM photos
       WHERE wedding_id = $1 AND id = $2 LIMIT 1`,
      [weddingId, photoId]
    );
    if (!rows[0]) return '';
    const url = rows[0].public_url || publicObjectUrl(rows[0].storage_key);
    return safePublicUrl(url);
  } catch {
    return '';
  }
}

/**
 * Only couple-published fields reach guests. Planner-private notes never appear.
 * Richer blocks: travel/lodging, registry links, FAQ, optional hero image URL.
 */
async function sanitizePublished(input, weddingId) {
  const src = input && typeof input === 'object' ? input : {};
  const out = {};
  const shortKeys = ['headline', 'subhead', 'date', 'venue', 'dressCode', 'rsvpHint'];
  const longKeys = ['message', 'schedule', 'travel', 'lodging'];
  for (const key of shortKeys) {
    if (src[key] == null) continue;
    const v = String(src[key]).trim().slice(0, 400);
    if (v) out[key] = v;
  }
  for (const key of longKeys) {
    if (src[key] == null) continue;
    const v = String(src[key]).trim().slice(0, 2000);
    if (v) out[key] = v;
  }
  const heroRaw = src.heroImageUrl || src.heroPhotoId || '';
  const hero = await resolveAssetUrl(weddingId, heroRaw);
  if (hero) out.heroImageUrl = hero;

  if (Array.isArray(src.registryLinks)) {
    const links = [];
    for (const item of src.registryLinks.slice(0, 8)) {
      if (!item || typeof item !== 'object') continue;
      const label = String(item.label || '').trim().slice(0, 120);
      const url = safePublicUrl(item.url);
      if (label && url) links.push({ label, url });
    }
    if (links.length) out.registryLinks = links;
  }

  if (Array.isArray(src.faqs)) {
    const faqs = [];
    for (const item of src.faqs.slice(0, 12)) {
      if (!item || typeof item !== 'object') continue;
      const q = String(item.q || item.question || '').trim().slice(0, 200);
      const a = String(item.a || item.answer || '').trim().slice(0, 1000);
      if (q && a) faqs.push({ q, a });
    }
    if (faqs.length) out.faqs = faqs;
  }

  const blockKeys = [
    'welcome',
    'event',
    'schedule',
    'travel',
    'lodging',
    'registry',
    'faq',
    'hero'
  ];
  if (src.blocks && typeof src.blocks === 'object') {
    const blocks = {};
    for (const k of blockKeys) {
      if (Object.prototype.hasOwnProperty.call(src.blocks, k)) {
        blocks[k] = !!src.blocks[k];
      }
    }
    if (Object.keys(blocks).length) out.blocks = blocks;
  }

  return out;
}

async function portalPublicView(row, baseUrl) {
  const weddingId = row.id || row.wedding_id || null;
  const published = await sanitizePublished(row.portal_published_json || {}, weddingId);
  return {
    enabled: !!row.portal_enabled,
    slug: row.portal_slug || null,
    accessMode: row.portal_access_mode || 'unlisted',
    hasAccessCode: !!row.portal_access_code_hash,
    published,
    url: row.portal_slug ? `${baseUrl}/p/${encodeURIComponent(row.portal_slug)}` : null,
    updatedAt: row.portal_updated_at
      ? new Date(row.portal_updated_at).toISOString()
      : null
  };
}

/** GET /weddings/:weddingId/portal */
router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, portal_slug, portal_enabled, portal_access_mode, portal_access_code_hash,
              portal_published_json, portal_updated_at, name, bride, groom, wedding_date
         FROM weddings WHERE id = $1`,
      [req.params.weddingId]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ ok: true, portal: await portalPublicView(rows[0], publicUrl(req)) });
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /weddings/:weddingId/portal
 * Body: { enabled?, slug?, accessMode?, accessCode?, clearAccessCode?, published? }
 */
router.put('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const { rows: curRows } = await query(`SELECT * FROM weddings WHERE id = $1`, [weddingId]);
    const cur = curRows[0];
    if (!cur) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    const body = req.body || {};
    let slug = cur.portal_slug;
    if (body.slug != null) {
      slug = slugify(body.slug);
    } else if (!slug && (body.enabled === true || body.generateSlug)) {
      const base = slugify(
        [cur.bride, cur.groom].filter(Boolean).join('-') || cur.name || 'wedding'
      );
      slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
    }

    let accessMode = cur.portal_access_mode || 'unlisted';
    if (body.accessMode != null) {
      const m = String(body.accessMode).trim();
      if (!ACCESS_MODES.has(m)) {
        res.status(400).json({
          error: 'invalid',
          message: 'accessMode must be unlisted, email, code, or email_or_code.'
        });
        return;
      }
      accessMode = m;
    }

    let codeHash = cur.portal_access_code_hash;
    if (body.clearAccessCode) {
      codeHash = null;
    } else if (body.accessCode != null && String(body.accessCode).trim() !== '') {
      codeHash = hashPassword(String(body.accessCode).trim());
    }

    const enabled = body.enabled != null ? !!body.enabled : !!cur.portal_enabled;
    const published =
      body.published != null
        ? await sanitizePublished(body.published, weddingId)
        : await sanitizePublished(cur.portal_published_json || {}, weddingId);

    if (enabled && !slug) {
      res.status(400).json({
        error: 'invalid',
        message: 'Set a portal slug (or pass generateSlug:true) before enabling.'
      });
      return;
    }

    if ((accessMode === 'code' || accessMode === 'email_or_code') && enabled && !codeHash) {
      res.status(400).json({
        error: 'invalid',
        message: 'Set an accessCode when using code gate modes.'
      });
      return;
    }

    try {
      const { rows } = await query(
        `UPDATE weddings SET
           portal_slug = $2,
           portal_enabled = $3,
           portal_access_mode = $4,
           portal_access_code_hash = $5,
           portal_published_json = $6::jsonb,
           portal_updated_at = now(),
           updated_at = now()
         WHERE id = $1
         RETURNING id, portal_slug, portal_enabled, portal_access_mode, portal_access_code_hash,
                   portal_published_json, portal_updated_at`,
        [weddingId, slug, enabled, accessMode, codeHash, JSON.stringify(published)]
      );
      res.json({ ok: true, portal: await portalPublicView(rows[0], publicUrl(req)) });
    } catch (e) {
      if (e && e.code === '23505') {
        res.status(409).json({
          error: 'slug_taken',
          message: 'That portal slug is already in use. Choose another.'
        });
        return;
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

/** POST /weddings/:weddingId/portal/rotate-code — set a new code (returns plaintext once). */
router.post('/rotate-code', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const code =
      String(req.body?.accessCode || '').trim() ||
      crypto.randomBytes(4).toString('hex');
    const hash = hashPassword(code);
    const { rows } = await query(
      `UPDATE weddings SET
         portal_access_code_hash = $2,
         portal_updated_at = now(),
         updated_at = now()
       WHERE id = $1
       RETURNING id, portal_slug, portal_enabled, portal_access_mode, portal_access_code_hash,
                 portal_published_json, portal_updated_at`,
      [req.params.weddingId, hash]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({
      ok: true,
      accessCode: code,
      portal: await portalPublicView(rows[0], publicUrl(req)),
      message: 'Access code rotated. Copy it now — it is not stored in plaintext.'
    });
  } catch (e) {
    next(e);
  }
});

function wantsHtml(req) {
  const accept = String(req.headers.accept || '');
  if (req.query.format === 'json') return false;
  if (req.query.format === 'html') return true;
  return accept.includes('text/html') && !accept.includes('application/json');
}

async function loadPortalBySlug(slug) {
  const s = String(slug || '').trim().toLowerCase();
  if (!s || !/^[a-z0-9-]{3,64}$/.test(s)) return null;
  const { rows } = await query(
    `SELECT id, name, bride, groom, wedding_date,
            portal_slug, portal_enabled, portal_access_mode, portal_access_code_hash,
            portal_published_json, portal_updated_at
       FROM weddings WHERE portal_slug = $1`,
    [s]
  );
  return rows[0] || null;
}

function isUnlocked(req, row) {
  const mode = row.portal_access_mode || 'unlisted';
  if (mode === 'unlisted') return true;
  const tok = readCookie(req, cookieName(row.portal_slug));
  return verifyUnlockToken(row.portal_slug, tok);
}

/** Public GET /p/:slug */
publicRouter.get('/:slug', async (req, res, next) => {
  try {
    const row = await loadPortalBySlug(req.params.slug);
    if (!row || !row.portal_enabled) {
      if (wantsHtml(req)) {
        res.status(404).type('html').send(
          simpleMessagePage('Not found', 'This guest page is unavailable.', true)
        );
        return;
      }
      res.status(404).json({ error: 'not_found', message: 'Portal not found or disabled.' });
      return;
    }

    const unlocked = isUnlocked(req, row);
    const published = await sanitizePublished(row.portal_published_json || {}, row.id);
    const payload = {
      ok: true,
      locked: !unlocked,
      accessMode: row.portal_access_mode,
      weddingName: row.name || '',
      published: unlocked ? published : {}
    };

    if (wantsHtml(req)) {
      res.type('html').send(
        portalPageHtml({
          slug: row.portal_slug,
          weddingName: row.name,
          accessMode: row.portal_access_mode,
          published,
          unlocked
        })
      );
      return;
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

/** Public POST /p/:slug/verify — email and/or code gate. */
publicRouter.post('/:slug/verify', async (req, res, next) => {
  try {
    const row = await loadPortalBySlug(req.params.slug);
    if (!row || !row.portal_enabled) {
      res.status(404).json({ error: 'not_found', message: 'Portal not found or disabled.' });
      return;
    }

    const mode = row.portal_access_mode || 'unlisted';
    if (mode === 'unlisted') {
      res.json({ ok: true, unlocked: true, token: null });
      return;
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();

    let emailOk = false;
    let codeOk = false;

    if (email && (mode === 'email' || mode === 'email_or_code')) {
      const { rows } = await query(
        `SELECT id FROM guests
          WHERE wedding_id = $1 AND lower(trim(email)) = $2
          LIMIT 1`,
        [row.id, email]
      );
      emailOk = !!rows[0];
    }

    if (code && (mode === 'code' || mode === 'email_or_code')) {
      codeOk = !!(row.portal_access_code_hash && verifyPassword(code, row.portal_access_code_hash));
    }

    let allowed = false;
    if (mode === 'email') allowed = emailOk;
    else if (mode === 'code') allowed = codeOk;
    else if (mode === 'email_or_code') allowed = emailOk || codeOk;

    if (!allowed) {
      res.status(403).json({
        error: 'forbidden',
        message:
          mode === 'email'
            ? 'That email is not on the guest list.'
            : mode === 'code'
              ? 'Incorrect access code.'
              : 'Email not on the list and access code did not match.'
      });
      return;
    }

    const token = makeUnlockToken(row.portal_slug);
    res.json({ ok: true, unlocked: true, token });
  } catch (e) {
    next(e);
  }
});

export { publicRouter as portalPublicRoutes };
export default router;

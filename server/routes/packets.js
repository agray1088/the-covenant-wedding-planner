import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Optional UI / analytics extras that stay nested JSON. */
const META_KEYS = [
  'activity', 'withheld', 'previewCards', 'cardMeta', 'mostOpened',
  'blockedBy', 'draftReason', 'neverAgeDays', 'tabLabel', 'cardTitle',
  'openedThisWeek', 'packet', 'notes'
];

function bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true' || v === 'yes') return true;
  return false;
}

function intOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function sectionsFromClient(c = {}) {
  if (Array.isArray(c.sections)) return c.sections;
  if (Array.isArray(c.sections_json)) return c.sections_json;
  return [];
}

function metaFromClient(c = {}) {
  const meta = {};
  if (c.meta && typeof c.meta === 'object' && !Array.isArray(c.meta)) {
    Object.assign(meta, c.meta);
  }
  META_KEYS.forEach((k) => {
    if (c[k] != null && c[k] !== '') meta[k] = c[k];
  });
  return meta;
}

function fromClient(c = {}) {
  const id = String(c.id || c._id || '').trim();
  const updatedAt = c.updatedAt || c.updated_at || new Date().toISOString();
  const name = c.name ?? c.packet ?? '';
  return {
    id,
    name: name != null ? String(name) : '',
    recipient: c.recipient ?? null,
    recipient_type: c.recipientType ?? c.recipient_type ?? c.type ?? null,
    contains: c.contains ?? null,
    mode: c.mode ?? null,
    opens: intOrZero(c.opens),
    expires: c.expires ?? null,
    status: c.status ?? null,
    created_date: c.created ?? c.created_date ?? c.createdDate ?? null,
    sent: c.sent ?? null,
    last_open: c.lastOpen ?? c.last_open ?? null,
    contact: c.contact ?? null,
    link: c.link ?? null,
    passcode: c.passcode ?? null,
    hides: c.hides ?? null,
    revoked: bool(c.revoked),
    sections_json: sectionsFromClient(c),
    meta_json: metaFromClient(c),
    updated_at: updatedAt
  };
}

function toClient(row) {
  const id = row.id;
  const meta = (row.meta_json && typeof row.meta_json === 'object' && !Array.isArray(row.meta_json))
    ? row.meta_json
    : {};
  const sections = Array.isArray(row.sections_json) ? row.sections_json : [];
  const out = {
    id,
    _id: id,
    name: row.name || '',
    recipient: row.recipient || '',
    recipientType: row.recipient_type || '',
    type: row.recipient_type || '',
    contains: row.contains || '',
    mode: row.mode || '',
    opens: row.opens != null ? Number(row.opens) : 0,
    expires: row.expires || '',
    status: row.status || '',
    created: row.created_date || '',
    sent: row.sent || '',
    lastOpen: row.last_open || '',
    contact: row.contact || '',
    link: row.link || '',
    passcode: row.passcode || '',
    hides: row.hides || '',
    revoked: !!row.revoked,
    sections,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
  Object.keys(meta).forEach((k) => {
    if (out[k] == null || out[k] === '') out[k] = meta[k];
  });
  if (!Array.isArray(out.activity)) out.activity = Array.isArray(meta.activity) ? meta.activity : [];
  if (!Array.isArray(out.withheld)) out.withheld = Array.isArray(meta.withheld) ? meta.withheld : [];
  if (!Array.isArray(out.previewCards)) {
    out.previewCards = Array.isArray(meta.previewCards) ? meta.previewCards : [];
  }
  return out;
}

const UPSERT_SQL = `
  INSERT INTO packets (
    id, wedding_id, name, recipient, recipient_type, contains, mode, opens,
    expires, status, created_date, sent, last_open, contact, link, passcode,
    hides, revoked, sections_json, meta_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20::jsonb,$21::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    recipient = EXCLUDED.recipient,
    recipient_type = EXCLUDED.recipient_type,
    contains = EXCLUDED.contains,
    mode = EXCLUDED.mode,
    opens = EXCLUDED.opens,
    expires = EXCLUDED.expires,
    status = EXCLUDED.status,
    created_date = EXCLUDED.created_date,
    sent = EXCLUDED.sent,
    last_open = EXCLUDED.last_open,
    contact = EXCLUDED.contact,
    link = EXCLUDED.link,
    passcode = EXCLUDED.passcode,
    hides = EXCLUDED.hides,
    revoked = EXCLUDED.revoked,
    sections_json = EXCLUDED.sections_json,
    meta_json = EXCLUDED.meta_json,
    updated_at = EXCLUDED.updated_at
  WHERE packets.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(pkt, weddingId) {
  return [
    pkt.id, weddingId, pkt.name, pkt.recipient, pkt.recipient_type, pkt.contains,
    pkt.mode, pkt.opens, pkt.expires, pkt.status, pkt.created_date, pkt.sent,
    pkt.last_open, pkt.contact, pkt.link, pkt.passcode, pkt.hides, pkt.revoked,
    JSON.stringify(pkt.sections_json || []), JSON.stringify(pkt.meta_json || {}),
    pkt.updated_at
  ];
}

async function upsertPacket(pkt, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(pkt, weddingId));
  let row = rows[0];
  if (!row) {
    const cur = await query(
      `SELECT * FROM packets WHERE wedding_id = $1 AND id = $2`,
      [weddingId, pkt.id]
    );
    row = cur.rows[0];
    if (!row) {
      const forced = await query(
        `INSERT INTO packets (
          id, wedding_id, name, recipient, recipient_type, contains, mode, opens,
          expires, status, created_date, sent, last_open, contact, link, passcode,
          hides, revoked, sections_json, meta_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20::jsonb,$21::timestamptz
        ) RETURNING *`,
        upsertParams(pkt, weddingId)
      );
      row = forced.rows[0];
      return { row, ack: true };
    }
    return { row, ack: false, reason: 'server_newer' };
  }
  return { row, ack: true };
}

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM packets WHERE wedding_id = $1
       ORDER BY created_date ASC NULLS LAST, name ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({ packets: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:packetId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const pkt = fromClient({ ...req.body, id: req.params.packetId });
    if (!pkt.id) {
      res.status(400).json({ error: 'invalid', message: 'Packet id required.' });
      return;
    }
    if (!pkt.name) pkt.name = pkt.recipient || 'Share packet';
    const result = await upsertPacket(pkt, req.params.weddingId);
    if (!result.ack) {
      res.json({ packet: toClient(result.row), ack: false, reason: result.reason || 'server_newer' });
      return;
    }
    res.json({ packet: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.packets) ? req.body.packets : [];
    const results = [];
    for (const raw of list) {
      const pkt = fromClient(raw);
      if (!pkt.id) {
        pkt.id = `pkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!pkt.name) pkt.name = pkt.recipient || 'Share packet';
      const result = await upsertPacket(pkt, weddingId);
      results.push({
        packet: toClient(result.row),
        ack: result.ack,
        reason: result.ack ? undefined : (result.reason || 'server_newer')
      });
    }
    await query(`UPDATE weddings SET updated_at = now() WHERE id = $1`, [weddingId]);
    res.json({ results, serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.delete('/:packetId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM packets WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.packetId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

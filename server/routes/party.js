import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Optional UI extras that stay nested JSON. */
const META_KEYS = [
  'side', 'attireStatus', 'duties', 'dutyLabels', 'fitting', 'fittingDetail',
  'relationship', 'cost', 'sizeNote', 'arrives', 'room', 'speechOrder',
  'speechMinutes', 'speechTitle', 'callTime', 'attireKind', 'attireDetail'
];

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
  const name = c.name ?? c.member_name ?? c.memberName ?? '';
  return {
    id,
    name: name != null ? String(name) : '',
    role: c.role ?? null,
    phone: c.phone ?? null,
    email: c.email ?? null,
    attire: c.attire ?? null,
    size: c.size ?? null,
    status: c.status ?? null,
    notes: c.notes ?? null,
    guest_id: c.guestId ?? c.guest_id ?? null,
    meta_json: metaFromClient(c),
    updated_at: updatedAt
  };
}

function toClient(row) {
  const id = row.id;
  const meta = (row.meta_json && typeof row.meta_json === 'object' && !Array.isArray(row.meta_json))
    ? row.meta_json
    : {};
  const out = {
    id,
    _id: id,
    name: row.name || '',
    role: row.role || '',
    phone: row.phone || '',
    email: row.email || '',
    attire: row.attire || '',
    size: row.size || '',
    status: row.status || '',
    notes: row.notes || '',
    guestId: row.guest_id || '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
  Object.keys(meta).forEach((k) => {
    if (out[k] == null || out[k] === '') out[k] = meta[k];
  });
  return out;
}

const UPSERT_SQL = `
  INSERT INTO party_members (
    id, wedding_id, name, role, phone, email, attire, size,
    status, notes, guest_id, meta_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    attire = EXCLUDED.attire,
    size = EXCLUDED.size,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    guest_id = EXCLUDED.guest_id,
    meta_json = EXCLUDED.meta_json,
    updated_at = EXCLUDED.updated_at
  WHERE party_members.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(m, weddingId) {
  return [
    m.id, weddingId, m.name, m.role, m.phone, m.email, m.attire, m.size,
    m.status, m.notes, m.guest_id, JSON.stringify(m.meta_json || {}), m.updated_at
  ];
}

async function upsertPartyMember(m, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(m, weddingId));
  let row = rows[0];
  if (!row) {
    const cur = await query(
      `SELECT * FROM party_members WHERE wedding_id = $1 AND id = $2`,
      [weddingId, m.id]
    );
    row = cur.rows[0];
    if (!row) {
      const forced = await query(
        `INSERT INTO party_members (
          id, wedding_id, name, role, phone, email, attire, size,
          status, notes, guest_id, meta_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::timestamptz
        ) RETURNING *`,
        upsertParams(m, weddingId)
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
      `SELECT * FROM party_members WHERE wedding_id = $1
       ORDER BY name ASC NULLS LAST, role ASC NULLS LAST, id ASC`,
      [req.params.weddingId]
    );
    res.json({ party: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:memberId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const m = fromClient({ ...req.body, id: req.params.memberId });
    if (!m.id) {
      res.status(400).json({ error: 'invalid', message: 'Party member id required.' });
      return;
    }
    if (!m.name) m.name = m.role || 'Party member';
    const result = await upsertPartyMember(m, req.params.weddingId);
    if (!result.ack) {
      res.json({ member: toClient(result.row), ack: false, reason: result.reason || 'server_newer' });
      return;
    }
    res.json({ member: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.party)
      ? req.body.party
      : (Array.isArray(req.body?.members) ? req.body.members : []);
    const results = [];
    for (const raw of list) {
      const m = fromClient(raw);
      if (!m.id) {
        m.id = `pty_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!m.name) m.name = m.role || 'Party member';
      const result = await upsertPartyMember(m, weddingId);
      results.push({
        member: toClient(result.row),
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

router.delete('/:memberId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM party_members WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.memberId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

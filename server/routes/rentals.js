import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Optional UI extras that stay nested JSON. */
const META_KEYS = [
  'notes', 'qty', 'quantity', 'status', 'category', 'location', 'color',
  'material', 'source', 'name'
];

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
  const item = c.item ?? c.name ?? '';
  return {
    id,
    item: item != null ? String(item) : '',
    vendor: c.vendor ?? null,
    vendor_id: c.vendorId ?? c.vendor_id ?? null,
    pickup_date: c.pickup ?? c.pickup_date ?? c.pickupDate ?? null,
    return_date: c.ret ?? c.return_date ?? c.returnDate ?? c.return ?? null,
    cost: num(c.cost),
    details: c.details ?? null,
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
    item: row.item || '',
    vendor: row.vendor || '',
    vendorId: row.vendor_id || '',
    pickup: row.pickup_date || '',
    ret: row.return_date || '',
    cost: row.cost != null ? Number(row.cost) : 0,
    details: row.details || '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
  Object.keys(meta).forEach((k) => {
    if (out[k] == null || out[k] === '') out[k] = meta[k];
  });
  return out;
}

const UPSERT_SQL = `
  INSERT INTO rentals (
    id, wedding_id, item, vendor, vendor_id, pickup_date, return_date,
    cost, details, meta_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    item = EXCLUDED.item,
    vendor = EXCLUDED.vendor,
    vendor_id = EXCLUDED.vendor_id,
    pickup_date = EXCLUDED.pickup_date,
    return_date = EXCLUDED.return_date,
    cost = EXCLUDED.cost,
    details = EXCLUDED.details,
    meta_json = EXCLUDED.meta_json,
    updated_at = EXCLUDED.updated_at
  WHERE rentals.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(r, weddingId) {
  return [
    r.id, weddingId, r.item, r.vendor, r.vendor_id, r.pickup_date, r.return_date,
    r.cost, r.details, JSON.stringify(r.meta_json || {}), r.updated_at
  ];
}

async function upsertRental(r, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(r, weddingId));
  let row = rows[0];
  if (!row) {
    const cur = await query(
      `SELECT * FROM rentals WHERE wedding_id = $1 AND id = $2`,
      [weddingId, r.id]
    );
    row = cur.rows[0];
    if (!row) {
      const forced = await query(
        `INSERT INTO rentals (
          id, wedding_id, item, vendor, vendor_id, pickup_date, return_date,
          cost, details, meta_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::timestamptz
        ) RETURNING *`,
        upsertParams(r, weddingId)
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
      `SELECT * FROM rentals WHERE wedding_id = $1
       ORDER BY pickup_date ASC NULLS LAST, item ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({ rentals: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:rentalId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const r = fromClient({ ...req.body, id: req.params.rentalId });
    if (!r.id) {
      res.status(400).json({ error: 'invalid', message: 'Rental id required.' });
      return;
    }
    if (!r.item) r.item = r.vendor || 'Rental item';
    const result = await upsertRental(r, req.params.weddingId);
    if (!result.ack) {
      res.json({ rental: toClient(result.row), ack: false, reason: result.reason || 'server_newer' });
      return;
    }
    res.json({ rental: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.rentals) ? req.body.rentals : [];
    const results = [];
    for (const raw of list) {
      const r = fromClient(raw);
      if (!r.id) {
        r.id = `rnt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!r.item) r.item = r.vendor || 'Rental item';
      const result = await upsertRental(r, weddingId);
      results.push({
        rental: toClient(result.row),
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

router.delete('/:rentalId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM rentals WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.rentalId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Optional UI extras that stay nested JSON (not first-class columns). */
const META_KEYS = [
  'category', 'location', 'pickup', 'return', 'ret', 'vendorId', 'vendor_id',
  'quantity', 'name', 'details'
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
  const qty = c.qty ?? c.quantity ?? null;
  return {
    id,
    item: item != null ? String(item) : '',
    material: c.material ?? null,
    color: c.color ?? null,
    qty: qty != null && qty !== '' ? String(qty) : null,
    vendor: c.vendor ?? null,
    source: c.source ?? null,
    cost: num(c.cost),
    status: c.status ?? null,
    notes: c.notes ?? null,
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
    material: row.material || '',
    color: row.color || '',
    qty: row.qty != null ? String(row.qty) : '',
    vendor: row.vendor || '',
    source: row.source || '',
    cost: row.cost != null ? Number(row.cost) : 0,
    status: row.status || '',
    notes: row.notes || '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
  Object.keys(meta).forEach((k) => {
    if (out[k] == null || out[k] === '') out[k] = meta[k];
  });
  return out;
}

const UPSERT_SQL = `
  INSERT INTO catering_rentals (
    id, wedding_id, item, material, color, qty, vendor, source,
    cost, status, notes, meta_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    item = EXCLUDED.item,
    material = EXCLUDED.material,
    color = EXCLUDED.color,
    qty = EXCLUDED.qty,
    vendor = EXCLUDED.vendor,
    source = EXCLUDED.source,
    cost = EXCLUDED.cost,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    meta_json = EXCLUDED.meta_json,
    updated_at = EXCLUDED.updated_at
  WHERE catering_rentals.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(r, weddingId) {
  return [
    r.id, weddingId, r.item, r.material, r.color, r.qty, r.vendor, r.source,
    r.cost, r.status, r.notes, JSON.stringify(r.meta_json || {}), r.updated_at
  ];
}

async function upsertCateringRental(r, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(r, weddingId));
  let row = rows[0];
  if (!row) {
    const cur = await query(
      `SELECT * FROM catering_rentals WHERE wedding_id = $1 AND id = $2`,
      [weddingId, r.id]
    );
    row = cur.rows[0];
    if (!row) {
      const forced = await query(
        `INSERT INTO catering_rentals (
          id, wedding_id, item, material, color, qty, vendor, source,
          cost, status, notes, meta_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::timestamptz
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
      `SELECT * FROM catering_rentals WHERE wedding_id = $1
       ORDER BY item ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({
      cateringRentals: rows.map(toClient),
      serverTime: new Date().toISOString()
    });
  } catch (e) {
    next(e);
  }
});

router.put('/:rentalId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const r = fromClient({ ...req.body, id: req.params.rentalId });
    if (!r.id) {
      res.status(400).json({ error: 'invalid', message: 'Catering rental id required.' });
      return;
    }
    if (!r.item) r.item = r.vendor || 'Catering rental';
    const result = await upsertCateringRental(r, req.params.weddingId);
    if (!result.ack) {
      res.json({
        cateringRental: toClient(result.row),
        ack: false,
        reason: result.reason || 'server_newer'
      });
      return;
    }
    res.json({ cateringRental: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.cateringRentals)
      ? req.body.cateringRentals
      : (Array.isArray(req.body?.rentals) ? req.body.rentals : []);
    const results = [];
    for (const raw of list) {
      const r = fromClient(raw);
      if (!r.id) {
        r.id = `crt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!r.item) r.item = r.vendor || 'Catering rental';
      const result = await upsertCateringRental(r, weddingId);
      results.push({
        cateringRental: toClient(result.row),
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
    await query(`DELETE FROM catering_rentals WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.rentalId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

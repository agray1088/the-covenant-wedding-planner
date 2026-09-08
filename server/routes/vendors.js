import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

function bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true') return true;
  return false;
}

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fromClient(v = {}) {
  const id = String(v.id || v._id || '').trim();
  const updatedAt = v.updatedAt || v.updated_at || new Date().toISOString();
  return {
    id,
    category: v.cat ?? v.category ?? null,
    name: String(v.name || '').trim(),
    contact: v.contact ?? null,
    phone: v.phone ?? null,
    email: v.email ?? null,
    quote: num(v.quote),
    deposit: num(v.deposit),
    balance: num(v.balance),
    status: v.status ?? null,
    rating: num(v.rating),
    has_contract: bool(v.contract ?? v.has_contract ?? v.hasContract),
    pros: v.pros ?? null,
    cons: v.cons ?? null,
    review: v.review ?? null,
    notes: v.notes ?? null,
    updated_at: updatedAt
  };
}

function toClient(row) {
  const id = row.id;
  return {
    id,
    _id: id,
    cat: row.category || '',
    category: row.category || '',
    name: row.name || '',
    contact: row.contact || '',
    phone: row.phone || '',
    email: row.email || '',
    quote: row.quote != null ? Number(row.quote) : 0,
    deposit: row.deposit != null ? Number(row.deposit) : 0,
    balance: row.balance != null ? Number(row.balance) : 0,
    status: row.status || '',
    rating: row.rating != null ? Number(row.rating) : 0,
    contract: !!row.has_contract,
    has_contract: !!row.has_contract,
    pros: row.pros || '',
    cons: row.cons || '',
    review: row.review || '',
    notes: row.notes || '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

const UPSERT_SQL = `
  INSERT INTO vendors (
    id, wedding_id, category, name, contact, phone, email,
    quote, deposit, balance, status, rating, has_contract,
    pros, cons, review, notes, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    contact = EXCLUDED.contact,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    quote = EXCLUDED.quote,
    deposit = EXCLUDED.deposit,
    balance = EXCLUDED.balance,
    status = EXCLUDED.status,
    rating = EXCLUDED.rating,
    has_contract = EXCLUDED.has_contract,
    pros = EXCLUDED.pros,
    cons = EXCLUDED.cons,
    review = EXCLUDED.review,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at
  WHERE vendors.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(vendor, weddingId) {
  return [
    vendor.id, weddingId, vendor.category, vendor.name, vendor.contact, vendor.phone, vendor.email,
    vendor.quote, vendor.deposit, vendor.balance, vendor.status, vendor.rating, vendor.has_contract,
    vendor.pros, vendor.cons, vendor.review, vendor.notes, vendor.updated_at
  ];
}

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM vendors WHERE wedding_id = $1 ORDER BY name ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({ vendors: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:vendorId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const vendor = fromClient({ ...req.body, id: req.params.vendorId });
    if (!vendor.id) {
      res.status(400).json({ error: 'invalid', message: 'Vendor id required.' });
      return;
    }
    if (!vendor.name) vendor.name = 'Vendor';
    const { rows } = await query(UPSERT_SQL, upsertParams(vendor, req.params.weddingId));
    let row = rows[0];
    if (!row) {
      const cur = await query(
        `SELECT * FROM vendors WHERE wedding_id = $1 AND id = $2`,
        [req.params.weddingId, vendor.id]
      );
      row = cur.rows[0];
      if (!row) {
        const forced = await query(
          `INSERT INTO vendors (
            id, wedding_id, category, name, contact, phone, email,
            quote, deposit, balance, status, rating, has_contract,
            pros, cons, review, notes, updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::timestamptz
          ) RETURNING *`,
          upsertParams(vendor, req.params.weddingId)
        );
        row = forced.rows[0];
      } else {
        res.json({ vendor: toClient(row), ack: false, reason: 'server_newer' });
        return;
      }
    }
    res.json({ vendor: toClient(row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.vendors) ? req.body.vendors : [];
    const results = [];
    for (const raw of list) {
      const vendor = fromClient(raw);
      if (!vendor.id) {
        vendor.id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!vendor.name) vendor.name = 'Vendor';
      const { rows } = await query(UPSERT_SQL, upsertParams(vendor, req.params.weddingId));
      let row = rows[0];
      if (!row) {
        const cur = await query(
          `SELECT * FROM vendors WHERE wedding_id = $1 AND id = $2`,
          [req.params.weddingId, vendor.id]
        );
        row = cur.rows[0];
        results.push({ vendor: toClient(row), ack: false, reason: 'server_newer' });
      } else {
        results.push({ vendor: toClient(row), ack: true });
      }
    }
    await query(`UPDATE weddings SET updated_at = now() WHERE id = $1`, [req.params.weddingId]);
    res.json({ results, serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.delete('/:vendorId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM vendors WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.vendorId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

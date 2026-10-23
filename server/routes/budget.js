import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true') return true;
  if (v === false || v === 0 || v === '0' || v === 'false') return false;
  return !!v;
}

function itemsFromClient(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((it) => {
    if (!it || typeof it !== 'object') return it;
    const id = it._id || it.id || undefined;
    return {
      ...it,
      _id: id,
      id: id || it.id || undefined,
      name: it.name ?? '',
      cost: num(it.cost),
      actual: num(it.actual),
      budgeted: num(it.budgeted),
      status: it.status ?? 'Pending',
      paid: bool(it.paid),
      due: it.due ?? it.due_date ?? it.dueDate ?? '',
      due_date: it.due_date ?? it.due ?? it.dueDate ?? '',
      notes: it.notes ?? '',
      paymentId: it.paymentId ?? it.payment_id ?? '',
      vendorId: it.vendorId ?? it.vendor_id ?? '',
      paidAmount: num(it.paidAmount ?? it.paid_amount),
      budgetCategoryId: it.budgetCategoryId ?? it.budget_category_id ?? ''
    };
  });
}

function fromClient(c = {}) {
  const id = String(c.id || c._id || '').trim();
  const updatedAt = c.updatedAt || c.updated_at || new Date().toISOString();
  return {
    id,
    name: c.cat ?? c.name ?? '',
    target_pct: num(c.target ?? c.target_pct ?? c.targetPct),
    planned: num(c.planned),
    tip: c.tip ?? null,
    items_json: itemsFromClient(c.items),
    updated_at: updatedAt
  };
}

function toClient(row) {
  const id = row.id;
  const items = Array.isArray(row.items_json) ? row.items_json : [];
  return {
    id,
    _id: id,
    cat: row.name || '',
    name: row.name || '',
    target: row.target_pct != null ? Number(row.target_pct) : 0,
    planned: row.planned != null ? Number(row.planned) : 0,
    tip: row.tip || '',
    items,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

const UPSERT_SQL = `
  INSERT INTO budget_categories (
    id, wedding_id, name, target_pct, planned, tip, items_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7::jsonb,$8::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    target_pct = EXCLUDED.target_pct,
    planned = EXCLUDED.planned,
    tip = EXCLUDED.tip,
    items_json = EXCLUDED.items_json,
    updated_at = EXCLUDED.updated_at
  WHERE budget_categories.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(cat, weddingId) {
  return [
    cat.id, weddingId, cat.name, cat.target_pct, cat.planned, cat.tip,
    JSON.stringify(cat.items_json || []), cat.updated_at
  ];
}

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM budget_categories WHERE wedding_id = $1 ORDER BY name ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({ budget: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:categoryId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const cat = fromClient({ ...req.body, id: req.params.categoryId });
    if (!cat.id) {
      res.status(400).json({ error: 'invalid', message: 'Budget category id required.' });
      return;
    }
    if (!cat.name) cat.name = 'Category';
    const { rows } = await query(UPSERT_SQL, upsertParams(cat, req.params.weddingId));
    let row = rows[0];
    if (!row) {
      const cur = await query(
        `SELECT * FROM budget_categories WHERE wedding_id = $1 AND id = $2`,
        [req.params.weddingId, cat.id]
      );
      row = cur.rows[0];
      if (!row) {
        const forced = await query(
          `INSERT INTO budget_categories (
            id, wedding_id, name, target_pct, planned, tip, items_json, updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7::jsonb,$8::timestamptz
          ) RETURNING *`,
          upsertParams(cat, req.params.weddingId)
        );
        row = forced.rows[0];
      } else {
        res.json({ category: toClient(row), ack: false, reason: 'server_newer' });
        return;
      }
    }
    res.json({ category: toClient(row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.budget)
      ? req.body.budget
      : (Array.isArray(req.body?.categories) ? req.body.categories : []);
    const results = [];
    for (const raw of list) {
      const cat = fromClient(raw);
      if (!cat.id) {
        cat.id = `bc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!cat.name) cat.name = 'Category';
      const { rows } = await query(UPSERT_SQL, upsertParams(cat, req.params.weddingId));
      let row = rows[0];
      if (!row) {
        const cur = await query(
          `SELECT * FROM budget_categories WHERE wedding_id = $1 AND id = $2`,
          [req.params.weddingId, cat.id]
        );
        row = cur.rows[0];
        results.push({ category: toClient(row), ack: false, reason: 'server_newer' });
      } else {
        results.push({ category: toClient(row), ack: true });
      }
    }
    await query(`UPDATE weddings SET updated_at = now() WHERE id = $1`, [req.params.weddingId]);
    res.json({ results, serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.delete('/:categoryId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM budget_categories WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.categoryId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

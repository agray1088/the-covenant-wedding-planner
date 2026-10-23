import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function installmentsFromClient(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((inst) => {
    if (!inst || typeof inst !== 'object') return inst;
    return {
      _id: inst._id || inst.id || undefined,
      id: inst.id || inst._id || undefined,
      label: inst.label ?? '',
      amount: num(inst.amount),
      amountDue: num(inst.amountDue ?? inst.amount_due) ?? 0,
      amountPaid: num(inst.amountPaid ?? inst.amount_paid) ?? 0,
      dueDate: inst.dueDate ?? inst.due_date ?? '',
      paidDate: inst.paidDate ?? inst.paid_date ?? '',
      status: inst.status ?? '',
      notes: inst.notes ?? ''
    };
  });
}

function fromClient(p = {}) {
  const id = String(p.id || p._id || '').trim();
  const updatedAt = p.updatedAt || p.updated_at || new Date().toISOString();
  return {
    id,
    vendor: p.vendor ?? null,
    vendor_id: p.vendorId ?? p.vendor_id ?? null,
    budget_cat: p.budgetCat ?? p.budget_cat ?? null,
    budget_category_id: p.budgetCategoryId ?? p.budget_category_id ?? null,
    descr: p.desc ?? p.descr ?? null,
    due_amount: num(p.due ?? p.due_amount),
    paid_amount: num(p.paid ?? p.paid_amount),
    gratuity: num(p.gratuity),
    gratuity_status: p.gratuityStatus ?? p.gratuity_status ?? null,
    budget_item: p.budgetItem ?? p.budget_item ?? null,
    budget_item_id: p.budgetItemId ?? p.budget_item_id ?? null,
    contract_idx: p.contractIdx != null ? String(p.contractIdx) : (p.contract_idx != null ? String(p.contract_idx) : null),
    contract_id: p.contractId ?? p.contract_id ?? null,
    due_date: p.date ?? p.dueDate ?? p.due_date ?? null,
    paid_date: p.paiddate ?? p.paidDate ?? p.paid_date ?? null,
    method: p.ptype ?? p.method ?? null,
    status: p.status ?? null,
    notes: p.notes ?? null,
    installments_json: installmentsFromClient(p.installments),
    updated_at: updatedAt
  };
}

function toClient(row) {
  const id = row.id;
  const installments = Array.isArray(row.installments_json) ? row.installments_json : [];
  return {
    id,
    _id: id,
    vendor: row.vendor || '',
    vendorId: row.vendor_id || '',
    budgetCat: row.budget_cat || '',
    budgetCategoryId: row.budget_category_id || '',
    desc: row.descr || '',
    due: row.due_amount != null ? Number(row.due_amount) : 0,
    paid: row.paid_amount != null ? Number(row.paid_amount) : 0,
    gratuity: row.gratuity != null ? Number(row.gratuity) : 0,
    gratuityStatus: row.gratuity_status || 'Not Planned',
    budgetItem: row.budget_item || '',
    budgetItemId: row.budget_item_id || '',
    contractIdx: row.contract_idx != null ? row.contract_idx : '',
    contractId: row.contract_id || '',
    date: row.due_date || '',
    paiddate: row.paid_date || '',
    ptype: row.method || '',
    status: row.status || 'Not Paid',
    notes: row.notes || '',
    installments,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

const UPSERT_SQL = `
  INSERT INTO payments (
    id, wedding_id, vendor, vendor_id, budget_cat, budget_category_id,
    descr, due_amount, paid_amount, gratuity, gratuity_status,
    budget_item, budget_item_id, contract_idx, contract_id,
    due_date, paid_date, method, status, notes, installments_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    vendor = EXCLUDED.vendor,
    vendor_id = EXCLUDED.vendor_id,
    budget_cat = EXCLUDED.budget_cat,
    budget_category_id = EXCLUDED.budget_category_id,
    descr = EXCLUDED.descr,
    due_amount = EXCLUDED.due_amount,
    paid_amount = EXCLUDED.paid_amount,
    gratuity = EXCLUDED.gratuity,
    gratuity_status = EXCLUDED.gratuity_status,
    budget_item = EXCLUDED.budget_item,
    budget_item_id = EXCLUDED.budget_item_id,
    contract_idx = EXCLUDED.contract_idx,
    contract_id = EXCLUDED.contract_id,
    due_date = EXCLUDED.due_date,
    paid_date = EXCLUDED.paid_date,
    method = EXCLUDED.method,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    installments_json = EXCLUDED.installments_json,
    updated_at = EXCLUDED.updated_at
  WHERE payments.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(payment, weddingId) {
  return [
    payment.id, weddingId, payment.vendor, payment.vendor_id, payment.budget_cat, payment.budget_category_id,
    payment.descr, payment.due_amount, payment.paid_amount, payment.gratuity, payment.gratuity_status,
    payment.budget_item, payment.budget_item_id, payment.contract_idx, payment.contract_id,
    payment.due_date, payment.paid_date, payment.method, payment.status, payment.notes,
    JSON.stringify(payment.installments_json || []), payment.updated_at
  ];
}

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM payments WHERE wedding_id = $1 ORDER BY due_date ASC NULLS LAST, id ASC`,
      [req.params.weddingId]
    );
    res.json({ payments: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:paymentId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const payment = fromClient({ ...req.body, id: req.params.paymentId });
    if (!payment.id) {
      res.status(400).json({ error: 'invalid', message: 'Payment id required.' });
      return;
    }
    if (!payment.descr) payment.descr = payment.vendor || 'Payment';
    const { rows } = await query(UPSERT_SQL, upsertParams(payment, req.params.weddingId));
    let row = rows[0];
    if (!row) {
      const cur = await query(
        `SELECT * FROM payments WHERE wedding_id = $1 AND id = $2`,
        [req.params.weddingId, payment.id]
      );
      row = cur.rows[0];
      if (!row) {
        const forced = await query(
          `INSERT INTO payments (
            id, wedding_id, vendor, vendor_id, budget_cat, budget_category_id,
            descr, due_amount, paid_amount, gratuity, gratuity_status,
            budget_item, budget_item_id, contract_idx, contract_id,
            due_date, paid_date, method, status, notes, installments_json, updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::timestamptz
          ) RETURNING *`,
          upsertParams(payment, req.params.weddingId)
        );
        row = forced.rows[0];
      } else {
        res.json({ payment: toClient(row), ack: false, reason: 'server_newer' });
        return;
      }
    }
    res.json({ payment: toClient(row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.payments) ? req.body.payments : [];
    const results = [];
    for (const raw of list) {
      const payment = fromClient(raw);
      if (!payment.id) {
        payment.id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!payment.descr) payment.descr = payment.vendor || 'Payment';
      const { rows } = await query(UPSERT_SQL, upsertParams(payment, req.params.weddingId));
      let row = rows[0];
      if (!row) {
        const cur = await query(
          `SELECT * FROM payments WHERE wedding_id = $1 AND id = $2`,
          [req.params.weddingId, payment.id]
        );
        row = cur.rows[0];
        results.push({ payment: toClient(row), ack: false, reason: 'server_newer' });
      } else {
        results.push({ payment: toClient(row), ack: true });
      }
    }
    await query(`UPDATE weddings SET updated_at = now() WHERE id = $1`, [req.params.weddingId]);
    res.json({ results, serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.delete('/:paymentId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM payments WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.paymentId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Optional UI extras that stay nested JSON. */
const META_KEYS = [
  'link', 'url', 'vendorId', 'vendor_id', 'paymentId', 'payment_id',
  'budgetCat', 'budget_cat', 'source', 'template', 'order', 'sort',
  'collapsed', 'expanded', 'tags'
];

function bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true' || v === 'yes') return true;
  if (v === false || v === 0 || v === '0' || v === 'false' || v === 'no') return false;
  return !!v;
}

function subtasksFromClient(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((st) => {
    if (!st || typeof st !== 'object') {
      return { text: String(st == null ? '' : st), done: false };
    }
    return {
      _id: st._id || st.id || undefined,
      id: st.id || st._id || undefined,
      text: st.text ?? st.body ?? st.label ?? '',
      done: bool(st.done)
    };
  });
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
  const title = c.task ?? c.title ?? c.name ?? '';
  return {
    id,
    title: title != null ? String(title) : '',
    category: c.cat ?? c.category ?? null,
    phase: c.phase ?? null,
    priority: c.priority ?? null,
    due_date: c.date ?? c.dueDate ?? c.due_date ?? null,
    suggested_due: c.suggestedDue ?? c.suggested_due ?? null,
    status: c.status ?? null,
    assigned: c.assigned ?? null,
    notes: c.notes ?? null,
    done: bool(c.done),
    subtasks_json: subtasksFromClient(c.subtasks),
    meta_json: metaFromClient(c),
    updated_at: updatedAt
  };
}

function toClient(row) {
  const id = row.id;
  const meta = (row.meta_json && typeof row.meta_json === 'object' && !Array.isArray(row.meta_json))
    ? row.meta_json
    : {};
  const subtasks = Array.isArray(row.subtasks_json) ? row.subtasks_json : [];
  const out = {
    id,
    _id: id,
    task: row.title || '',
    cat: row.category || '',
    phase: row.phase || '',
    priority: row.priority || '',
    date: row.due_date || '',
    suggestedDue: row.suggested_due || '',
    status: row.status || '',
    assigned: row.assigned || '',
    notes: row.notes || '',
    done: !!row.done,
    subtasks,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
  Object.keys(meta).forEach((k) => {
    if (out[k] == null || out[k] === '') out[k] = meta[k];
  });
  return out;
}

const UPSERT_SQL = `
  INSERT INTO planning_tasks (
    id, wedding_id, title, category, phase, priority, due_date, suggested_due,
    status, assigned, notes, done, subtasks_json, meta_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    phase = EXCLUDED.phase,
    priority = EXCLUDED.priority,
    due_date = EXCLUDED.due_date,
    suggested_due = EXCLUDED.suggested_due,
    status = EXCLUDED.status,
    assigned = EXCLUDED.assigned,
    notes = EXCLUDED.notes,
    done = EXCLUDED.done,
    subtasks_json = EXCLUDED.subtasks_json,
    meta_json = EXCLUDED.meta_json,
    updated_at = EXCLUDED.updated_at
  WHERE planning_tasks.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(t, weddingId) {
  return [
    t.id, weddingId, t.title, t.category, t.phase, t.priority, t.due_date, t.suggested_due,
    t.status, t.assigned, t.notes, t.done, JSON.stringify(t.subtasks_json || []),
    JSON.stringify(t.meta_json || {}), t.updated_at
  ];
}

async function upsertTask(t, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(t, weddingId));
  let row = rows[0];
  if (!row) {
    const cur = await query(
      `SELECT * FROM planning_tasks WHERE wedding_id = $1 AND id = $2`,
      [weddingId, t.id]
    );
    row = cur.rows[0];
    if (!row) {
      const forced = await query(
        `INSERT INTO planning_tasks (
          id, wedding_id, title, category, phase, priority, due_date, suggested_due,
          status, assigned, notes, done, subtasks_json, meta_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::timestamptz
        ) RETURNING *`,
        upsertParams(t, weddingId)
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
      `SELECT * FROM planning_tasks WHERE wedding_id = $1
       ORDER BY phase ASC NULLS LAST, due_date ASC NULLS LAST, title ASC NULLS LAST, id ASC`,
      [req.params.weddingId]
    );
    res.json({ tasks: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:taskId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const t = fromClient({ ...req.body, id: req.params.taskId });
    if (!t.id) {
      res.status(400).json({ error: 'invalid', message: 'Task id required.' });
      return;
    }
    if (!t.title) t.title = t.phase || 'Task';
    const result = await upsertTask(t, req.params.weddingId);
    if (!result.ack) {
      res.json({ task: toClient(result.row), ack: false, reason: result.reason || 'server_newer' });
      return;
    }
    res.json({ task: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.tasks) ? req.body.tasks : [];
    const results = [];
    for (const raw of list) {
      const t = fromClient(raw);
      if (!t.id) {
        t.id = `tsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!t.title) t.title = t.phase || 'Task';
      const result = await upsertTask(t, weddingId);
      results.push({
        task: toClient(result.row),
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

router.delete('/:taskId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM planning_tasks WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.taskId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

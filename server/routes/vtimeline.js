import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Optional calendar / presentation extras that stay nested JSON. */
const META_KEYS = [
  'description', 'color', 'icon', 'guests', 'reminder', 'timezone', 'timeZone',
  'calColor', 'calIcon', 'presentation', 'vendorId', 'vendor_id'
];

function bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true' || v === 'yes') return true;
  return false;
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
  const vendor = c.vendor ?? c.name ?? '';
  return {
    id,
    vendor: vendor != null ? String(vendor) : '',
    start_time: c.time ?? c.start_time ?? c.startTime ?? null,
    location: c.location ?? null,
    contact: c.contact ?? null,
    notes: c.notes ?? null,
    event: c.event ?? c.title ?? null,
    event_date: c.date ?? c.event_date ?? c.eventDate ?? null,
    end_time: c.endTime ?? c.end_time ?? null,
    all_day: bool(c.allDay ?? c.all_day),
    status: c.status ?? null,
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
    vendor: row.vendor || '',
    time: row.start_time || '',
    location: row.location || '',
    contact: row.contact || '',
    notes: row.notes || '',
    event: row.event || '',
    date: row.event_date || '',
    endTime: row.end_time || '',
    allDay: !!row.all_day,
    status: row.status || '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
  Object.keys(meta).forEach((k) => {
    if (out[k] == null || out[k] === '') out[k] = meta[k];
  });
  return out;
}

const UPSERT_SQL = `
  INSERT INTO vendor_arrivals (
    id, wedding_id, vendor, start_time, location, contact, notes, event,
    event_date, end_time, all_day, status, meta_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    vendor = EXCLUDED.vendor,
    start_time = EXCLUDED.start_time,
    location = EXCLUDED.location,
    contact = EXCLUDED.contact,
    notes = EXCLUDED.notes,
    event = EXCLUDED.event,
    event_date = EXCLUDED.event_date,
    end_time = EXCLUDED.end_time,
    all_day = EXCLUDED.all_day,
    status = EXCLUDED.status,
    meta_json = EXCLUDED.meta_json,
    updated_at = EXCLUDED.updated_at
  WHERE vendor_arrivals.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(row, weddingId) {
  return [
    row.id, weddingId, row.vendor, row.start_time, row.location, row.contact,
    row.notes, row.event, row.event_date, row.end_time, row.all_day, row.status,
    JSON.stringify(row.meta_json || {}), row.updated_at
  ];
}

async function upsertArrival(row, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(row, weddingId));
  let stored = rows[0];
  if (!stored) {
    const cur = await query(
      `SELECT * FROM vendor_arrivals WHERE wedding_id = $1 AND id = $2`,
      [weddingId, row.id]
    );
    stored = cur.rows[0];
    if (!stored) {
      const forced = await query(
        `INSERT INTO vendor_arrivals (
          id, wedding_id, vendor, start_time, location, contact, notes, event,
          event_date, end_time, all_day, status, meta_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::timestamptz
        ) RETURNING *`,
        upsertParams(row, weddingId)
      );
      stored = forced.rows[0];
      return { row: stored, ack: true };
    }
    return { row: stored, ack: false, reason: 'server_newer' };
  }
  return { row: stored, ack: true };
}

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM vendor_arrivals WHERE wedding_id = $1
       ORDER BY event_date ASC NULLS LAST, start_time ASC NULLS LAST, vendor ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({ vtimeline: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:arrivalId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const row = fromClient({ ...req.body, id: req.params.arrivalId });
    if (!row.id) {
      res.status(400).json({ error: 'invalid', message: 'Vendor arrival id required.' });
      return;
    }
    if (!row.vendor) row.vendor = row.event || row.start_time || 'Vendor arrival';
    const result = await upsertArrival(row, req.params.weddingId);
    if (!result.ack) {
      res.json({ arrival: toClient(result.row), ack: false, reason: result.reason || 'server_newer' });
      return;
    }
    res.json({ arrival: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.vtimeline)
      ? req.body.vtimeline
      : (Array.isArray(req.body?.arrivals) ? req.body.arrivals : []);
    const results = [];
    for (const raw of list) {
      const row = fromClient(raw);
      if (!row.id) {
        row.id = `vtl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!row.vendor) row.vendor = row.event || row.start_time || 'Vendor arrival';
      const result = await upsertArrival(row, weddingId);
      results.push({
        arrival: toClient(result.row),
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

router.delete('/:arrivalId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM vendor_arrivals WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.arrivalId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

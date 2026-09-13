import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Optional calendar / presentation extras that stay nested JSON. */
const META_KEYS = [
  'description', 'color', 'icon', 'guests', 'reminder', 'timezone', 'timeZone',
  'calColor', 'calIcon', 'presentation'
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
  const event = c.event ?? c.title ?? c.name ?? '';
  return {
    id,
    start_time: c.time ?? c.start_time ?? c.startTime ?? null,
    event: event != null ? String(event) : '',
    location: c.location ?? null,
    responsible: c.responsible ?? c.person ?? c.lead ?? null,
    duration: c.duration ?? null,
    notes: c.notes ?? null,
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
  const responsible = row.responsible || '';
  const out = {
    id,
    _id: id,
    time: row.start_time || '',
    event: row.event || '',
    location: row.location || '',
    responsible,
    person: responsible,
    duration: row.duration || '',
    notes: row.notes || '',
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
  INSERT INTO timeline_events (
    id, wedding_id, start_time, event, location, responsible, duration, notes,
    event_date, end_time, all_day, status, meta_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    event = EXCLUDED.event,
    location = EXCLUDED.location,
    responsible = EXCLUDED.responsible,
    duration = EXCLUDED.duration,
    notes = EXCLUDED.notes,
    event_date = EXCLUDED.event_date,
    end_time = EXCLUDED.end_time,
    all_day = EXCLUDED.all_day,
    status = EXCLUDED.status,
    meta_json = EXCLUDED.meta_json,
    updated_at = EXCLUDED.updated_at
  WHERE timeline_events.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(ev, weddingId) {
  return [
    ev.id, weddingId, ev.start_time, ev.event, ev.location, ev.responsible,
    ev.duration, ev.notes, ev.event_date, ev.end_time, ev.all_day, ev.status,
    JSON.stringify(ev.meta_json || {}), ev.updated_at
  ];
}

async function upsertTimeline(ev, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(ev, weddingId));
  let row = rows[0];
  if (!row) {
    const cur = await query(
      `SELECT * FROM timeline_events WHERE wedding_id = $1 AND id = $2`,
      [weddingId, ev.id]
    );
    row = cur.rows[0];
    if (!row) {
      const forced = await query(
        `INSERT INTO timeline_events (
          id, wedding_id, start_time, event, location, responsible, duration, notes,
          event_date, end_time, all_day, status, meta_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::timestamptz
        ) RETURNING *`,
        upsertParams(ev, weddingId)
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
      `SELECT * FROM timeline_events WHERE wedding_id = $1
       ORDER BY event_date ASC NULLS LAST, start_time ASC NULLS LAST, event ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({ timeline: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:eventId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const ev = fromClient({ ...req.body, id: req.params.eventId });
    if (!ev.id) {
      res.status(400).json({ error: 'invalid', message: 'Timeline event id required.' });
      return;
    }
    if (!ev.event) ev.event = ev.start_time || 'Timeline event';
    const result = await upsertTimeline(ev, req.params.weddingId);
    if (!result.ack) {
      res.json({ event: toClient(result.row), ack: false, reason: result.reason || 'server_newer' });
      return;
    }
    res.json({ event: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.timeline)
      ? req.body.timeline
      : (Array.isArray(req.body?.events) ? req.body.events : []);
    const results = [];
    for (const raw of list) {
      const ev = fromClient(raw);
      if (!ev.id) {
        ev.id = `wdy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!ev.event) ev.event = ev.start_time || 'Timeline event';
      const result = await upsertTimeline(ev, weddingId);
      results.push({
        event: toClient(result.row),
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

router.delete('/:eventId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM timeline_events WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.eventId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function int(v) {
  const n = num(v);
  if (n == null) return null;
  return Math.round(n);
}

function bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true') return true;
  if (v === false || v === 0 || v === '0' || v === 'false') return false;
  return !!v;
}

/** Floor-plan / size extras kept as nested JSON (like payment installments). */
function layoutFromClient(t = {}) {
  const layout = (t.layout && typeof t.layout === 'object') ? { ...t.layout } : {};
  const keys = ['x', 'y', 'w', 'h', 'vert', 'preset'];
  keys.forEach((k) => {
    if (t[k] !== undefined) layout[k] = t[k];
  });
  if (layout.x != null) layout.x = num(layout.x);
  if (layout.y != null) layout.y = num(layout.y);
  if (layout.w != null) layout.w = num(layout.w);
  if (layout.h != null) layout.h = num(layout.h);
  if (layout.vert != null) layout.vert = bool(layout.vert);
  if (layout.preset != null) layout.preset = String(layout.preset);
  return layout;
}

function fromClient(t = {}) {
  const id = String(t.id || t._id || '').trim();
  const updatedAt = t.updatedAt || t.updated_at || new Date().toISOString();
  return {
    id,
    name: t.name ?? t.label ?? '',
    capacity: int(t.capacity),
    placement: t.placement ?? null,
    table_type: t.type ?? t.table_type ?? t.tableType ?? null,
    shape: t.shape ?? null,
    vip: bool(t.vip),
    facing: t.facing ?? null,
    label: t.label ?? t.displayName ?? null,
    table_group: t.group ?? t.table_group ?? t.tableGroup ?? null,
    notes: t.notes ?? null,
    layout_json: layoutFromClient(t),
    updated_at: updatedAt
  };
}

function toClient(row) {
  const id = row.id;
  const layout = (row.layout_json && typeof row.layout_json === 'object' && !Array.isArray(row.layout_json))
    ? row.layout_json
    : {};
  const out = {
    id,
    _id: id,
    name: row.name || '',
    capacity: row.capacity != null ? Number(row.capacity) : 0,
    placement: row.placement || '',
    type: row.table_type || '',
    shape: row.shape || '',
    vip: !!row.vip,
    facing: row.facing || '',
    label: row.label || '',
    group: row.table_group || '',
    notes: row.notes || '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
  if (layout.x != null) out.x = layout.x;
  if (layout.y != null) out.y = layout.y;
  if (layout.w != null) out.w = layout.w;
  if (layout.h != null) out.h = layout.h;
  if (layout.vert != null) out.vert = !!layout.vert;
  if (layout.preset != null && layout.preset !== '') out.preset = layout.preset;
  return out;
}

function fixturesFromClient(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  Object.keys(raw).forEach((key) => {
    const item = raw[key];
    if (!item || typeof item !== 'object') return;
    out[key] = {
      x: num(item.x),
      y: num(item.y),
      w: num(item.w),
      h: num(item.h),
      label: item.label != null ? String(item.label) : ''
    };
  });
  return out;
}

const UPSERT_SQL = `
  INSERT INTO seating_tables (
    id, wedding_id, name, capacity, placement, table_type, shape, vip, facing,
    label, table_group, notes, layout_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    capacity = EXCLUDED.capacity,
    placement = EXCLUDED.placement,
    table_type = EXCLUDED.table_type,
    shape = EXCLUDED.shape,
    vip = EXCLUDED.vip,
    facing = EXCLUDED.facing,
    label = EXCLUDED.label,
    table_group = EXCLUDED.table_group,
    notes = EXCLUDED.notes,
    layout_json = EXCLUDED.layout_json,
    updated_at = EXCLUDED.updated_at
  WHERE seating_tables.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(table, weddingId) {
  return [
    table.id, weddingId, table.name, table.capacity, table.placement, table.table_type,
    table.shape, table.vip, table.facing, table.label, table.table_group, table.notes,
    JSON.stringify(table.layout_json || {}), table.updated_at
  ];
}

async function upsertTable(table, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(table, weddingId));
  let row = rows[0];
  if (!row) {
    const cur = await query(
      `SELECT * FROM seating_tables WHERE wedding_id = $1 AND id = $2`,
      [weddingId, table.id]
    );
    row = cur.rows[0];
    if (!row) {
      const forced = await query(
        `INSERT INTO seating_tables (
          id, wedding_id, name, capacity, placement, table_type, shape, vip, facing,
          label, table_group, notes, layout_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::timestamptz
        ) RETURNING *`,
        upsertParams(table, weddingId)
      );
      row = forced.rows[0];
      return { row, ack: true };
    }
    return { row, ack: false, reason: 'server_newer' };
  }
  return { row, ack: true };
}

async function readFloorFixtures(weddingId) {
  const { rows } = await query(
    `SELECT floor_fixtures_json, floor_fixtures_updated_at FROM weddings WHERE id = $1`,
    [weddingId]
  );
  const row = rows[0] || {};
  return {
    floorFixtures: (row.floor_fixtures_json && typeof row.floor_fixtures_json === 'object')
      ? row.floor_fixtures_json
      : {},
    floorFixturesUpdatedAt: row.floor_fixtures_updated_at
      ? new Date(row.floor_fixtures_updated_at).toISOString()
      : null
  };
}

async function upsertFloorFixtures(weddingId, fixtures, updatedAt) {
  const ts = updatedAt || new Date().toISOString();
  const { rows } = await query(
    `UPDATE weddings SET
       floor_fixtures_json = $2::jsonb,
       floor_fixtures_updated_at = $3::timestamptz,
       updated_at = now()
     WHERE id = $1
       AND (floor_fixtures_updated_at IS NULL OR floor_fixtures_updated_at <= $3::timestamptz)
     RETURNING floor_fixtures_json, floor_fixtures_updated_at`,
    [weddingId, JSON.stringify(fixtures || {}), ts]
  );
  if (rows[0]) {
    return {
      floorFixtures: rows[0].floor_fixtures_json || {},
      floorFixturesUpdatedAt: rows[0].floor_fixtures_updated_at
        ? new Date(rows[0].floor_fixtures_updated_at).toISOString()
        : null,
      ack: true
    };
  }
  const cur = await readFloorFixtures(weddingId);
  return { ...cur, ack: false, reason: 'server_newer' };
}

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const { rows } = await query(
      `SELECT * FROM seating_tables WHERE wedding_id = $1 ORDER BY name ASC, id ASC`,
      [weddingId]
    );
    const fixtures = await readFloorFixtures(weddingId);
    res.json({
      tables: rows.map(toClient),
      seating: rows.map(toClient),
      floorFixtures: fixtures.floorFixtures,
      floorFixturesUpdatedAt: fixtures.floorFixturesUpdatedAt,
      serverTime: new Date().toISOString()
    });
  } catch (e) {
    next(e);
  }
});

router.put('/:tableId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const table = fromClient({ ...req.body, id: req.params.tableId });
    if (!table.id) {
      res.status(400).json({ error: 'invalid', message: 'Table id required.' });
      return;
    }
    if (!table.name) table.name = 'Table';
    const result = await upsertTable(table, req.params.weddingId);
    if (!result.ack) {
      res.json({ table: toClient(result.row), ack: false, reason: result.reason || 'server_newer' });
      return;
    }
    res.json({ table: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.tables)
      ? req.body.tables
      : (Array.isArray(req.body?.seating) ? req.body.seating : []);
    const results = [];
    for (const raw of list) {
      const table = fromClient(raw);
      if (!table.id) {
        table.id = `tbl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!table.name) table.name = 'Table';
      const result = await upsertTable(table, weddingId);
      results.push({
        table: toClient(result.row),
        ack: result.ack,
        reason: result.ack ? undefined : (result.reason || 'server_newer')
      });
    }

    let fixturesResult = null;
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'floorFixtures')) {
      const fixtures = fixturesFromClient(req.body.floorFixtures);
      const ts = req.body.floorFixturesUpdatedAt
        || req.body.floor_fixtures_updated_at
        || new Date().toISOString();
      fixturesResult = await upsertFloorFixtures(weddingId, fixtures, ts);
    }

    await query(`UPDATE weddings SET updated_at = now() WHERE id = $1`, [weddingId]);
    const payload = { results, serverTime: new Date().toISOString() };
    if (fixturesResult) {
      payload.floorFixtures = fixturesResult.floorFixtures;
      payload.floorFixturesUpdatedAt = fixturesResult.floorFixturesUpdatedAt;
      payload.floorFixturesAck = fixturesResult.ack;
      if (!fixturesResult.ack) payload.floorFixturesReason = fixturesResult.reason;
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

router.delete('/:tableId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM seating_tables WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.tableId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

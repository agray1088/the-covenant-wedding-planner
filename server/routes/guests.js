import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

function bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true') return true;
  return false;
}

function fromClient(g = {}) {
  const id = String(g.id || g._id || '').trim();
  const updatedAt = g.updatedAt || g.updated_at || new Date().toISOString();
  return {
    id,
    name: String(g.name || '').trim(),
    household: g.household ?? null,
    guest_group: g.group ?? g.guest_group ?? g.guestGroup ?? null,
    side: g.side ?? null,
    role: g.role ?? null,
    invite_decision: g.inviteDecision ?? g.invite_decision ?? null,
    phone: g.phone ?? null,
    email: g.email ?? null,
    address: g.address ?? null,
    invited: bool(g.invited),
    rsvp: g.rsvp ?? null,
    meal: g.meal ?? null,
    dietary: g.dietary ?? null,
    plus_one: bool(g.plusone ?? g.plus_one ?? g.plusOne),
    children: Number(g.children) || 0,
    family: bool(g.family),
    thankyou: bool(g.thankyou),
    table_name: g.table ?? g.table_name ?? g.tableName ?? null,
    notes: g.notes ?? null,
    companions_json: Array.isArray(g.companions) ? g.companions : [],
    updated_at: updatedAt
  };
}

function toClient(row) {
  return {
    id: row.id,
    name: row.name || '',
    household: row.household || '',
    group: row.guest_group || '',
    side: row.side || '',
    role: row.role || '',
    inviteDecision: row.invite_decision || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    invited: !!row.invited,
    rsvp: row.rsvp || '',
    meal: row.meal || '',
    dietary: row.dietary || '',
    plusone: !!row.plus_one,
    children: row.children || 0,
    family: !!row.family,
    thankyou: !!row.thankyou,
    table: row.table_name || '',
    notes: row.notes || '',
    companions: row.companions_json || [],
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

const UPSERT_SQL = `
  INSERT INTO guests (
    id, wedding_id, name, household, guest_group, side, role, invite_decision,
    phone, email, address, invited, rsvp, meal, dietary, plus_one, children,
    family, thankyou, table_name, notes, companions_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22::jsonb,$23::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    household = EXCLUDED.household,
    guest_group = EXCLUDED.guest_group,
    side = EXCLUDED.side,
    role = EXCLUDED.role,
    invite_decision = EXCLUDED.invite_decision,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    invited = EXCLUDED.invited,
    rsvp = EXCLUDED.rsvp,
    meal = EXCLUDED.meal,
    dietary = EXCLUDED.dietary,
    plus_one = EXCLUDED.plus_one,
    children = EXCLUDED.children,
    family = EXCLUDED.family,
    thankyou = EXCLUDED.thankyou,
    table_name = EXCLUDED.table_name,
    notes = EXCLUDED.notes,
    companions_json = EXCLUDED.companions_json,
    updated_at = EXCLUDED.updated_at
  WHERE guests.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM guests WHERE wedding_id = $1 ORDER BY name ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({ guests: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:guestId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const guest = fromClient({ ...req.body, id: req.params.guestId });
    if (!guest.id) {
      res.status(400).json({ error: 'invalid', message: 'Guest id required.' });
      return;
    }
    if (!guest.name) guest.name = 'Guest';
    const { rows } = await query(UPSERT_SQL, [
      guest.id, req.params.weddingId, guest.name, guest.household, guest.guest_group, guest.side,
      guest.role, guest.invite_decision, guest.phone, guest.email, guest.address, guest.invited,
      guest.rsvp, guest.meal, guest.dietary, guest.plus_one, guest.children, guest.family,
      guest.thankyou, guest.table_name, guest.notes, JSON.stringify(guest.companions_json),
      guest.updated_at
    ]);
    // If WHERE blocked the update (server newer), return current row.
    let row = rows[0];
    if (!row) {
      const cur = await query(
        `SELECT * FROM guests WHERE wedding_id = $1 AND id = $2`,
        [req.params.weddingId, guest.id]
      );
      row = cur.rows[0];
      if (!row) {
        // Insert lost a race — force insert without LWW guard
        const forced = await query(
          `INSERT INTO guests (
            id, wedding_id, name, household, guest_group, side, role, invite_decision,
            phone, email, address, invited, rsvp, meal, dietary, plus_one, children,
            family, thankyou, table_name, notes, companions_json, updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22::jsonb,$23::timestamptz
          ) RETURNING *`,
          [
            guest.id, req.params.weddingId, guest.name, guest.household, guest.guest_group, guest.side,
            guest.role, guest.invite_decision, guest.phone, guest.email, guest.address, guest.invited,
            guest.rsvp, guest.meal, guest.dietary, guest.plus_one, guest.children, guest.family,
            guest.thankyou, guest.table_name, guest.notes, JSON.stringify(guest.companions_json),
            guest.updated_at
          ]
        );
        row = forced.rows[0];
      } else {
        res.json({ guest: toClient(row), ack: false, reason: 'server_newer' });
        return;
      }
    }
    res.json({ guest: toClient(row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.guests) ? req.body.guests : [];
    const results = [];
    for (const raw of list) {
      const guest = fromClient(raw);
      if (!guest.id) {
        guest.id = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!guest.name) guest.name = 'Guest';
      const { rows } = await query(UPSERT_SQL, [
        guest.id, req.params.weddingId, guest.name, guest.household, guest.guest_group, guest.side,
        guest.role, guest.invite_decision, guest.phone, guest.email, guest.address, guest.invited,
        guest.rsvp, guest.meal, guest.dietary, guest.plus_one, guest.children, guest.family,
        guest.thankyou, guest.table_name, guest.notes, JSON.stringify(guest.companions_json),
        guest.updated_at
      ]);
      let row = rows[0];
      if (!row) {
        const cur = await query(
          `SELECT * FROM guests WHERE wedding_id = $1 AND id = $2`,
          [req.params.weddingId, guest.id]
        );
        row = cur.rows[0];
        results.push({ guest: toClient(row), ack: false, reason: 'server_newer' });
      } else {
        results.push({ guest: toClient(row), ack: true });
      }
    }
    await query(`UPDATE weddings SET updated_at = now() WHERE id = $1`, [req.params.weddingId]);
    res.json({ results, serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.delete('/:guestId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM guests WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.guestId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

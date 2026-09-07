import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router();

function setupFromBody(body = {}) {
  return {
    name: String(body.name || body.title || 'My Wedding').trim() || 'My Wedding',
    bride: body.bride != null ? String(body.bride) : (body.setup?.bride || null),
    groom: body.groom != null ? String(body.groom) : (body.setup?.groom || null),
    wedding_date: body.weddingDate || body.wedding_date || body.setup?.['wedding-date'] || body.setup?.weddingDate || null,
    client_key: body.clientKey || body.client_key || null
  };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT w.*, m.role
         FROM weddings w
         JOIN memberships m ON m.wedding_id = w.id
        WHERE m.user_id = $1
        ORDER BY w.updated_at DESC`,
      [req.user.id]
    );
    res.json({ weddings: rows });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const s = setupFromBody(req.body || {});
    let wedding;
    if (s.client_key) {
      const existing = await query(`SELECT * FROM weddings WHERE client_key = $1`, [s.client_key]);
      if (existing.rows[0]) {
        const mem = await query(
          `SELECT role FROM memberships WHERE wedding_id = $1 AND user_id = $2`,
          [existing.rows[0].id, req.user.id]
        );
        if (!mem.rows[0]) {
          await query(
            `INSERT INTO memberships (wedding_id, user_id, role) VALUES ($1, $2, 'owner')
             ON CONFLICT (wedding_id, user_id) DO NOTHING`,
            [existing.rows[0].id, req.user.id]
          );
        }
        const { rows } = await query(
          `UPDATE weddings SET name = $2, bride = $3, groom = $4, wedding_date = $5, updated_at = now()
            WHERE id = $1 RETURNING *`,
          [existing.rows[0].id, s.name, s.bride, s.groom, s.wedding_date]
        );
        wedding = rows[0];
        res.json({ wedding, reused: true });
        return;
      }
    }
    const { rows } = await query(
      `INSERT INTO weddings (name, bride, groom, wedding_date, client_key)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [s.name, s.bride, s.groom, s.wedding_date, s.client_key]
    );
    wedding = rows[0];
    await query(
      `INSERT INTO memberships (wedding_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [wedding.id, req.user.id]
    );
    res.status(201).json({ wedding, reused: false });
  } catch (e) {
    next(e);
  }
});

router.get('/:weddingId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM weddings WHERE id = $1`, [req.params.weddingId]);
    if (!rows[0]) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ wedding: rows[0], role: req.membershipRole });
  } catch (e) {
    next(e);
  }
});

export default router;

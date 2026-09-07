import { Router } from 'express';
import { query } from '../lib/db.js';
import {
  createSession,
  destroySession,
  hashPassword,
  magicLinkStub,
  requireAuth,
  verifyPassword
} from '../lib/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.displayName || req.body?.name || '').trim() || null;
    if (!email || !password || password.length < 8) {
      res.status(400).json({ error: 'invalid', message: 'Email and password (8+ chars) required.' });
      return;
    }
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows[0]) {
      res.status(409).json({ error: 'exists', message: 'Account already exists. Sign in instead.' });
      return;
    }
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3) RETURNING id, email, display_name`,
      [email, hashPassword(password), displayName]
    );
    const user = rows[0];
    const session = await createSession(user.id);
    res.status(201).json({
      user: { id: user.id, email: user.email, displayName: user.display_name },
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const { rows } = await query(
      `SELECT id, email, display_name, password_hash FROM users WHERE email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'invalid_credentials', message: 'Email or password incorrect.' });
      return;
    }
    const session = await createSession(user.id);
    res.json({
      user: { id: user.id, email: user.email, displayName: user.display_name },
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await destroySession(req.token);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

/** Placeholder for future magic-link flow. */
router.post('/magic-link', async (req, res) => {
  res.status(501).json(magicLinkStub(req.body?.email));
});

export default router;

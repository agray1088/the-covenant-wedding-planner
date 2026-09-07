import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);

export function hashPassword(password) {
  return bcrypt.hashSync(String(password), 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(String(password), String(hash || ''));
}

export function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await query(
    `INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expires.toISOString()]
  );
  return { token, expiresAt: expires.toISOString() };
}

export async function destroySession(token) {
  if (!token) return;
  await query(`DELETE FROM sessions WHERE token = $1`, [token]);
}

export async function userFromToken(token) {
  if (!token) return null;
  const { rows } = await query(
    `SELECT u.id, u.email, u.display_name, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = $1`,
    [token]
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }
  return { id: row.id, email: row.email, displayName: row.display_name };
}

export function bearerToken(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (m) return m[1].trim();
  if (req.headers['x-covenant-token']) return String(req.headers['x-covenant-token']).trim();
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = bearerToken(req);
    const user = await userFromToken(token);
    if (!user) {
      res.status(401).json({ error: 'unauthorized', message: 'Sign in required.' });
      return;
    }
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    next(e);
  }
}

export async function requireWeddingMember(req, res, next) {
  try {
    const weddingId = req.params.weddingId || req.params.id;
    const { rows } = await query(
      `SELECT role FROM memberships WHERE wedding_id = $1 AND user_id = $2`,
      [weddingId, req.user.id]
    );
    if (!rows[0]) {
      res.status(403).json({ error: 'forbidden', message: 'Not a member of this wedding.' });
      return;
    }
    req.membershipRole = rows[0].role;
    next();
  } catch (e) {
    next(e);
  }
}

/** Magic-link placeholder — reserved for SMTP later. */
export function magicLinkStub(email) {
  return {
    ok: false,
    message: 'Magic-link auth is not wired in v1. Use email/password. Set MAGIC_LINK_* env vars when SMTP ships.',
    email: email || null
  };
}

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);
const RESET_HOURS = Number(process.env.PASSWORD_RESET_HOURS || 2);

export function hashPassword(password) {
  return bcrypt.hashSync(String(password), 10);
}

export function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compareSync(String(password), String(hash || ''));
}

export function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function normalizeUsername(username) {
  const u = String(username || '').trim().toLowerCase();
  if (!u) return null;
  return u;
}

/** Username: 3–32 chars, letters/numbers/._- */
export function validUsername(username) {
  const u = normalizeUsername(username);
  if (!u) return false;
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(u);
}

export function publicUrl(req) {
  const env = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (env) return env;
  if (req) {
    const proto = req.protocol || 'http';
    const host = req.get?.('host') || '127.0.0.1:18787';
    return `${proto}://${host}`;
  }
  return 'http://127.0.0.1:18787';
}

export function clientAppUrl() {
  const explicit = (process.env.CLIENT_APP_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const cors = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (cors[0]) return cors[0].replace(/\/$/, '');
  return 'http://localhost:8000';
}

export function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username || null,
    displayName: row.display_name || null,
    hasPassword: !!row.password_hash,
    googleLinked: !!row.google_sub
  };
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
    `SELECT u.id, u.email, u.username, u.display_name, u.password_hash, u.google_sub, s.expires_at
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
  return mapUser(row);
}

export async function findUserByLogin(login) {
  const raw = String(login || '').trim();
  if (!raw) return null;
  const email = normalizeEmail(raw);
  const username = normalizeUsername(raw);
  const { rows } = await query(
    `SELECT id, email, username, display_name, password_hash, google_sub
       FROM users
      WHERE lower(email) = $1
         OR (username IS NOT NULL AND lower(username) = $2)
      LIMIT 1`,
    [email, username]
  );
  return rows[0] || null;
}

export async function createAuthToken({ userId = null, email = null, purpose, meta = {}, hours = RESET_HOURS }) {
  const raw = newToken();
  const expires = new Date(Date.now() + hours * 3600000);
  await query(
    `INSERT INTO auth_tokens (user_id, email, purpose, token_hash, meta_json, expires_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [userId, email, purpose, hashToken(raw), JSON.stringify(meta || {}), expires.toISOString()]
  );
  return { token: raw, expiresAt: expires.toISOString() };
}

export async function consumeAuthToken(raw, purpose) {
  if (!raw) return null;
  const { rows } = await query(
    `SELECT id, user_id, email, meta_json, expires_at, used_at
       FROM auth_tokens
      WHERE purpose = $1 AND token_hash = $2`,
    [purpose, hashToken(raw)]
  );
  const row = rows[0];
  if (!row || row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  await query(`UPDATE auth_tokens SET used_at = now() WHERE id = $1`, [row.id]);
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    meta: row.meta_json || {}
  };
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
    message: 'Magic-link auth is not wired in v1. Use email/password or Google Sign-In. Set MAGIC_LINK_* env vars when SMTP ships.',
    email: email || null
  };
}

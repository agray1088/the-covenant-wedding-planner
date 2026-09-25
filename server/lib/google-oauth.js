/**
 * Google OAuth (authorization-code) helpers.
 * Enabled when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set
 * (unless FEATURE_GOOGLE_AUTH explicitly disables).
 */
import { query } from './db.js';
import { clientAppUrl, hashToken, newToken, publicUrl } from './auth.js';

export { clientAppUrl, publicUrl as publicBaseUrl };

function flag(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').trim().toLowerCase());
}

export function googleConfigured() {
  const id = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const secret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  if (!id || !secret) return false;
  if (
    process.env.FEATURE_GOOGLE_AUTH != null
    && String(process.env.FEATURE_GOOGLE_AUTH).trim() !== ''
    && !flag('FEATURE_GOOGLE_AUTH')
  ) {
    return false;
  }
  return true;
}

export function googleRedirectUri(req) {
  const override = (process.env.GOOGLE_REDIRECT_URI || '').trim();
  if (override) return override;
  return `${publicUrl(req)}/auth/google/callback`;
}

export function googleStatus(req) {
  return {
    configured: googleConfigured(),
    clientIdSet: !!(process.env.GOOGLE_CLIENT_ID || '').trim(),
    redirectUri: googleConfigured() ? googleRedirectUri(req) : null
  };
}

export async function createOAuthState(meta = {}) {
  const state = newToken();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  await query(
    `INSERT INTO auth_tokens (purpose, token_hash, meta_json, expires_at)
     VALUES ('oauth_state', $1, $2::jsonb, $3)`,
    [hashToken(state), JSON.stringify(meta), expires.toISOString()]
  );
  return state;
}

export async function consumeOAuthState(state) {
  if (!state) return null;
  const { rows } = await query(
    `SELECT id, meta_json, expires_at, used_at FROM auth_tokens
      WHERE purpose = 'oauth_state' AND token_hash = $1`,
    [hashToken(state)]
  );
  const row = rows[0];
  if (!row || row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  await query(`UPDATE auth_tokens SET used_at = now() WHERE id = $1`, [row.id]);
  return row.meta_json || {};
}

export function googleAuthUrl(state, req) {
  const params = new URLSearchParams({
    client_id: (process.env.GOOGLE_CLIENT_ID || '').trim(),
    redirect_uri: googleRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    include_granted_scopes: 'true',
    state,
    prompt: 'select_account'
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code, req) {
  const body = new URLSearchParams({
    code,
    client_id: (process.env.GOOGLE_CLIENT_ID || '').trim(),
    client_secret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
    redirect_uri: googleRedirectUri(req),
    grant_type: 'authorization_code'
  });
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenJson.access_token) {
    const err = new Error(tokenJson.error_description || tokenJson.error || 'Google token exchange failed');
    err.code = 'google_token_error';
    err.details = tokenJson;
    throw err;
  }

  const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` }
  });
  const profile = await profileRes.json().catch(() => ({}));
  if (!profileRes.ok || !profile.sub) {
    const err = new Error(profile.error_description || profile.error || 'Google profile fetch failed');
    err.code = 'google_profile_error';
    throw err;
  }
  return {
    sub: String(profile.sub),
    email: profile.email ? String(profile.email).trim().toLowerCase() : null,
    emailVerified: !!profile.email_verified,
    name: profile.name ? String(profile.name).trim() : null,
    picture: profile.picture || null
  };
}

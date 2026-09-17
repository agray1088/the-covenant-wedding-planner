import { Router } from 'express';
import { query } from '../lib/db.js';
import {
  clientAppUrl,
  consumeAuthToken,
  createAuthToken,
  createSession,
  destroySession,
  findUserByLogin,
  hashPassword,
  magicLinkStub,
  mapUser,
  normalizeEmail,
  normalizeUsername,
  publicUrl,
  requireAuth,
  validUsername,
  verifyPassword
} from '../lib/auth.js';
import { sendMail, smtpConfigured, smtpStatus } from '../lib/mail.js';
import {
  createOAuthState,
  consumeOAuthState,
  exchangeGoogleCode,
  googleAuthUrl,
  googleConfigured,
  googleStatus
} from '../lib/google-oauth.js';

const router = Router();

function authCapabilities(req) {
  return {
    password: true,
    username: true,
    google: googleStatus(req),
    email: smtpStatus(),
    publicUrl: publicUrl(req),
    clientAppUrl: clientAppUrl(),
    resetPasswordPath: '/auth/reset-password',
    googleStartPath: '/auth/google'
  };
}

/** Public capability probe for Settings UI (no auth). */
router.get('/config', (req, res) => {
  res.json({ ok: true, auth: authCapabilities(req) });
});

router.post('/register', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.displayName || req.body?.name || '').trim() || null;
    let username = normalizeUsername(req.body?.username);
    if (!email || !password || password.length < 8) {
      res.status(400).json({ error: 'invalid', message: 'Email and password (8+ chars) required.' });
      return;
    }
    if (username && !validUsername(username)) {
      res.status(400).json({
        error: 'invalid_username',
        message: 'Username must be 3–32 characters: letters, numbers, . _ - (start with letter/number).'
      });
      return;
    }
    if (!username) username = null;

    const existingEmail = await query(`SELECT id FROM users WHERE lower(email) = $1`, [email]);
    if (existingEmail.rows[0]) {
      res.status(409).json({ error: 'exists', message: 'Account already exists. Sign in instead.' });
      return;
    }
    if (username) {
      const existingUser = await query(
        `SELECT id FROM users WHERE username IS NOT NULL AND lower(username) = $1`,
        [username]
      );
      if (existingUser.rows[0]) {
        res.status(409).json({ error: 'username_taken', message: 'That username is already taken.' });
        return;
      }
    }

    const { rows } = await query(
      `INSERT INTO users (email, username, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, display_name, password_hash, google_sub`,
      [email, username, hashPassword(password), displayName]
    );
    const user = rows[0];
    const session = await createSession(user.id);
    res.status(201).json({
      user: mapUser(user),
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const login = String(req.body?.email || req.body?.username || req.body?.login || '').trim();
    const password = String(req.body?.password || '');
    if (!login || !password) {
      res.status(400).json({ error: 'invalid', message: 'Email/username and password required.' });
      return;
    }
    const user = await findUserByLogin(login);
    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({
        error: 'invalid_credentials',
        message: 'Email/username or password incorrect.'
      });
      return;
    }
    const session = await createSession(user.id);
    res.json({
      user: mapUser(user),
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

/** Request a password-reset email. Always needs SMTP. */
router.post('/forgot-password', async (req, res, next) => {
  try {
    if (!smtpConfigured()) {
      res.status(503).json({
        error: 'smtp_not_configured',
        message:
          'Password reset email cannot be sent: SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM (see docs/AUTH.md).',
        auth: authCapabilities(req)
      });
      return;
    }
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ error: 'invalid', message: 'Email required.' });
      return;
    }
    const { rows } = await query(
      `SELECT id, email, username, password_hash FROM users WHERE lower(email) = $1`,
      [email]
    );
    const user = rows[0];
    // Do not reveal whether the account exists — but still require SMTP above.
    if (user && user.password_hash) {
      const { token, expiresAt } = await createAuthToken({
        userId: user.id,
        email: user.email,
        purpose: 'password_reset',
        meta: { username: user.username || null }
      });
      const base = publicUrl(req);
      const app = clientAppUrl();
      const apiLink = `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
      const appLink = `${app}/?cloudResetToken=${encodeURIComponent(token)}`;
      await sendMail({
        to: user.email,
        subject: 'Reset your Covenant planner password',
        text: [
          'You requested a password reset for The Covenant Wedding Planner.',
          '',
          `Open this link to choose a new password:`,
          apiLink,
          '',
          `Or in the planner (Settings → Cloud sync):`,
          appLink,
          '',
          `This link expires at ${expiresAt}.`,
          'If you did not request this, ignore this email.'
        ].join('\n'),
        html: `<p>You requested a password reset for <b>The Covenant Wedding Planner</b>.</p>
<p><a href="${apiLink}">Choose a new password</a></p>
<p>Or open the planner with this link:<br><a href="${appLink}">${appLink}</a></p>
<p>Expires at ${expiresAt}. If you did not request this, ignore this email.</p>`
      });
    }
    res.json({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.'
    });
  } catch (e) {
    if (e && e.code === 'smtp_not_configured') {
      res.status(503).json({
        error: 'smtp_not_configured',
        message: e.message,
        auth: authCapabilities(req)
      });
      return;
    }
    next(e);
  }
});

/** Confirm password reset with token from email. */
router.post('/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || req.body?.newPassword || '');
    if (!token || password.length < 8) {
      res.status(400).json({
        error: 'invalid',
        message: 'Reset token and new password (8+ chars) required.'
      });
      return;
    }
    const consumed = await consumeAuthToken(token, 'password_reset');
    if (!consumed || !consumed.userId) {
      res.status(400).json({
        error: 'invalid_token',
        message: 'Reset link is invalid or expired. Request a new one.'
      });
      return;
    }
    await query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [hashPassword(password), consumed.userId]
    );
    // Invalidate other outstanding reset tokens for this user.
    await query(
      `UPDATE auth_tokens SET used_at = now()
        WHERE user_id = $1 AND purpose = 'password_reset' AND used_at IS NULL`,
      [consumed.userId]
    );
    const { rows } = await query(
      `SELECT id, email, username, display_name, password_hash, google_sub FROM users WHERE id = $1`,
      [consumed.userId]
    );
    const session = await createSession(consumed.userId);
    res.json({
      ok: true,
      user: mapUser(rows[0]),
      token: session.token,
      expiresAt: session.expiresAt,
      message: 'Password updated. You are signed in.'
    });
  } catch (e) {
    next(e);
  }
});

/** Minimal browser form for email links hitting the API host. */
router.get('/reset-password', (req, res) => {
  const token = String(req.query.token || '').trim();
  const safe = token.replace(/[^a-zA-Z0-9]/g, '');
  res.type('html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset password — Covenant</title>
<style>
  body{font-family:Georgia,serif;max-width:28rem;margin:3rem auto;padding:0 1rem;color:#1c1917;background:#faf7f2}
  label{display:block;margin:.75rem 0 .25rem;font-size:.9rem}
  input{width:100%;padding:.55rem .65rem;font-size:1rem;border:1px solid #d6d3d1;border-radius:6px;box-sizing:border-box}
  button{margin-top:1rem;padding:.6rem 1rem;font-size:1rem;background:#44403c;color:#fff;border:0;border-radius:6px;cursor:pointer}
  .msg{margin-top:1rem;font-size:.95rem}
  .err{color:#9f1239}.ok{color:#166534}
</style></head><body>
<h1>Reset password</h1>
<p>Choose a new password for your Covenant cloud account. The planner still works offline without signing in.</p>
<form id="f">
  <input type="hidden" name="token" value="${safe}">
  <label for="p">New password (8+ characters)</label>
  <input id="p" name="password" type="password" minlength="8" required autocomplete="new-password">
  <label for="p2">Confirm password</label>
  <input id="p2" type="password" minlength="8" required autocomplete="new-password">
  <button type="submit">Update password</button>
</form>
<p class="msg" id="m"></p>
<script>
document.getElementById('f').addEventListener('submit', async function (e) {
  e.preventDefault();
  var m = document.getElementById('m');
  var p = document.getElementById('p').value;
  var p2 = document.getElementById('p2').value;
  if (p !== p2) { m.className = 'msg err'; m.textContent = 'Passwords do not match.'; return; }
  m.className = 'msg'; m.textContent = 'Updating…';
  try {
    var res = await fetch('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: document.querySelector('[name=token]').value, password: p })
    });
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      m.className = 'msg err';
      m.textContent = body.message || 'Reset failed.';
      return;
    }
    m.className = 'msg ok';
    m.textContent = 'Password updated. Return to the planner and sign in, or use Sync now if a session was created.';
    if (body.token) {
      try {
        localStorage.setItem('covenant_cloud_token', body.token);
        localStorage.setItem('covenant_cloud_user', JSON.stringify(body.user || {}));
      } catch (err) {}
    }
  } catch (err) {
    m.className = 'msg err';
    m.textContent = (err && err.message) || 'Network error';
  }
});
</script>
</body></html>`);
});

/** Email the account username (or note that login is email-only). */
router.post('/forgot-username', async (req, res, next) => {
  try {
    if (!smtpConfigured()) {
      res.status(503).json({
        error: 'smtp_not_configured',
        message:
          'Username recovery email cannot be sent: SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM (see docs/AUTH.md).',
        auth: authCapabilities(req)
      });
      return;
    }
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ error: 'invalid', message: 'Email required.' });
      return;
    }
    const { rows } = await query(
      `SELECT id, email, username FROM users WHERE lower(email) = $1`,
      [email]
    );
    const user = rows[0];
    if (user) {
      const usernameLine = user.username
        ? `Your username is: ${user.username}`
        : 'This account has no username — sign in with your email address.';
      await sendMail({
        to: user.email,
        subject: 'Your Covenant planner username',
        text: [
          'You requested a username reminder for The Covenant Wedding Planner.',
          '',
          usernameLine,
          `Email: ${user.email}`,
          '',
          'If you did not request this, ignore this email.'
        ].join('\n'),
        html: `<p>You requested a username reminder for <b>The Covenant Wedding Planner</b>.</p>
<p>${usernameLine}</p>
<p>Email: <code>${user.email}</code></p>
<p>If you did not request this, ignore this email.</p>`
      });
    }
    res.json({
      ok: true,
      message: 'If an account exists for that email, a reminder has been sent.'
    });
  } catch (e) {
    if (e && e.code === 'smtp_not_configured') {
      res.status(503).json({
        error: 'smtp_not_configured',
        message: e.message,
        auth: authCapabilities(req)
      });
      return;
    }
    next(e);
  }
});

/** Start Google OAuth — redirects to Google when configured. */
router.get('/google', async (req, res, next) => {
  try {
    if (!googleConfigured()) {
      res.status(503).json({
        error: 'google_not_configured',
        message:
          'Google Sign-In is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, and register the redirect URI in Google Cloud Console (see docs/AUTH.md).',
        auth: authCapabilities(req)
      });
      return;
    }
    const returnTo = String(req.query.returnTo || req.query.next || '').trim() || clientAppUrl();
    const state = await createOAuthState({ returnTo });
    res.redirect(302, googleAuthUrl(state, req));
  } catch (e) {
    next(e);
  }
});

router.get('/google/callback', async (req, res, next) => {
  try {
    if (!googleConfigured()) {
      res.status(503).type('html').send('<p>Google Sign-In is not configured.</p>');
      return;
    }
    const errQ = req.query.error;
    if (errQ) {
      res.status(400).type('html').send(`<p>Google sign-in cancelled or failed: ${String(errQ)}</p>`);
      return;
    }
    const code = String(req.query.code || '').trim();
    const state = String(req.query.state || '').trim();
    const meta = await consumeOAuthState(state);
    if (!code || !meta) {
      res.status(400).type('html').send('<p>Invalid or expired Google sign-in state. Try again.</p>');
      return;
    }
    const profile = await exchangeGoogleCode(code, req);
    if (!profile.email) {
      res.status(400).type('html').send('<p>Google did not return an email address. Enable the email scope.</p>');
      return;
    }

    let userRow = null;
    const bySub = await query(
      `SELECT id, email, username, display_name, password_hash, google_sub
         FROM users WHERE google_sub = $1`,
      [profile.sub]
    );
    userRow = bySub.rows[0] || null;

    if (!userRow) {
      const byEmail = await query(
        `SELECT id, email, username, display_name, password_hash, google_sub
           FROM users WHERE lower(email) = $1`,
        [profile.email]
      );
      if (byEmail.rows[0]) {
        await query(
          `UPDATE users SET google_sub = $1, display_name = COALESCE(display_name, $2), updated_at = now()
            WHERE id = $3`,
          [profile.sub, profile.name, byEmail.rows[0].id]
        );
        const refreshed = await query(
          `SELECT id, email, username, display_name, password_hash, google_sub FROM users WHERE id = $1`,
          [byEmail.rows[0].id]
        );
        userRow = refreshed.rows[0];
      }
    }

    if (!userRow) {
      const inserted = await query(
        `INSERT INTO users (email, password_hash, google_sub, display_name)
         VALUES ($1, NULL, $2, $3)
         RETURNING id, email, username, display_name, password_hash, google_sub`,
        [profile.email, profile.sub, profile.name]
      );
      userRow = inserted.rows[0];
    }

    const session = await createSession(userRow.id);
    const returnTo = String(meta.returnTo || clientAppUrl()).replace(/\/$/, '');
    const sep = returnTo.includes('?') ? '&' : '?';
    const dest = `${returnTo}${sep}cloudToken=${encodeURIComponent(session.token)}&cloudOAuth=1`;
    res.redirect(302, dest);
  } catch (e) {
    next(e);
  }
});

/** Placeholder for future magic-link flow. */
router.post('/magic-link', async (req, res) => {
  res.status(501).json(magicLinkStub(req.body?.email));
});

export default router;

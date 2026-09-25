import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { initSchema, pool, query, describeDatabaseUrl, databaseUrl } from './lib/db.js';
import { hashPassword } from './lib/auth.js';
import { googleConfigured } from './lib/google-oauth.js';
import { smtpConfigured } from './lib/mail.js';
import authRoutes from './routes/auth.js';
import weddingRoutes from './routes/weddings.js';
import guestRoutes from './routes/guests.js';
import vendorRoutes from './routes/vendors.js';
import paymentRoutes from './routes/payments.js';
import budgetRoutes from './routes/budget.js';
import seatingRoutes from './routes/seating.js';
import contractRoutes from './routes/contracts.js';
import timelineRoutes from './routes/timeline.js';
import packetRoutes from './routes/packets.js';
import rentalRoutes from './routes/rentals.js';
import cateringRentalRoutes from './routes/catering-rentals.js';
import partyRoutes from './routes/party.js';
import taskRoutes from './routes/tasks.js';
import vtimelineRoutes from './routes/vtimeline.js';
import packetOverrideRoutes from './routes/packet-overrides.js';
import photoRoutes from './routes/photos.js';
import rsvpRoutes, { guestPublicRoutes } from './routes/rsvp.js';
import portalRoutes, { portalPublicRoutes } from './routes/portal.js';
import {
  weddingInviteRoutes,
  invitePublicRoutes,
  inviteTokenPage
} from './routes/invites.js';
import vendorPortalRoutes, {
  vendorPortalPublicRoutes
} from './routes/vendor-portal.js';
import {
  objectStorageConfigured,
  storageConfigSummary
} from './lib/object-storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8787);
const HOST = (process.env.HOST || '0.0.0.0').trim();
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const TRUST_PROXY = String(process.env.TRUST_PROXY || '').trim();
const SERVE_STATIC = ['1', 'true', 'yes'].includes(
  String(process.env.SERVE_STATIC || '').trim().toLowerCase()
);

function flag(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').trim().toLowerCase());
}

/** Feature on unless explicitly set to 0/false/no (RSVP + landing ship enabled). */
function flagDefaultOn(name) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === '') return true;
  return !['0', 'false', 'no', 'off'].includes(String(raw).trim().toLowerCase());
}

const FEATURES = {
  googleAuth: googleConfigured() || flag('FEATURE_GOOGLE_AUTH'),
  email: smtpConfigured() || flag('FEATURE_EMAIL'),
  rsvp: flagDefaultOn('FEATURE_RSVP'),
  landing: flagDefaultOn('FEATURE_LANDING'),
  photos: flag('FEATURE_PHOTOS'),
  partnerInvites: flagDefaultOn('FEATURE_PARTNER_INVITES'),
  vendorTokens: flagDefaultOn('FEATURE_VENDOR_TOKENS')
};

/** Comma-separated CORS origins; empty entries ignored. */
function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:8000';
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const CORS_ORIGINS = parseCorsOrigins();

const app = express();

// Behind Railway / Fly / Render reverse proxies — correct req.protocol / req.ip.
if (TRUST_PROXY === '1' || TRUST_PROXY.toLowerCase() === 'true' || TRUST_PROXY === '*') {
  app.set('trust proxy', 1);
} else if (TRUST_PROXY && !Number.isNaN(Number(TRUST_PROXY))) {
  app.set('trust proxy', Number(TRUST_PROXY));
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin(origin, cb) {
    // Allow same-origin tools, curl, and configured planner origins.
    if (
      !origin
      || CORS_ORIGINS.includes(origin)
      || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      cb(null, true);
      return;
    }
    cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

function setupStatusPayload(req) {
  const google = googleConfigured();
  const smtp = smtpConfigured();
  const publicUrlConfigured = !!PUBLIC_URL;
  const objectStorage = objectStorageConfigured();
  const photoStorage = storageConfigSummary();
  // Booleans + non-secret PUBLIC_URL only — never client secrets / SMTP / S3 passwords.
  return {
    ok: true,
    service: 'covenant-sync',
    db: 'up',
    publicUrlConfigured,
    publicUrl: PUBLIC_URL || null,
    googleConfigured: google,
    smtpConfigured: smtp,
    objectStorageConfigured: objectStorage,
    photoStorage: {
      mode: photoStorage.mode,
      configured: photoStorage.configured,
      publicBaseConfigured: photoStorage.publicBaseConfigured,
      note: photoStorage.note
    },
    // What each secret enables (for Settings → Hosted setup checklist).
    enables: {
      googleSignIn: google,
      passwordResetEmail: smtp,
      forgotUsernameEmail: smtp,
      rsvpEmail: smtp,
      partnerInviteEmail: smtp,
      vendorPortalEmail: smtp,
      portalHeroPhotos: objectStorage,
      packetImageAssets: objectStorage
    },
    features: {
      rsvp: FEATURES.rsvp,
      landing: FEATURES.landing,
      partnerInvites: FEATURES.partnerInvites,
      vendorTokens: FEATURES.vendorTokens,
      photos: FEATURES.photos
    },
    docs: {
      auth: 'docs/AUTH.md',
      hosted: 'docs/HOSTED_DEPLOY.md',
      photos: 'docs/BACKUP_AND_PHOTOS.md'
    },
    time: new Date().toISOString(),
    proto: req.protocol,
    host: req.get('host') || null
  };
}

app.get('/health', async (req, res) => {
  // Cheap liveness for platform probes — do not require auth.
  // Works behind HTTPS terminators (trust proxy) so platforms can hit /health.
  try {
    await query('SELECT 1');
    const setup = setupStatusPayload(req);
    res.json({
      ok: true,
      service: 'covenant-sync',
      version: '0.5.0',
      mode: 'offline-first-optional-cloud',
      db: 'up',
      publicUrl: setup.publicUrl,
      publicUrlConfigured: setup.publicUrlConfigured,
      features: {
        ...FEATURES,
        googleConfigured: setup.googleConfigured,
        smtpConfigured: setup.smtpConfigured,
        objectStorageConfigured: setup.objectStorageConfigured,
        photoStorage: storageConfigSummary()
      },
      objectStorageConfigured: setup.objectStorageConfigured,
      time: setup.time,
      // Echo how the proxy sees us (useful when debugging HTTPS / redirects).
      proto: setup.proto,
      host: setup.host
    });
  } catch (e) {
    res.status(503).json({ ok: false, db: 'down', error: String(e.message || e) });
  }
});

/** Operator / Settings checklist — capability flags only (no secret values). */
app.get('/setup/status', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json(setupStatusPayload(req));
  } catch (e) {
    res.status(503).json({
      ok: false,
      db: 'down',
      publicUrlConfigured: !!PUBLIC_URL,
      publicUrl: PUBLIC_URL || null,
      googleConfigured: false,
      smtpConfigured: false,
      objectStorageConfigured: false,
      error: String(e.message || e)
    });
  }
});

app.use('/auth', authRoutes);
app.use('/weddings', weddingRoutes);
app.use('/weddings/:weddingId/guests', guestRoutes);
app.use('/weddings/:weddingId/vendors', vendorRoutes);
app.use('/weddings/:weddingId/payments', paymentRoutes);
app.use('/weddings/:weddingId/budget', budgetRoutes);
app.use('/weddings/:weddingId/seating', seatingRoutes);
app.use('/weddings/:weddingId/tables', seatingRoutes);
app.use('/weddings/:weddingId/contracts', contractRoutes);
app.use('/weddings/:weddingId/timeline', timelineRoutes);
app.use('/weddings/:weddingId/packets', packetRoutes);
app.use('/weddings/:weddingId/rentals', rentalRoutes);
app.use('/weddings/:weddingId/catering-rentals', cateringRentalRoutes);
app.use('/weddings/:weddingId/party', partyRoutes);
app.use('/weddings/:weddingId/tasks', taskRoutes);
app.use('/weddings/:weddingId/vtimeline', vtimelineRoutes);
app.use('/weddings/:weddingId/packet-overrides', packetOverrideRoutes);
app.use('/weddings/:weddingId/photos', photoRoutes);
app.use('/weddings/:weddingId/rsvp', rsvpRoutes);
app.use('/weddings/:weddingId/portal', portalRoutes);
app.use('/weddings/:weddingId/vendor-portal', vendorPortalRoutes);
app.use('/weddings/:weddingId', weddingInviteRoutes);

// Partner invites (auth + token preview) and public guest / vendor surfaces.
app.use('/invites', invitePublicRoutes);
app.get('/invite/:token', inviteTokenPage);
app.use('/guest', guestPublicRoutes);
app.use('/p', portalPublicRoutes);
app.use('/vendor', vendorPortalPublicRoutes);
app.get('/r/:token', (req, res) => {
  res.redirect(302, `/guest/rsvp/${encodeURIComponent(req.params.token)}`);
});

if (SERVE_STATIC) {
  const staticRoot = path.resolve(
    process.env.STATIC_ROOT || path.join(__dirname, '..')
  );
  app.use(express.static(staticRoot, { index: ['index.html'], fallthrough: true }));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/auth')
      || req.path.startsWith('/weddings')
      || req.path.startsWith('/guest')
      || req.path.startsWith('/p/')
      || req.path.startsWith('/r/')
      || req.path.startsWith('/invite')
      || req.path.startsWith('/invites')
      || req.path.startsWith('/vendor')
      || req.path === '/health'
      || req.path === '/setup/status'
      || req.path.startsWith('/setup/')
    ) {
      next();
      return;
    }
    res.sendFile(path.join(staticRoot, 'index.html'), (err) => {
      if (err) next();
    });
  });
  console.log('[covenant-sync] serving static planner from', staticRoot);
}

app.use((err, _req, res, _next) => {
  console.error('[covenant-sync]', err);
  res.status(500).json({ error: 'server_error', message: err.message || 'Unexpected error' });
});

async function bootstrapUser() {
  const email = (process.env.BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const password = process.env.BOOTSTRAP_PASSWORD || '';
  if (!email || !password) return;
  const username = (process.env.BOOTSTRAP_USERNAME || 'demo').trim().toLowerCase() || 'demo';
  const { rows } = await query(`SELECT id, username FROM users WHERE email = $1`, [email]);
  if (rows[0]) {
    if (!rows[0].username && username) {
      await query(
        `UPDATE users SET username = $1, updated_at = now() WHERE id = $2 AND username IS NULL`,
        [username, rows[0].id]
      );
    }
    return;
  }
  await query(
    `INSERT INTO users (email, username, password_hash, display_name) VALUES ($1, $2, $3, $4)`,
    [email, username, hashPassword(password), 'Demo Couple']
  );
  console.log('[covenant-sync] bootstrap user ready:', email, `(username: ${username})`);
}

async function main() {
  if (process.env.NODE_ENV === 'production' && !(process.env.SESSION_SECRET || '').trim()) {
    console.warn(
      '[covenant-sync] WARNING: SESSION_SECRET is unset. Set it before public traffic (see server/.env.production.example).'
    );
  }
  const dbInfo = describeDatabaseUrl(databaseUrl);
  console.log(
    `[covenant-sync] db target ${dbInfo.user}@${dbInfo.host}:${dbInfo.port}/${dbInfo.database} (${dbInfo.source}) pwdLen=${dbInfo.passwordLength} codes=${dbInfo.passwordCharCodes}`
  );
  await initSchema();
  await bootstrapUser();
  app.listen(PORT, HOST, () => {
    console.log(`[covenant-sync] listening on http://${HOST}:${PORT}`);
    if (PUBLIC_URL) console.log(`[covenant-sync] PUBLIC_URL=${PUBLIC_URL}`);
    console.log('[covenant-sync] offline planner remains default; cloud is optional.');
  });
}

main().catch((e) => {
  const dbInfo = describeDatabaseUrl(databaseUrl);
  console.error('[covenant-sync] failed to start', e);
  console.error(
    `[covenant-sync] check DATABASE_URL → ${dbInfo.user}@${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`
  );
  console.error('[covenant-sync] tip: echo %DATABASE_URL%  (if set in Windows, it used to override server\\.env)');
  pool.end().finally(() => process.exit(1));
});

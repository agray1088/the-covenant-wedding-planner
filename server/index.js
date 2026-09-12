import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { initSchema, pool, query, describeDatabaseUrl, databaseUrl } from './lib/db.js';
import { hashPassword } from './lib/auth.js';
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
import partyRoutes from './routes/party.js';
import taskRoutes from './routes/tasks.js';
import vtimelineRoutes from './routes/vtimeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8000';

const app = express();
app.use(cors({
  origin(origin, cb) {
    // Allow same-origin tools, curl, and configured static planner origin.
    if (!origin || origin === CORS_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      cb(null, true);
      return;
    }
    cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      ok: true,
      service: 'covenant-sync',
      version: '0.1.0',
      mode: 'offline-first-optional-cloud',
      db: 'up',
      time: new Date().toISOString()
    });
  } catch (e) {
    res.status(503).json({ ok: false, db: 'down', error: String(e.message || e) });
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
app.use('/weddings/:weddingId/party', partyRoutes);
app.use('/weddings/:weddingId/tasks', taskRoutes);
app.use('/weddings/:weddingId/vtimeline', vtimelineRoutes);

app.use((err, _req, res, _next) => {
  console.error('[covenant-sync]', err);
  res.status(500).json({ error: 'server_error', message: err.message || 'Unexpected error' });
});

async function bootstrapUser() {
  const email = (process.env.BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const password = process.env.BOOTSTRAP_PASSWORD || '';
  if (!email || !password) return;
  const { rows } = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (rows[0]) return;
  await query(
    `INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3)`,
    [email, hashPassword(password), 'Demo Couple']
  );
  console.log('[covenant-sync] bootstrap user ready:', email);
}

async function main() {
  const dbInfo = describeDatabaseUrl(databaseUrl);
  console.log(
    `[covenant-sync] db target ${dbInfo.user}@${dbInfo.host}:${dbInfo.port}/${dbInfo.database} (${dbInfo.source}) pwdLen=${dbInfo.passwordLength} codes=${dbInfo.passwordCharCodes}`
  );
  await initSchema();
  await bootstrapUser();
  app.listen(PORT, () => {
    console.log(`[covenant-sync] listening on http://127.0.0.1:${PORT}`);
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

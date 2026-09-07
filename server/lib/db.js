import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
const examplePath = path.join(__dirname, '../.env.example');
const inDocker = process.env.COVENANT_SYNC_DOCKER === '1';

if (!inDocker) {
  // Prefer server/.env over any machine-wide DATABASE_URL (common on Windows).
  if (fs.existsSync(examplePath)) {
    dotenv.config({ path: examplePath });
  }
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

const { Pool } = pg;

const DEFAULT_URL = inDocker
  ? 'postgres://covenant:covenant@postgres:5432/covenant'
  : 'postgres://covenant:covenant@127.0.0.1:5433/covenant';

// Trim — Windows CRLF .env files often leave `\r` on values and cause 28P01.
export const databaseUrl = String(process.env.DATABASE_URL || DEFAULT_URL).trim();

for (const key of ['PORT', 'CORS_ORIGIN', 'BOOTSTRAP_EMAIL', 'BOOTSTRAP_PASSWORD']) {
  if (process.env[key] != null) process.env[key] = String(process.env[key]).trim();
}

export function parseDatabaseUrl(url = databaseUrl) {
  const u = new URL(url);
  return {
    user: decodeURIComponent(u.username || ''),
    password: decodeURIComponent(u.password || ''),
    host: u.hostname,
    port: Number(u.port || 5432),
    database: (u.pathname || '/').replace(/^\//, '') || ''
  };
}

export function describeDatabaseUrl(url = databaseUrl) {
  try {
    const cfg = parseDatabaseUrl(url);
    const codes = [...cfg.password].map((ch) => ch.charCodeAt(0));
    return {
      user: cfg.user,
      host: cfg.host,
      port: String(cfg.port),
      database: cfg.database,
      source: inDocker ? 'docker-compose' : (fs.existsSync(envPath) ? envPath : 'default'),
      passwordLength: cfg.password.length,
      passwordCharCodes: codes.join(',')
    };
  } catch {
    return {
      user: '?',
      host: '?',
      port: '?',
      database: '?',
      source: 'invalid-url',
      passwordLength: 0,
      passwordCharCodes: ''
    };
  }
}

const cfg = parseDatabaseUrl(databaseUrl);
export const pool = new Pool({
  user: cfg.user,
  password: cfg.password,
  host: cfg.host,
  port: cfg.port,
  database: cfg.database
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function initSchema() {
  const schemaPath = path.join(__dirname, '../schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
}

export async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

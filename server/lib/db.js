import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
const examplePath = path.join(__dirname, '../.env.example');

// Prefer server/.env over any machine-wide DATABASE_URL (common on Windows).
if (fs.existsSync(examplePath)) {
  dotenv.config({ path: examplePath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const { Pool } = pg;

const DEFAULT_URL = 'postgres://covenant:covenant@127.0.0.1:5433/covenant';
// Trim — Windows CRLF .env files often leave `\r` on the password and cause 28P01.
export const databaseUrl = String(process.env.DATABASE_URL || DEFAULT_URL).trim();

if (process.env.PORT) process.env.PORT = String(process.env.PORT).trim();
if (process.env.CORS_ORIGIN) process.env.CORS_ORIGIN = String(process.env.CORS_ORIGIN).trim();
if (process.env.BOOTSTRAP_EMAIL) process.env.BOOTSTRAP_EMAIL = String(process.env.BOOTSTRAP_EMAIL).trim();
if (process.env.BOOTSTRAP_PASSWORD) process.env.BOOTSTRAP_PASSWORD = String(process.env.BOOTSTRAP_PASSWORD).trim();

export function describeDatabaseUrl(url = databaseUrl) {
  try {
    const u = new URL(url);
    return {
      user: decodeURIComponent(u.username || ''),
      host: u.hostname,
      port: u.port || '5432',
      database: (u.pathname || '/').replace(/^\//, '') || '',
      source: fs.existsSync(envPath) ? envPath : 'default'
    };
  } catch {
    return { user: '?', host: '?', port: '?', database: '?', source: 'invalid-url' };
  }
}

export const pool = new Pool({ connectionString: databaseUrl });

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

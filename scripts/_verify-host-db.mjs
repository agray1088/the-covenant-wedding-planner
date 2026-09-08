#!/usr/bin/env node
/**
 * True host→published-port check (not docker exec / Docker network).
 * LOCAL DEV ONLY. Requires: npm install --prefix server (for `pg`).
 *
 * Usage: node scripts/_verify-host-db.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'server', 'package.json'));

let Client;
try {
  ({ Client } = require('pg'));
} catch {
  console.error('FAIL: cannot load server/node_modules/pg — run: npm install --prefix server');
  process.exit(2);
}

const HOST = process.env.COVENANT_DB_HOST || '127.0.0.1';
const PORT = Number(process.env.COVENANT_DB_PORT || 15432);

async function tryConnect(password, label) {
  const client = new Client({
    host: HOST,
    port: PORT,
    user: 'covenant',
    password,
    database: 'covenant',
    ssl: false,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    const { rows } = await client.query(
      'SELECT current_user AS u, current_database() AS d, inet_server_port() AS p'
    );
    console.log(`OK: ${label} →`, rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.error(`FAIL: ${label} → ${err.message}`);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

console.log(`== host Node/pg → ${HOST}:${PORT} (must be covenant-db-proxy / trust) ==`);

const okCorrect = await tryConnect('covenant', 'password=covenant');
const okWrong = await tryConnect('definitely-not-the-password', 'password=WRONG (trust must accept)');

if (!okCorrect) {
  console.error(`
Host ${HOST}:${PORT} rejected a normal login.
Check: docker compose ps  (covenant-db-proxy must own host :15432)
       netstat -ano | findstr 15432   (Windows — nothing else should own it)
       docker compose logs db-proxy postgres --tail 40`);
  process.exit(1);
}

if (!okWrong) {
  console.error(`
Password "covenant" worked but a WRONG password failed.
That means you are talking to a SCRAM/md5 Postgres — NOT this stack's trust proxy.
Common cause on Windows: native PostgreSQL (or an old container) bound to the same port.
Fix: stop the other service, or confirm docker compose ps shows covenant-db-proxy on :15432.`);
  process.exit(1);
}

console.log(`
All host checks passed.
Desktop pgAdmin: Host ${HOST}  Port ${PORT}  User/Password/DB covenant  SSL Disable.`);
process.exit(0);

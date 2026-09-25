import { initSchema, pool } from '../lib/db.js';

await initSchema();
console.log('schema applied');
await pool.end();

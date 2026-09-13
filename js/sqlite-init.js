/* ============================================================
   sqlite-init.js — Track 4.1 (SQLite WASM engine + IndexedDB)
   ------------------------------------------------------------
   Loads a SQLite database compiled to WebAssembly (sql.js), runs
   schema.sql, and persists the DB binary in IndexedDB per wedding
   profile. Also exports/imports portable .sqlite backups.

   STATUS: ENABLED, wired, and authoritative for recovery when localStorage is
   missing or older. Authority story (P0 persist race fix):
   1. localStorage is the synchronous crash-safety mirror (every save() writes it
      with data.updatedAt).
   2. In-memory SQLite is rebuilt on write-through (debounced ~250ms).
   3. IndexedDB holds the SQLite bytes (debounced ~400ms). A successful persist
      ACKs meta.lastPersistedUpdatedAt = data.updatedAt.
   4. Boot: if localStorage.updatedAt is newer than the IDB ACK / hydrated
      updatedAt, localStorage wins until ACK — do not let stale IDB hydrate
      clobber newer LS edits. pagehide/beforeunload flush pending persists.
   5. If localStorage is missing/blank and IDB has data, SQLite wins (recovery).

   WIRING (now in place):
   1. Vendored sql.js:  js/vendor/sql-wasm.js  +  js/vendor/sql-wasm.wasm
      (from https://github.com/sql-js/sql.js releases)
   2. Loaded before planner.js in index.html:
        <script src="js/vendor/sql-wasm.js"></script>
        <script src="js/sqlite-init.js"></script>
        <script src="js/migration-map.js"></script>
        <script src="js/json-to-sqlite-migrate.js"></script>
        <script src="js/db-repository.js"></script>
   3. COVENANT_SQLITE.enabled = true and initAllSqlite(activeProfile)
      runs from initAll().
   ============================================================ */

const COVENANT_SQLITE = {
  enabled: true,         // master flag — Track 4 enabled (WASM vendored + wired)
  SQL: null,             // sql.js module (from initSqlJs)
  db: null,              // active Database instance
  profileId: null,
  schemaText: null,      // cached schema.sql DDL
  wasmPath: 'js/vendor/' // where sql-wasm.wasm lives
};

const SQLITE_IDB_NAME = 'covenant_planner_db_v1';
const SQLITE_STORE_DB = 'databases';   // profile_{id} -> Uint8Array
const SQLITE_STORE_META = 'meta';      // 'meta' -> { activeProfile, schemaVersion, lastMigratedFromJson }

/* ---- IndexedDB plumbing (promise-wrapped) ---- */
function sqliteIdbOpen() {
  return new Promise((resolve, reject) => {
    // Private browsing / blocked storage: indexedDB may be absent, or .open() may
    // throw synchronously (SecurityError) or fire onerror/onblocked. Reject cleanly
    // in every case so callers can degrade to the in-memory DB + localStorage mirror
    // instead of surfacing an uncaught error.
    if (typeof indexedDB === 'undefined' || !indexedDB) {
      reject(new Error('IndexedDB is unavailable in this browser/context.'));
      return;
    }
    let req;
    try {
      req = indexedDB.open(SQLITE_IDB_NAME, 1);
    } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SQLITE_STORE_DB)) db.createObjectStore(SQLITE_STORE_DB);
      if (!db.objectStoreNames.contains(SQLITE_STORE_META)) db.createObjectStore(SQLITE_STORE_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed.'));
    req.onblocked = () => reject(new Error('IndexedDB open was blocked.'));
  });
}
function sqliteIdbTx(store, mode, fn) {
  return sqliteIdbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const os = tx.objectStore(store);
    const out = fn(os);
    // `fn` returns an IDBRequest whose `.result` is undefined on a GET miss
    // (and for writes). Resolve to that result — NOT the request object — so a
    // cache miss reads as `undefined`. (The old `? out.result : out` returned
    // the truthy request handle on a miss, which made openProfileDb wrongly
    // take the "existing bytes" branch and skip schema creation => 0 tables.)
    tx.oncomplete = () => resolve(out && typeof out === 'object' && 'result' in out ? out.result : out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}
function sqliteIdbGet(store, key) {
  return sqliteIdbTx(store, 'readonly', os => os.get(key));
}
function sqliteIdbPut(store, key, value) {
  return sqliteIdbTx(store, 'readwrite', os => os.put(value, key));
}
function sqliteIdbDelete(store, key) {
  return sqliteIdbTx(store, 'readwrite', os => os.delete(key));
}

/* Remove a profile's persisted SQLite bytes from IndexedDB (profile delete / reset). */
async function deleteProfileDbFromIndexedDB(profileId) {
  const id = profileId || COVENANT_SQLITE.profileId;
  if (!id) return false;
  try {
    await sqliteIdbDelete(SQLITE_STORE_DB, 'profile_' + id);
    return true;
  } catch (e) {
    console.warn('[SQLite] IndexedDB delete failed for profile_' + id, e);
    return false;
  }
}

/* ---- Engine lifecycle ---- */
// Decode a base64 string to a Uint8Array (no dependency on Buffer/Node).
function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function initSqliteEngine(opts) {
  opts = opts || {};
  if (COVENANT_SQLITE.SQL) return COVENANT_SQLITE.SQL;
  if (typeof initSqlJs !== 'function') {
    throw new Error('sql.js not found: include js/vendor/sql-wasm.js before sqlite-init.js.');
  }
  // Bundled single-file mode: the rebundle inlines the .wasm as base64 so sql.js
  // boots WITHOUT any network fetch (initSqlJs accepts a `wasmBinary` option).
  // Dev mode (separate files) falls back to locateFile → js/vendor/sql-wasm.wasm.
  if (typeof COVENANT_SQLITE_WASM_B64 === 'string' && COVENANT_SQLITE_WASM_B64.length) {
    const wasmBinary = base64ToUint8Array(COVENANT_SQLITE_WASM_B64);
    COVENANT_SQLITE.SQL = await initSqlJs({ wasmBinary });
  } else {
    const wasmPath = opts.wasmPath || COVENANT_SQLITE.wasmPath;
    COVENANT_SQLITE.SQL = await initSqlJs({ locateFile: file => wasmPath + file });
  }
  return COVENANT_SQLITE.SQL;
}

async function loadSchemaText() {
  if (COVENANT_SQLITE.schemaText) return COVENANT_SQLITE.schemaText;
  // In the single-file customer bundle this global is inlined by the rebundle
  // script; in dev we fetch the file next to the app.
  let text;
  if (typeof COVENANT_SCHEMA_SQL === 'string') {
    text = COVENANT_SCHEMA_SQL;
  } else {
    const res = await fetch('schema.sql');
    if (!res.ok) throw new Error('Could not load schema.sql (' + res.status + ')');
    text = await res.text();
  }
  // Never silently accept an empty/whitespace schema: doing so would create a
  // 0-table database that could then be persisted and poison every later load.
  if (!text || !text.trim()) {
    throw new Error('schema is empty/blank — refusing to initialize an empty database.');
  }
  COVENANT_SQLITE.schemaText = text;
  return COVENANT_SQLITE.schemaText;
}

function execSchema(db, schemaText) {
  db.run('PRAGMA foreign_keys = ON;');
  db.run(schemaText);
}

function countDbTables(db) {
  const res = db.exec("SELECT count(*) c FROM sqlite_master WHERE type='table'");
  return (res && res[0]) ? res[0].values[0][0] : 0;
}

/* ---- Additive schema upgrades (Phase B) ----
   Columns added after some DBs were already persisted. Fresh DBs get them from
   schema.sql; older DBs are upgraded here via guarded ALTER TABLE so hydrate can
   read them and the overflow safety net can be stored. Idempotent + guarded. */
const SQLITE_ADDED_COLUMNS = [
  ['wedding', 'overflow_json', 'TEXT'],      // JSON overflow safety net
  ['guest',   'guest_group', 'TEXT'],        // guest.group  (keyword-safe name)
  ['guest',   'role', 'TEXT'],               // guest.role
  ['guest',   'invite_decision', 'TEXT'],    // guest.inviteDecision
  ['vendor',  'rating', 'REAL'],             // vendor.rating
  ['payment', 'gratuity', 'REAL'],           // payment.gratuity
  ['payment', 'gratuity_status', 'TEXT'],    // payment.gratuityStatus
  ['payment', 'budget_item', 'TEXT'],        // payment.budgetItem
  ['payment', 'budget_item_id', 'TEXT'],     // payment.budgetItemId
  ['payment', 'contract_idx', 'TEXT'],       // payment.contractIdx
  ['task',    'phase', 'TEXT'],              // task.phase
  ['task',    'suggested_due', 'TEXT']       // task.suggestedDue
];
// Tables added after the original schema shipped — created on older DBs (that
// predate them) so hydrate/sync can rely on them. Existing DBs already carrying
// the table are left untouched (IF NOT EXISTS).
const SQLITE_ADDED_TABLES = [
  "CREATE TABLE IF NOT EXISTS task_subtask (id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES task(id) ON DELETE CASCADE, body TEXT, done INTEGER DEFAULT 0, position INTEGER)",
  "CREATE INDEX IF NOT EXISTS idx_subtask_task ON task_subtask(task_id)"
];
function sqliteTableHasColumn(db, table, col) {
  try {
    const res = db.exec('PRAGMA table_info(' + table + ')');
    if (res && res[0]) { const i = res[0].columns.indexOf('name'); return res[0].values.some(r => r[i] === col); }
  } catch (e) {}
  return false;
}
function ensureSchemaColumns(db) {
  if (!db) return;
  SQLITE_ADDED_COLUMNS.forEach(([table, col, type]) => {
    try {
      if (!sqliteTableHasColumn(db, table, col)) db.run('ALTER TABLE ' + table + ' ADD COLUMN ' + col + ' ' + type);
    } catch (e) { /* table absent in a partial/older schema — ignore */ }
  });
  SQLITE_ADDED_TABLES.forEach(ddl => {
    try { db.run(ddl); } catch (e) { /* dependency table absent in a partial schema — ignore */ }
  });
}

async function openProfileDb(profileId) {
  const SQL = await initSqliteEngine();
  const key = 'profile_' + profileId;
  // Read any persisted bytes, but degrade gracefully when IndexedDB is unavailable
  // (private browsing / storage blocked): treat it as "no persisted DB" and build a
  // fresh in-memory database from schema below. The localStorage JSON mirror stays
  // the crash-safe store, so no data is lost — this function never throws on an IDB
  // read failure.
  let bytes = null;
  try {
    bytes = await sqliteIdbGet(SQLITE_STORE_DB, key);
  } catch (e) {
    console.warn('[SQLite] IndexedDB read unavailable — opening an in-memory database from schema.', e);
    bytes = null;
  }
  let db;
  // A never-populated SQL.Database() exports to 0 bytes and a valid SQLite file
  // is never that small, so treat empty/too-small persisted bytes as "no DB".
  if (bytes && bytes.byteLength > 0) {
    db = new SQL.Database(new Uint8Array(bytes));
    db.run('PRAGMA foreign_keys = ON;');
  } else {
    db = new SQL.Database();
    execSchema(db, await loadSchemaText());
  }
  // Self-heal: if the DB we ended up with has no schema (a poisoned/empty
  // persisted profile), rebuild it so we never get stuck reporting 0 tables.
  if (!countDbTables(db)) {
    execSchema(db, await loadSchemaText());
  }
  // Bring older persisted DBs up to the current column set (Phase B) before use.
  ensureSchemaColumns(db);
  COVENANT_SQLITE.db = db;
  COVENANT_SQLITE.profileId = profileId;
  return db;
}

async function persistDbToIndexedDB(profileId, db) {
  const target = db || COVENANT_SQLITE.db;
  const id = profileId || COVENANT_SQLITE.profileId;
  if (!target || !id) return false;
  // Safety net: never persist a schema-less database. Doing so would poison
  // every subsequent load (openProfileDb would keep reopening 0 tables).
  try {
    if (!countDbTables(target)) {
      console.warn('[SQLite] Refusing to persist a database with 0 tables (profile_' + id + ').');
      return false;
    }
  } catch (e) { /* if the check itself fails, fall through and save normally */ }
  // Persist is best-effort: if IndexedDB is unavailable (private browsing / quota /
  // SecurityError) we swallow the error and keep running on the in-memory DB plus
  // the localStorage mirror. This must never throw to the caller.
  try {
    const bytes = target.export();               // Uint8Array
    await sqliteIdbPut(SQLITE_STORE_DB, 'profile_' + id, bytes);
    // ACK the mirror timestamp we just flushed so boot can prefer newer LS edits.
    try {
      const mirror = (typeof window !== 'undefined' && window.data) ? window.data : null;
      const ackAt = (mirror && mirror.updatedAt) || new Date().toISOString();
      const meta = (await getSqliteMeta()) || {};
      meta.lastPersistedUpdatedAt = ackAt;
      meta.lastPersistedProfileId = id;
      meta.lastPersistedAt = new Date().toISOString();
      await setSqliteMeta(meta);
    } catch (e) { /* meta ACK is best-effort */ }
    return true;
  } catch (e) {
    console.warn('[SQLite] IndexedDB persist unavailable — keeping in-memory DB + localStorage mirror.', e);
    return false;
  }
}

async function loadDbFromIndexedDB(profileId) {
  const bytes = await sqliteIdbGet(SQLITE_STORE_DB, 'profile_' + profileId);
  // A 0-length buffer (degenerate empty export) is not a usable DB — report
  // "none" so callers migrate/rebuild instead of trusting empty bytes.
  return (bytes && bytes.byteLength > 0) ? new Uint8Array(bytes) : null;
}

function getSqliteMeta() { return sqliteIdbGet(SQLITE_STORE_META, 'meta'); }
function setSqliteMeta(meta) { return sqliteIdbPut(SQLITE_STORE_META, 'meta', meta); }

/* ---- Portable .sqlite export / import ---- */
function exportDbFile(filename) {
  const db = COVENANT_SQLITE.db;
  if (!db) { throw new Error('No open database to export.'); }
  const bytes = db.export();
  const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || ('covenant-wedding-planner-' + new Date().toISOString().split('T')[0] + '.sqlite');
  a.click();
  URL.revokeObjectURL(url);
}

async function importDbFile(file, profileId) {
  const SQL = await initSqliteEngine();
  const buf = await file.arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buf));
  db.run('PRAGMA foreign_keys = ON;');
  ensureSchemaColumns(db); // upgrade an imported .sqlite made by an older build
  COVENANT_SQLITE.db = db;
  COVENANT_SQLITE.profileId = profileId || COVENANT_SQLITE.profileId;
  await persistDbToIndexedDB(COVENANT_SQLITE.profileId, db);
  return db;
}

function closeDb() {
  if (COVENANT_SQLITE.db) { try { COVENANT_SQLITE.db.close(); } catch (e) {} }
  COVENANT_SQLITE.db = null;
  COVENANT_SQLITE.profileId = null;
}

/* Convenience bootstrap used by planner.js initAll() once enabled. Returns
   { migrated: bool } — true when a first-time JSON import ran. */
async function initAllSqlite(profileId, jsonData) {
  if (!COVENANT_SQLITE.enabled) return { enabled: false };
  // Detect a previously-persisted DB. If IndexedDB is blocked this read throws;
  // treat it as "none" and let openProfileDb build an in-memory DB from schema so
  // the engine still works this session (edits persist to the localStorage mirror).
  let existing = null;
  let idbAvailable = true;
  try {
    existing = await loadDbFromIndexedDB(profileId);
  } catch (e) {
    idbAvailable = false;
    console.warn('[SQLite] IndexedDB unavailable — running SQLite in-memory this session; the localStorage mirror stays authoritative for persistence.', e);
  }
  // openProfileDb is hardened to never throw on an IndexedDB read failure; it builds
  // an in-memory database from schema when nothing can be read.
  await openProfileDb(profileId);
  let migrated = false;
  if (!existing && jsonData && typeof migrateJsonToSqlite === 'function') {
    // First run (or IndexedDB-blocked): build SQLite content from the JSON mirror so
    // the in-memory engine matches `data`.
    await migrateJsonToSqlite(jsonData, COVENANT_SQLITE.db);
    // Persist + meta writes are best-effort. persistDbToIndexedDB never throws; when
    // IndexedDB is blocked it returns false and we simply skip the meta write.
    const persisted = await persistDbToIndexedDB(profileId, COVENANT_SQLITE.db);
    if (persisted) {
      try {
        const meta = (await getSqliteMeta()) || {};
        meta.activeProfile = profileId;
        meta.lastMigratedFromJson = true;
        meta.schemaVersion = (typeof CURRENT_SCHEMA_VERSION !== 'undefined') ? CURRENT_SCHEMA_VERSION : null;
        await setSqliteMeta(meta);
      } catch (e) { console.warn('[SQLite] Could not write meta (IndexedDB blocked?); continuing.', e); }
    }
    migrated = true;
  }
  return { enabled: true, migrated, idb: idbAvailable, inMemory: !idbAvailable };
}

if (typeof window !== 'undefined') {
  window.COVENANT_SQLITE = COVENANT_SQLITE;
}

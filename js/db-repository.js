/* ============================================================
   db-repository.js — Track 4.3
   ------------------------------------------------------------
   Thin async repository over the SQLite DB. planner.js will call
   these instead of mutating `data` arrays directly, one domain at
   a time (rollout phases A→D in the build plan).

   Live behavior: writes go through SQLite AND the app keeps `data`
   as an in-memory read cache (hydrated on load). This lets the UI +
   CWP table engine keep receiving plain arrays while persistence
   runs under the hood.

   STATUS: ENABLED and authoritative — COVENANT_SQLITE.enabled is true
   and the sql.js WASM asset is vendored + wired (see sqlite-init.js
   header). SQLite is the source of truth; the localStorage/JSON copy
   is retained only as a crash-safety mirror.
   ============================================================ */

(function (global) {
  'use strict';

  function db() {
    const s = global.COVENANT_SQLITE;
    if (!s || !s.enabled || !s.db) throw new Error('SQLite not initialized (COVENANT_SQLITE.db is null).');
    return s.db;
  }

  // Run a query returning an array of plain row objects.
  function sqlAll(sql, params) {
    const stmt = db().prepare(sql);
    try {
      if (params) stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }
  function sqlRun(sql, params) { db().run(sql, params || []); }

  // Debounced persistence so a burst of writes = one IndexedDB save.
  let _persistTimer = null;
  let _persistInFlight = null;
  function schedulePersist(delay) {
    if (_persistTimer) clearTimeout(_persistTimer);
    _persistTimer = setTimeout(() => {
      _persistTimer = null;
      flushPersist();
    }, delay == null ? 400 : delay);
  }
  // Cancel debounce and persist immediately (pagehide / critical saves / boot ACK).
  function flushPersist() {
    if (_persistTimer) { clearTimeout(_persistTimer); _persistTimer = null; }
    if (typeof persistDbToIndexedDB !== 'function') return Promise.resolve(false);
    if (_persistInFlight) return _persistInFlight;
    _persistInFlight = Promise.resolve()
      .then(() => persistDbToIndexedDB())
      .catch(e => { console.warn('SQLite persist failed', e); return false; })
      .finally(() => { _persistInFlight = null; });
    return _persistInFlight;
  }

  // ---- Generic table CRUD ----
  function tableCols(table) {
    const res = db().exec('PRAGMA table_info(' + table + ')');
    const cols = [];
    if (res && res[0]) { const i = res[0].columns.indexOf('name'); res[0].values.forEach(r => cols.push(r[i])); }
    return cols;
  }
  function getAll(table, weddingId) {
    return weddingId
      ? sqlAll('SELECT * FROM ' + table + ' WHERE wedding_id = ?', [weddingId])
      : sqlAll('SELECT * FROM ' + table);
  }
  function getById(table, id) {
    const rows = sqlAll('SELECT * FROM ' + table + ' WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }
  function upsert(table, row) {
    const cols = tableCols(table);
    const keys = Object.keys(row).filter(k => cols.indexOf(k) >= 0 && row[k] !== undefined);
    if (!keys.length) return;
    const placeholders = keys.map(() => '?').join(', ');
    const params = keys.map(k => { const v = row[k]; return v === true ? 1 : v === false ? 0 : v; });
    sqlRun('INSERT OR REPLACE INTO ' + table + ' (' + keys.join(', ') + ') VALUES (' + placeholders + ')', params);
    schedulePersist();
  }
  function remove(table, id) {
    sqlRun('DELETE FROM ' + table + ' WHERE id = ?', [id]);
    schedulePersist();
  }

  // ---- Domain wrappers (extend as collections move to SQLite) ----
  const repo = {
    sqlAll, sqlRun, getAll, getById, upsert, remove, schedulePersist, flushPersist,
    getGuests: (weddingId) => getAll('guest', weddingId),
    upsertGuest: (row) => upsert('guest', row),
    deleteGuest: (id) => remove('guest', id),
    getPayments: (weddingId) => getAll('payment', weddingId),
    upsertPayment: (row) => upsert('payment', row),
    deletePayment: (id) => remove('payment', id),
    getTasks: (weddingId) => getAll('task', weddingId),
    upsertTask: (row) => upsert('task', row),
    deleteTask: (id) => remove('task', id),
    getBudgetCategories: (weddingId) => getAll('budget_category', weddingId)
  };

  /* ============================================================
     Phase B — REVERSE hydration (SQLite → the `data` shape).
     ------------------------------------------------------------
     Exact inverse of migration-map.js: singletons → objects,
     collections → arrays (with their `_id`s), nested child tables →
     nested arrays, FK ids → the name-string refs the UI expects, and
     SQL 0/1 → booleans. Returns { hydrated, weddingId, data, counts }.
     Pure read: does NOT mutate planner state — planner.js merges the
     returned object into its own `data` (see hydrateDataFromSqlite use
     in load/restore). Accepts an optional explicit db (for tests).
     ============================================================ */
  function invertAlias(alias) {
    const inv = {};
    Object.keys(alias || {}).forEach(k => { inv[alias[k]] = k; });
    return inv;
  }

  function hydrateDataFromSqlite(weddingId, dbArg) {
    const S = global.MIGRATION_SINGLETONS || {};
    const COLLS = global.MIGRATION_COLLECTIONS || [];
    const MISC_OBJECTS = global.MIGRATION_MISC_OBJECTS || [];
    const NOTE_KINDS = global.MIGRATION_NOTE_KINDS || [];
    const VENUE_FIELDS = global.MIGRATION_VENUE_FIELDS || [];
    const VENUE_ALIAS = global.MIGRATION_VENUE_ALIAS || {};

    const database = dbArg || (global.COVENANT_SQLITE && global.COVENANT_SQLITE.db);
    if (!database) return { hydrated: false, reason: 'no-db' };

    // Query helpers bound to the chosen db (independent of the active handle).
    const q = (sql, params) => {
      const st = database.prepare(sql);
      try { if (params) st.bind(params); const rows = []; while (st.step()) rows.push(st.getAsObject()); return rows; }
      finally { st.free(); }
    };
    const colCache = {};
    const cols = table => {
      if (colCache[table]) return colCache[table];
      const set = new Set();
      try { const r = database.exec('PRAGMA table_info(' + table + ')'); if (r && r[0]) { const i = r[0].columns.indexOf('name'); r[0].values.forEach(v => set.add(v[i])); } } catch (e) {}
      colCache[table] = set; return set;
    };
    const tableExists = table => q("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1", [table]).length > 0;

    if (!tableExists('wedding')) return { hydrated: false, reason: 'no-schema' };
    const weddingRow = q('SELECT * FROM wedding LIMIT 1')[0] || null;
    if (!weddingRow) return { hydrated: false, reason: 'empty' };
    const wid = weddingId || weddingRow.id;

    // id → name maps for reversing FK refs back to the name strings the UI uses.
    const nameById = {};
    ['vendor', 'reception_table', 'guest', 'budget_category'].forEach(t => {
      nameById[t] = {};
      if (!tableExists(t) || !cols(t).has('name')) return;
      const where = cols(t).has('wedding_id') ? ' WHERE wedding_id=?' : '';
      q('SELECT id, name FROM ' + t + where, where ? [wid] : undefined).forEach(r => { nameById[t][r.id] = r.name; });
    });

    // Reverse a SQL row into a JSON row per a collection/nested spec.
    function reverseRow(spec, row, opts) {
      opts = opts || {};
      const invAlias = invertAlias(spec.alias);
      const boolCols = new Set(spec.bool || []);
      const refs = spec.refs || {};
      const refAsCols = new Set(Object.keys(refs).map(f => refs[f].as));
      const constant = spec.constant || {};
      const parentCols = opts.parentCols || [];
      const out = {};
      Object.keys(row).forEach(col => {
        if (col === 'wedding_id') return;
        if (parentCols.indexOf(col) >= 0) return;
        if (Object.prototype.hasOwnProperty.call(constant, col)) return; // discriminator
        if (col === 'id') {
          if (opts.withId !== false) out['_id'] = row[col];
          if (spec.emitId) out[spec.emitId] = row[col];                  // e.g. guestEvents keep both id + _id
          return;
        }
        if (refAsCols.has(col)) return;                                  // handled below
        let val = row[col];
        if (val === null || val === undefined) return;                   // don't inject absent keys
        if (boolCols.has(col)) val = !!val;
        out[invAlias[col] || col] = val;
      });
      // FK id → name (only fills a field the alias/1:1 pass didn't already set).
      Object.keys(refs).forEach(f => {
        const ref = refs[f];
        const fk = row[ref.as];
        if (fk == null) return;
        const nm = (nameById[ref.table] || {})[fk];
        if (nm == null) return;
        if (out[f] === undefined || out[f] === null || out[f] === '') out[f] = nm;
      });
      return out;
    }

    const data = {};
    const counts = {};

    // ---- setup ← wedding row (+ misc_setting scope='setup') ----
    {
      const invAlias = invertAlias((S.setup || {}).alias);
      // overflow_json is meta (the safety-net patch), applied separately at the
      // very end — it must never be reversed into setup as a data field.
      const skip = new Set(['id', 'name', 'wedding_id', 'onboard_wizard_seen', 'onboard_backup_done', 'schema_version', 'created_at', 'updated_at', 'overflow_json']);
      const setup = { _id: weddingRow.id };
      Object.keys(weddingRow).forEach(col => {
        if (skip.has(col)) return;
        const val = weddingRow[col];
        if (val === null || val === undefined) return;
        setup[invAlias[col] || col] = val;
      });
      if (tableExists('misc_setting')) {
        q("SELECT field, value FROM misc_setting WHERE wedding_id=? AND scope='setup'", [wid]).forEach(r => { setup[r.field] = r.value; });
      }
      data.setup = setup;
    }

    // ---- other singletons (1:1 tables keyed by wedding_id) ----
    ['ceremony', 'honeymoon', 'cateringMeta', 'marriageLicense'].forEach(key => {
      const spec = S[key];
      if (!spec || !tableExists(spec.table)) return;
      const rows = q('SELECT * FROM ' + spec.table + ' WHERE wedding_id=?', [wid]);
      if (!rows.length) return;
      data[key] = reverseRow(spec, rows[0], { withId: false });
    });

    // ---- notes ← note(kind, body) ----
    if (tableExists('note')) {
      const notes = {};
      q('SELECT kind, body FROM note WHERE wedding_id=?', [wid]).forEach(r => { notes[r.kind] = r.body; });
      if (Object.keys(notes).length) data.notes = notes;
    }

    // ---- venue ← venue(role, ...) → { 'c-*', 'r-*' } ----
    if (tableExists('venue')) {
      const venue = {};
      q('SELECT * FROM venue WHERE wedding_id=?', [wid]).forEach(r => {
        const prefix = r.role === 'ceremony' ? 'c-' : r.role === 'reception' ? 'r-' : null;
        if (!prefix) return;
        VENUE_FIELDS.forEach(f => {
          const col = VENUE_ALIAS[f] || f;
          const val = r[col];
          if (val != null && val !== '') venue[prefix + f] = val;
        });
      });
      if (Object.keys(venue).length) data.venue = venue;
    }

    // ---- dynamic-key objects ← misc_setting(scope, field, value) ----
    if (tableExists('misc_setting')) {
      MISC_OBJECTS.forEach(scope => {
        const rows = q('SELECT field, value FROM misc_setting WHERE wedding_id=? AND scope=?', [wid, scope]);
        if (!rows.length) return;
        const obj = {};
        rows.forEach(r => { obj[r.field] = r.value; });
        data[scope] = obj;
      });
    }

    // ---- collections ← their tables (+ nested child tables) ----
    COLLS.forEach(spec => {
      if (!tableExists(spec.table)) return;
      const tcols = cols(spec.table);
      const clauses = [];
      const params = [];
      if (tcols.has('wedding_id')) { clauses.push('wedding_id=?'); params.push(wid); }
      if (spec.constant) Object.keys(spec.constant).forEach(c => { clauses.push(c + '=?'); params.push(spec.constant[c]); });
      // ORDER BY rowid keeps rows in insertion (= original array) order, which the
      // overflow diff relies on for element-wise alignment.
      const sql = 'SELECT * FROM ' + spec.table + (clauses.length ? ' WHERE ' + clauses.join(' AND ') : '') + ' ORDER BY rowid';
      const rows = q(sql, params.length ? params : undefined);
      const arr = rows.map(row => {
        const obj = reverseRow(spec, row, {});
        if (spec.nested) {
          Object.keys(spec.nested).forEach(field => {
            const childSpec = spec.nested[field];
            if (!tableExists(childSpec.table)) { obj[field] = []; return; }
            // Skip the parent FK and any order-hint column when reversing; honor
            // keepId:false for children that carry no _id in JSON (e.g. subtasks).
            const skipCols = [childSpec.parentCol].concat(childSpec.orderCol ? [childSpec.orderCol] : []);
            const children = q('SELECT * FROM ' + childSpec.table + ' WHERE ' + childSpec.parentCol + '=? ORDER BY rowid', [row.id]);
            obj[field] = children.map(ch => reverseRow({ alias: childSpec.alias, bool: childSpec.bool }, ch, { parentCols: skipCols, withId: childSpec.keepId !== false }));
          });
        }
        return obj;
      });
      data[spec.jsonKey] = arr;
      counts[spec.jsonKey] = arr.length;
    });

    // ---- JSON overflow merge (MUST be last) ----
    // Restores everything the relational tables could not faithfully represent
    // (unmapped keys, extra per-record fields, coerced scalar types) so the
    // returned object deep-equals the original `data` — see the OVERFLOW SAFETY
    // NET in json-to-sqlite-migrate.js. When this DB was written before the
    // column existed (or by an older build), overflow is simply absent and we
    // return the relational-only reconstruction unchanged.
    try {
      const OV = global.CovenantOverflow;
      if (OV && typeof OV.apply === 'function' && weddingRow.overflow_json) {
        const patch = JSON.parse(weddingRow.overflow_json);
        if (patch && typeof patch === 'object') {
          const merged = OV.apply(data, patch);
          return { hydrated: true, weddingId: wid, data: merged, counts: counts };
        }
      }
    } catch (e) { /* malformed overflow: fall back to the relational-only data */ }

    return { hydrated: true, weddingId: wid, data: data, counts: counts };
  }

  global.DBRepo = repo;
  global.hydrateDataFromSqlite = hydrateDataFromSqlite;
})(typeof window !== 'undefined' ? window : this);

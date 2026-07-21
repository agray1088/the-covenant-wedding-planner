/* ============================================================
   json-to-sqlite-migrate.js — Track 4.2
   ------------------------------------------------------------
   One-time migration of a localStorage JSON planner (`data`) into
   a fresh SQLite database, driven by migration-map.js.

   Depends on: migration-map.js (loaded first). Runs inside a
   single transaction; rolls back on any error. Returns a report
   { tablesMigrated, rowsInserted, warnings[] }.

   STATUS: ENABLED and wired — see sqlite-init.js header.
   COVENANT_SQLITE.enabled is true and the sql.js WASM asset is
   vendored, so this migration promotes a profile's JSON planner into
   the authoritative SQLite database when needed.
   ============================================================ */

(function (global) {
  'use strict';

  function normName(v) {
    return String(v == null ? '' : v).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').trim();
  }
  function toBool(v) { return v ? 1 : 0; }
  function isScalar(v) { return v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'; }

  /* ============================================================
     JSON-OVERFLOW SAFETY NET (Phase B — guaranteed-lossless round-trip)
     ------------------------------------------------------------
     The relational tables + migration-map capture the bulk of `data`, but a few
     things are not (or cannot be) represented faithfully by them:
       • unmapped top-level keys (e.g. guestEvents, guestEventAssignments,
         onboard, custom email templates, schemaVersion, updatedAt),
       • extra per-record fields with no column (e.g. payment.budgetItemId),
       • scalar VALUES that SQLite column affinity would coerce
         (e.g. setup.budget "10000" -> REAL 10000, darkMode true -> "true").
     To make SQLite a safe single source of truth we store a compact JSON *patch*
     — the difference between the original `data` and what the relational tables
     hydrate back to — in wedding.overflow_json, then deep-merge it on hydrate.
     ovApply(base, ovDiff(orig, base)) deep-equals orig by construction, so the
     round-trip is lossless regardless of what the map does or doesn't cover.

     Volatile runtime-only state (undo/redo/history) is intentionally NOT stored
     in SQLite (it lives in the localStorage crash-safety mirror); those keys are
     skipped here to keep overflow small. */
  const OVERFLOW_SKIP_KEYS = ['_historyLog', '_undoSnapshots', '_redoSnapshots', '_historyPrefs'];

  function ovDeepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a && b && typeof a === 'object') {
      const aArr = Array.isArray(a), bArr = Array.isArray(b);
      if (aArr !== bArr) return false;
      if (aArr) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (!ovDeepEqual(a[i], b[i])) return false;
        return true;
      }
      const ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (let i = 0; i < ka.length; i++) {
        const k = ka[i];
        if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
        if (!ovDeepEqual(a[k], b[k])) return false;
      }
      return true;
    }
    return false; // primitives that are not === (covers "10000" vs 10000, true vs "true")
  }

  function ovClone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  // Compute a patch P such that ovApply(base, P) deep-equals orig. Returns
  // undefined when orig already deep-equals base (nothing to store).
  function ovDiff(orig, base) {
    if (ovDeepEqual(orig, base)) return undefined;
    if (Array.isArray(orig)) {
      // Arrays hydrate back in insertion order, so element i aligns with base[i]
      // when the lengths match — diff element-wise to keep overflow minimal.
      if (Array.isArray(base) && base.length === orig.length) {
        const items = {};
        for (let i = 0; i < orig.length; i++) {
          const d = ovDiff(orig[i], base[i]);
          if (d !== undefined) items[i] = d;
        }
        return { __t: 'arr', items: items };
      }
      return { __t: 'rep', v: ovClone(orig) }; // length/shape mismatch -> replace whole
    }
    if (orig && typeof orig === 'object') {
      if (base && typeof base === 'object' && !Array.isArray(base)) {
        const set = {};
        let hasSet = false;
        Object.keys(orig).forEach(k => {
          const d = ovDiff(orig[k], base[k]);
          if (d !== undefined) { set[k] = d; hasSet = true; }
        });
        const del = [];
        Object.keys(base).forEach(k => { if (!Object.prototype.hasOwnProperty.call(orig, k)) del.push(k); });
        const out = { __t: 'obj' };
        if (hasSet) out.set = set;
        if (del.length) out.del = del;
        return out;
      }
      return { __t: 'rep', v: ovClone(orig) };
    }
    return { __t: 'rep', v: orig }; // primitive that differs (or null vs object)
  }

  function ovApply(base, patch) {
    if (!patch || typeof patch !== 'object') return base;
    if (patch.__t === 'rep') return ovClone(patch.v);
    if (patch.__t === 'arr') {
      const out = Array.isArray(base) ? base.slice() : [];
      const items = patch.items || {};
      Object.keys(items).forEach(idx => { const i = +idx; out[i] = ovApply(out[i], items[idx]); });
      return out;
    }
    if (patch.__t === 'obj') {
      const out = (base && typeof base === 'object' && !Array.isArray(base)) ? Object.assign({}, base) : {};
      if (patch.set) Object.keys(patch.set).forEach(k => { out[k] = ovApply(out[k], patch.set[k]); });
      if (patch.del) patch.del.forEach(k => { delete out[k]; });
      return out;
    }
    return base;
  }

  // Shallow copy of `data` minus the volatile runtime-only keys.
  function ovStripTop(data) {
    const out = {};
    Object.keys(data || {}).forEach(k => { if (OVERFLOW_SKIP_KEYS.indexOf(k) < 0) out[k] = data[k]; });
    return out;
  }

  function ovHasColumn(db, table, col) {
    try {
      const res = db.exec('PRAGMA table_info(' + table + ')');
      if (res && res[0]) { const i = res[0].columns.indexOf('name'); return res[0].values.some(r => r[i] === col); }
    } catch (e) {}
    return false;
  }
  // Guarded, idempotent — lets us write overflow even into a DB persisted before
  // the column existed (belt-and-braces alongside sqlite-init ensureSchemaColumns).
  function ensureOverflowColumn(db) {
    if (!ovHasColumn(db, 'wedding', 'overflow_json')) {
      try { db.run('ALTER TABLE wedding ADD COLUMN overflow_json TEXT'); } catch (e) {}
    }
  }

  // After all relational tables are populated, hydrate them back (with overflow
  // currently empty) and store the residual diff so hydrate can reproduce `data`.
  function writeOverflow(db, data, weddingId) {
    if (typeof global.hydrateDataFromSqlite !== 'function') return;
    ensureOverflowColumn(db);
    const h = global.hydrateDataFromSqlite(weddingId, db);
    if (!h || !h.hydrated || !h.data) return;
    const patch = ovDiff(ovStripTop(data), h.data);
    const json = (patch === undefined) ? null : JSON.stringify(patch);
    db.run('UPDATE wedding SET overflow_json = ? WHERE id = ?', [json, weddingId]);
  }

  const _colCache = {};
  function tableColumns(db, table) {
    if (_colCache[table]) return _colCache[table];
    const set = new Set();
    const res = db.exec('PRAGMA table_info(' + table + ')');
    if (res && res[0]) {
      const nameIdx = res[0].columns.indexOf('name');
      res[0].values.forEach(r => set.add(r[nameIdx]));
    }
    _colCache[table] = set;
    return set;
  }

  // Build a { column: value } object for a row against a collection spec.
  function buildRow(spec, row, weddingId, extra) {
    const alias = spec.alias || {};
    const boolCols = new Set(spec.bool || []);
    const out = {};
    if (weddingId != null) out.wedding_id = weddingId;
    if (row && row._id != null) out.id = row._id;
    Object.keys(row || {}).forEach(field => {
      if (field === '_id') return;
      const val = row[field];
      if (!isScalar(val)) return; // arrays/objects handled via nested/misc
      const col = alias[field] || field;
      out[col] = boolCols.has(col) ? toBool(val) : val;
    });
    // reference resolution (name/id -> FK)
    if (spec.refs) {
      Object.keys(spec.refs).forEach(field => {
        const ref = spec.refs[field];
        const lookup = extra && extra.lookups && extra.lookups[ref.table];
        if (lookup) { const id = lookup[normName(row[field])]; if (id) out[ref.as] = id; }
      });
    }
    if (spec.constant) Object.assign(out, spec.constant);
    return out;
  }

  function insertRow(db, table, obj, warnings) {
    const cols = tableColumns(db, table);
    const keys = Object.keys(obj).filter(k => cols.has(k) && obj[k] !== undefined);
    if (!keys.length) { warnings.push('No matching columns for ' + table); return; }
    const placeholders = keys.map(() => '?').join(', ');
    const sql = 'INSERT OR REPLACE INTO ' + table + ' (' + keys.join(', ') + ') VALUES (' + placeholders + ')';
    const params = keys.map(k => {
      const v = obj[k];
      return (v === true) ? 1 : (v === false) ? 0 : (v == null ? null : v);
    });
    db.run(sql, params);
  }

  function migrateSingletons(db, data, weddingId, warnings, report) {
    const S = global.MIGRATION_SINGLETONS || {};
    // wedding (from setup) is inserted by caller before this; here handle the rest
    ['ceremony', 'honeymoon', 'cateringMeta', 'marriageLicense'].forEach(key => {
      const spec = S[key];
      const src = data[key];
      if (!spec || !src || typeof src !== 'object' || Array.isArray(src)) return;
      const obj = buildRow(spec, src, weddingId);
      if (spec.pk === 'wedding_id') { obj.wedding_id = weddingId; delete obj.id; }
      insertRow(db, spec.table, obj, warnings);
      report.tablesMigrated.add(spec.table);
      report.rowsInserted++;
    });
    // notes -> note(kind, body)
    (global.MIGRATION_NOTE_KINDS || []).forEach(kind => {
      const body = data.notes && data.notes[kind];
      if (!body) return;
      insertRow(db, 'note', { id: 'note_' + kind, wedding_id: weddingId, kind: kind, body: body }, warnings);
      report.tablesMigrated.add('note'); report.rowsInserted++;
    });
    // venue c-*/r-*
    const venue = data.venue || {};
    [['c', 'ceremony'], ['r', 'reception']].forEach(([prefix, role]) => {
      const obj = { id: 'venue_' + role, wedding_id: weddingId, role: role };
      let any = false;
      (global.MIGRATION_VENUE_FIELDS || []).forEach(f => {
        const v = venue[prefix + '-' + f];
        if (v != null && v !== '') { obj[(global.MIGRATION_VENUE_ALIAS || {})[f] || f] = v; any = true; }
      });
      if (any) { insertRow(db, 'venue', obj, warnings); report.tablesMigrated.add('venue'); report.rowsInserted++; }
    });
    // dynamic-key objects -> misc_setting(scope, field, value)
    (global.MIGRATION_MISC_OBJECTS || []).forEach(scope => {
      const src = data[scope];
      if (!src || typeof src !== 'object') return;
      Object.keys(src).forEach(field => {
        const v = src[field];
        if (!isScalar(v)) return;
        insertRow(db, 'misc_setting', { id: 'misc_' + scope + '_' + field, wedding_id: weddingId, scope: scope, field: field, value: String(v) }, warnings);
        report.rowsInserted++;
      });
      report.tablesMigrated.add('misc_setting');
    });
    // setup extras (theme/font/etc.) -> misc_setting
    const setupSpec = S.setup || {};
    (setupSpec.misc || []).forEach(field => {
      const v = data.setup && data.setup[field];
      if (v == null || v === '' || !isScalar(v)) return;
      insertRow(db, 'misc_setting', { id: 'misc_setup_' + field, wedding_id: weddingId, scope: 'setup', field: field, value: String(v) }, warnings);
      report.rowsInserted++;
    });
  }

  function migrateCollections(db, data, weddingId, lookups, warnings, report) {
    // Insert referenced parents first, then the rest. guest + guest_event must
    // precede guest_event_assignment (FK to both). Array.sort is stable, so
    // same-priority specs keep their MIGRATION_COLLECTIONS order.
    const priority = { vendor: 0, reception_table: 1, budget_category: 2, guest: 3, guest_event: 4 };
    const specs = (global.MIGRATION_COLLECTIONS || []).slice().sort((a, b) => (priority[a.table] ?? 9) - (priority[b.table] ?? 9));

    specs.forEach(spec => {
      const rows = Array.isArray(data[spec.jsonKey]) ? data[spec.jsonKey] : [];
      if (!rows.length) return;
      rows.forEach((row, i) => {
        if (!row || typeof row !== 'object') return;
        const parentId = row._id != null ? row._id : (spec.table + '_' + i);
        const obj = buildRow(spec, row, weddingId, { lookups });
        if (obj.id == null) obj.id = parentId;
        insertRow(db, spec.table, obj, warnings);
        report.rowsInserted++;

        if (spec.nested) {
          Object.keys(spec.nested).forEach(field => {
            const childSpec = spec.nested[field];
            const children = Array.isArray(row[field]) ? row[field] : [];
            children.forEach((child, ci) => {
              if (!child || typeof child !== 'object') return;
              const cObj = buildRow({ alias: childSpec.alias, bool: childSpec.bool }, child, weddingId);
              cObj[childSpec.parentCol] = obj.id;
              if (childSpec.orderCol) cObj[childSpec.orderCol] = ci; // preserve array order explicitly
              if (cObj.id == null) cObj.id = (child._id != null ? child._id : obj.id + '_' + field + '_' + ci);
              insertRow(db, childSpec.table, cObj, warnings);
              report.tablesMigrated.add(childSpec.table);
              report.rowsInserted++;
            });
          });
        }
      });
      report.tablesMigrated.add(spec.table);
    });
  }

  function buildLookups(data) {
    const lookups = { vendor: {}, reception_table: {}, guest: {}, budget_category: {} };
    (data.vendors || []).forEach(v => { if (v && v._id) lookups.vendor[normName(v.name)] = v._id; });
    (data.tables || []).forEach(t => { if (t && t._id) lookups.reception_table[normName(t.name)] = t._id; });
    (data.guests || []).forEach(g => { if (g && g._id) lookups.guest[normName(g.name)] = g._id; });
    (data.budget || []).forEach(c => { if (c && c._id) lookups.budget_category[normName(c.cat)] = c._id; });
    return lookups;
  }

  /* The set of tables this migration/sync owns, derived from the map so it
     stays DRY. Used by syncDataToSqlite() to clear stale rows before a full
     re-population (delete-then-insert). Tables NOT listed here (e.g.
     guest_event, email_template) are never touched by the JSON⇄SQL bridge. */
  function managedTables() {
    const S = global.MIGRATION_SINGLETONS || {};
    const tables = new Set(['wedding', 'note', 'venue', 'misc_setting']);
    Object.keys(S).forEach(k => { if (S[k] && S[k].table) tables.add(S[k].table); });
    (global.MIGRATION_COLLECTIONS || []).forEach(spec => {
      if (spec.table) tables.add(spec.table);
      if (spec.nested) Object.keys(spec.nested).forEach(f => { if (spec.nested[f].table) tables.add(spec.nested[f].table); });
    });
    return Array.from(tables);
  }

  function clearManagedTables(db) {
    // FK cascade means any order is safe here (child refs are CASCADE/SET NULL),
    // and each profile is its own DB file, so an unqualified DELETE is correct.
    managedTables().forEach(t => { try { db.run('DELETE FROM ' + t); } catch (e) { /* table may not exist in an older persisted schema */ } });
  }

  /* Shared population pass (no transaction control of its own) used by both the
     one-time migrate and the continuous write-through sync. */
  function populate(db, data, report) {
    const S = global.MIGRATION_SINGLETONS || {};
    const weddingId = (data.setup && data.setup._id) || 'wedding_default';

    const weddingObj = buildRow(S.setup || { alias: {} }, Object.assign({ _id: weddingId }, data.setup || {}), null);
    weddingObj.id = weddingId;
    if (typeof CURRENT_SCHEMA_VERSION !== 'undefined') weddingObj.schema_version = CURRENT_SCHEMA_VERSION;
    else if (typeof global.CURRENT_SCHEMA_VERSION !== 'undefined') weddingObj.schema_version = global.CURRENT_SCHEMA_VERSION;
    insertRow(db, 'wedding', weddingObj, report.warnings);
    report.tablesMigrated.add('wedding'); report.rowsInserted++;

    migrateSingletons(db, data, weddingId, report.warnings, report);
    const lookups = buildLookups(data);
    migrateCollections(db, data, weddingId, lookups, report.warnings, report);
    // Capture anything the relational pass could not represent faithfully so the
    // hydrate is guaranteed lossless (see OVERFLOW SAFETY NET above). Guarded so a
    // failure here can never break the migrate/sync transaction's core work.
    try { writeOverflow(db, data, weddingId); } catch (e) { report.warnings.push('overflow: ' + ((e && e.message) || e)); }
    return weddingId;
  }

  async function migrateJsonToSqlite(jsonData, db) {
    const data = jsonData || {};
    const report = { tablesMigrated: new Set(), rowsInserted: 0, warnings: [] };

    db.run('BEGIN');
    try {
      populate(db, data, report);
      db.run('COMMIT');
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }

    const result = {
      tablesMigrated: report.tablesMigrated.size,
      rowsInserted: report.rowsInserted,
      warnings: report.warnings
    };
    try { console.info('[SQLite migration]', result); } catch (e) {}
    return result;
  }

  /* ---- Continuous write-through sync (Phase B) ----
     Rebuilds the DB's managed tables from the current in-memory `data` so the
     SQLite file always mirrors the live planner. Strategy: delete-then-insert
     the full managed table set inside one transaction (handles adds, edits AND
     deletes with no diffing). Idempotent and driven entirely by migration-map.js,
     so JSON stays the single source of truth for the mapping.

     Synchronous (sql.js is synchronous). Returns a small report. Callers MUST
     guard so any throw here never breaks the JSON/localStorage save. */
  function syncDataToSqlite(jsonData, db) {
    const data = jsonData || {};
    const target = db || (global.COVENANT_SQLITE && global.COVENANT_SQLITE.db);
    if (!target) throw new Error('syncDataToSqlite: no database provided.');
    const report = { tablesMigrated: new Set(), rowsInserted: 0, warnings: [] };
    target.run('BEGIN');
    try {
      clearManagedTables(target);
      populate(target, data, report);
      target.run('COMMIT');
    } catch (e) {
      try { target.run('ROLLBACK'); } catch (_) {}
      throw e;
    }
    return {
      tablesSynced: report.tablesMigrated.size,
      rowsInserted: report.rowsInserted,
      warnings: report.warnings
    };
  }

  global.migrateJsonToSqlite = migrateJsonToSqlite;
  global.syncDataToSqlite = syncDataToSqlite;
  // Shared overflow diff/merge utilities (used by db-repository hydrate + tests).
  global.CovenantOverflow = {
    deepEqual: ovDeepEqual,
    diff: ovDiff,
    apply: ovApply,
    stripTop: ovStripTop,
    clone: ovClone,
    SKIP_KEYS: OVERFLOW_SKIP_KEYS
  };
})(typeof window !== 'undefined' ? window : this);

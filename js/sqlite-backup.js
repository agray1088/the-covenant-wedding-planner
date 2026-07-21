/* ============================================================
   sqlite-backup.js — Track 4.4 (dual-format backup / restore)
   ------------------------------------------------------------
   Bridges the SQLite .sqlite export/import primitives (sqlite-init.js)
   with the app's existing JSON backup path so users can back up and
   restore in EITHER format during the transition release.

   Policy (updated — .sqlite is now the primary user-facing backup):
     - Download Backup (existing button)  → .sqlite (primary format)
     - Download SQLite Backup (new)       → .sqlite
     - Restore auto-detects .sqlite vs .json by extension/content
     - Keep JSON export working as a defensive fallback so no
       existing user is stranded (invisible localStorage JSON
       mirror also remains internally).

   STATUS: ENABLED and wired — COVENANT_SQLITE.enabled is true and
   sql.js is vendored (see sqlite-init.js header). SQLite is the
   authoritative store, so .sqlite is the primary backup format; the
   JSON export/import path is retained as a defensive fallback and a
   localStorage crash-safety mirror.
   ============================================================ */

(function (global) {
  'use strict';

  function sqliteOn() {
    const s = global.COVENANT_SQLITE;
    return !!(s && s.enabled && s.db);
  }

  /* Backup is only trustworthy once the engine finished booting for the active profile. */
  function sqliteBackupReady(profileId) {
    const s = global.COVENANT_SQLITE;
    const pid = profileId != null ? profileId : (typeof activeProfile !== 'undefined' ? activeProfile : s && s.profileId);
    if (!s || !s.enabled || !s.db) return false;
    if (pid != null && s.profileId !== pid) return false;
    if (typeof _sqliteSyncSuppressed !== 'undefined' && _sqliteSyncSuppressed) return false;
    return true;
  }

  /* ---- JSON backup (kept as the default format this release) ---- */
  // When SQLite is authoritative we export SQL → JSON shape; until the
  // full inverse mapping lands (Phase B) we fall back to the in-memory
  // `data` via the app's existing exporter so backups always round-trip.
  function downloadJsonBackup() {
    if (sqliteOn() && typeof sqliteToJson === 'function' && typeof exportJSONFromObject === 'function') {
      try { return exportJSONFromObject(sqliteToJson(global.COVENANT_SQLITE.db)); }
      catch (e) { console.warn('SQLite→JSON export failed, using in-memory data.', e); }
    }
    if (typeof exportJSON === 'function') return exportJSON();
    throw new Error('No JSON export path available (exportJSON not found).');
  }

  /* ---- Portable .sqlite backup (new path) ---- */
  function downloadSqliteBackup(filename, profileId) {
    if (!sqliteBackupReady(profileId)) throw new Error('SQLite backup is not ready yet (engine still loading or profile mismatch).');
    return exportDbFile(filename); // from sqlite-init.js
  }

  /* ---- Unified restore: detect format and route ---- */
  function isSqliteFile(file, headerText) {
    if (file && /\.sqlite$|\.db$/i.test(file.name || '')) return true;
    // SQLite files begin with the ASCII magic string "SQLite format 3\0"
    return typeof headerText === 'string' && headerText.slice(0, 15) === 'SQLite format 3';
  }

  async function restoreFromFile(file, profileId) {
    if (!file) throw new Error('No file selected.');
    // Peek at the first bytes to detect format regardless of extension.
    let headerText = '';
    try { headerText = new TextDecoder('latin1').decode(new Uint8Array(await file.slice(0, 16).arrayBuffer())); } catch (e) {}

    if (isSqliteFile(file, headerText)) {
      if (!global.COVENANT_SQLITE || !global.COVENANT_SQLITE.enabled) {
        throw new Error('This is a .sqlite backup, but SQLite mode is not enabled in this build.');
      }
      // Load the file into a TEMP database first so the user can still cancel the
      // confirm without having replaced the live DB. We only commit the swap +
      // IndexedDB persist once the app has applied the restored data.
      const buf = new Uint8Array(await file.arrayBuffer());
      let SQL = global.COVENANT_SQLITE.SQL;
      if (!SQL && typeof initSqliteEngine === 'function') SQL = await initSqliteEngine();
      if (!SQL) throw new Error('SQLite engine is not ready.');
      const tempDb = new SQL.Database(buf);
      tempDb.run('PRAGMA foreign_keys = ON;');
      // Upgrade an older .sqlite (missing Phase-B columns) before hydrating it.
      if (typeof ensureSchemaColumns === 'function') { try { ensureSchemaColumns(tempDb); } catch (e) {} }

      let obj = null, hydrated = false;
      if (typeof hydrateDataFromSqlite === 'function') {
        const h = hydrateDataFromSqlite(null, tempDb);   // hydrate from the temp DB (no side effects)
        if (h && h.hydrated) { obj = h.data; hydrated = true; }
      }
      if (!hydrated) { try { tempDb.close(); } catch (e) {} throw new Error('That .sqlite file did not contain a readable Covenant Planner database.'); }

      let applied = true;
      if (typeof applyRestoredPlannerData === 'function') {
        applied = applyRestoredPlannerData(obj, { format: 'sqlite' });   // confirm + replace data + re-render
      }
      if (applied === false) { try { tempDb.close(); } catch (e) {} return { format: 'sqlite', applied: false }; }

      // Commit: make the imported DB the live handle, rebuild managed tables from the
      // hydrated JSON (not a raw file swap), then persist.
      try { if (global.COVENANT_SQLITE.db && global.COVENANT_SQLITE.db !== tempDb) global.COVENANT_SQLITE.db.close(); } catch (e) {}
      global.COVENANT_SQLITE.db = tempDb;
      global.COVENANT_SQLITE.profileId = profileId || global.COVENANT_SQLITE.profileId;
      if (typeof syncDataToSqlite === 'function' && obj) {
        syncDataToSqlite(obj, tempDb);
      }
      if (typeof persistDbToIndexedDB === 'function') {
        await persistDbToIndexedDB(global.COVENANT_SQLITE.profileId, tempDb);
      }
      return { format: 'sqlite', hydrated: true, applied: true };
    }

    // JSON path — reuse the app's importer (which runs migrateData() + re-render).
    const text = await file.text();
    if (typeof importJSONText === 'function') { return { format: 'json', applied: importJSONText(text) }; }
    const parsed = JSON.parse(text);
    if (typeof applyRestoredPlannerData === 'function') { return { format: 'json', applied: applyRestoredPlannerData(parsed, { format: 'json' }) }; }
    if (typeof loadImportedData === 'function') { loadImportedData(parsed); return { format: 'json' }; }
    throw new Error('No JSON import path available (importJSONText not found).');
  }

  global.CovenantBackup = {
    downloadJsonBackup,
    downloadSqliteBackup,
    restoreFromFile,
    isSqliteFile,
    sqliteOn,
    sqliteBackupReady
  };
})(typeof window !== 'undefined' ? window : this);

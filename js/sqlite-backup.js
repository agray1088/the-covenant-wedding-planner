/* ============================================================
   sqlite-backup.js — Track 4.4 (dual-format + full zip backup)
   ------------------------------------------------------------
   Bridges the SQLite .sqlite export/import primitives (sqlite-init.js)
   with the app's existing JSON backup path so users can back up and
   restore in EITHER format during the transition release.

   Policy (updated — .sqlite is now the primary user-facing backup):
     - Download Backup (existing button)  → .sqlite (primary format)
     - Download full backup               → .zip (planner + photos)
     - Restore auto-detects .zip / .sqlite / .json
     - Keep JSON export working as a defensive fallback so no
       existing user is stranded (invisible localStorage JSON
       mirror also remains internally).

   Full zip layout (covenant-backup-v1):
     manifest.json
     planner.sqlite | planner.json
     photos-index.json
     photos/<id>.<ext>

   STATUS: ENABLED and wired — COVENANT_SQLITE.enabled is true and
   sql.js is vendored (see sqlite-init.js header). SQLite is the
   authoritative store, so .sqlite is the primary backup format; the
   JSON export/import path is retained as a defensive fallback and a
   localStorage crash-safety mirror.
   ============================================================ */

(function (global) {
  'use strict';

  var BACKUP_FORMAT = 'covenant-backup-v1';

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

  function plannerSnapshot() {
    try {
      if (typeof data !== 'undefined' && data) return data;
    } catch (e) {}
    return null;
  }

  function encodeJson(obj) {
    var text = JSON.stringify(obj, null, 2);
    if (global.CovenantZip && typeof CovenantZip.encodeUtf8 === 'function') {
      return CovenantZip.encodeUtf8(text);
    }
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text);
    var out = [];
    for (var i = 0; i < text.length; i++) out.push(text.charCodeAt(i) & 0xff);
    return new Uint8Array(out);
  }

  function decodeJsonBytes(bytes) {
    var text;
    if (global.CovenantZip && typeof CovenantZip.decodeUtf8 === 'function') {
      text = CovenantZip.decodeUtf8(bytes);
    } else if (typeof TextDecoder !== 'undefined') {
      text = new TextDecoder('utf-8').decode(bytes);
    } else {
      text = String.fromCharCode.apply(null, Array.from(bytes));
    }
    return JSON.parse(text);
  }

  async function buildFullBackupEntries(profileId) {
    var entries = [];
    var snap = plannerSnapshot();
    var photos = [];
    if (global.CovenantPhotos && typeof CovenantPhotos.collectBackupPhotos === 'function') {
      photos = await CovenantPhotos.collectBackupPhotos(snap, profileId);
    }

    var hasSqlite = false;
    if (sqliteBackupReady(profileId) && global.COVENANT_SQLITE && global.COVENANT_SQLITE.db) {
      try {
        if (typeof flushSqliteSync === 'function') flushSqliteSync();
        var bytes = global.COVENANT_SQLITE.db.export();
        entries.push({ name: 'planner.sqlite', data: bytes });
        hasSqlite = true;
      } catch (e) {
        console.warn('[backup] sqlite export for zip failed', e);
      }
    }
    if (!hasSqlite) {
      var jsonObj = snap;
      if (!jsonObj && typeof sqliteToJson === 'function' && sqliteOn()) {
        try { jsonObj = sqliteToJson(global.COVENANT_SQLITE.db); } catch (e2) {}
      }
      if (!jsonObj) throw new Error('Nothing to back up — planner data is not ready.');
      entries.push({ name: 'planner.json', data: encodeJson(jsonObj) });
    }

    var index = [];
    for (var i = 0; i < photos.length; i++) {
      var p = photos[i];
      var ext = (global.CovenantPhotos && CovenantPhotos.extForMime)
        ? CovenantPhotos.extForMime(p.mime)
        : 'bin';
      var fileName = 'photos/' + String(p.id).replace(/[^a-zA-Z0-9._-]/g, '_') + '.' + ext;
      entries.push({ name: fileName, data: p.bytes });
      index.push({
        id: p.id,
        file: fileName,
        name: p.name || p.id,
        mime: p.mime,
        size: p.bytes.byteLength,
        meta: p.meta || {}
      });
    }
    entries.push({ name: 'photos-index.json', data: encodeJson({ photos: index }) });
    entries.push({
      name: 'manifest.json',
      data: encodeJson({
        format: BACKUP_FORMAT,
        createdAt: new Date().toISOString(),
        app: 'The Covenant Wedding Planner',
        includes: {
          planner: hasSqlite ? 'sqlite' : 'json',
          photoCount: photos.length
        },
        privacy: 'local-file-backup',
        note: 'Offline file backup. Optional cloud sync is separate and opt-in.'
      })
    });
    return { entries: entries, photoCount: photos.length, planner: hasSqlite ? 'sqlite' : 'json' };
  }

  async function downloadFullBackup(filename, profileId) {
    if (!global.CovenantZip || typeof CovenantZip.buildZip !== 'function') {
      throw new Error('Zip helper not loaded (covenant-zip.js).');
    }
    var built = await buildFullBackupEntries(profileId);
    var zipBytes = CovenantZip.buildZip(built.entries);
    var name = filename || ('covenant-wedding-backup-' + new Date().toISOString().split('T')[0] + '.zip');
    if (typeof CovenantZip.downloadBytes === 'function') {
      CovenantZip.downloadBytes(zipBytes, name, 'application/zip');
    } else {
      throw new Error('Download not available in this environment.');
    }
    return { photoCount: built.photoCount, planner: built.planner, bytes: zipBytes.length };
  }

  /* ---- Unified restore: detect format and route ---- */
  function isSqliteFile(file, headerText) {
    if (file && /\.sqlite$|\.db$/i.test(file.name || '')) return true;
    // SQLite files begin with the ASCII magic string "SQLite format 3\0"
    return typeof headerText === 'string' && headerText.slice(0, 15) === 'SQLite format 3';
  }

  function isZipFile(file, headerBytes) {
    if (file && /\.zip$/i.test(file.name || '')) return true;
    if (headerBytes && headerBytes.length >= 4) {
      return headerBytes[0] === 0x50 && headerBytes[1] === 0x4b
        && (headerBytes[2] === 0x03 || headerBytes[2] === 0x05 || headerBytes[2] === 0x07)
        && (headerBytes[3] === 0x04 || headerBytes[3] === 0x06 || headerBytes[3] === 0x08);
    }
    return false;
  }

  async function restoreSqliteBytes(buf, profileId) {
    let SQL = global.COVENANT_SQLITE && global.COVENANT_SQLITE.SQL;
    if (!SQL && typeof initSqliteEngine === 'function') SQL = await initSqliteEngine();
    if (!SQL) throw new Error('SQLite engine is not ready.');
    const tempDb = new SQL.Database(buf);
    tempDb.run('PRAGMA foreign_keys = ON;');
    if (typeof ensureSchemaColumns === 'function') { try { ensureSchemaColumns(tempDb); } catch (e) {} }

    let obj = null, hydrated = false;
    if (typeof hydrateDataFromSqlite === 'function') {
      const h = hydrateDataFromSqlite(null, tempDb);
      if (h && h.hydrated) { obj = h.data; hydrated = true; }
    }
    if (!hydrated) { try { tempDb.close(); } catch (e) {} throw new Error('That .sqlite file did not contain a readable Covenant Planner database.'); }

    let applied = true;
    if (typeof applyRestoredPlannerData === 'function') {
      applied = applyRestoredPlannerData(obj, { format: 'sqlite' });
    }
    if (applied === false) { try { tempDb.close(); } catch (e) {} return { format: 'sqlite', applied: false }; }

    try { if (global.COVENANT_SQLITE.db && global.COVENANT_SQLITE.db !== tempDb) global.COVENANT_SQLITE.db.close(); } catch (e) {}
    global.COVENANT_SQLITE.db = tempDb;
    global.COVENANT_SQLITE.profileId = profileId || global.COVENANT_SQLITE.profileId;
    if (typeof syncDataToSqlite === 'function' && obj) {
      syncDataToSqlite(obj, tempDb);
    }
    if (typeof persistDbToIndexedDB === 'function') {
      await persistDbToIndexedDB(global.COVENANT_SQLITE.profileId, tempDb);
    }
    return { format: 'sqlite', hydrated: true, applied: true, data: obj };
  }

  async function restoreZipBackup(file, profileId) {
    if (!global.CovenantZip || typeof CovenantZip.parseZip !== 'function') {
      throw new Error('Zip helper not loaded (covenant-zip.js).');
    }
    var buf = new Uint8Array(await file.arrayBuffer());
    var zipEntries = CovenantZip.parseZip(buf);
    var byName = {};
    for (var i = 0; i < zipEntries.length; i++) {
      byName[zipEntries[i].name] = zipEntries[i];
    }

    var manifest = null;
    if (byName['manifest.json']) {
      try { manifest = decodeJsonBytes(byName['manifest.json'].data); } catch (e) {}
    }

    var applied = null;
    if (byName['planner.sqlite']) {
      if (!global.COVENANT_SQLITE || !global.COVENANT_SQLITE.enabled) {
        throw new Error('This zip contains a .sqlite planner, but SQLite mode is not enabled in this build.');
      }
      applied = await restoreSqliteBytes(byName['planner.sqlite'].data, profileId);
    } else if (byName['planner.json']) {
      var parsed = decodeJsonBytes(byName['planner.json'].data);
      if (typeof applyRestoredPlannerData === 'function') {
        var ok = applyRestoredPlannerData(parsed, { format: 'json' });
        applied = { format: 'json', applied: ok, data: parsed };
      } else if (typeof importJSONText === 'function') {
        applied = { format: 'json', applied: importJSONText(JSON.stringify(parsed)) };
      } else {
        throw new Error('No JSON import path available.');
      }
      if (applied && applied.applied === false) return { format: 'zip', applied: false, manifest: manifest };
    } else {
      throw new Error('That zip is not a Covenant backup (missing planner.sqlite or planner.json).');
    }

    if (applied && applied.applied === false) return { format: 'zip', applied: false, manifest: manifest };

    var photoEntries = [];
    var index = { photos: [] };
    if (byName['photos-index.json']) {
      try { index = decodeJsonBytes(byName['photos-index.json'].data) || index; } catch (e2) {}
    }
    var listed = (index && index.photos) || [];
    for (var p = 0; p < listed.length; p++) {
      var row = listed[p];
      if (!row || !row.file || !byName[row.file]) continue;
      photoEntries.push({
        id: row.id,
        name: row.name,
        mime: row.mime,
        bytes: byName[row.file].data,
        meta: row.meta || {}
      });
    }
    // Also pick up any photos/* not listed (defensive).
    for (var name in byName) {
      if (!Object.prototype.hasOwnProperty.call(byName, name)) continue;
      if (name.indexOf('photos/') !== 0 || name === 'photos-index.json') continue;
      var base = name.slice('photos/'.length).replace(/\.[^.]+$/, '');
      if (photoEntries.some(function (e) { return e.id === base || (e.meta && e.meta.file === name); })) continue;
      if (listed.some(function (r) { return r && r.file === name; })) continue;
      photoEntries.push({
        id: base,
        name: base,
        mime: 'application/octet-stream',
        bytes: byName[name].data,
        meta: { file: name }
      });
    }

    var imported = 0;
    if (photoEntries.length && global.CovenantPhotos && typeof CovenantPhotos.importBackupPhotos === 'function') {
      imported = await CovenantPhotos.importBackupPhotos(photoEntries, profileId);
    }

    return {
      format: 'zip',
      applied: true,
      manifest: manifest,
      photosImported: imported,
      inner: applied && applied.format
    };
  }

  async function restoreFromFile(file, profileId) {
    if (!file) throw new Error('No file selected.');
    // Peek at the first bytes to detect format regardless of extension.
    let headerBytes = new Uint8Array(0);
    let headerText = '';
    try {
      headerBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      headerText = new TextDecoder('latin1').decode(headerBytes);
    } catch (e) {}

    if (isZipFile(file, headerBytes)) {
      return restoreZipBackup(file, profileId);
    }

    if (isSqliteFile(file, headerText)) {
      if (!global.COVENANT_SQLITE || !global.COVENANT_SQLITE.enabled) {
        throw new Error('This is a .sqlite backup, but SQLite mode is not enabled in this build.');
      }
      const buf = new Uint8Array(await file.arrayBuffer());
      return restoreSqliteBytes(buf, profileId);
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
    downloadJsonBackup: downloadJsonBackup,
    downloadSqliteBackup: downloadSqliteBackup,
    downloadFullBackup: downloadFullBackup,
    buildFullBackupEntries: buildFullBackupEntries,
    restoreFromFile: restoreFromFile,
    isSqliteFile: isSqliteFile,
    isZipFile: isZipFile,
    sqliteOn: sqliteOn,
    sqliteBackupReady: sqliteBackupReady,
    BACKUP_FORMAT: BACKUP_FORMAT
  };
})(typeof window !== 'undefined' ? window : this);

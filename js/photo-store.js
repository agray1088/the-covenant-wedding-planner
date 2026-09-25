/* ============================================================
   photo-store.js — local photo library (IndexedDB blobs)
   ------------------------------------------------------------
   Metadata lives in planner data (`data.photoLibrary[]`).
   Image bytes live in IndexedDB — not stuffed into Postgres and
   not required to bloat every localStorage write when using idb: refs.

   Refs:
     - `idb:<photoId>`  → blob in this store
     - `data:image/...` → legacy inline (still supported; included in backups)

   Online: metadata syncs via server /photos routes; blobs go to
   object storage (S3/R2) or local disk when configured — see
   docs/BACKUP_AND_PHOTOS.md.
   ============================================================ */
(function (global) {
  'use strict';

  var IDB_NAME = 'covenant-photos-v1';
  var IDB_VER = 1;
  var STORE_BLOBS = 'blobs';
  var STORE_META = 'meta';

  function profileId() {
    try {
      if (typeof activeProfile !== 'undefined' && activeProfile != null) return String(activeProfile);
    } catch (e) {}
    try {
      if (global.COVENANT_SQLITE && global.COVENANT_SQLITE.profileId != null) {
        return String(global.COVENANT_SQLITE.profileId);
      }
    } catch (e2) {}
    return 'default';
  }

  function blobKey(photoId, pid) {
    return String(pid || profileId()) + ':' + String(photoId);
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (typeof indexedDB === 'undefined' || !indexedDB) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      var req;
      try { req = indexedDB.open(IDB_NAME, IDB_VER); }
      catch (e) { reject(e); return; }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE_BLOBS)) db.createObjectStore(STORE_BLOBS);
        if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('photo IDB open failed')); };
      req.onblocked = function () { reject(new Error('photo IDB open blocked')); };
    });
  }

  function idbReq(store, mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, mode);
        var os = tx.objectStore(store);
        var out = fn(os);
        tx.oncomplete = function () {
          resolve(out && typeof out === 'object' && 'result' in out ? out.result : out);
        };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function ensureLibrary() {
    try {
      if (typeof data !== 'undefined' && data) {
        if (!Array.isArray(data.photoLibrary)) data.photoLibrary = [];
        return data.photoLibrary;
      }
    } catch (e) {}
    return [];
  }

  function newId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'ph_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  function extForMime(mime) {
    mime = String(mime || '').toLowerCase();
    if (mime.indexOf('png') >= 0) return 'png';
    if (mime.indexOf('webp') >= 0) return 'webp';
    if (mime.indexOf('gif') >= 0) return 'gif';
    if (mime.indexOf('svg') >= 0) return 'svg';
    return 'jpg';
  }

  function parseDataUrl(dataUrl) {
    var m = String(dataUrl || '').match(/^data:([^;,]+)?(;base64)?,(.*)$/i);
    if (!m) return null;
    var mime = m[1] || 'application/octet-stream';
    var b64 = m[2] ? m[3] : null;
    if (!b64) return null;
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { mime: mime, bytes: bytes };
  }

  function isIdbRef(src) {
    return typeof src === 'string' && /^idb:/i.test(src);
  }

  function idFromRef(src) {
    return String(src || '').replace(/^idb:/i, '');
  }

  async function putBlob(photoId, bytes, mime, pid) {
    var key = blobKey(photoId, pid);
    var record = {
      id: String(photoId),
      profileId: String(pid || profileId()),
      mime: mime || 'application/octet-stream',
      bytes: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
      updatedAt: new Date().toISOString()
    };
    await idbReq(STORE_BLOBS, 'readwrite', function (os) { return os.put(record, key); });
    return record;
  }

  async function getBlob(photoId, pid) {
    return idbReq(STORE_BLOBS, 'readonly', function (os) {
      return os.get(blobKey(photoId, pid));
    });
  }

  async function deleteBlob(photoId, pid) {
    try {
      await idbReq(STORE_BLOBS, 'readwrite', function (os) {
        return os.delete(blobKey(photoId, pid));
      });
      return true;
    } catch (e) {
      console.warn('[photos] delete failed', e);
      return false;
    }
  }

  async function listBlobKeys(pid) {
    var prefix = String(pid || profileId()) + ':';
    var db = await openDb();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_BLOBS, 'readonly');
      var os = tx.objectStore(STORE_BLOBS);
      var req = os.getAllKeys();
      req.onsuccess = function () {
        var keys = (req.result || []).filter(function (k) {
          return String(k).indexOf(prefix) === 0;
        });
        resolve(keys);
      };
      req.onerror = function () { reject(req.error); };
    });
  }

  async function putFromFile(file, meta) {
    meta = meta || {};
    if (!file) throw new Error('No file');
    var id = meta.id || newId();
    var buf = new Uint8Array(await file.arrayBuffer());
    var mime = file.type || meta.mime || 'image/jpeg';
    await putBlob(id, buf, mime);
    var entry = {
      id: id,
      name: meta.name || file.name || ('photo-' + id.slice(0, 8)),
      mime: mime,
      size: buf.byteLength,
      kind: meta.kind || 'library',
      album: meta.album || '',
      caption: meta.caption || '',
      createdAt: meta.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      src: 'idb:' + id,
      publicUrl: null,
      cloudSynced: false
    };
    var lib = ensureLibrary();
    var idx = lib.findIndex(function (p) { return p && p.id === id; });
    if (idx >= 0) lib[idx] = Object.assign({}, lib[idx], entry);
    else lib.push(entry);
    if (typeof save === 'function') save();

    // Optional cloud object storage — only when cloud sync is opted in.
    // Failure never removes the local IndexedDB copy (offline path).
    if (meta.skipCloud !== true) {
      try {
        var CS = global.CovenantCloudSync;
        var st = CS && typeof CS.getStatus === 'function' ? CS.getStatus() : null;
        if (CS && typeof CS.uploadPhoto === 'function' && st && st.enabled
          && st.weddingId && (st.state === 'signed_in' || st.state === 'syncing' || st.state === 'synced')) {
          var up = await CS.uploadPhoto({
            id: id,
            name: entry.name,
            mime: mime,
            kind: entry.kind,
            size: entry.size,
            bytes: buf
          });
          if (up && up.publicUrl) {
            entry.publicUrl = up.publicUrl;
            entry.cloudSynced = true;
            var lib2 = ensureLibrary();
            var i2 = lib2.findIndex(function (p) { return p && p.id === id; });
            if (i2 >= 0) {
              lib2[i2].publicUrl = up.publicUrl;
              lib2[i2].cloudSynced = true;
            }
            if (typeof save === 'function') save();
          }
        }
      } catch (cloudErr) {
        console.warn('[photos] cloud upload skipped', cloudErr && cloudErr.message ? cloudErr.message : cloudErr);
      }
    }
    return entry;
  }

  async function putFromDataUrl(dataUrl, meta) {
    meta = meta || {};
    var parsed = parseDataUrl(dataUrl);
    if (!parsed) throw new Error('Not a base64 data URL');
    var id = meta.id || newId();
    await putBlob(id, parsed.bytes, parsed.mime);
    var entry = {
      id: id,
      name: meta.name || ('photo-' + id.slice(0, 8)),
      mime: parsed.mime,
      size: parsed.bytes.byteLength,
      kind: meta.kind || 'library',
      album: meta.album || '',
      caption: meta.caption || '',
      createdAt: meta.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      src: 'idb:' + id
    };
    var lib = ensureLibrary();
    var idx = lib.findIndex(function (p) { return p && p.id === id; });
    if (idx >= 0) lib[idx] = Object.assign({}, lib[idx], entry);
    else lib.push(entry);
    if (meta.persist !== false && typeof save === 'function') save();
    return entry;
  }

  async function resolveSrc(src) {
    if (!src) return null;
    if (isIdbRef(src)) {
      var rec = await getBlob(idFromRef(src));
      if (!rec || !rec.bytes) return null;
      var blob = new Blob([rec.bytes], { type: rec.mime || 'application/octet-stream' });
      return URL.createObjectURL(blob);
    }
    return src;
  }

  async function removePhoto(photoId) {
    var lib = ensureLibrary();
    var next = lib.filter(function (p) { return !(p && p.id === photoId); });
    try {
      if (typeof data !== 'undefined' && data) data.photoLibrary = next;
    } catch (e) {}
    await deleteBlob(photoId);
    if (typeof save === 'function') save();
    return true;
  }

  /** Collect exportable photo binaries for full backup (IDB + inline data URLs). */
  async function collectBackupPhotos(plannerData, pid) {
    var out = [];
    var seen = {};
    pid = pid || profileId();

    async function addIdb(id, hint) {
      if (!id || seen[id]) return;
      var rec = await getBlob(id, pid);
      if (!rec || !rec.bytes || !rec.bytes.byteLength) return;
      seen[id] = true;
      out.push({
        id: id,
        name: (hint && hint.name) || id,
        mime: rec.mime || 'application/octet-stream',
        bytes: rec.bytes,
        meta: hint || { id: id }
      });
    }

    function addDataUrl(dataUrl, hint) {
      var parsed = parseDataUrl(dataUrl);
      if (!parsed) return;
      var id = (hint && hint.id) || ('inline_' + crcLite(parsed.bytes));
      if (seen[id]) return;
      seen[id] = true;
      out.push({
        id: id,
        name: (hint && hint.name) || id,
        mime: parsed.mime,
        bytes: parsed.bytes,
        meta: Object.assign({ id: id, inline: true }, hint || {})
      });
    }

    var lib = (plannerData && plannerData.photoLibrary) || ensureLibrary() || [];
    for (var i = 0; i < lib.length; i++) {
      var p = lib[i];
      if (!p) continue;
      if (isIdbRef(p.src) || p.id) await addIdb(p.id || idFromRef(p.src), p);
      else if (typeof p.src === 'string' && p.src.indexOf('data:') === 0) addDataUrl(p.src, p);
    }

    var setup = plannerData && plannerData.setup;
    if (setup && typeof setup.photo === 'string') {
      if (isIdbRef(setup.photo)) await addIdb(idFromRef(setup.photo), { id: idFromRef(setup.photo), kind: 'hero', name: 'hero-photo' });
      else if (setup.photo.indexOf('data:') === 0) addDataUrl(setup.photo, { id: 'hero_photo', kind: 'hero', name: 'hero-photo' });
    }

    var moods = (plannerData && plannerData.moodPhotos) || [];
    for (var m = 0; m < moods.length; m++) {
      var mp = moods[m];
      if (!mp || typeof mp.src !== 'string') continue;
      if (isIdbRef(mp.src)) await addIdb(idFromRef(mp.src), { id: idFromRef(mp.src), kind: 'mood', name: mp.caption || ('mood-' + m) });
      else if (mp.src.indexOf('data:') === 0) addDataUrl(mp.src, { id: 'mood_' + m, kind: 'mood', name: mp.caption || ('mood-' + m), caption: mp.caption || '' });
    }

    var items = (plannerData && plannerData.moodItems) || [];
    for (var n = 0; n < items.length; n++) {
      var mi = items[n];
      if (!mi) continue;
      var src = mi.src || mi.image;
      if (typeof src !== 'string') continue;
      if (isIdbRef(src)) await addIdb(idFromRef(src), { id: idFromRef(src), kind: 'moodItem', name: mi.item || ('item-' + n) });
      else if (src.indexOf('data:') === 0) addDataUrl(src, { id: 'mooditem_' + n, kind: 'moodItem', name: mi.item || ('item-' + n) });
    }

    return out;
  }

  function crcLite(bytes) {
    var h = 2166136261;
    for (var i = 0; i < bytes.length; i += Math.max(1, Math.floor(bytes.length / 64))) {
      h ^= bytes[i];
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  async function importBackupPhotos(photoEntries, pid) {
    pid = pid || profileId();
    var imported = 0;
    for (var i = 0; i < (photoEntries || []).length; i++) {
      var e = photoEntries[i];
      if (!e || !e.id || !e.bytes) continue;
      await putBlob(e.id, e.bytes, e.mime || 'application/octet-stream', pid);
      imported++;
      if (e.meta && e.meta.kind === 'library') {
        var lib = ensureLibrary();
        if (!lib.some(function (p) { return p && p.id === e.id; })) {
          lib.push({
            id: e.id,
            name: e.name || e.id,
            mime: e.mime,
            size: e.bytes.byteLength,
            kind: 'library',
            album: (e.meta && e.meta.album) || '',
            caption: (e.meta && e.meta.caption) || '',
            createdAt: (e.meta && e.meta.createdAt) || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            src: 'idb:' + e.id
          });
        }
      }
    }
    return imported;
  }

  global.CovenantPhotos = {
    putFromFile: putFromFile,
    putFromDataUrl: putFromDataUrl,
    putBlob: putBlob,
    getBlob: getBlob,
    deleteBlob: deleteBlob,
    removePhoto: removePhoto,
    resolveSrc: resolveSrc,
    isIdbRef: isIdbRef,
    idFromRef: idFromRef,
    ensureLibrary: ensureLibrary,
    listBlobKeys: listBlobKeys,
    collectBackupPhotos: collectBackupPhotos,
    importBackupPhotos: importBackupPhotos,
    extForMime: extForMime,
    parseDataUrl: parseDataUrl,
    profileId: profileId,
    newId: newId
  };
})(typeof window !== 'undefined' ? window : this);

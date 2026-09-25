/**
 * Photo metadata + blob content routes.
 * Blobs are NOT stored as base64 in Postgres — only metadata + storage_key + public_url.
 * Offline clients keep IndexedDB; object storage is optional when S3/R2 is configured.
 */
import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';
import {
  createDownloadDescriptor,
  createUploadDescriptor,
  deleteObject,
  getObject,
  newPhotoId,
  objectStorageConfigured,
  photoStorageMode,
  publicObjectUrl,
  putObject,
  storageConfigSummary
} from '../lib/object-storage.js';

const router = Router({ mergeParams: true });

function extFromMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  if (m.includes('svg')) return 'svg';
  return 'jpg';
}

function fromClient(c = {}) {
  const id = String(c.id || c._id || '').trim() || newPhotoId();
  const updatedAt = c.updatedAt || c.updated_at || new Date().toISOString();
  return {
    id,
    name: c.name != null ? String(c.name) : '',
    mime: c.mime || c.contentType || c.content_type || null,
    size_bytes: c.size != null ? Number(c.size) : (c.size_bytes != null ? Number(c.size_bytes) : null),
    width: c.width != null ? Number(c.width) : null,
    height: c.height != null ? Number(c.height) : null,
    caption: c.caption ?? null,
    album: c.album ?? null,
    kind: c.kind || 'library',
    storage_key: c.storageKey || c.storage_key || null,
    storage_backend: c.storageBackend || c.storage_backend || photoStorageMode(),
    public_url: c.publicUrl || c.public_url || null,
    updated_at: updatedAt
  };
}

function toClient(row) {
  const publicUrl = row.public_url || publicObjectUrl(row.storage_key) || null;
  return {
    id: row.id,
    _id: row.id,
    name: row.name || '',
    mime: row.mime || '',
    size: row.size_bytes != null ? Number(row.size_bytes) : null,
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    caption: row.caption || '',
    album: row.album || '',
    kind: row.kind || 'library',
    storageKey: row.storage_key || null,
    storageBackend: row.storage_backend || null,
    publicUrl,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
  };
}

router.get('/storage', requireAuth, requireWeddingMember, async (_req, res) => {
  res.json({ ok: true, storage: storageConfigSummary() });
});

router.get('/', requireAuth, requireWeddingMember, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM photos WHERE wedding_id = $1 ORDER BY updated_at DESC`,
    [req.params.weddingId]
  );
  res.json({ photos: rows.map(toClient), storage: storageConfigSummary() });
});

async function upsertPhoto(req, res, photoId) {
  const body = fromClient({ ...req.body, id: photoId });
  if (!body.id) {
    res.status(400).json({ error: 'missing_id' });
    return;
  }
  if (!body.storage_key) {
    const desc = await createUploadDescriptor({
      weddingId: req.params.weddingId,
      photoId: body.id,
      mime: body.mime,
      ext: extFromMime(body.mime)
    });
    body.storage_key = desc.storageKey;
    if (!body.public_url && desc.publicUrl) body.public_url = desc.publicUrl;
  } else if (!body.public_url) {
    body.public_url = publicObjectUrl(body.storage_key);
  }
  const { rows } = await query(
    `INSERT INTO photos (
       id, wedding_id, name, mime, size_bytes, width, height,
       caption, album, kind, storage_key, storage_backend, public_url, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::timestamptz
     )
     ON CONFLICT (wedding_id, id) DO UPDATE SET
       name = EXCLUDED.name,
       mime = COALESCE(EXCLUDED.mime, photos.mime),
       size_bytes = COALESCE(EXCLUDED.size_bytes, photos.size_bytes),
       width = COALESCE(EXCLUDED.width, photos.width),
       height = COALESCE(EXCLUDED.height, photos.height),
       caption = EXCLUDED.caption,
       album = EXCLUDED.album,
       kind = EXCLUDED.kind,
       storage_key = COALESCE(EXCLUDED.storage_key, photos.storage_key),
       storage_backend = COALESCE(EXCLUDED.storage_backend, photos.storage_backend),
       public_url = COALESCE(EXCLUDED.public_url, photos.public_url),
       updated_at = CASE
         WHEN EXCLUDED.updated_at >= photos.updated_at THEN EXCLUDED.updated_at
         ELSE photos.updated_at
       END
     RETURNING *, (xmax = 0) AS inserted`,
    [
      body.id,
      req.params.weddingId,
      body.name,
      body.mime,
      Number.isFinite(body.size_bytes) ? body.size_bytes : null,
      Number.isFinite(body.width) ? body.width : null,
      Number.isFinite(body.height) ? body.height : null,
      body.caption,
      body.album,
      body.kind,
      body.storage_key,
      body.storage_backend,
      body.public_url,
      body.updated_at
    ]
  );
  const row = rows[0];
  res.json({
    ack: true,
    photo: toClient(row),
    inserted: !!(row && row.inserted),
    storage: storageConfigSummary()
  });
}

router.put('/:photoId', requireAuth, requireWeddingMember, async (req, res) => {
  await upsertPhoto(req, res, req.params.photoId);
});

router.post('/', requireAuth, requireWeddingMember, async (req, res) => {
  const id = (req.body && (req.body.id || req.body._id)) || newPhotoId();
  await upsertPhoto(req, res, id);
});

router.post('/:photoId/upload-url', requireAuth, requireWeddingMember, async (req, res) => {
  const photoId = String(req.params.photoId || '').trim();
  if (!photoId) {
    res.status(400).json({ error: 'missing_id' });
    return;
  }
  const mime = (req.body && (req.body.mime || req.body.contentType)) || 'application/octet-stream';
  const desc = await createUploadDescriptor({
    weddingId: req.params.weddingId,
    photoId,
    mime,
    ext: extFromMime(mime)
  });
  await query(
    `INSERT INTO photos (id, wedding_id, name, mime, storage_key, storage_backend, public_url, kind, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
     ON CONFLICT (wedding_id, id) DO UPDATE SET
       mime = COALESCE(EXCLUDED.mime, photos.mime),
       storage_key = COALESCE(EXCLUDED.storage_key, photos.storage_key),
       storage_backend = EXCLUDED.storage_backend,
       public_url = COALESCE(EXCLUDED.public_url, photos.public_url),
       updated_at = now()`,
    [
      photoId,
      req.params.weddingId,
      (req.body && req.body.name) || photoId,
      mime,
      desc.storageKey,
      desc.backend,
      desc.publicUrl || null,
      (req.body && req.body.kind) || 'library'
    ]
  );
  res.json({ ok: true, upload: desc, storage: storageConfigSummary() });
});

router.get('/:photoId/download-url', requireAuth, requireWeddingMember, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM photos WHERE wedding_id = $1 AND id = $2`,
    [req.params.weddingId, req.params.photoId]
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const row = rows[0];
  const desc = await createDownloadDescriptor({
    weddingId: req.params.weddingId,
    photoId: row.id,
    storageKey: row.storage_key,
    mime: row.mime,
    publicUrl: row.public_url
  });
  res.json({ ok: true, photo: toClient(row), download: desc });
});

/**
 * Authenticated blob PUT.
 * Works for local backend and for S3/R2 (server-side PutObject) —
 * clients may also PUT directly to a presigned upload-url.
 */
router.put('/:photoId/content', requireAuth, requireWeddingMember, async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  if (!bytes.length) {
    res.status(400).json({ error: 'empty_body' });
    return;
  }
  const mime = req.get('content-type') || 'application/octet-stream';
  const desc = await createUploadDescriptor({
    weddingId: req.params.weddingId,
    photoId: req.params.photoId,
    mime,
    ext: extFromMime(mime)
  });
  let put;
  try {
    put = await putObject({ storageKey: desc.storageKey, bytes, mime });
  } catch (e) {
    const code = e.code || 'put_failed';
    res.status(code === 'object_storage_not_configured' ? 503 : 500).json({
      error: code,
      message: e.message,
      hint: e.hint || null,
      storage: storageConfigSummary()
    });
    return;
  }
  const publicUrl = put.publicUrl || desc.publicUrl || publicObjectUrl(desc.storageKey);
  await query(
    `INSERT INTO photos (id, wedding_id, name, mime, size_bytes, storage_key, storage_backend, public_url, kind, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'library',now())
     ON CONFLICT (wedding_id, id) DO UPDATE SET
       mime = EXCLUDED.mime,
       size_bytes = EXCLUDED.size_bytes,
       storage_key = EXCLUDED.storage_key,
       storage_backend = EXCLUDED.storage_backend,
       public_url = COALESCE(EXCLUDED.public_url, photos.public_url),
       updated_at = now()`,
    [
      req.params.photoId,
      req.params.weddingId,
      req.params.photoId,
      mime,
      bytes.length,
      desc.storageKey,
      desc.backend,
      publicUrl
    ]
  );
  res.json({
    ok: true,
    storageKey: desc.storageKey,
    size: bytes.length,
    backend: desc.backend,
    publicUrl,
    storage: storageConfigSummary()
  });
});

router.get('/:photoId/content', requireAuth, requireWeddingMember, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM photos WHERE wedding_id = $1 AND id = $2`,
    [req.params.weddingId, req.params.photoId]
  );
  if (!rows[0] || !rows[0].storage_key) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const row = rows[0];
  // Prefer redirect to stable public URL when available (portal-friendly).
  const pub = row.public_url || publicObjectUrl(row.storage_key);
  if (pub && objectStorageConfigured() && req.query.redirect !== '0') {
    res.redirect(302, pub);
    return;
  }
  try {
    const obj = await getObject({ storageKey: row.storage_key });
    if (!obj) {
      res.status(404).json({ error: 'blob_missing' });
      return;
    }
    res.setHeader('Content-Type', row.mime || obj.mime || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(Buffer.from(obj.bytes));
  } catch (e) {
    res.status(e.code === 'object_storage_not_configured' ? 503 : 500).json({
      error: e.code || 'get_failed',
      message: e.message
    });
  }
});

router.delete('/:photoId', requireAuth, requireWeddingMember, async (req, res) => {
  const { rows } = await query(
    `DELETE FROM photos WHERE wedding_id = $1 AND id = $2 RETURNING *`,
    [req.params.weddingId, req.params.photoId]
  );
  if (rows[0] && rows[0].storage_key) {
    try { await deleteObject({ storageKey: rows[0].storage_key }); } catch (_) { /* best-effort */ }
  }
  res.json({ ok: true, deleted: rows.length > 0, photo: rows[0] ? toClient(rows[0]) : null });
});

export default router;

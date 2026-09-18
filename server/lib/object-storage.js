/**
 * Object storage strategy for online photo binaries.
 * Metadata lives in Postgres (`photos` table). Blobs go here —
 * never as huge base64 columns in Postgres rows.
 *
 * Backends (env PHOTO_STORAGE):
 *   local  — write under PHOTO_LOCAL_DIR (dev / single-node)
 *   s3     — AWS S3 (needs S3_BUCKET + credentials)
 *   r2     — Cloudflare R2 (S3-compatible; R2_* or S3_* env)
 *
 * Presigned upload/download are scaffolded; full SDK wiring comes when
 * FEATURE_PHOTOS is enabled in production and buckets are provisioned.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function env(name, fallback = '') {
  return String(process.env[name] != null ? process.env[name] : fallback).trim();
}

export function photoStorageMode() {
  const mode = env('PHOTO_STORAGE', 'local').toLowerCase();
  if (mode === 's3' || mode === 'r2' || mode === 'local') return mode;
  return 'local';
}

export function objectStorageConfigured() {
  const mode = photoStorageMode();
  if (mode === 'local') return true;
  const bucket = env('S3_BUCKET') || env('R2_BUCKET');
  const key = env('S3_ACCESS_KEY_ID') || env('R2_ACCESS_KEY_ID');
  const secret = env('S3_SECRET_ACCESS_KEY') || env('R2_SECRET_ACCESS_KEY');
  return !!(bucket && key && secret);
}

export function storageConfigSummary() {
  const mode = photoStorageMode();
  return {
    mode,
    configured: objectStorageConfigured(),
    bucket: env('S3_BUCKET') || env('R2_BUCKET') || null,
    region: env('S3_REGION') || env('R2_REGION') || null,
    endpoint: env('S3_ENDPOINT') || env('R2_ENDPOINT') || null,
    localDir: mode === 'local' ? localDir() : null,
    note: mode === 'local'
      ? 'Local disk blob store (dev). Provision S3/R2 for hosted photo backup.'
      : (objectStorageConfigured()
        ? 'Credentials present — use upload-url / download-url routes.'
        : 'Set bucket + access keys to enable hosted object storage.')
  };
}

export function localDir() {
  const raw = env('PHOTO_LOCAL_DIR');
  if (raw) return path.resolve(raw);
  return path.resolve(__dirname, '../.photo-blobs');
}

export function buildStorageKey(weddingId, photoId, ext) {
  const safeExt = String(ext || 'bin').replace(/[^a-z0-9]/gi, '') || 'bin';
  return `weddings/${weddingId}/photos/${photoId}.${safeExt}`;
}

function ensureLocalDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/** Put bytes for local backend. S3/R2 returns not_configured until SDK is wired. */
export async function putObject({ storageKey, bytes, mime }) {
  const mode = photoStorageMode();
  if (mode === 'local') {
    const full = path.join(localDir(), storageKey);
    ensureLocalDir(full);
    fs.writeFileSync(full, Buffer.from(bytes));
    return { backend: 'local', storageKey, bytes: Buffer.byteLength(bytes), mime: mime || null };
  }
  if (!objectStorageConfigured()) {
    const err = new Error('object_storage_not_configured');
    err.code = 'object_storage_not_configured';
    throw err;
  }
  // Scaffold: real @aws-sdk/client-s3 PutObject lands when buckets are provisioned.
  const err = new Error('object_storage_sdk_not_wired');
  err.code = 'object_storage_sdk_not_wired';
  err.hint = 'PHOTO_STORAGE is s3/r2 and credentials exist, but the S3 SDK is not bundled yet. Use local mode or upload via client→presign once wired.';
  throw err;
}

export async function getObject({ storageKey }) {
  const mode = photoStorageMode();
  if (mode === 'local') {
    const full = path.join(localDir(), storageKey);
    if (!fs.existsSync(full)) return null;
    const bytes = fs.readFileSync(full);
    return { backend: 'local', storageKey, bytes };
  }
  if (!objectStorageConfigured()) {
    const err = new Error('object_storage_not_configured');
    err.code = 'object_storage_not_configured';
    throw err;
  }
  const err = new Error('object_storage_sdk_not_wired');
  err.code = 'object_storage_sdk_not_wired';
  throw err;
}

export async function deleteObject({ storageKey }) {
  const mode = photoStorageMode();
  if (mode === 'local') {
    const full = path.join(localDir(), storageKey);
    if (fs.existsSync(full)) fs.unlinkSync(full);
    return { backend: 'local', storageKey, deleted: true };
  }
  if (!objectStorageConfigured()) {
    return { backend: mode, storageKey, deleted: false, reason: 'not_configured' };
  }
  return { backend: mode, storageKey, deleted: false, reason: 'sdk_not_wired' };
}

/**
 * Return a strategy object the client can use. Local mode returns an API PUT
 * path; s3/r2 returns a placeholder for a future presigned URL.
 */
export function createUploadDescriptor({ weddingId, photoId, mime, ext }) {
  const mode = photoStorageMode();
  const storageKey = buildStorageKey(weddingId, photoId, ext);
  if (mode === 'local') {
    return {
      backend: 'local',
      storageKey,
      method: 'PUT',
      url: `/weddings/${weddingId}/photos/${encodeURIComponent(photoId)}/content`,
      headers: { 'Content-Type': mime || 'application/octet-stream' },
      expiresAt: null
    };
  }
  const configured = objectStorageConfigured();
  return {
    backend: mode,
    storageKey,
    method: 'PUT',
    url: null,
    configured,
    placeholder: true,
    message: configured
      ? 'Presigned S3/R2 upload URL scaffolding — wire AWS SDK PutObject / getSignedUrl when provisioning the bucket.'
      : 'Set S3_BUCKET (or R2_BUCKET) + access keys. See docs/BACKUP_AND_PHOTOS.md.',
    // Echo env shape (no secrets) so operators can verify config.
    target: {
      bucket: env('S3_BUCKET') || env('R2_BUCKET') || null,
      region: env('S3_REGION') || env('R2_REGION') || null,
      endpoint: env('S3_ENDPOINT') || env('R2_ENDPOINT') || null
    },
    expiresAt: null
  };
}

export function createDownloadDescriptor({ weddingId, photoId, storageKey, mime }) {
  const mode = photoStorageMode();
  if (mode === 'local') {
    return {
      backend: 'local',
      storageKey,
      method: 'GET',
      url: `/weddings/${weddingId}/photos/${encodeURIComponent(photoId)}/content`,
      headers: mime ? { Accept: mime } : {},
      expiresAt: null
    };
  }
  return {
    backend: mode,
    storageKey,
    method: 'GET',
    url: null,
    configured: objectStorageConfigured(),
    placeholder: true,
    message: 'Presigned download URL scaffolding — wire getSignedUrl when S3/R2 is provisioned.'
  };
}

export function newPhotoId() {
  return crypto.randomUUID();
}

/**
 * Object storage for online photo binaries (AWS S3 or Cloudflare R2).
 * Metadata lives in Postgres (`photos` table). Blobs go here —
 * never as huge base64 columns in Postgres rows.
 *
 * Backends (env PHOTO_STORAGE):
 *   local  — write under PHOTO_LOCAL_DIR (dev / single-node); default
 *   s3     — AWS S3 (S3_BUCKET + credentials + optional S3_PUBLIC_BASE_URL)
 *   r2     — Cloudflare R2 (S3-compatible; R2_* or S3_* env)
 *
 * IndexedDB on the client remains the offline path. Object storage is
 * optional cloud when configured — setup/status reports
 * objectStorageConfigured: false until bucket + keys are set.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function env(name, fallback = '') {
  return String(process.env[name] != null ? process.env[name] : fallback).trim();
}

export function photoStorageMode() {
  const mode = env('PHOTO_STORAGE', 'local').toLowerCase();
  if (mode === 's3' || mode === 'r2' || mode === 'local') return mode;
  return 'local';
}

/** True only when PHOTO_STORAGE is s3|r2 and bucket + access keys are present. */
export function objectStorageConfigured() {
  const mode = photoStorageMode();
  if (mode !== 's3' && mode !== 'r2') return false;
  const bucket = env('S3_BUCKET') || env('R2_BUCKET');
  const key = env('S3_ACCESS_KEY_ID') || env('R2_ACCESS_KEY_ID');
  const secret = env('S3_SECRET_ACCESS_KEY') || env('R2_SECRET_ACCESS_KEY');
  return !!(bucket && key && secret);
}

export function objectPublicBaseUrl() {
  const raw = env('S3_PUBLIC_BASE_URL') || env('R2_PUBLIC_BASE_URL') || env('PHOTO_PUBLIC_BASE_URL');
  return raw.replace(/\/$/, '');
}

export function storageBucket() {
  return env('S3_BUCKET') || env('R2_BUCKET') || null;
}

export function storageRegion() {
  return env('S3_REGION') || env('R2_REGION') || (photoStorageMode() === 'r2' ? 'auto' : 'us-east-1');
}

export function storageEndpoint() {
  return env('S3_ENDPOINT') || env('R2_ENDPOINT') || null;
}

let _s3Client = null;

function s3Client() {
  if (_s3Client) return _s3Client;
  if (!objectStorageConfigured()) return null;
  const endpoint = storageEndpoint();
  const accessKeyId = env('S3_ACCESS_KEY_ID') || env('R2_ACCESS_KEY_ID');
  const secretAccessKey = env('S3_SECRET_ACCESS_KEY') || env('R2_SECRET_ACCESS_KEY');
  _s3Client = new S3Client({
    region: storageRegion(),
    endpoint: endpoint || undefined,
    forcePathStyle: !!endpoint,
    credentials: { accessKeyId, secretAccessKey }
  });
  return _s3Client;
}

/** Build stable HTTPS URL for a key when a public/CDN base is configured. */
export function publicObjectUrl(storageKey) {
  const base = objectPublicBaseUrl();
  if (!base || !storageKey) return null;
  const key = String(storageKey).replace(/^\/+/, '');
  return `${base}/${key}`;
}

export function storageConfigSummary() {
  const mode = photoStorageMode();
  const configured = objectStorageConfigured();
  const publicBase = objectPublicBaseUrl() || null;
  return {
    mode,
    configured,
    objectStorageConfigured: configured,
    bucket: storageBucket(),
    region: storageRegion() || null,
    endpoint: storageEndpoint(),
    publicBaseUrl: publicBase,
    publicBaseConfigured: !!publicBase,
    localDir: mode === 'local' ? localDir() : null,
    note: mode === 'local'
      ? 'Local disk / client IndexedDB offline path. Set PHOTO_STORAGE=s3|r2 + bucket + keys for hosted portal hero / packet assets.'
      : (configured
        ? (publicBase
          ? 'Object storage ready — uploads return HTTPS public URLs for portal hero / packet images.'
          : 'Credentials present — uploads work; set S3_PUBLIC_BASE_URL (or R2_PUBLIC_BASE_URL) for stable public HTTPS URLs.')
        : 'Set PHOTO_STORAGE=s3|r2 plus bucket + access keys. See docs/BACKUP_AND_PHOTOS.md.')
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

async function streamToBuffer(body) {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body.transformToByteArray === 'function') {
    return Buffer.from(await body.transformToByteArray());
  }
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Put bytes — local disk or S3/R2 PutObject. */
export async function putObject({ storageKey, bytes, mime }) {
  const mode = photoStorageMode();
  const buf = Buffer.from(bytes);
  if (mode === 'local') {
    const full = path.join(localDir(), storageKey);
    ensureLocalDir(full);
    fs.writeFileSync(full, buf);
    return {
      backend: 'local',
      storageKey,
      bytes: buf.length,
      mime: mime || null,
      publicUrl: null
    };
  }
  if (!objectStorageConfigured()) {
    const err = new Error('object_storage_not_configured');
    err.code = 'object_storage_not_configured';
    throw err;
  }
  const client = s3Client();
  await client.send(new PutObjectCommand({
    Bucket: storageBucket(),
    Key: storageKey,
    Body: buf,
    ContentType: mime || 'application/octet-stream'
    // No ACL — private bucket + public CDN/custom domain, or signed URLs.
  }));
  return {
    backend: mode,
    storageKey,
    bytes: buf.length,
    mime: mime || null,
    publicUrl: publicObjectUrl(storageKey)
  };
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
  const client = s3Client();
  try {
    const out = await client.send(new GetObjectCommand({
      Bucket: storageBucket(),
      Key: storageKey
    }));
    const bytes = await streamToBuffer(out.Body);
    return {
      backend: mode,
      storageKey,
      bytes,
      mime: out.ContentType || null
    };
  } catch (e) {
    if (e && (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404)) {
      return null;
    }
    throw e;
  }
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
  const client = s3Client();
  await client.send(new DeleteObjectCommand({
    Bucket: storageBucket(),
    Key: storageKey
  }));
  return { backend: mode, storageKey, deleted: true };
}

const PRESIGN_TTL_SEC = 15 * 60;

/**
 * Upload strategy for the client.
 * Local → authenticated API PUT path.
 * S3/R2 configured → presigned PUT (+ publicUrl when CDN base set).
 */
export async function createUploadDescriptor({ weddingId, photoId, mime, ext }) {
  const mode = photoStorageMode();
  const storageKey = buildStorageKey(weddingId, photoId, ext);
  if (mode === 'local') {
    return {
      backend: 'local',
      storageKey,
      method: 'PUT',
      url: `/weddings/${weddingId}/photos/${encodeURIComponent(photoId)}/content`,
      headers: { 'Content-Type': mime || 'application/octet-stream' },
      publicUrl: null,
      expiresAt: null
    };
  }
  const configured = objectStorageConfigured();
  if (!configured) {
    return {
      backend: mode,
      storageKey,
      method: 'PUT',
      url: null,
      configured: false,
      publicUrl: null,
      message: 'Set PHOTO_STORAGE=s3|r2 + S3_BUCKET (or R2_BUCKET) + access keys. See docs/BACKUP_AND_PHOTOS.md.',
      target: {
        bucket: storageBucket(),
        region: storageRegion(),
        endpoint: storageEndpoint(),
        publicBaseUrl: objectPublicBaseUrl() || null
      },
      expiresAt: null
    };
  }
  const client = s3Client();
  const command = new PutObjectCommand({
    Bucket: storageBucket(),
    Key: storageKey,
    ContentType: mime || 'application/octet-stream'
  });
  const url = await getSignedUrl(client, command, { expiresIn: PRESIGN_TTL_SEC });
  const expiresAt = new Date(Date.now() + PRESIGN_TTL_SEC * 1000).toISOString();
  return {
    backend: mode,
    storageKey,
    method: 'PUT',
    url,
    headers: { 'Content-Type': mime || 'application/octet-stream' },
    configured: true,
    publicUrl: publicObjectUrl(storageKey),
    expiresAt
  };
}

export async function createDownloadDescriptor({ weddingId, photoId, storageKey, mime, publicUrl }) {
  const mode = photoStorageMode();
  if (mode === 'local') {
    return {
      backend: 'local',
      storageKey,
      method: 'GET',
      url: `/weddings/${weddingId}/photos/${encodeURIComponent(photoId)}/content`,
      headers: mime ? { Accept: mime } : {},
      publicUrl: null,
      expiresAt: null
    };
  }
  // Prefer stable public/CDN URL when configured (portal hero / packet assets).
  const stable = publicUrl || publicObjectUrl(storageKey);
  if (stable) {
    return {
      backend: mode,
      storageKey,
      method: 'GET',
      url: stable,
      publicUrl: stable,
      headers: {},
      expiresAt: null
    };
  }
  if (!objectStorageConfigured() || !storageKey) {
    return {
      backend: mode,
      storageKey,
      method: 'GET',
      url: null,
      configured: objectStorageConfigured(),
      publicUrl: null,
      message: 'No public base URL — set S3_PUBLIC_BASE_URL / R2_PUBLIC_BASE_URL, or use a signed download.',
      expiresAt: null
    };
  }
  const client = s3Client();
  const command = new GetObjectCommand({
    Bucket: storageBucket(),
    Key: storageKey
  });
  const url = await getSignedUrl(client, command, { expiresIn: PRESIGN_TTL_SEC });
  return {
    backend: mode,
    storageKey,
    method: 'GET',
    url,
    publicUrl: null,
    headers: mime ? { Accept: mime } : {},
    expiresAt: new Date(Date.now() + PRESIGN_TTL_SEC * 1000).toISOString()
  };
}

export function newPhotoId() {
  return crypto.randomUUID();
}

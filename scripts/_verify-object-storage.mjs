#!/usr/bin/env node
/**
 * Verify S3/R2 object-storage foundation (polish #2).
 * Scaffold checks always; live API checks when up; S3 PutObject mocked/skipped without credentials.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const issues = [];
function ok(label, cond) {
  if (!cond) issues.push(label);
}

const objStore = read('server/lib/object-storage.js');
ok('objectStorageConfigured export', /export function objectStorageConfigured/.test(objStore));
ok('photoStorageMode export', /export function photoStorageMode/.test(objStore));
ok('AWS SDK PutObject import', /PutObjectCommand/.test(objStore));
ok('presigner import', /getSignedUrl/.test(objStore));
ok('S3_PUBLIC_BASE_URL / R2_PUBLIC_BASE_URL', /S3_PUBLIC_BASE_URL/.test(objStore) && /R2_PUBLIC_BASE_URL/.test(objStore));
ok('publicObjectUrl helper', /export function publicObjectUrl/.test(objStore));
ok('local mode default path', /PHOTO_STORAGE/.test(objStore) && /local/.test(objStore));

const pkg = JSON.parse(read('server/package.json'));
ok('server depends on @aws-sdk/client-s3', !!(pkg.dependencies && pkg.dependencies['@aws-sdk/client-s3']));
ok('server depends on s3-request-presigner', !!(pkg.dependencies && pkg.dependencies['@aws-sdk/s3-request-presigner']));

const schema = read('server/schema.sql');
ok('photos.public_url column', /public_url/.test(schema));

const photos = read('server/routes/photos.js');
ok('photos return publicUrl', /publicUrl/.test(photos));
ok('upload-url async', /await createUploadDescriptor/.test(photos));

const indexJs = read('server/index.js');
ok('setup/status objectStorageConfigured', /objectStorageConfigured/.test(indexJs));
ok('setup enables portalHeroPhotos', /portalHeroPhotos/.test(indexJs));

const portal = read('server/routes/portal.js');
ok('portal resolveAssetUrl', /resolveAssetUrl/.test(portal));
ok('portal hero from photo id', /heroPhotoId|resolveAssetUrl/.test(portal));

const vendor = read('server/routes/vendor-portal.js');
ok('vendor packetImageUrl', /packetImageUrl/.test(vendor));

const cloud = read('js/cloud-sync.js');
ok('client uploadPhoto', /function uploadPhoto/.test(cloud));
ok('client photosStorage', /function photosStorage/.test(cloud));
ok('fetchSetupStatus objectStorageConfigured', /objectStorageConfigured/.test(cloud));

const settings = read('js/settings-window-redesign.js');
ok('settings checklist S3/R2 step', /S3 \/ R2 object storage|objectStorageConfigured/.test(settings));
ok('settings Use as portal hero', /rdPhotoUsePortalHero/.test(settings));
ok('vendor packet image field', /rd-vp-packet-image/.test(settings));

const photoStore = read('js/photo-store.js');
ok('photo-store optional cloud upload', /uploadPhoto/.test(photoStore));

const envEx = read('server/.env.example');
const envProd = read('server/.env.production.example');
ok('env example S3_PUBLIC_BASE_URL', /S3_PUBLIC_BASE_URL/.test(envEx));
ok('env prod R2_PUBLIC_BASE_URL', /R2_PUBLIC_BASE_URL/.test(envProd));

const docs = read('docs/BACKUP_AND_PHOTOS.md');
ok('docs polish #2 object storage', /objectStorageConfigured|S3_PUBLIC_BASE_URL/.test(docs));
ok('docs no public listing', /no public listing/i.test(docs));

const roadmap = read('docs/PRODUCT_ROADMAP.md');
ok('roadmap S3/R2 shipped or status', /S3\/R2|object.storage/i.test(roadmap));

// Unit: configured=false without credentials (default env)
const mod = await import(pathToFileURL(path.join(root, 'server/lib/object-storage.js')).href);
ok('default mode local', mod.photoStorageMode() === 'local');
ok('default objectStorageConfigured false', mod.objectStorageConfigured() === false);
const summary = mod.storageConfigSummary();
ok('summary objectStorageConfigured false', summary.objectStorageConfigured === false);
ok('summary.configured false when local', summary.configured === false);

// Optional live API — skip soft if down
const API = process.env.COVENANT_CLOUD_API || 'http://127.0.0.1:18787';
async function live() {
  let health;
  try {
    const res = await fetch(API + '/health');
    health = await res.json();
  } catch {
    console.log('object-storage verify: API not reachable at ' + API + ' — scaffold + unit only.');
    return;
  }
  ok('health has objectStorageConfigured', typeof health.objectStorageConfigured === 'boolean'
    || typeof health.features?.objectStorageConfigured === 'boolean');

  const setupRes = await fetch(API + '/setup/status');
  const setup = await setupRes.json();
  ok('setup/status objectStorageConfigured boolean', typeof setup.objectStorageConfigured === 'boolean');
  // Without operator credentials, expect false
  if (!process.env.S3_BUCKET && !process.env.R2_BUCKET) {
    ok('setup objectStorageConfigured false without creds', setup.objectStorageConfigured === false);
  }
  const raw = JSON.stringify(setup);
  ok('setup no S3_SECRET in payload', !/"S3_SECRET_ACCESS_KEY"\s*:/.test(raw));
  ok('setup no R2_SECRET in payload', !/"R2_SECRET_ACCESS_KEY"\s*:/.test(raw));
}

await live();

if (issues.length) {
  console.error('object-storage verify FAILED:');
  issues.forEach((i) => console.error(' -', i));
  process.exit(1);
}
console.log('object-storage verify ok (scaffold, unit configured=false, docs, optional live)');

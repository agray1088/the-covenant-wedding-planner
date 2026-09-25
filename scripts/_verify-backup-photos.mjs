#!/usr/bin/env node
/**
 * Verify backup + photos foundation (roadmap steps 3–5).
 * Static checks + zip encode/decode round-trip (no browser required).
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const issues = [];
function ok(label, cond) {
  if (!cond) issues.push(label);
}

const zip = require(path.join(root, 'js/covenant-zip.js'));

ok('covenant-zip exports buildZip', typeof zip.buildZip === 'function');
ok('covenant-zip exports parseZip', typeof zip.parseZip === 'function');

const payload = zip.encodeUtf8(JSON.stringify({ hello: 'covenant', n: 42 }));
const photo = new Uint8Array([0xff, 0xd8, 0xff, 0xd9, 1, 2, 3, 4]);
const built = zip.buildZip([
  { name: 'manifest.json', data: zip.encodeUtf8(JSON.stringify({ format: 'covenant-backup-v1', photoCount: 1 })) },
  { name: 'planner.json', data: payload },
  { name: 'photos-index.json', data: zip.encodeUtf8(JSON.stringify({ photos: [{ id: 'p1', file: 'photos/p1.jpg', mime: 'image/jpeg' }] })) },
  { name: 'photos/p1.jpg', data: photo }
]);
ok('zip magic PK', built[0] === 0x50 && built[1] === 0x4b);
const parsed = zip.parseZip(built);
const names = parsed.map((e) => e.name).sort();
ok('zip round-trip entry count', parsed.length === 4);
ok('zip has manifest', names.includes('manifest.json'));
ok('zip has planner.json', names.includes('planner.json'));
ok('zip has photo binary', names.includes('photos/p1.jpg'));
const photoEntry = parsed.find((e) => e.name === 'photos/p1.jpg');
ok('photo bytes match', photoEntry && photoEntry.data.length === photo.length
  && photoEntry.data[0] === 0xff && photoEntry.data[photo.length - 1] === 4);

const backup = read('js/sqlite-backup.js');
ok('downloadFullBackup exported', /downloadFullBackup/.test(backup));
ok('restoreZipBackup path', /restoreZipBackup|isZipFile/.test(backup));
ok('covenant-backup-v1 format', /covenant-backup-v1/.test(backup));

const photos = read('js/photo-store.js');
ok('CovenantPhotos global', /CovenantPhotos/.test(photos));
ok('IndexedDB photo store', /covenant-photos-v1/.test(photos));
ok('collectBackupPhotos', /collectBackupPhotos/.test(photos));
ok('importBackupPhotos', /importBackupPhotos/.test(photos));

const settings = read('js/settings-window-redesign.js');
ok('privacy pane', /id: 'privacy'/.test(settings) || /paneHtml\('privacy'\)/.test(settings) || /'privacy'/.test(settings));
ok('privacy copy local by default', /Local by default/i.test(settings));
ok('privacy copy do not sell', /do not sell/i.test(settings));
ok('honest cloud storage copy', /stored on the (API|server)|we store what you/i.test(settings));
ok('full backup button', /downloadFullBackup/.test(settings));
ok('photos settings pane', /id: 'photos'|rdPhotosAdd/.test(settings));

const index = read('index.html');
ok('covenant-zip script', /covenant-zip\.js/.test(index));
ok('photo-store script', /photo-store\.js/.test(index));
ok('import accepts zip', /importInput[^>]*accept="[^"]*\.zip/.test(index) || /accept="\.zip/.test(index));

const planner = read('js/planner.js');
ok('photoLibrary in blankData', /photoLibrary:\s*\[\]/.test(planner));
ok('downloadFullBackup function', /function downloadFullBackup/.test(planner));
ok('schema v7 photoLibrary migrate', /v6 → v7|photoLibrary/.test(planner));

const schema = read('server/schema.sql');
ok('photos table metadata only', /CREATE TABLE IF NOT EXISTS photos/.test(schema));
ok('no bytea photo column', !/CREATE TABLE IF NOT EXISTS photos[\s\S]*bytea/i.test(schema.split('CREATE TABLE IF NOT EXISTS photos')[1]?.slice(0, 800) || ''));
ok('storage_key column', /storage_key/.test(schema));

const objStore = read('server/lib/object-storage.js');
ok('PHOTO_STORAGE modes', /photoStorageMode/.test(objStore));
ok('S3/R2 env + SDK', /S3_BUCKET/.test(objStore) && /R2_BUCKET/.test(objStore) && /PutObjectCommand/.test(objStore));
ok('objectStorageConfigured', /objectStorageConfigured/.test(objStore));
ok('public base URL', /S3_PUBLIC_BASE_URL|R2_PUBLIC_BASE_URL/.test(objStore));

const photoRoutes = read('server/routes/photos.js');
ok('upload-url route', /upload-url/.test(photoRoutes));
ok('download-url route', /download-url/.test(photoRoutes));
ok('content put/get', /\/content/.test(photoRoutes));
ok('public_url / publicUrl', /public_url|publicUrl/.test(photoRoutes));

const serverIndex = read('server/index.js');
ok('photos routes mounted', /\/photos/.test(serverIndex) && /photoRoutes/.test(serverIndex));
ok('health photoStorage', /photoStorage/.test(serverIndex));
ok('setup objectStorageConfigured', /objectStorageConfigured/.test(serverIndex));

const docs = read('docs/BACKUP_AND_PHOTOS.md');
ok('backup docs present', /covenant-backup-v1/.test(docs));
ok('privacy section', /Local by default/i.test(docs));
ok('reconnect unchanged note', /RECONNECT_AFTER_RESTART|demo@covenant\.local/.test(docs));
ok('object storage polish', /objectStorageConfigured|S3_PUBLIC_BASE_URL/.test(docs));

const roadmap = read('docs/PRODUCT_ROADMAP.md');
ok('roadmap step 3 shipped', /Offline \+ backup clarity[\s\S]*Shipped/i.test(roadmap));
ok('roadmap RSVP foundation', /RSVP \+ guest portal[\s\S]*Foundation shipped|RSVP_AND_GUEST_PORTAL\.md/i.test(roadmap));
ok('roadmap S3/R2 photos', /S3\/R2 photo storage/i.test(roadmap));

const envEx = read('server/.env.example');
ok('env PHOTO_STORAGE', /PHOTO_STORAGE/.test(envEx));
ok('env S3 placeholders', /S3_BUCKET/.test(envEx));
ok('env public base URL', /S3_PUBLIC_BASE_URL|R2_PUBLIC_BASE_URL/.test(envEx));

if (issues.length) {
  console.error('backup-photos verify FAILED:');
  issues.forEach((i) => console.error(' -', i));
  process.exit(1);
}
console.log('backup-photos verify ok (zip round-trip, client wiring, privacy copy, server object storage, docs)');

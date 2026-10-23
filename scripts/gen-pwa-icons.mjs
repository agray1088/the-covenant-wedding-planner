/* Generates PWA icons (gold "C" ring monogram on forest green) with zero deps.
   Usage: node scripts/gen-pwa-icons.mjs   -> assets/icons/*.png */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons');
const BG = [0x2d, 0x4a, 0x3e], GOLD = [0xc9, 0xa9, 0x6e];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pix) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    pix.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

/* radius = outer ring radius as fraction of size (maskable keeps it inside the 80% safe zone) */
function render(size, radius) {
  const SS = 4, pix = Buffer.alloc(size * size * 3);
  const R = radius * size, r = R * 0.74, cx = size / 2, cy = size / 2;
  const gap = Math.PI / 3.4; // opening on the right makes the "C"
  const cap = (R - r) / 2, mid = (R + r) / 2;
  const capPts = [gap, -gap].map((a) => [cx + mid * Math.cos(a), cy + mid * Math.sin(a)]);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let hit = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px = x + (sx + 0.5) / SS - cx, py = y + (sy + 0.5) / SS - cy;
      const d = Math.hypot(px, py), a = Math.atan2(py, px);
      let on = d <= R && d >= r && Math.abs(a) >= gap;
      if (!on) on = capPts.some(([qx, qy]) => Math.hypot(px + cx - qx, py + cy - qy) <= cap);
      if (on) hit++;
    }
    const t = hit / (SS * SS), i = (y * size + x) * 3;
    for (let c = 0; c < 3; c++) pix[i + c] = Math.round(BG[c] * (1 - t) + GOLD[c] * t);
  }
  return pix;
}

fs.mkdirSync(OUT, { recursive: true });
const jobs = [
  ['icon-192.png', 192, 0.34], ['icon-512.png', 512, 0.34],
  ['icon-maskable-192.png', 192, 0.28], ['icon-maskable-512.png', 512, 0.28],
  ['apple-touch-icon.png', 180, 0.30]
];
for (const [name, size, rad] of jobs) {
  const buf = png(size, render(size, rad));
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(name, buf.length, 'bytes');
}

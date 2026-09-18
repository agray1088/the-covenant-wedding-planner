/* ============================================================
   covenant-zip.js — minimal STORE-only ZIP encode/decode
   ------------------------------------------------------------
   Used for full planner backups that bundle planner.sqlite +
   photo blobs. No compression dependency (method 0 / store).
   Works in browser (window.CovenantZip) and Node (module.exports).
   ============================================================ */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) root.CovenantZip = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function () {
  'use strict';

  function u16(n) {
    return [(n) & 0xff, (n >>> 8) & 0xff];
  }
  function u32(n) {
    return [(n) & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  }
  function concatBytes(parts) {
    var total = 0;
    for (var i = 0; i < parts.length; i++) total += parts[i].length;
    var out = new Uint8Array(total);
    var off = 0;
    for (var j = 0; j < parts.length; j++) {
      out.set(parts[j], off);
      off += parts[j].length;
    }
    return out;
  }
  function crc32(bytes) {
    var table = crc32._t;
    if (!table) {
      table = new Uint32Array(256);
      for (var i = 0; i < 256; i++) {
        var c = i;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c >>> 0;
      }
      crc32._t = table;
    }
    var crc = 0xffffffff;
    for (var j = 0; j < bytes.length; j++) {
      crc = table[(crc ^ bytes[j]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function encodeUtf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    return new Uint8Array(out);
  }
  function decodeUtf8(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
  }

  /** @param {{name:string, data:Uint8Array}[]} entries */
  function buildZip(entries) {
    var localParts = [];
    var centralParts = [];
    var offset = 0;
    var count = 0;
    for (var i = 0; i < entries.length; i++) {
      var name = String(entries[i].name || '').replace(/^\/+/, '');
      if (!name) continue;
      var data = entries[i].data instanceof Uint8Array ? entries[i].data : new Uint8Array(entries[i].data || []);
      var nameBytes = encodeUtf8(name);
      var crc = crc32(data);
      var local = concatBytes([
        new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
        new Uint8Array(u16(20)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u32(crc)),
        new Uint8Array(u32(data.length)),
        new Uint8Array(u32(data.length)),
        new Uint8Array(u16(nameBytes.length)),
        new Uint8Array(u16(0)),
        nameBytes,
        data
      ]);
      var central = concatBytes([
        new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
        new Uint8Array(u16(20)),
        new Uint8Array(u16(20)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u32(crc)),
        new Uint8Array(u32(data.length)),
        new Uint8Array(u32(data.length)),
        new Uint8Array(u16(nameBytes.length)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u32(0)),
        new Uint8Array(u32(offset)),
        nameBytes
      ]);
      localParts.push(local);
      centralParts.push(central);
      offset += local.length;
      count++;
    }
    var centralDir = concatBytes(centralParts);
    var end = concatBytes([
      new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
      new Uint8Array(u16(0)),
      new Uint8Array(u16(0)),
      new Uint8Array(u16(count)),
      new Uint8Array(u16(count)),
      new Uint8Array(u32(centralDir.length)),
      new Uint8Array(u32(offset)),
      new Uint8Array(u16(0))
    ]);
    return concatBytes(localParts.concat([centralDir, end]));
  }

  function readU16(view, off) { return view[off] | (view[off + 1] << 8); }
  function readU32(view, off) {
    return (view[off] | (view[off + 1] << 8) | (view[off + 2] << 16) | (view[off + 3] << 24)) >>> 0;
  }

  /** @returns {{name:string, data:Uint8Array}[]} */
  function parseZip(buffer) {
    var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var entries = [];
    var i = 0;
    while (i + 30 <= bytes.length) {
      if (readU32(bytes, i) !== 0x04034b50) break;
      var nameLen = readU16(bytes, i + 26);
      var extraLen = readU16(bytes, i + 28);
      var compSize = readU32(bytes, i + 18);
      var method = readU16(bytes, i + 8);
      var nameStart = i + 30;
      var name = decodeUtf8(bytes.subarray(nameStart, nameStart + nameLen));
      var dataStart = nameStart + nameLen + extraLen;
      var data = bytes.subarray(dataStart, dataStart + compSize);
      if (method === 0) {
        entries.push({ name: name, data: new Uint8Array(data) });
      } else {
        throw new Error('ZIP entry "' + name + '" uses compression method ' + method + '; only store (0) is supported.');
      }
      i = dataStart + compSize;
    }
    return entries;
  }

  function downloadBytes(bytes, filename, mime) {
    var blob = new Blob([bytes], { type: mime || 'application/zip' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    buildZip: buildZip,
    parseZip: parseZip,
    crc32: crc32,
    encodeUtf8: encodeUtf8,
    decodeUtf8: decodeUtf8,
    downloadBytes: typeof document !== 'undefined' ? downloadBytes : undefined
  };
});

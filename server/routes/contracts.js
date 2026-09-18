import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Cap embedded file payloads so bulk sync stays under express JSON limits. */
const MAX_EMBEDDED_FILE_CHARS = 4096;

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function trimEmbedded(str) {
  if (str == null) return null;
  const s = String(str);
  if (!s) return '';
  if (s.length > MAX_EMBEDDED_FILE_CHARS && /^data:/i.test(s)) return null;
  if (s.length > MAX_EMBEDDED_FILE_CHARS) return s.slice(0, MAX_EMBEDDED_FILE_CHARS);
  return s;
}

function fileFromClient(raw) {
  if (raw == null || raw === false) return null;
  if (typeof raw === 'string') {
    const img = trimEmbedded(raw);
    return img ? { name: 'Attachment', type: 'file', img } : { name: 'Attachment', type: 'file' };
  }
  if (typeof raw !== 'object') return null;
  const out = {
    name: raw.name != null ? String(raw.name) : 'Attachment',
    type: raw.type != null ? String(raw.type) : 'file'
  };
  const img = trimEmbedded(raw.img);
  if (img) out.img = img;
  return out;
}

function filesFromClient(c = {}) {
  const files = {};
  if (c.contractFile != null) files.contractFile = fileFromClient(c.contractFile);
  if (c.invoiceFile != null) files.invoiceFile = fileFromClient(c.invoiceFile);
  if (c.files && typeof c.files === 'object' && !Array.isArray(c.files)) {
    if (c.files.contractFile != null && files.contractFile == null) {
      files.contractFile = fileFromClient(c.files.contractFile);
    }
    if (c.files.invoiceFile != null && files.invoiceFile == null) {
      files.invoiceFile = fileFromClient(c.files.invoiceFile);
    }
  }
  // Legacy planner snapshot field — only keep short / non-data-URL values.
  const legacyImg = trimEmbedded(c.img);
  if (legacyImg) files.img = legacyImg;
  return files;
}

function fromClient(c = {}) {
  const id = String(c.id || c._id || '').trim();
  const updatedAt = c.updatedAt || c.updated_at || new Date().toISOString();
  const total = num(c.total);
  const amount = num(c.amount);
  return {
    id,
    name: c.name ?? '',
    vendor: c.vendor ?? null,
    vendor_id: c.vendorId ?? c.vendor_id ?? null,
    doc_type: c.type ?? c.doc_type ?? c.docType ?? null,
    doc_date: c.date ?? c.doc_date ?? c.docDate ?? null,
    amount: amount != null ? amount : total,
    total: total != null ? total : amount,
    deposit: num(c.deposit),
    status: c.status ?? null,
    location: c.where ?? c.location ?? null,
    notes: c.notes ?? null,
    files_json: filesFromClient(c),
    updated_at: updatedAt
  };
}

function toClient(row) {
  const id = row.id;
  const files = (row.files_json && typeof row.files_json === 'object' && !Array.isArray(row.files_json))
    ? row.files_json
    : {};
  const amount = row.amount != null ? Number(row.amount) : 0;
  const total = row.total != null ? Number(row.total) : amount;
  const out = {
    id,
    _id: id,
    name: row.name || '',
    vendor: row.vendor || '',
    vendorId: row.vendor_id || '',
    type: row.doc_type || 'Contract',
    date: row.doc_date || '',
    amount,
    total,
    deposit: row.deposit != null ? Number(row.deposit) : 0,
    status: row.status || 'Not Signed',
    where: row.location || '',
    notes: row.notes || '',
    contractFile: files.contractFile != null ? files.contractFile : null,
    invoiceFile: files.invoiceFile != null ? files.invoiceFile : null,
    img: typeof files.img === 'string' ? files.img : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
  return out;
}

const UPSERT_SQL = `
  INSERT INTO contracts (
    id, wedding_id, name, vendor, vendor_id, doc_type, doc_date,
    amount, total, deposit, status, location, notes, files_json, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::timestamptz
  )
  ON CONFLICT (wedding_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    vendor = EXCLUDED.vendor,
    vendor_id = EXCLUDED.vendor_id,
    doc_type = EXCLUDED.doc_type,
    doc_date = EXCLUDED.doc_date,
    amount = EXCLUDED.amount,
    total = EXCLUDED.total,
    deposit = EXCLUDED.deposit,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    notes = EXCLUDED.notes,
    files_json = EXCLUDED.files_json,
    updated_at = EXCLUDED.updated_at
  WHERE contracts.updated_at <= EXCLUDED.updated_at
  RETURNING *`;

function upsertParams(contract, weddingId) {
  return [
    contract.id, weddingId, contract.name, contract.vendor, contract.vendor_id,
    contract.doc_type, contract.doc_date, contract.amount, contract.total, contract.deposit,
    contract.status, contract.location, contract.notes,
    JSON.stringify(contract.files_json || {}), contract.updated_at
  ];
}

async function upsertContract(contract, weddingId) {
  const { rows } = await query(UPSERT_SQL, upsertParams(contract, weddingId));
  let row = rows[0];
  if (!row) {
    const cur = await query(
      `SELECT * FROM contracts WHERE wedding_id = $1 AND id = $2`,
      [weddingId, contract.id]
    );
    row = cur.rows[0];
    if (!row) {
      const forced = await query(
        `INSERT INTO contracts (
          id, wedding_id, name, vendor, vendor_id, doc_type, doc_date,
          amount, total, deposit, status, location, notes, files_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::timestamptz
        ) RETURNING *`,
        upsertParams(contract, weddingId)
      );
      row = forced.rows[0];
      return { row, ack: true };
    }
    return { row, ack: false, reason: 'server_newer' };
  }
  return { row, ack: true };
}

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM contracts WHERE wedding_id = $1 ORDER BY doc_date ASC NULLS LAST, name ASC, id ASC`,
      [req.params.weddingId]
    );
    res.json({ contracts: rows.map(toClient), serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.put('/:contractId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const contract = fromClient({ ...req.body, id: req.params.contractId });
    if (!contract.id) {
      res.status(400).json({ error: 'invalid', message: 'Contract id required.' });
      return;
    }
    if (!contract.name) contract.name = contract.vendor || 'Contract';
    const result = await upsertContract(contract, req.params.weddingId);
    if (!result.ack) {
      res.json({ contract: toClient(result.row), ack: false, reason: result.reason || 'server_newer' });
      return;
    }
    res.json({ contract: toClient(result.row), ack: true });
  } catch (e) {
    next(e);
  }
});

router.post('/bulk', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const weddingId = req.params.weddingId;
    const list = Array.isArray(req.body?.contracts) ? req.body.contracts : [];
    const results = [];
    for (const raw of list) {
      const contract = fromClient(raw);
      if (!contract.id) {
        contract.id = `con_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      }
      if (!contract.name) contract.name = contract.vendor || 'Contract';
      const result = await upsertContract(contract, weddingId);
      results.push({
        contract: toClient(result.row),
        ack: result.ack,
        reason: result.ack ? undefined : (result.reason || 'server_newer')
      });
    }
    await query(`UPDATE weddings SET updated_at = now() WHERE id = $1`, [weddingId]);
    res.json({ results, serverTime: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.delete('/:contractId', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    await query(`DELETE FROM contracts WHERE wedding_id = $1 AND id = $2`, [
      req.params.weddingId,
      req.params.contractId
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

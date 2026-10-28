import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth, requireWeddingMember } from '../lib/auth.js';

const router = Router({ mergeParams: true });

/** Normalize planner print-override objects into one wedding-scoped blob. */
function overridesFromClient(body = {}) {
  const nested = (body.packetOverrides && typeof body.packetOverrides === 'object'
    && !Array.isArray(body.packetOverrides))
    ? body.packetOverrides
    : body;

  const vendorPackets = (nested.vendorPackets && typeof nested.vendorPackets === 'object'
    && !Array.isArray(nested.vendorPackets))
    ? nested.vendorPackets
    : {};
  const partyPackets = (nested.partyPackets && typeof nested.partyPackets === 'object'
    && !Array.isArray(nested.partyPackets))
    ? nested.partyPackets
    : {};
  const coordPacket = (nested.coordPacket && typeof nested.coordPacket === 'object'
    && !Array.isArray(nested.coordPacket))
    ? nested.coordPacket
    : {};

  return { vendorPackets, partyPackets, coordPacket };
}

function toClient(json, updatedAt) {
  const blob = (json && typeof json === 'object' && !Array.isArray(json)) ? json : {};
  return {
    vendorPackets: (blob.vendorPackets && typeof blob.vendorPackets === 'object'
      && !Array.isArray(blob.vendorPackets))
      ? blob.vendorPackets
      : {},
    partyPackets: (blob.partyPackets && typeof blob.partyPackets === 'object'
      && !Array.isArray(blob.partyPackets))
      ? blob.partyPackets
      : {},
    coordPacket: (blob.coordPacket && typeof blob.coordPacket === 'object'
      && !Array.isArray(blob.coordPacket))
      ? blob.coordPacket
      : {},
    packetOverridesUpdatedAt: updatedAt
      ? new Date(updatedAt).toISOString()
      : null
  };
}

async function readOverrides(weddingId) {
  const { rows } = await query(
    `SELECT packet_overrides_json, packet_overrides_updated_at FROM weddings WHERE id = $1`,
    [weddingId]
  );
  const row = rows[0] || {};
  return toClient(row.packet_overrides_json, row.packet_overrides_updated_at);
}

async function upsertOverrides(weddingId, overrides, updatedAt) {
  const ts = updatedAt || new Date().toISOString();
  const { rows } = await query(
    `UPDATE weddings SET
       packet_overrides_json = $2::jsonb,
       packet_overrides_updated_at = $3::timestamptz,
       updated_at = now()
     WHERE id = $1
       AND (packet_overrides_updated_at IS NULL OR packet_overrides_updated_at <= $3::timestamptz)
     RETURNING packet_overrides_json, packet_overrides_updated_at`,
    [weddingId, JSON.stringify(overrides || {}), ts]
  );
  if (rows[0]) {
    return {
      ...toClient(rows[0].packet_overrides_json, rows[0].packet_overrides_updated_at),
      ack: true
    };
  }
  const cur = await readOverrides(weddingId);
  return { ...cur, ack: false, reason: 'server_newer' };
}

router.get('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const payload = await readOverrides(req.params.weddingId);
    res.json({
      ...payload,
      packetOverrides: {
        vendorPackets: payload.vendorPackets,
        partyPackets: payload.partyPackets,
        coordPacket: payload.coordPacket
      },
      serverTime: new Date().toISOString()
    });
  } catch (e) {
    next(e);
  }
});

router.put('/', requireAuth, requireWeddingMember, async (req, res, next) => {
  try {
    const overrides = overridesFromClient(req.body || {});
    const ts = req.body?.packetOverridesUpdatedAt
      || req.body?.packet_overrides_updated_at
      || req.body?.updatedAt
      || req.body?.updated_at
      || new Date().toISOString();
    const result = await upsertOverrides(req.params.weddingId, overrides, ts);
    if (!result.ack) {
      res.json({
        ...result,
        packetOverrides: {
          vendorPackets: result.vendorPackets,
          partyPackets: result.partyPackets,
          coordPacket: result.coordPacket
        },
        ack: false,
        reason: result.reason || 'server_newer'
      });
      return;
    }
    res.json({
      ...result,
      packetOverrides: {
        vendorPackets: result.vendorPackets,
        partyPackets: result.partyPackets,
        coordPacket: result.coordPacket
      },
      ack: true
    });
  } catch (e) {
    next(e);
  }
});

export default router;

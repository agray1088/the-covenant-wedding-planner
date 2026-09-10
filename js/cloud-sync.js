/* Cloud sync bridge (beta) — optional overlay on offline-first planner.
   Default: DISABLED. Offline save() always remains the source of truth on device.
   Enable via window.COVENANT_CLOUD = { enabled:true, apiBase:'http://localhost:18787' }
   or localStorage covenant_cloud_enabled=1 + covenant_cloud_api. */
(function () {
  'use strict';

  var LS_ENABLED = 'covenant_cloud_enabled';
  var LS_API = 'covenant_cloud_api';
  var LS_TOKEN = 'covenant_cloud_token';
  var LS_USER = 'covenant_cloud_user';
  var LS_WEDDING = 'covenant_cloud_wedding_id';
  var LS_STATUS = 'covenant_cloud_status';
  var LS_LAST_SYNC = 'covenant_cloud_last_sync';
  var LS_LAST_ERROR = 'covenant_cloud_last_error';

  var syncTimer = null;
  var syncing = false;
  var statusListeners = [];

  function cfg() {
    var w = (typeof window !== 'undefined' && window.COVENANT_CLOUD) ? window.COVENANT_CLOUD : {};
    var api = (w.apiBase || w.api || ls(LS_API) || '').replace(/\/$/, '');
    var enabledFlag = w.enabled === true
      || String(ls(LS_ENABLED) || '') === '1'
      || String(ls(LS_ENABLED) || '').toLowerCase() === 'true';
    return {
      enabled: !!(enabledFlag && api),
      configured: !!api,
      apiBase: api,
      label: 'Cloud sync (beta)'
    };
  }

  function ls(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, val) {
    try {
      if (val == null) localStorage.removeItem(key);
      else localStorage.setItem(key, String(val));
    } catch (e) { /* private mode */ }
  }

  function setStatus(status, detail) {
    lsSet(LS_STATUS, status);
    if (detail) lsSet(LS_LAST_ERROR, detail);
    else if (status !== 'error') lsSet(LS_LAST_ERROR, null);
    statusListeners.forEach(function (fn) {
      try { fn(getStatus()); } catch (e) { /* ignore */ }
    });
  }

  function getStatus() {
    var c = cfg();
    if (!c.configured) {
      return { state: 'disabled', label: c.label, detail: 'Not configured — offline-only (GA default).', enabled: false };
    }
    if (!c.enabled) {
      return { state: 'disabled', label: c.label, detail: 'Configured but flag off.', enabled: false };
    }
    if (!navigator.onLine) {
      return { state: 'offline', label: c.label, detail: 'No network — local saves continue.', enabled: true };
    }
    var token = ls(LS_TOKEN);
    if (!token) {
      return { state: 'signed_out', label: c.label, detail: 'Sign in to sync guests, vendors, payments, budget, seating, contracts, timeline, packets, rentals, and party.', enabled: true };
    }
    var st = ls(LS_STATUS) || 'signed_in';
    return {
      state: st,
      label: c.label,
      detail: ls(LS_LAST_ERROR) || '',
      enabled: true,
      user: readJson(LS_USER),
      weddingId: ls(LS_WEDDING),
      lastSync: ls(LS_LAST_SYNC)
    };
  }

  function readJson(key) {
    try { return JSON.parse(ls(key) || 'null'); } catch (e) { return null; }
  }

  function onStatus(fn) {
    if (typeof fn === 'function') statusListeners.push(fn);
  }

  function api(path, opts) {
    var c = cfg();
    if (!c.apiBase) return Promise.reject(new Error('Cloud API not configured'));
    opts = opts || {};
    var headers = Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, opts.headers || {});
    var token = ls(LS_TOKEN);
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(c.apiBase + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body != null ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          var err = new Error(body.message || body.error || ('HTTP ' + res.status));
          err.status = res.status;
          err.body = body;
          throw err;
        }
        return body;
      });
    });
  }

  function ensureGuestIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.guests)) return;
      var changed = false;
      data.guests.forEach(function (g) {
        if (!g) return;
        if (!g.id) {
          g.id = 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (!g.updatedAt) {
          g.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        // Avoid edit-count churn when only stamping ids for sync.
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensureVendorIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.vendors)) return;
      var changed = false;
      data.vendors.forEach(function (v) {
        if (!v) return;
        var id = v.id || v._id;
        if (!id) {
          id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (v.id !== id) { v.id = id; changed = true; }
        if (v._id !== id) { v._id = id; changed = true; }
        if (!v.updatedAt) {
          v.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensurePaymentIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.payments)) return;
      var changed = false;
      data.payments.forEach(function (p) {
        if (!p) return;
        var id = p.id || p._id;
        if (!id) {
          id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (p.id !== id) { p.id = id; changed = true; }
        if (p._id !== id) { p._id = id; changed = true; }
        if (!p.updatedAt) {
          p.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensureBudgetIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.budget)) return;
      var changed = false;
      data.budget.forEach(function (c) {
        if (!c) return;
        var id = c.id || c._id;
        if (!id) {
          id = 'bc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (c.id !== id) { c.id = id; changed = true; }
        if (c._id !== id) { c._id = id; changed = true; }
        if (!Array.isArray(c.items)) {
          c.items = [];
          changed = true;
        }
        c.items.forEach(function (it, ii) {
          if (!it) return;
          var iid = it.id || it._id;
          if (!iid) {
            iid = id + '_i_' + ii + '_' + Math.random().toString(36).slice(2, 6);
            changed = true;
          }
          if (it.id !== iid) { it.id = iid; changed = true; }
          if (it._id !== iid) { it._id = iid; changed = true; }
        });
        if (!c.updatedAt) {
          c.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensureSeatingIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.tables)) return;
      var changed = false;
      data.tables.forEach(function (t) {
        if (!t) return;
        var id = t.id || t._id;
        if (!id) {
          id = 'tbl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (t.id !== id) { t.id = id; changed = true; }
        if (t._id !== id) { t._id = id; changed = true; }
        if (!t.updatedAt) {
          t.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (!data.floorFixtures || typeof data.floorFixtures !== 'object') {
        data.floorFixtures = data.floorFixtures || {};
      }
      if (data.floorFixtures && !data.floorFixturesUpdatedAt && !data.floor_fixtures_updated_at) {
        data.floorFixturesUpdatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
        changed = true;
      }
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensureContractIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.contracts)) return;
      var changed = false;
      data.contracts.forEach(function (c) {
        if (!c) return;
        var id = c.id || c._id;
        if (!id) {
          id = 'con_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (c.id !== id) { c.id = id; changed = true; }
        if (c._id !== id) { c._id = id; changed = true; }
        if (!c.updatedAt) {
          c.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensureTimelineIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.timeline)) return;
      var changed = false;
      data.timeline.forEach(function (ev) {
        if (!ev) return;
        var id = ev.id || ev._id;
        if (!id) {
          id = 'wdy_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (ev.id !== id) { ev.id = id; changed = true; }
        if (ev._id !== id) { ev._id = id; changed = true; }
        if (!ev.updatedAt) {
          ev.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensurePacketIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.packets)) return;
      var changed = false;
      data.packets.forEach(function (p) {
        if (!p) return;
        var id = p.id || p._id;
        if (!id) {
          id = 'pkt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (p.id !== id) { p.id = id; changed = true; }
        if (p._id !== id) { p._id = id; changed = true; }
        if (!p.updatedAt) {
          p.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensureRentalIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.rentals)) return;
      var changed = false;
      data.rentals.forEach(function (r) {
        if (!r) return;
        var id = r.id || r._id;
        if (!id) {
          id = 'rnt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (r.id !== id) { r.id = id; changed = true; }
        if (r._id !== id) { r._id = id; changed = true; }
        if (!r.updatedAt) {
          r.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function ensurePartyIds() {
    try {
      if (typeof data === 'undefined' || !data || !Array.isArray(data.party)) return;
      var changed = false;
      data.party.forEach(function (m) {
        if (!m) return;
        var id = m.id || m._id;
        if (!id) {
          id = 'pty_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          changed = true;
        }
        if (m.id !== id) { m.id = id; changed = true; }
        if (m._id !== id) { m._id = id; changed = true; }
        if (!m.updatedAt) {
          m.updatedAt = (typeof data.updatedAt === 'string' && data.updatedAt) || new Date().toISOString();
          changed = true;
        }
      });
      if (changed && typeof save === 'function') {
        var prev = window._suppressEditCount;
        window._suppressEditCount = true;
        try { save(); } finally { window._suppressEditCount = prev; }
      }
    } catch (e) { /* soft */ }
  }

  function guestTs(g) {
    if (!g) return 0;
    var t = Date.parse(g.updatedAt || g.updated_at || '');
    return isNaN(t) ? 0 : t;
  }

  function vendorTs(v) {
    if (!v) return 0;
    var t = Date.parse(v.updatedAt || v.updated_at || '');
    return isNaN(t) ? 0 : t;
  }

  function paymentTs(p) {
    if (!p) return 0;
    var t = Date.parse(p.updatedAt || p.updated_at || '');
    return isNaN(t) ? 0 : t;
  }

  function budgetTs(c) {
    if (!c) return 0;
    var t = Date.parse(c.updatedAt || c.updated_at || '');
    return isNaN(t) ? 0 : t;
  }

  function vendorId(v) {
    return v ? String(v.id || v._id || '') : '';
  }

  function paymentId(p) {
    return p ? String(p.id || p._id || '') : '';
  }

  function budgetId(c) {
    return c ? String(c.id || c._id || '') : '';
  }

  function seatingTs(t) {
    if (!t) return 0;
    var ts = Date.parse(t.updatedAt || t.updated_at || '');
    return isNaN(ts) ? 0 : ts;
  }

  function seatingId(t) {
    return t ? String(t.id || t._id || '') : '';
  }

  function contractTs(c) {
    if (!c) return 0;
    var ts = Date.parse(c.updatedAt || c.updated_at || '');
    return isNaN(ts) ? 0 : ts;
  }

  function contractId(c) {
    return c ? String(c.id || c._id || '') : '';
  }

  function timelineTs(ev) {
    if (!ev) return 0;
    var ts = Date.parse(ev.updatedAt || ev.updated_at || '');
    return isNaN(ts) ? 0 : ts;
  }

  function timelineId(ev) {
    return ev ? String(ev.id || ev._id || '') : '';
  }

  function packetTs(p) {
    if (!p) return 0;
    var ts = Date.parse(p.updatedAt || p.updated_at || '');
    return isNaN(ts) ? 0 : ts;
  }

  function packetId(p) {
    return p ? String(p.id || p._id || '') : '';
  }

  function rentalTs(r) {
    if (!r) return 0;
    var ts = Date.parse(r.updatedAt || r.updated_at || '');
    return isNaN(ts) ? 0 : ts;
  }

  function rentalId(r) {
    return r ? String(r.id || r._id || '') : '';
  }

  function partyTs(m) {
    if (!m) return 0;
    var ts = Date.parse(m.updatedAt || m.updated_at || '');
    return isNaN(ts) ? 0 : ts;
  }

  function partyId(m) {
    return m ? String(m.id || m._id || '') : '';
  }

  function floorFixturesTs() {
    if (typeof data === 'undefined' || !data) return 0;
    var ts = Date.parse(data.floorFixturesUpdatedAt || data.floor_fixtures_updated_at || '');
    return isNaN(ts) ? 0 : ts;
  }

  function mergeGuestsFromServer(serverGuests) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.guests)) data.guests = [];
    var byId = {};
    data.guests.forEach(function (g, i) { if (g && g.id) byId[g.id] = i; });
    var pulled = 0;
    var kept = 0;
    (serverGuests || []).forEach(function (sg) {
      if (!sg || !sg.id) return;
      var idx = byId[sg.id];
      if (idx == null) {
        data.guests.push(sg);
        byId[sg.id] = data.guests.length - 1;
        pulled++;
        return;
      }
      var local = data.guests[idx];
      if (guestTs(sg) > guestTs(local)) {
        data.guests[idx] = Object.assign({}, local, sg);
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function mergeVendorsFromServer(serverVendors) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.vendors)) data.vendors = [];
    var byId = {};
    data.vendors.forEach(function (v, i) {
      var id = vendorId(v);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverVendors || []).forEach(function (sv) {
      if (!sv) return;
      var id = vendorId(sv);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, sv, { id: id, _id: id });
        data.vendors.push(row);
        byId[id] = data.vendors.length - 1;
        pulled++;
        return;
      }
      var local = data.vendors[idx];
      if (vendorTs(sv) > vendorTs(local)) {
        data.vendors[idx] = Object.assign({}, local, sv, { id: id, _id: id });
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function mergePaymentsFromServer(serverPayments) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.payments)) data.payments = [];
    var byId = {};
    data.payments.forEach(function (p, i) {
      var id = paymentId(p);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverPayments || []).forEach(function (sp) {
      if (!sp) return;
      var id = paymentId(sp);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, sp, { id: id, _id: id });
        if (!Array.isArray(row.installments)) row.installments = [];
        data.payments.push(row);
        byId[id] = data.payments.length - 1;
        pulled++;
        return;
      }
      var local = data.payments[idx];
      if (paymentTs(sp) > paymentTs(local)) {
        var merged = Object.assign({}, local, sp, { id: id, _id: id });
        if (!Array.isArray(merged.installments)) merged.installments = [];
        data.payments[idx] = merged;
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function mergeBudgetFromServer(serverBudget) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.budget)) data.budget = [];
    var byId = {};
    data.budget.forEach(function (c, i) {
      var id = budgetId(c);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverBudget || []).forEach(function (sc) {
      if (!sc) return;
      var id = budgetId(sc);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, sc, { id: id, _id: id, cat: sc.cat || sc.name || '' });
        if (!Array.isArray(row.items)) row.items = [];
        data.budget.push(row);
        byId[id] = data.budget.length - 1;
        pulled++;
        return;
      }
      var local = data.budget[idx];
      if (budgetTs(sc) > budgetTs(local)) {
        var merged = Object.assign({}, local, sc, {
          id: id,
          _id: id,
          cat: sc.cat || sc.name || local.cat || ''
        });
        if (!Array.isArray(merged.items)) merged.items = [];
        data.budget[idx] = merged;
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function mergeSeatingFromServer(serverTables, floorFixtures, floorFixturesUpdatedAt) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0, fixturesPulled: false };
    if (!Array.isArray(data.tables)) data.tables = [];
    var byId = {};
    data.tables.forEach(function (t, i) {
      var id = seatingId(t);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverTables || []).forEach(function (st) {
      if (!st) return;
      var id = seatingId(st);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, st, { id: id, _id: id });
        data.tables.push(row);
        byId[id] = data.tables.length - 1;
        pulled++;
        return;
      }
      var local = data.tables[idx];
      if (seatingTs(st) > seatingTs(local)) {
        data.tables[idx] = Object.assign({}, local, st, { id: id, _id: id });
        pulled++;
      } else {
        kept++;
      }
    });
    var fixturesPulled = false;
    if (floorFixtures && typeof floorFixtures === 'object') {
      var serverFxTs = Date.parse(floorFixturesUpdatedAt || '') || 0;
      var localFxTs = floorFixturesTs();
      if (!data.floorFixtures || serverFxTs > localFxTs) {
        data.floorFixtures = Object.assign({}, floorFixtures);
        if (floorFixturesUpdatedAt) data.floorFixturesUpdatedAt = floorFixturesUpdatedAt;
        fixturesPulled = true;
      }
    }
    return { pulled: pulled, kept: kept, fixturesPulled: fixturesPulled };
  }

  function mergeContractsFromServer(serverContracts) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.contracts)) data.contracts = [];
    var byId = {};
    data.contracts.forEach(function (c, i) {
      var id = contractId(c);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverContracts || []).forEach(function (sc) {
      if (!sc) return;
      var id = contractId(sc);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, sc, { id: id, _id: id });
        data.contracts.push(row);
        byId[id] = data.contracts.length - 1;
        pulled++;
        return;
      }
      var local = data.contracts[idx];
      if (contractTs(sc) > contractTs(local)) {
        // Prefer server row for synced fields; keep local large file blobs if server stripped them.
        var merged = Object.assign({}, local, sc, { id: id, _id: id });
        if (sc.contractFile == null && local.contractFile != null) merged.contractFile = local.contractFile;
        if (sc.invoiceFile == null && local.invoiceFile != null) merged.invoiceFile = local.invoiceFile;
        if ((!sc.img || sc.img === '') && local.img) merged.img = local.img;
        data.contracts[idx] = merged;
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function mergeTimelineFromServer(serverTimeline) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.timeline)) data.timeline = [];
    var byId = {};
    data.timeline.forEach(function (ev, i) {
      var id = timelineId(ev);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverTimeline || []).forEach(function (se) {
      if (!se) return;
      var id = timelineId(se);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, se, { id: id, _id: id });
        if (!row.responsible && row.person) row.responsible = row.person;
        if (!row.person && row.responsible) row.person = row.responsible;
        data.timeline.push(row);
        byId[id] = data.timeline.length - 1;
        pulled++;
        return;
      }
      var local = data.timeline[idx];
      if (timelineTs(se) > timelineTs(local)) {
        var merged = Object.assign({}, local, se, { id: id, _id: id });
        if (!merged.responsible && merged.person) merged.responsible = merged.person;
        if (!merged.person && merged.responsible) merged.person = merged.responsible;
        data.timeline[idx] = merged;
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function mergePacketsFromServer(serverPackets) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.packets)) data.packets = [];
    var byId = {};
    data.packets.forEach(function (p, i) {
      var id = packetId(p);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverPackets || []).forEach(function (sp) {
      if (!sp) return;
      var id = packetId(sp);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, sp, { id: id, _id: id });
        if (!Array.isArray(row.sections)) row.sections = [];
        if (!Array.isArray(row.activity)) row.activity = [];
        if (!Array.isArray(row.withheld)) row.withheld = [];
        data.packets.push(row);
        byId[id] = data.packets.length - 1;
        pulled++;
        return;
      }
      var local = data.packets[idx];
      if (packetTs(sp) > packetTs(local)) {
        var merged = Object.assign({}, local, sp, { id: id, _id: id });
        if (!Array.isArray(merged.sections)) merged.sections = [];
        if (!Array.isArray(merged.activity)) merged.activity = [];
        if (!Array.isArray(merged.withheld)) merged.withheld = [];
        data.packets[idx] = merged;
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function mergeRentalsFromServer(serverRentals) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.rentals)) data.rentals = [];
    var byId = {};
    data.rentals.forEach(function (r, i) {
      var id = rentalId(r);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverRentals || []).forEach(function (sr) {
      if (!sr) return;
      var id = rentalId(sr);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, sr, { id: id, _id: id });
        data.rentals.push(row);
        byId[id] = data.rentals.length - 1;
        pulled++;
        return;
      }
      var local = data.rentals[idx];
      if (rentalTs(sr) > rentalTs(local)) {
        var merged = Object.assign({}, local, sr, { id: id, _id: id });
        data.rentals[idx] = merged;
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function mergePartyFromServer(serverParty) {
    if (typeof data === 'undefined' || !data) return { pulled: 0, kept: 0 };
    if (!Array.isArray(data.party)) data.party = [];
    var byId = {};
    data.party.forEach(function (m, i) {
      var id = partyId(m);
      if (id) byId[id] = i;
    });
    var pulled = 0;
    var kept = 0;
    (serverParty || []).forEach(function (sm) {
      if (!sm) return;
      var id = partyId(sm);
      if (!id) return;
      var idx = byId[id];
      if (idx == null) {
        var row = Object.assign({}, sm, { id: id, _id: id });
        data.party.push(row);
        byId[id] = data.party.length - 1;
        pulled++;
        return;
      }
      var local = data.party[idx];
      if (partyTs(sm) > partyTs(local)) {
        var merged = Object.assign({}, local, sm, { id: id, _id: id });
        data.party[idx] = merged;
        pulled++;
      } else {
        kept++;
      }
    });
    return { pulled: pulled, kept: kept };
  }

  function signIn(email, password) {
    return api('/auth/login', { method: 'POST', body: { email: email, password: password } })
      .then(function (body) {
        lsSet(LS_TOKEN, body.token);
        lsSet(LS_USER, JSON.stringify(body.user || {}));
        setStatus('signed_in');
        return body;
      });
  }

  function register(email, password, displayName) {
    return api('/auth/register', {
      method: 'POST',
      body: { email: email, password: password, displayName: displayName || '' }
    }).then(function (body) {
      lsSet(LS_TOKEN, body.token);
      lsSet(LS_USER, JSON.stringify(body.user || {}));
      setStatus('signed_in');
      return body;
    });
  }

  function signOut() {
    var p = Promise.resolve();
    if (ls(LS_TOKEN) && cfg().enabled) {
      p = api('/auth/logout', { method: 'POST' }).catch(function () { /* ignore */ });
    }
    return p.finally(function () {
      lsSet(LS_TOKEN, null);
      lsSet(LS_USER, null);
      // Keep wedding id so re-login can resume; user can clear via Upload.
      setStatus('signed_out');
    });
  }

  function setupPayload() {
    var setup = (typeof data !== 'undefined' && data && data.setup) ? data.setup : {};
    var bride = setup.bride || setup['bride-name'] || '';
    var groom = setup.groom || setup['groom-name'] || '';
    var name = [bride, groom].filter(Boolean).join(' & ') || 'My Wedding';
    var clientKey = null;
    try {
      clientKey = (typeof activeProfile !== 'undefined' && activeProfile)
        ? ('profile:' + activeProfile)
        : ('device:' + (ls('covenant_active_profile') || 'default'));
    } catch (e) {
      clientKey = 'device:default';
    }
    return {
      name: name,
      bride: bride || null,
      groom: groom || null,
      weddingDate: setup['wedding-date'] || setup.weddingDate || null,
      clientKey: clientKey,
      setup: setup
    };
  }

  function listWeddings() {
    return api('/weddings').then(function (body) {
      return Array.isArray(body.weddings) ? body.weddings : [];
    });
  }

  /** Second device / reinstall: claim the account's newest wedding instead of creating a duplicate. */
  function linkExistingWeddingIfAny() {
    return listWeddings().then(function (weddings) {
      if (!weddings.length) return null;
      var w = weddings[0];
      var id = w && w.id;
      if (!id) return null;
      lsSet(LS_WEDDING, id);
      return w;
    });
  }

  function uploadWedding() {
    ensureGuestIds();
    ensureVendorIds();
    ensurePaymentIds();
    ensureBudgetIds();
    ensureSeatingIds();
    ensureContractIds();
    setStatus('syncing');
    // Prefer an already-owned cloud wedding (same account on another device) before POST create.
    // Different devices use different clientKeys, so POST alone would spawn empty duplicates.
    return linkExistingWeddingIfAny()
      .then(function (existing) {
        if (existing) {
          return pushAll().then(function (pushResult) {
            setStatus('synced');
            lsSet(LS_LAST_SYNC, new Date().toISOString());
            return { wedding: existing, reused: true, linkedExisting: true, push: pushResult };
          });
        }
        return api('/weddings', { method: 'POST', body: setupPayload() })
          .then(function (body) {
            var id = body.wedding && body.wedding.id;
            if (!id) throw new Error('No wedding id returned');
            lsSet(LS_WEDDING, id);
            return pushAll().then(function (pushResult) {
              setStatus('synced');
              lsSet(LS_LAST_SYNC, new Date().toISOString());
              return { wedding: body.wedding, reused: !!body.reused, push: pushResult };
            });
          });
      })
      .catch(function (err) {
        setStatus('error', err.message || String(err));
        throw err;
      });
  }

  function pushGuests() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensureGuestIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var guests = (typeof data !== 'undefined' && data && Array.isArray(data.guests))
      ? data.guests.map(function (g) {
          if (!g) return g;
          // Prefer an existing guest stamp; otherwise inherit planner save time so local edits ACK.
          var ts = g.updatedAt || g.updated_at || now;
          return Object.assign({}, g, { updatedAt: ts });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/guests/bulk', {
      method: 'POST',
      body: { guests: guests }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.guest || !r.guest.id) return;
        if (!r.ack) return; // server newer — leave local; pull will reconcile
        var list = data.guests || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && list[i].id === r.guest.id) {
            list[i].updatedAt = r.guest.updatedAt || list[i].updatedAt;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushVendors() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensureVendorIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var vendors = (typeof data !== 'undefined' && data && Array.isArray(data.vendors))
      ? data.vendors.map(function (v) {
          if (!v) return v;
          var id = vendorId(v);
          var ts = v.updatedAt || v.updated_at || now;
          return Object.assign({}, v, { id: id, _id: id, updatedAt: ts });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/vendors/bulk', {
      method: 'POST',
      body: { vendors: vendors }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.vendor) return;
        if (!r.ack) return;
        var rid = vendorId(r.vendor);
        if (!rid) return;
        var list = data.vendors || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && vendorId(list[i]) === rid) {
            list[i].updatedAt = r.vendor.updatedAt || list[i].updatedAt;
            list[i].id = rid;
            list[i]._id = rid;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushPayments() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensurePaymentIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var payments = (typeof data !== 'undefined' && data && Array.isArray(data.payments))
      ? data.payments.map(function (p) {
          if (!p) return p;
          var id = paymentId(p);
          var ts = p.updatedAt || p.updated_at || now;
          return Object.assign({}, p, {
            id: id,
            _id: id,
            updatedAt: ts,
            installments: Array.isArray(p.installments) ? p.installments : []
          });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/payments/bulk', {
      method: 'POST',
      body: { payments: payments }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.payment) return;
        if (!r.ack) return;
        var rid = paymentId(r.payment);
        if (!rid) return;
        var list = data.payments || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && paymentId(list[i]) === rid) {
            list[i].updatedAt = r.payment.updatedAt || list[i].updatedAt;
            list[i].id = rid;
            list[i]._id = rid;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushBudget() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensureBudgetIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var budget = (typeof data !== 'undefined' && data && Array.isArray(data.budget))
      ? data.budget.map(function (c) {
          if (!c) return c;
          var id = budgetId(c);
          var ts = c.updatedAt || c.updated_at || now;
          return Object.assign({}, c, {
            id: id,
            _id: id,
            cat: c.cat || c.name || '',
            updatedAt: ts,
            items: Array.isArray(c.items) ? c.items : []
          });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/budget/bulk', {
      method: 'POST',
      body: { budget: budget }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.category) return;
        if (!r.ack) return;
        var rid = budgetId(r.category);
        if (!rid) return;
        var list = data.budget || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && budgetId(list[i]) === rid) {
            list[i].updatedAt = r.category.updatedAt || list[i].updatedAt;
            list[i].id = rid;
            list[i]._id = rid;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushSeating() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensureSeatingIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var tables = (typeof data !== 'undefined' && data && Array.isArray(data.tables))
      ? data.tables.map(function (t) {
          if (!t) return t;
          var id = seatingId(t);
          var ts = t.updatedAt || t.updated_at || now;
          return Object.assign({}, t, { id: id, _id: id, updatedAt: ts });
        })
      : [];
    var body = { tables: tables };
    if (typeof data !== 'undefined' && data && data.floorFixtures && typeof data.floorFixtures === 'object') {
      body.floorFixtures = data.floorFixtures;
      body.floorFixturesUpdatedAt = data.floorFixturesUpdatedAt || data.floor_fixtures_updated_at || now;
    }
    return api('/weddings/' + encodeURIComponent(weddingId) + '/seating/bulk', {
      method: 'POST',
      body: body
    }).then(function (resp) {
      (resp.results || []).forEach(function (r) {
        if (!r || !r.table) return;
        if (!r.ack) return;
        var rid = seatingId(r.table);
        if (!rid) return;
        var list = data.tables || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && seatingId(list[i]) === rid) {
            list[i].updatedAt = r.table.updatedAt || list[i].updatedAt;
            list[i].id = rid;
            list[i]._id = rid;
            break;
          }
        }
      });
      if (resp.floorFixturesAck && resp.floorFixturesUpdatedAt && typeof data !== 'undefined' && data) {
        data.floorFixturesUpdatedAt = resp.floorFixturesUpdatedAt;
        if (resp.floorFixtures && typeof resp.floorFixtures === 'object') {
          data.floorFixtures = Object.assign({}, data.floorFixtures || {}, resp.floorFixtures);
        }
      }
      return resp;
    });
  }

  function pushContracts() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensureContractIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var contracts = (typeof data !== 'undefined' && data && Array.isArray(data.contracts))
      ? data.contracts.map(function (c) {
          if (!c) return c;
          var id = contractId(c);
          var ts = c.updatedAt || c.updated_at || now;
          return Object.assign({}, c, { id: id, _id: id, updatedAt: ts });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/contracts/bulk', {
      method: 'POST',
      body: { contracts: contracts }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.contract) return;
        if (!r.ack) return;
        var rid = contractId(r.contract);
        if (!rid) return;
        var list = data.contracts || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && contractId(list[i]) === rid) {
            list[i].updatedAt = r.contract.updatedAt || list[i].updatedAt;
            list[i].id = rid;
            list[i]._id = rid;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushTimeline() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensureTimelineIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var timeline = (typeof data !== 'undefined' && data && Array.isArray(data.timeline))
      ? data.timeline.map(function (ev) {
          if (!ev) return ev;
          var id = timelineId(ev);
          var ts = ev.updatedAt || ev.updated_at || now;
          var responsible = ev.responsible || ev.person || '';
          return Object.assign({}, ev, {
            id: id,
            _id: id,
            responsible: responsible,
            person: responsible,
            updatedAt: ts
          });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/timeline/bulk', {
      method: 'POST',
      body: { timeline: timeline }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.event) return;
        if (!r.ack) return;
        var rid = timelineId(r.event);
        if (!rid) return;
        var list = data.timeline || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && timelineId(list[i]) === rid) {
            list[i].updatedAt = r.event.updatedAt || list[i].updatedAt;
            list[i].id = rid;
            list[i]._id = rid;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushPackets() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensurePacketIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var packets = (typeof data !== 'undefined' && data && Array.isArray(data.packets))
      ? data.packets.map(function (p) {
          if (!p) return p;
          var id = packetId(p);
          var ts = p.updatedAt || p.updated_at || now;
          return Object.assign({}, p, {
            id: id,
            _id: id,
            sections: Array.isArray(p.sections) ? p.sections : [],
            activity: Array.isArray(p.activity) ? p.activity : [],
            withheld: Array.isArray(p.withheld) ? p.withheld : [],
            updatedAt: ts
          });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/packets/bulk', {
      method: 'POST',
      body: { packets: packets }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.packet) return;
        if (!r.ack) return;
        var rid = packetId(r.packet);
        if (!rid) return;
        var list = data.packets || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && packetId(list[i]) === rid) {
            list[i].updatedAt = r.packet.updatedAt || list[i].updatedAt;
            list[i].id = rid;
            list[i]._id = rid;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushRentals() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensureRentalIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var rentals = (typeof data !== 'undefined' && data && Array.isArray(data.rentals))
      ? data.rentals.map(function (r) {
          if (!r) return r;
          var id = rentalId(r);
          var ts = r.updatedAt || r.updated_at || now;
          return Object.assign({}, r, {
            id: id,
            _id: id,
            updatedAt: ts
          });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/rentals/bulk', {
      method: 'POST',
      body: { rentals: rentals }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.rental) return;
        if (!r.ack) return;
        var rid = rentalId(r.rental);
        if (!rid) return;
        var list = data.rentals || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && rentalId(list[i]) === rid) {
            list[i].updatedAt = r.rental.updatedAt || list[i].updatedAt;
            list[i].id = rid;
            list[i]._id = rid;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushParty() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding — use Upload this wedding first.'));
    ensurePartyIds();
    var now = (typeof data !== 'undefined' && data && data.updatedAt) || new Date().toISOString();
    var party = (typeof data !== 'undefined' && data && Array.isArray(data.party))
      ? data.party.map(function (m) {
          if (!m) return m;
          var id = partyId(m);
          var ts = m.updatedAt || m.updated_at || now;
          return Object.assign({}, m, {
            id: id,
            _id: id,
            updatedAt: ts
          });
        })
      : [];
    return api('/weddings/' + encodeURIComponent(weddingId) + '/party/bulk', {
      method: 'POST',
      body: { party: party }
    }).then(function (body) {
      (body.results || []).forEach(function (r) {
        if (!r || !r.member) return;
        if (!r.ack) return;
        var mid = partyId(r.member);
        if (!mid) return;
        var list = data.party || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && partyId(list[i]) === mid) {
            list[i].updatedAt = r.member.updatedAt || list[i].updatedAt;
            list[i].id = mid;
            list[i]._id = mid;
            break;
          }
        }
      });
      return body;
    });
  }

  function pushAll() {
    return pushGuests().then(function (guests) {
      return pushVendors().then(function (vendors) {
        return pushPayments().then(function (payments) {
          return pushBudget().then(function (budget) {
            return pushSeating().then(function (seating) {
              return pushContracts().then(function (contracts) {
                return pushTimeline().then(function (timeline) {
                  return pushPackets().then(function (packets) {
                    return pushRentals().then(function (rentals) {
                      return pushParty().then(function (party) {
                        return {
                          guests: guests,
                          vendors: vendors,
                          payments: payments,
                          budget: budget,
                          seating: seating,
                          contracts: contracts,
                          timeline: timeline,
                          packets: packets,
                          rentals: rentals,
                          party: party
                        };
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  function pullGuests() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/guests')
      .then(function (body) {
        var merge = mergeGuestsFromServer(body.guests || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (typeof renderGuests === 'function' && document.body.getAttribute('data-active-panel') === 'guests') {
            try { renderGuests(); } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullVendors() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/vendors')
      .then(function (body) {
        var merge = mergeVendorsFromServer(body.vendors || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (typeof renderVendors === 'function' && document.body.getAttribute('data-active-panel') === 'vendors') {
            try { renderVendors(); } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullPayments() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/payments')
      .then(function (body) {
        var merge = mergePaymentsFromServer(body.payments || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (typeof renderPayments === 'function' && document.body.getAttribute('data-active-panel') === 'payments') {
            try { renderPayments(); } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullBudget() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/budget')
      .then(function (body) {
        var merge = mergeBudgetFromServer(body.budget || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (typeof renderBudget === 'function' && document.body.getAttribute('data-active-panel') === 'budget') {
            try { renderBudget(); } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullSeating() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/seating')
      .then(function (body) {
        var tables = body.tables || body.seating || [];
        var merge = mergeSeatingFromServer(tables, body.floorFixtures, body.floorFixturesUpdatedAt);
        if ((merge.pulled > 0 || merge.fixturesPulled) && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (document.body.getAttribute('data-active-panel') === 'tables') {
            try {
              if (typeof renderTables === 'function') renderTables();
              else if (typeof window.__tablesRenderRd === 'function') window.__tablesRenderRd();
            } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullContracts() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/contracts')
      .then(function (body) {
        var merge = mergeContractsFromServer(body.contracts || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (document.body.getAttribute('data-active-panel') === 'contracts') {
            try {
              if (typeof window.__contractsRenderRd === 'function') window.__contractsRenderRd();
              else if (typeof renderContracts === 'function') renderContracts();
            } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullTimeline() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/timeline')
      .then(function (body) {
        var merge = mergeTimelineFromServer(body.timeline || body.events || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (document.body.getAttribute('data-active-panel') === 'timeline') {
            try {
              if (typeof window.__timelineRenderRd === 'function') window.__timelineRenderRd();
              else if (typeof renderTimeline === 'function') renderTimeline();
              else if (typeof renderWeddingDayOverview === 'function') renderWeddingDayOverview();
            } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullPackets() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/packets')
      .then(function (body) {
        var merge = mergePacketsFromServer(body.packets || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (document.body.getAttribute('data-active-panel') === 'packets') {
            try {
              if (typeof window.__packetsRenderRd === 'function') window.__packetsRenderRd();
              else if (typeof renderPacketsRd === 'function') renderPacketsRd();
              else if (typeof renderPackets === 'function') renderPackets();
            } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullRentals() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/rentals')
      .then(function (body) {
        var merge = mergeRentalsFromServer(body.rentals || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (document.body.getAttribute('data-active-panel') === 'contracts') {
            try {
              if (typeof renderRentals === 'function') renderRentals();
              else if (typeof window.__contractsRenderRd === 'function') window.__contractsRenderRd();
            } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullParty() {
    var weddingId = ls(LS_WEDDING);
    if (!weddingId) return Promise.reject(new Error('No cloud wedding linked.'));
    return api('/weddings/' + encodeURIComponent(weddingId) + '/party')
      .then(function (body) {
        var merge = mergePartyFromServer(body.party || []);
        if (merge.pulled > 0 && typeof save === 'function') {
          var prev = window._suppressEditCount;
          window._suppressEditCount = true;
          try { save(); } finally { window._suppressEditCount = prev; }
          if (document.body.getAttribute('data-active-panel') === 'party') {
            try {
              if (typeof renderParty === 'function') renderParty();
              else if (typeof window.__partyRenderRd === 'function') window.__partyRenderRd();
            } catch (e) { /* soft */ }
          }
        }
        return merge;
      });
  }

  function pullAll() {
    return pullGuests().then(function (guests) {
      return pullVendors().then(function (vendors) {
        return pullPayments().then(function (payments) {
          return pullBudget().then(function (budget) {
            return pullSeating().then(function (seating) {
              return pullContracts().then(function (contracts) {
                return pullTimeline().then(function (timeline) {
                  return pullPackets().then(function (packets) {
                    return pullRentals().then(function (rentals) {
                      return pullParty().then(function (party) {
                        return {
                          guests: guests,
                          vendors: vendors,
                          payments: payments,
                          budget: budget,
                          seating: seating,
                          contracts: contracts,
                          timeline: timeline,
                          packets: packets,
                          rentals: rentals,
                          party: party
                        };
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  function syncNow() {
    if (syncing) return Promise.resolve(getStatus());
    var c = cfg();
    if (!c.enabled) return Promise.reject(new Error('Cloud sync disabled'));
    if (!ls(LS_TOKEN)) return Promise.reject(new Error('Sign in required'));

    // Device B has no local wedding id — link the account's existing wedding before creating one.
    var ensureLinked = ls(LS_WEDDING)
      ? Promise.resolve(ls(LS_WEDDING))
      : linkExistingWeddingIfAny().then(function (w) {
          return w && w.id ? w.id : null;
        });

    return ensureLinked.then(function (weddingId) {
      if (!weddingId) return uploadWedding();
      syncing = true;
      setStatus('syncing');
      return pullAll()
        .then(function (pull) {
          return pushAll().then(function (push) {
            return { pull: pull, push: push, weddingId: weddingId };
          });
        })
        .then(function (result) {
          lsSet(LS_LAST_SYNC, new Date().toISOString());
          setStatus('synced');
          return result;
        })
        .catch(function (err) {
          setStatus('error', err.message || String(err));
          throw err;
        })
        .finally(function () { syncing = false; });
    });
  }

  function scheduleGuestSync() {
    var c = cfg();
    if (!c.enabled || !ls(LS_TOKEN) || !ls(LS_WEDDING)) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      syncTimer = null;
      syncNow().catch(function () { /* status already set */ });
    }, 1200);
  }

  // Alias — sync covers guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + party.
  var scheduleSync = scheduleGuestSync;

  function patchSaveHook() {
    if (typeof window === 'undefined' || typeof window.save !== 'function') return false;
    if (window.save._covenantCloudPatched) return true;
    var orig = window.save;
    function wrapped() {
      var result = orig.apply(this, arguments);
      try {
        if (cfg().enabled && typeof data !== 'undefined' && data) {
          var now = data.updatedAt || new Date().toISOString();
          if (Array.isArray(data.guests)) {
            data.guests.forEach(function (g) {
              if (!g) return;
              // Bump stamp to this save so LWW treats the local edit as newer.
              g.updatedAt = now;
            });
          }
          if (Array.isArray(data.vendors)) {
            data.vendors.forEach(function (v) {
              if (!v) return;
              v.updatedAt = now;
            });
          }
          if (Array.isArray(data.payments)) {
            data.payments.forEach(function (p) {
              if (!p) return;
              p.updatedAt = now;
            });
          }
          if (Array.isArray(data.budget)) {
            data.budget.forEach(function (c) {
              if (!c) return;
              c.updatedAt = now;
            });
          }
          if (Array.isArray(data.tables)) {
            data.tables.forEach(function (t) {
              if (!t) return;
              t.updatedAt = now;
            });
          }
          if (data.floorFixtures && typeof data.floorFixtures === 'object') {
            data.floorFixturesUpdatedAt = now;
          }
          if (Array.isArray(data.contracts)) {
            data.contracts.forEach(function (c) {
              if (!c) return;
              c.updatedAt = now;
            });
          }
          if (Array.isArray(data.timeline)) {
            data.timeline.forEach(function (ev) {
              if (!ev) return;
              ev.updatedAt = now;
            });
          }
          if (Array.isArray(data.packets)) {
            data.packets.forEach(function (p) {
              if (!p) return;
              p.updatedAt = now;
            });
          }
          if (Array.isArray(data.rentals)) {
            data.rentals.forEach(function (r) {
              if (!r) return;
              r.updatedAt = now;
            });
          }
          if (Array.isArray(data.party)) {
            data.party.forEach(function (m) {
              if (!m) return;
              m.updatedAt = now;
            });
          }
        }
        scheduleSync();
      } catch (e) { /* never break offline save */ }
      return result;
    }
    wrapped._covenantCloudPatched = true;
    window.save = wrapped;
    return true;
  }

  function boot() {
    if (!patchSaveHook()) {
      setTimeout(boot, 400);
      return;
    }
    var c = cfg();
    if (!c.enabled) {
      setStatus('disabled');
      return;
    }
    if (!ls(LS_TOKEN)) setStatus('signed_out');
    else if (!ls(LS_WEDDING)) setStatus('signed_in');
    else setStatus(ls(LS_STATUS) || 'signed_in');
  }

  var CloudSync = {
    cfg: cfg,
    getStatus: getStatus,
    onStatus: onStatus,
    signIn: signIn,
    register: register,
    signOut: signOut,
    listWeddings: listWeddings,
    linkExistingWeddingIfAny: linkExistingWeddingIfAny,
    uploadWedding: uploadWedding,
    syncNow: syncNow,
    scheduleGuestSync: scheduleGuestSync,
    scheduleSync: scheduleSync,
    api: api
  };

  if (typeof window !== 'undefined') {
    window.CovenantCloudSync = CloudSync;
    window.cloudSyncSignIn = function (email, password) { return CloudSync.signIn(email, password); };
    window.cloudSyncSignOut = function () { return CloudSync.signOut(); };
    window.cloudSyncNow = function () { return CloudSync.syncNow(); };
    window.cloudSyncUploadWedding = function () { return CloudSync.uploadWedding(); };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 600); });
  } else {
    setTimeout(boot, 600);
  }
})();

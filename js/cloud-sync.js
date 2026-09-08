/* Cloud sync bridge (beta) — optional overlay on offline-first planner.
   Default: DISABLED. Offline save() always remains the source of truth on device.
   Enable via window.COVENANT_CLOUD = { enabled:true, apiBase:'http://localhost:8787' }
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
      return { state: 'signed_out', label: c.label, detail: 'Sign in to sync guests, vendors, and payments.', enabled: true };
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

  function vendorId(v) {
    return v ? String(v.id || v._id || '') : '';
  }

  function paymentId(p) {
    return p ? String(p.id || p._id || '') : '';
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

  function pushAll() {
    return pushGuests().then(function (guests) {
      return pushVendors().then(function (vendors) {
        return pushPayments().then(function (payments) {
          return { guests: guests, vendors: vendors, payments: payments };
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

  function pullAll() {
    return pullGuests().then(function (guests) {
      return pullVendors().then(function (vendors) {
        return pullPayments().then(function (payments) {
          return { guests: guests, vendors: vendors, payments: payments };
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

  // Alias — sync covers guests + vendors + payments.
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

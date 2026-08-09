/* Roles · Views #43a — planner / couple / vendor role shells.
   Planner + couple share one chrome; Covenant is couple-owned (default off for planner).
   Vendor is a separate muted product preview — not the planner with tabs hidden.
   Full Vendor Portal product remains Planner Vendor Portal.dc.html. */
(function () {
  'use strict';

  var COVENANT_PANELS = { prayer: 1, counseling: 1, reflect: 1, vision: 1, firstmonth: 1, rhythms: 1 };

  function ensureRoleSetup() {
    if (typeof window.data === 'undefined' || !data) return null;
    if (!data.setup || typeof data.setup !== 'object') data.setup = {};
    var s = data.setup;
    if (s.viewerRole !== 'planner' && s.viewerRole !== 'couple' && s.viewerRole !== 'vendorPreview') {
      s.viewerRole = 'couple';
    }
    if (!s.covenantAccess || typeof s.covenantAccess !== 'object') {
      s.covenantAccess = { granted: false, grantedBy: '', grantedAt: '', revokedAt: '' };
    }
    if (typeof s.covenantAccess.granted !== 'boolean') s.covenantAccess.granted = !!s.covenantAccess.granted;
    if (!s.plannerName) s.plannerName = 'Mary O.';
    if (!s.viewerName) s.viewerName = '';
    return s;
  }

  function getRole() {
    var s = ensureRoleSetup();
    return (s && s.viewerRole) || 'couple';
  }

  function coupleNames() {
    var s = ensureRoleSetup() || {};
    var b = String(s.bride || '').trim();
    var g = String(s.groom || '').trim();
    if (b && g) return b + ' & ' + g;
    return b || g || 'Your wedding';
  }

  function actorLabel(role) {
    var s = ensureRoleSetup() || {};
    role = role || getRole();
    if (role === 'planner') {
      return 'Planner · ' + (s.plannerName || 'Mary O.');
    }
    if (role === 'vendorPreview') {
      var vName = 'Vendor';
      try {
        var vendors = (data && Array.isArray(data.vendors)) ? data.vendors : [];
        if (vendors[0]) vName = String(vendors[0].name || vendors[0].vendor || 'Vendor');
      } catch (e) { /* soft */ }
      return 'Vendor · ' + vName;
    }
    var who = String(s.viewerName || s.bride || 'Ama').trim() || 'Ama';
    return 'Couple · ' + who.split(/\s+/)[0];
  }

  function canSeeCovenant() {
    var role = getRole();
    if (role === 'couple') return true;
    if (role === 'vendorPreview') return false;
    var s = ensureRoleSetup();
    return !!(s && s.covenantAccess && s.covenantAccess.granted);
  }

  function canOwnSharing() {
    return getRole() === 'couple';
  }

  function setRole(role) {
    var s = ensureRoleSetup();
    if (!s) return;
    if (role !== 'planner' && role !== 'couple' && role !== 'vendorPreview') role = 'couple';
    if (role === 'vendorPreview') {
      /* Separate product — open portal, keep planner on couple shell */
      openVendorPreview();
      return;
    }
    s.viewerRole = role;
    if (typeof save === 'function') save();
    closeVendorPreview();
    apply();
    if (typeof showToast === 'function') {
      showToast('Viewing as ' + actorLabel(role), 'ok');
    }
  }

  function setCovenantAccess(granted) {
    var s = ensureRoleSetup();
    if (!s) return;
    if (getRole() !== 'couple') {
      if (typeof showToast === 'function') showToast('Only the couple can grant or revoke Covenant access.', 'warn');
      return;
    }
    var today = new Date();
    var iso = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    s.covenantAccess.granted = !!granted;
    if (granted) {
      s.covenantAccess.grantedBy = String(s.bride || s.viewerName || 'Couple').trim() || 'Couple';
      s.covenantAccess.grantedAt = iso;
      s.covenantAccess.revokedAt = '';
    } else {
      s.covenantAccess.revokedAt = iso;
    }
    if (typeof save === 'function') save();
    apply();
    if (typeof showToast === 'function') {
      showToast(granted
        ? 'Planner can see Covenant until you revoke it.'
        : 'Covenant access revoked for the planner.', 'ok');
    }
  }

  function toggleCovenantAccess() {
    var s = ensureRoleSetup();
    setCovenantAccess(!(s && s.covenantAccess && s.covenantAccess.granted));
  }

  /* ── chrome ──────────────────────────────────────────────────────────── */

  function ensureRoleChip() {
    var bar = document.querySelector('.rd-topbar');
    if (!bar) return null;
    var chip = document.getElementById('rd-role-chip');
    if (!chip) {
      chip = document.createElement('span');
      chip.id = 'rd-role-chip';
      chip.className = 'rd-role-chip';
      var wedding = document.getElementById('rd-wedding-btn');
      if (wedding && wedding.parentNode) {
        wedding.parentNode.insertBefore(chip, wedding.nextSibling);
      } else {
        bar.appendChild(chip);
      }
    }
    return chip;
  }

  function syncTopbarLabels() {
    var label = document.getElementById('rd-wedding-label');
    if (label) label.textContent = coupleNames();
    var chip = ensureRoleChip();
    if (chip) {
      var role = getRole();
      chip.textContent = actorLabel(role);
      chip.dataset.role = role;
      chip.hidden = role === 'vendorPreview';
    }
  }

  function applyTabVisibility() {
    var show = canSeeCovenant();
    document.querySelectorAll('.rd-tab[data-tab="covenant"]').forEach(function (tab) {
      tab.hidden = !show;
      tab.style.display = show ? '' : 'none';
      tab.setAttribute('aria-hidden', show ? 'false' : 'true');
    });
    document.body.classList.toggle('rd-role-covenant-hidden', !show);
    document.body.classList.toggle('rd-role-planner', getRole() === 'planner');
    document.body.classList.toggle('rd-role-couple', getRole() === 'couple');
    document.body.classList.toggle('rd-role-vendor-preview', getRole() === 'vendorPreview');

    var active = document.body.getAttribute('data-active-panel') || '';
    if (!show && COVENANT_PANELS[active] && typeof showPanel === 'function') {
      showPanel('dashboard', true);
    }
  }

  function applySharingOwnership() {
    var own = canOwnSharing();
    document.body.classList.toggle('rd-role-sharing-locked', !own);
    /* Soft-gate Share Packets primary for planner */
    var packets = document.getElementById('panel-packets');
    if (packets) {
      packets.querySelectorAll('.rd-btn--primary, [onclick*="rdPktAdd"], [onclick*="rdPacketsAdd"]').forEach(function (btn) {
        if (own) {
          btn.removeAttribute('data-rd-sharing-locked');
          if (btn.dataset.rdSharePrevDisabled != null) {
            btn.disabled = btn.dataset.rdSharePrevDisabled === '1';
            delete btn.dataset.rdSharePrevDisabled;
          }
          btn.title = btn.getAttribute('data-rd-share-title') || btn.title;
        } else {
          if (!btn.dataset.rdSharePrevDisabled) {
            btn.dataset.rdSharePrevDisabled = btn.disabled ? '1' : '0';
            btn.setAttribute('data-rd-share-title', btn.title || '');
          }
          btn.disabled = true;
          btn.setAttribute('data-rd-sharing-locked', '1');
          btn.title = 'The couple owns sharing decisions';
        }
      });
    }
  }

  function syncProfileUi() {
    var role = getRole();
    document.querySelectorAll('[data-rd-role-opt]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-rd-role-opt') === role);
      btn.setAttribute('aria-pressed', btn.getAttribute('data-rd-role-opt') === role ? 'true' : 'false');
    });
    var grant = document.getElementById('rd-covenant-grant-btn');
    var grantRow = document.getElementById('rd-covenant-grant-row');
    var s = ensureRoleSetup();
    var granted = !!(s && s.covenantAccess && s.covenantAccess.granted);
    if (grantRow) {
      grantRow.hidden = role !== 'couple';
    }
    if (grant) {
      grant.classList.toggle('on', granted);
      grant.setAttribute('aria-checked', granted ? 'true' : 'false');
    }
    var meta = document.getElementById('rd-covenant-grant-meta');
    if (meta) {
      if (granted && s.covenantAccess.grantedAt) {
        meta.textContent = 'Granted ' + s.covenantAccess.grantedAt +
          (s.covenantAccess.grantedBy ? (' by ' + s.covenantAccess.grantedBy) : '') +
          ' · revocable anytime.';
      } else {
        meta.textContent = 'Default is off. Planner cannot open Covenant until you grant it.';
      }
    }
    var plannerNote = document.getElementById('rd-role-planner-note');
    if (plannerNote) {
      plannerNote.hidden = role !== 'planner';
      plannerNote.textContent = canSeeCovenant()
        ? 'Covenant is visible because the couple granted access.'
        : 'Covenant is hidden. Ask the couple to grant access — default is off.';
    }
  }

  function apply() {
    if (!document.body.classList.contains('rd-scope')) return;
    ensureRoleSetup();
    syncTopbarLabels();
    applyTabVisibility();
    applySharingOwnership();
    syncProfileUi();
  }

  /* ── Vendor Portal entry (separate product) ──────────────────────────── */

  function portalToken() {
    try {
      var packets = (typeof data !== 'undefined' && data && Array.isArray(data.packets)) ? data.packets : [];
      var pkt = packets.find(function (p) {
        return /vendor/i.test(String(p.recipientType || '')) || /cater|vendor/i.test(String(p.recipient || ''));
      });
      if (pkt && pkt.link) {
        var m = String(pkt.link).match(/\/g\/([A-Za-z0-9_-]+)/);
        if (m) return m[1];
      }
    } catch (e) { /* soft */ }
    return 'cat9';
  }

  function openVendorPreview() {
    /* Vendor Portal is a separate product — open vendor-portal.html, do not hide planner tabs. */
    var url = 'vendor-portal.html?g=' + encodeURIComponent(portalToken());
    window.open(url, '_blank', 'noopener');
    var s = ensureRoleSetup();
    if (s) s.viewerRole = 'couple';
    if (typeof save === 'function') save();
    apply();
    if (typeof showToast === 'function') {
      showToast('Opened Vendor Portal in a new tab', 'ok');
    }
  }

  function closeVendorPreview() {
    var host = document.getElementById('rd-vendor-preview');
    if (host) { host.hidden = true; host.innerHTML = ''; }
    document.body.classList.remove('rd-vendor-preview-open');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ── profile drawer UI ───────────────────────────────────────────────── */

  function injectProfileRoleUi() {
    /* Markup lives in index.html Modes & Tools; keep ids in sync only. */
    if (document.querySelector('[data-rd-roles-block]')) return;
  }

  /* ── public + hooks ──────────────────────────────────────────────────── */

  window.RdRoles = {
    getRole: getRole,
    setRole: setRole,
    canSeeCovenant: canSeeCovenant,
    canOwnSharing: canOwnSharing,
    setCovenantAccess: setCovenantAccess,
    apply: apply,
    afterSync: applyTabVisibility,
    openVendorPreview: openVendorPreview,
    closeVendorPreview: closeVendorPreview
  };
  window.rdSetViewerRole = setRole;
  window.rdToggleCovenantAccess = toggleCovenantAccess;
  window.rdEnterVendorPreview = function () { setRole('vendorPreview'); };
  window.rdExitVendorPreview = function () {
    var host = document.getElementById('rd-vendor-preview');
    if (host) host.hidden = true;
    document.body.classList.remove('rd-vendor-preview-open');
    var s = ensureRoleSetup();
    if (s) s.viewerRole = 'couple';
    if (typeof save === 'function') save();
    apply();
  };

  function hookShell() {
    if (window.covenantShell && typeof window.covenantShell.sync === 'function' && !window.covenantShell.sync.__rdRoles) {
      var _sync = window.covenantShell.sync;
      window.covenantShell.sync = function () {
        var out = _sync.apply(this, arguments);
        applyTabVisibility();
        applySharingOwnership();
        return out;
      };
      window.covenantShell.sync.__rdRoles = true;
    }
  }

  function boot() {
    if (!document.body.classList.contains('rd-scope')) {
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (document.body.classList.contains('rd-scope') || tries > 50) {
          clearInterval(t);
          if (document.body.classList.contains('rd-scope')) boot();
        }
      }, 100);
      return;
    }
    injectProfileRoleUi();
    hookShell();
    apply();
    var _show = window.showPanel;
    if (typeof _show === 'function' && !_show.__rdRolesWrapped) {
      window.showPanel = function (id, forceOpen) {
        if (COVENANT_PANELS[id] && !canSeeCovenant()) {
          if (typeof showToast === 'function') {
            showToast(getRole() === 'planner'
              ? 'Covenant is hidden until the couple grants access.'
              : 'Covenant is not available in this role view.', 'warn');
          }
          return _show.call(window, 'dashboard', true);
        }
        if (id === 'packets' && !canOwnSharing()) {
          /* Allow viewing packets, but apply() will disable create */
        }
        var out = _show.call(window, id, forceOpen);
        setTimeout(apply, 0);
        return out;
      };
      window.showPanel.__rdRolesWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

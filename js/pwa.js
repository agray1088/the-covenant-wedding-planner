/* PWA glue: service worker registration (https/localhost only), in-app update banner,
   install prompt handling and status for Settings -> Install app. Never touches cloud sync.
   Electron desktop shell skips SW registration and update banners (Help → Check for Updates). */
(function () {
  'use strict';
  var state = { supported: false, registered: false, controlled: false, version: '', updateReady: false,
    canPrompt: false, installed: false, ios: false, error: '', desktop: false };
  var listeners = [];
  var deferredPrompt = null;
  var waitingWorker = null;
  var reloading = false;

  function isDesktopShell() {
    try {
      if (window.COVENANT_DESKTOP && window.COVENANT_DESKTOP.isDesktop) return true;
      if (window.covenantDesktop && window.covenantDesktop.isDesktop) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function emit() { listeners.slice().forEach(function (f) { try { f(getStatus()); } catch (e) {} }); }
  function getStatus() {
    return {
      supported: state.supported, registered: state.registered, offlineReady: state.registered && state.controlled,
      version: state.version, updateReady: state.updateReady, canPrompt: state.canPrompt,
      installed: isStandalone(), ios: isIos(), online: navigator.onLine !== false, error: state.error,
      desktop: state.desktop
    };
  }
  function isStandalone() {
    try {
      if (state.desktop) return true;
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        window.navigator.standalone === true || state.installed;
    } catch (e) { return false; }
  }
  function isIos() {
    var ua = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }
  function secureEnough() {
    var h = location.hostname;
    return location.protocol === 'https:' || h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }

  function showUpdateBanner() {
    /* Desktop uses Help → Check for Updates (real auto-update later), not SW reload. */
    if (state.desktop || isDesktopShell()) return;
    if (document.getElementById('covenant-update-banner')) return;
    var b = document.createElement('div');
    b.id = 'covenant-update-banner';
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483646;display:flex;gap:12px;'
      + 'align-items:center;padding:10px 14px;background:#20362D;color:#F4EFE6;border:1px solid #B89968;border-radius:8px;'
      + 'box-shadow:0 6px 24px rgba(0,0,0,.35);font:500 14px/1.3 Inter,system-ui,sans-serif';
    b.innerHTML = '<span>Update available</span><button type="button" style="background:#B89968;color:#1A1A1A;border:0;'
      + 'border-radius:5px;padding:6px 12px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer">Reload</button>'
      + '<button type="button" aria-label="Dismiss" style="background:none;border:0;color:#F4EFE6;font-size:18px;cursor:pointer">\u00d7</button>';
    b.children[1].addEventListener('click', applyUpdate);
    b.children[2].addEventListener('click', function () { b.remove(); });
    document.body.appendChild(b);
  }

  function applyUpdate() {
    if (waitingWorker) waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    else location.reload();
  }

  function trackWaiting(reg) {
    if (reg.waiting && navigator.serviceWorker.controller) {
      waitingWorker = reg.waiting; state.updateReady = true; showUpdateBanner(); emit();
    }
  }

  function register() {
    state.supported = true;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      state.controlled = !!navigator.serviceWorker.controller;
      if (waitingWorker && !reloading) { reloading = true; location.reload(); return; }
      emit();
    });
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'VERSION') { state.version = e.data.version; emit(); }
    });
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (reg) {
      state.registered = true;
      state.controlled = !!navigator.serviceWorker.controller;
      trackWaiting(reg);
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed') {
            if (navigator.serviceWorker.controller) { waitingWorker = nw; state.updateReady = true; showUpdateBanner(); }
            else state.controlled = true;
            emit();
          }
        });
      });
      navigator.serviceWorker.ready.then(function (r) {
        if (r.active) r.active.postMessage({ type: 'GET_VERSION' });
        emit();
      });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') reg.update().catch(function () {});
      });
      emit();
    }).catch(function (err) { state.error = (err && err.message) || 'Service worker registration failed'; emit(); });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    /* Desktop is already an installed .exe — never offer Add to Home Screen / Install. */
    if (state.desktop || isDesktopShell()) {
      try { e.preventDefault(); } catch (_) {}
      deferredPrompt = null;
      state.canPrompt = false;
      return;
    }
    e.preventDefault(); deferredPrompt = e; state.canPrompt = true; emit();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null; state.canPrompt = false; state.installed = true; emit();
  });
  window.addEventListener('online', emit);
  window.addEventListener('offline', emit);

  window.CovenantPWA = {
    getStatus: getStatus,
    onChange: function (fn) { listeners.push(fn); },
    offChange: function (fn) { listeners = listeners.filter(function (f) { return f !== fn; }); },
    applyUpdate: applyUpdate,
    checkForUpdate: function () {
      if (state.desktop || isDesktopShell()) return Promise.resolve();
      if (!('serviceWorker' in navigator)) return Promise.resolve();
      return navigator.serviceWorker.getRegistration().then(function (r) { return r && r.update(); });
    },
    promptInstall: function () {
      if (state.desktop || isDesktopShell()) return Promise.resolve('desktop');
      if (!deferredPrompt) return Promise.resolve('unavailable');
      var p = deferredPrompt; deferredPrompt = null; state.canPrompt = false;
      p.prompt();
      return p.userChoice.then(function (c) { emit(); return c && c.outcome; });
    }
  };

  if (isDesktopShell()) {
    state.desktop = true;
    state.installed = true;
    state.supported = false;
    state.canPrompt = false;
    state.updateReady = false;
    state.error = '';
    try {
      var stale = document.getElementById('covenant-update-banner');
      if (stale) stale.remove();
    } catch (_) { /* ignore */ }
  } else if ('serviceWorker' in navigator && secureEnough()) {
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);
  } else {
    state.error = location.protocol === 'file:' ? 'Offline install needs the hosted (https) or localhost version.' : '';
  }
})();

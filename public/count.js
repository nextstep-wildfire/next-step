/* Cookie-free counts: landing visits, Desk opens, copied or emailed letters, downloaded PDFs.
   Sends one small event to this site's own /api/count: what happened (visit, desk, copy, email, pdf), the language,
   and letter or sheet. No cookie, no id, no address, nothing typed. Visits and Desk opens are counted once per tab
   session. A browser that says Do Not Track or Global Privacy Control is never counted. */
(function () {
  window.nsCount = function (ev, what) {
    try {
      if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
      if (ev === 'visit' || ev === 'desk') {
        try { if (sessionStorage.getItem('ns-c-' + ev)) return; sessionStorage.setItem('ns-c-' + ev, '1'); } catch (e) {}
      }
      var body = JSON.stringify({ e: ev, l: window.nsLang && window.nsLang.current() === 'es' ? 'es' : 'en', w: what || '' });
      if (navigator.sendBeacon && navigator.sendBeacon('/api/count', new Blob([body], { type: 'application/json' }))) return;
      fetch('/api/count', { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
    } catch (e) {}
  };
})();

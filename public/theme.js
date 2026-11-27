/* Runs before the page paints, on every page.
   Theme: light always loads first; dark only if the person chose it with the toggle.
   Language: Spanish if the person chose it, or opened a link with ?lang=es, or their browser is set to Spanish;
   English otherwise. The choice is remembered on this device. */
(function () {
  var d = document.documentElement, t = null, l = null, sd = null;
  try { t = localStorage.getItem('ns-theme'); l = localStorage.getItem('ns-lang'); sd = localStorage.getItem('ns-side'); } catch (e) {}
  // The Desk's sidebar on a computer: open unless the person closed it on this device.
  if (sd === 'shut') d.setAttribute('data-side', 'shut');
  if (t === 'dark') d.setAttribute('data-theme', 'dark');
  var q = (location.search.match(/[?&]lang=(en|es)\b/) || [])[1];
  if (q) { l = q; try { localStorage.setItem('ns-lang', q); } catch (e) {} }
  if (l !== 'en' && l !== 'es') l = /^es\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'es' : 'en';
  d.setAttribute('lang', l);
  function meta() { var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', d.getAttribute('data-theme') === 'dark' ? '#1A1714' : '#F4F1EA'); }
  window.nsTheme = {
    current: function () { return d.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
    toggle: function () {
      var next = window.nsTheme.current() === 'dark' ? 'light' : 'dark';
      if (next === 'dark') d.setAttribute('data-theme', 'dark'); else d.removeAttribute('data-theme');
      try { localStorage.setItem('ns-theme', next); } catch (e) {}
      meta();
      return next;
    }
  };
  window.nsLang = {
    current: function () { return l; },
    set: function (v) {
      try { localStorage.setItem('ns-lang', v); } catch (e) {}
      // drop a ?lang= in the address so the choice just made is the one that sticks
      var url = location.pathname + location.search.replace(/([?&])lang=(en|es)&?/, '$1').replace(/[?&]$/, '') + location.hash;
      if (url === location.pathname + location.search + location.hash) location.reload(); else location.replace(url);
    }
  };
  if (t === 'dark') document.addEventListener('DOMContentLoaded', meta);
})();

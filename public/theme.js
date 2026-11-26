/* Runs before the page paints. The theme follows the device unless the person picked one with the toggle. */
(function () {
  var d = document.documentElement, t = null;
  try { t = localStorage.getItem('ns-theme'); } catch (e) {}
  if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
  window.nsTheme = {
    current: function () {
      var a = d.getAttribute('data-theme');
      if (a) return a;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    toggle: function () {
      var next = window.nsTheme.current() === 'dark' ? 'light' : 'dark';
      d.setAttribute('data-theme', next);
      try { localStorage.setItem('ns-theme', next); } catch (e) {}
      return next;
    }
  };
})();

/* Runs before the page paints. Light always loads first; dark only if the person chose it with the toggle. */
(function () {
  var d = document.documentElement, t = null;
  try { t = localStorage.getItem('ns-theme'); } catch (e) {}
  if (t === 'dark') d.setAttribute('data-theme', 'dark');
  window.nsTheme = {
    current: function () { return d.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
    toggle: function () {
      var next = window.nsTheme.current() === 'dark' ? 'light' : 'dark';
      if (next === 'dark') d.setAttribute('data-theme', 'dark'); else d.removeAttribute('data-theme');
      try { localStorage.setItem('ns-theme', next); } catch (e) {}
      return next;
    }
  };
})();

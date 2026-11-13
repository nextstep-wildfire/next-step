(function () {
  var d = document.documentElement;
  var t = null; try { t = localStorage.getItem('cr-theme'); } catch (e) {}
  d.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  d.classList.add('js');
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.15 });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { e.classList.add('in'); });
  document.querySelectorAll('a[href^="/app"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      ev.preventDefault(); document.body.classList.add('leaving');
      setTimeout(function () { location.href = a.href; }, 240);
    });
  });
})();

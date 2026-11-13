(function () {
  var d = document.documentElement;
  var t = null; try { t = localStorage.getItem('cr-theme'); } catch (e) {}
  d.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  d.classList.add('js');
  var tb = document.getElementById('themeBtn');
  if (tb) tb.addEventListener('click', function () {
    var next = d.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    d.setAttribute('data-theme', next); try { localStorage.setItem('cr-theme', next); } catch (e) {}
  });
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.15 });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { e.classList.add('in'); });
  var v = document.getElementById('demo');
  if (v && 'IntersectionObserver' in window && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }); }, { threshold: 0.5 }).observe(v);
  }

  var STEPS = ['Say Where You Are', 'Tell It What Happened', 'Pick One Clear Ask', 'Edit It, Copy It, Send It'];
  var segs = document.querySelectorAll('#stepper .segs i'), stN = document.getElementById('stN'), stT = document.getElementById('stT');
  if (v && stN) {
    var starts = [0, 5, 14, 21], dur = 29;
    fetch('/demo/steps.json?v=d9').then(function (r) { return r.json(); }).then(function (d) { if (d && d.starts && d.starts.length === 4) { starts = d.starts; dur = d.duration || dur; } }).catch(function () {});
    var cur = -1;
    var tick = function () {
      var t = v.currentTime || 0, i = 0, k;
      for (k = 0; k < 4; k++) if (t >= starts[k]) i = k;
      var end = i < 3 ? starts[i + 1] : (v.duration || dur), p = Math.min(1, Math.max(0, (t - starts[i]) / Math.max(0.1, end - starts[i])));
      segs.forEach(function (s, n) { s.style.setProperty('--p', n < i ? 1 : n === i ? p : 0); });
      if (i !== cur) { cur = i; stN.textContent = 'Step ' + (i + 1) + ' of 4'; stT.textContent = STEPS[i]; }
    };
    v.addEventListener('timeupdate', tick); v.addEventListener('seeked', tick); v.addEventListener('loadedmetadata', tick); tick();
    var on = false, raf = function () { tick(); if (!v.paused) requestAnimationFrame(raf); else on = false; };
    v.addEventListener('play', function () { if (!on) { on = true; requestAnimationFrame(raf); } });
  }
  document.querySelectorAll('a[href^="/app"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      ev.preventDefault(); document.body.classList.add('leaving');
      setTimeout(function () { location.href = a.href; }, 240);
    });
  });
})();

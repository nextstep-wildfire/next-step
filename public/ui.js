/* Small UI helpers on top of app.js: Title Case for labels (English only), copy buttons under messages, and a scroll-to-bottom button. */
(function () {
  'use strict';
  var thread = document.getElementById('thread'), chips = document.getElementById('chips');
  var MINOR = { a: 1, an: 1, and: 1, as: 1, at: 1, but: 1, by: 1, for: 1, from: 1, in: 1, into: 1, nor: 1, of: 1, on: 1, or: 1, per: 1, the: 1, to: 1, up: 1, via: 1, vs: 1, with: 1 };
  var SEL = '#chips .chip, .msg h2, .msg h3, .msg .choice b, .msg .choice small, .msg button:not(.cpbtn):not(.choice), .menu .mi span, .menu .mrow > span, .pill, .sidenew, .sidelbl, #chatTitle, .tagwho, .dhead h2, .sheet h2, .sheet h3, #copySummary, #copyList, .clist .ct';
  function capWord(w) {
    if (!w || /[.\d@\/{}]/.test(w) || /[A-Z]/.test(w.slice(1))) return w;
    return w.replace(/^([^A-Za-z]*)([a-z])/, function (m, p, c) { return p + c.toUpperCase(); });
  }
  function titleCase(s, first, last) {
    var parts = s.split(/(\s+)/), idx = [], i;
    for (i = 0; i < parts.length; i++) if (!/^\s*$/.test(parts[i])) idx.push(i);
    idx.forEach(function (pi, n) {
      var w = parts[pi], core = w.replace(/[^A-Za-z’']/g, '').toLowerCase();
      var keepLower = MINOR[core] && !(first && n === 0) && !(last && n === idx.length - 1);
      if (keepLower) return;
      parts[pi] = w.split('-').map(capWord).join('-');
    });
    return parts.join('');
  }
  function fixLabels() {
    if (document.documentElement.getAttribute('lang') !== 'en') return;
    document.querySelectorAll(SEL).forEach(function (el) {
      var nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
      nodes.forEach(function (t, i) {
        var v = titleCase(t.nodeValue, i === 0, i === nodes.length - 1);
        if (v !== t.nodeValue) t.nodeValue = v;
      });
    });
  }
  var LANG = { en: ['Copy', 'Copied'], es: ['Copiar', 'Copiado'], zh: ['复制', '已复制'] };
  function labels() { var l = document.documentElement.getAttribute('lang') || 'en'; return LANG[l === 'zh-CN' ? 'zh' : l] || LANG.en; }
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function copyText(text, done) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {} ta.remove(); done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }
  function textOf(m) {
    var c = m.cloneNode(true);
    c.querySelectorAll('.srcs, button, .cpbtn').forEach(function (x) { x.remove(); });
    return (m.querySelector('.srcs, button') ? (c.textContent || '') : (m.innerText || '')).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function addCopy() {
    thread.querySelectorAll('.msgtools').forEach(function (t) { var p = t.previousElementSibling; if (!p || !p.classList.contains('msg') || p.classList.contains('typing') || p.getAttribute('aria-busy') === 'true') t.remove(); });
    Array.prototype.forEach.call(thread.children, function (m) {
      if (!m.classList.contains('msg') || !(m.classList.contains('bot') || m.classList.contains('user'))) return;
      if (m.getAttribute('aria-busy') === 'true' || m.classList.contains('typing') || m.classList.contains('note') || m.classList.contains('home') || m.classList.contains('who')) return;
      if (m.querySelector('textarea, input')) return;
      var nx = m.nextElementSibling;
      if (nx && nx.classList.contains('msgtools')) { var b0 = nx.firstChild; if (b0 && !b0.classList.contains('done')) b0.setAttribute('aria-label', labels()[0]); return; }
      if (!(m.textContent || '').trim()) return;
      var tools = document.createElement('div'); tools.className = 'msgtools ' + (m.classList.contains('user') ? 'mine' : 'theirs');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cpbtn'; b.setAttribute('aria-label', labels()[0]);
      b.innerHTML = ICON; b.title = labels()[0];
      b.addEventListener('click', function () {
        var msg = tools.previousElementSibling; if (!msg) return;
        copyText(textOf(msg), function () {
          b.classList.add('done'); b.innerHTML = CHECK; b.setAttribute('aria-label', labels()[1]);
          setTimeout(function () { b.classList.remove('done'); b.innerHTML = ICON; b.setAttribute('aria-label', labels()[0]); }, 1400);
        });
      });
      tools.appendChild(b); m.after(tools);
    });
  }
  var down = document.createElement('button'); down.type = 'button'; down.id = 'toBottom'; down.setAttribute('aria-label', 'Scroll to bottom');
  down.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
  document.body.appendChild(down);
  down.addEventListener('click', function () { thread.scrollTop = thread.scrollHeight; });
  function placeDown() {
    var r = thread.getBoundingClientRect(), far = thread.scrollHeight - thread.scrollTop - thread.clientHeight > 140;
    down.style.left = Math.round(r.left + r.width / 2) + 'px';
    down.style.bottom = Math.max(70, Math.round(window.innerHeight - chips.getBoundingClientRect().top + 12)) + 'px';
    down.classList.toggle('show', far);
  }
  var queued = false;
  function run() { queued = false; fixLabels(); addCopy(); placeDown(); }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(run); } }
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['lang', 'class'] });
  thread.addEventListener('scroll', placeDown, { passive: true });
  window.addEventListener('resize', queue);
  queue();
})();

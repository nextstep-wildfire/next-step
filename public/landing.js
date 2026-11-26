/* The landing demo: the Desk's own materials playing one short, scripted exchange, once, then resting.
   Under reduced motion it simply shows the finished state. Nothing here calls the AI. */
(function () {
  var dk = document.getElementById('dk'), thread = document.getElementById('dkThread'), input = document.getElementById('dkIn'), paper = document.getElementById('dkPaper'), sheet = document.getElementById('dkSheet');
  if (!thread) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var send = document.querySelector('.dk-send');
  var HOLDER = input.textContent;
  var NOTES = 'They offered $42,300. My contractor’s estimate is $96,000.';
  var LETTER = [
    'Subject: Request for a line-by-line explanation of the settlement offer',
    'Dear Claims Team,',
    'You offered $42,300 to settle the claim for my home. My contractor’s estimate to repair the damage is $96,000.',
    'Please explain in writing how you calculated the offer, line by line, and what it does not include.',
    'Please reply in writing within 15 calendar days of receiving this letter.',
    'Thank you,\n[your name]'
  ];
  var STEPS = [
    { a: null, q: 'What’s happening with your insurer?', ch: ['They pushed back on my claim', 'I got a message from them', 'A call or visit is coming up'], pick: 0 },
    { a: 'That’s a hard place to be, and putting it in writing is a good next step. What did they do?', ch: ['They said no', 'They offered less', 'They went quiet'], pick: 1 },
    { a: 'Do you own the home, or rent it?', ch: ['I own it', 'I rent it', 'Not sure'], pick: 0, inline: true },
    { a: 'What do you want to ask them for? One ask per letter keeps it clear.', ch: [['Show how the number was figured, line by line', 'Pick this if you can’t tell how they reached their number.'], ['Get a second contractor estimate', 'Pick this if you have your own estimate to send.']], pick: 0 },
    { a: 'In a few words, what happened? Dates, amounts and names help.', type: NOTES }
  ];
  var timers = [], running = false;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function choice(c) { var b = el('span', 'dk-c'); if (Array.isArray(c)) { b.textContent = c[0]; b.appendChild(el('small', '', c[1])); } else b.textContent = c; return b; }
  function label(c) { return Array.isArray(c) ? c[0] : c; }
  function blanks(t) { var p = el('p'); t.split(/(\[[^\]]+\])/).forEach(function (part) { if (/^\[/.test(part)) p.appendChild(el('span', 'blank', part)); else p.appendChild(document.createTextNode(part)); }); return p; }
  function letterLines(animate) {
    sheet.innerHTML = '';
    LETTER.forEach(function (t, i) { var p = blanks(t); if (i === 0) p.className = 'subj'; p.style.whiteSpace = 'pre-line'; if (animate) { p.classList.add('in'); p.style.animationDelay = (i * 160) + 'ms'; } sheet.appendChild(p); });
  }
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    thread.innerHTML = ''; sheet.innerHTML = ''; dk.classList.remove('has-paper');
    input.textContent = HOLDER; input.classList.remove('typed'); send.classList.remove('on');
  }
  function finished() {
    reset();
    STEPS.forEach(function (s) {
      if (s.a) thread.appendChild(el('p', 'a', s.a));
      thread.appendChild(el('p', 'u', s.type || label(s.ch[s.pick])));
    });
    thread.appendChild(el('p', 'a', 'Your letter is ready. Fill in anything in [brackets], then copy it into an email to your adjuster.'));
    dk.classList.add('has-paper'); letterLines(false);
  }
  function play() {
    if (reduced) return finished();
    reset(); running = true;
    var t = 300;
    STEPS.forEach(function (s) {
      later(t, function () {
        if (s.a) thread.appendChild(el('p', 'a', s.a));
        if (s.q) thread.appendChild(el('p', 'q', s.q));
        if (s.ch) { var box = el('div', 'dk-ch' + (s.inline ? ' inl' : '')); s.ch.forEach(function (c) { box.appendChild(choice(c)); }); thread.appendChild(box); s.box = box; }
      });
      t += s.ch ? 1300 : 900;
      if (s.ch) {
        later(t, function () { s.box.children[s.pick].classList.add('on'); });
        t += 450;
        later(t, function () { s.box.remove(); var q = thread.querySelector('.q'); if (q) q.remove(); thread.appendChild(el('p', 'u', label(s.ch[s.pick]))); });
        t += 650;
      } else if (s.type) {
        var i = 0;
        later(t, function () { input.classList.add('typed'); input.textContent = ''; });
        for (i = 1; i <= s.type.length; i++) (function (n) { later(t + n * 34, function () { input.textContent = s.type.slice(0, n); if (n === 3) send.classList.add('on'); }); })(i);
        t += s.type.length * 34 + 500;
        later(t, function () { input.textContent = HOLDER; input.classList.remove('typed'); send.classList.remove('on'); thread.appendChild(el('p', 'u', s.type)); });
        t += 500;
      }
    });
    later(t, function () { thread.appendChild(el('p', 'a st', 'Writing your letter…')); });
    t += 1100;
    later(t, function () { thread.lastChild.remove(); dk.classList.add('has-paper'); letterLines(true); });
    t += LETTER.length * 160 + 700;
    later(t, function () { thread.appendChild(el('p', 'a', 'Your letter is ready. Fill in anything in [brackets], then copy it into an email to your adjuster.')); running = false; });
  }

  // Rest at the opening question until the demo is on screen, then play once.
  reset();
  if (reduced) finished();
  else {
    thread.appendChild(el('p', 'q', STEPS[0].q));
    var box = el('div', 'dk-ch'); STEPS[0].ch.forEach(function (c) { box.appendChild(choice(c)); }); thread.appendChild(box);
    var played = false;
    var go = function () { if (!played) { played = true; play(); } };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { threshold: 0.45 });
      io.observe(document.getElementById('dk'));
    } else go();
  }
  document.getElementById('dkAgain').addEventListener('click', function () { reduced ? finished() : play(); });
  window.__demo = { finished: finished, play: play, running: function () { return running; } };
})();

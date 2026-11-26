/* Next Step, the Desk. Chat on the left, the person's paper on the right.
   Every exchange can be done by tapping; typing and pasting always work too.
   Rules, numbers and phone lines come from /sources.json only. Chats are kept on this device only;
   a pasted insurer message is never saved. */
(function () {
  'use strict';
  var C = window.NS_CONTENT;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'ns-desk-v1';
  var SOURCES = {};
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- words (English now; Spanish comes later through this table) ---------- */
  var T = {
    open: 'What’s happening with your insurer?',
    openSub: 'Tap what fits, or tell me in your own words. I’ll help you write to them, one clear ask at a time.',
    o_push: 'They pushed back on my claim', o_msg: 'I got a message from them', o_call: 'A call or visit is coming up',
    s_denied: 'They said no', s_low: 'They offered less', s_quiet: 'They went quiet', s_other: 'Something else',
    askSit: 'That’s a hard place to be, and putting it in writing is a good next step. What did they do?',
    askRole: 'Do you own the home, or rent it?',
    r_own: 'I own it', r_rent: 'I rent it', r_unsure: 'Not sure',
    askAsk: 'What do you want to ask them for? One ask per letter keeps it clear, and you can write another after.',
    askNotes: 'In a few words, what happened? Dates, amounts and names help. I’ll turn it into plain, polite sentences, and leave blanks for anything missing.',
    writeNow: 'Write my letter', skipNotes: 'Skip, leave blanks',
    writing: 'Writing your letter…', writingReply: 'Writing your reply…', reading: 'Reading their message…', editing: 'Changing your letter…',
    done: 'Your letter is ready. Fill in anything in [brackets], then copy it into an email to your adjuster.',
    doneEdit: 'To change it, type on the letter or tell me here.',
    doneMobile: 'Tap Your letter above to open it. To change it, type on it or tell me here.',
    next: 'Send it by email so there’s a record. The 15 days is your request, not a legal deadline. If you are still stuck, call the California Department of Insurance: ',
    another: 'Write another letter', anotherDiff: 'Ask for something different',
    changed: 'Done. The changed lines are highlighted on your letter.',
    pasteAsk: 'Paste what they sent below. I’ll explain it in plain words and suggest what to ask for in your reply.',
    pastePrivacy: 'What you paste is sent to the AI to read and is not saved. Leave out anything you don’t want to share, like account numbers.',
    pasteHolder: 'Paste their message here',
    explainedRight: 'I\u2019ve put what their message says, in plain words, at the top of your paper.',
    suggest: 'For your reply, I’d ask them to:', suggested: 'suggested', otherAsk: 'Pick a different ask',
    replyDone: 'Your reply is ready, under the plain explanation of their message. Fill in anything in [brackets] before you send it.',
    callMsg: 'A call or visit with my insurer is coming up. How should I get ready?',
    isPaste: 'That looks like it could be a message from your insurer. Should I explain it and help you reply?',
    yesExplain: 'Yes, explain it', noJustChat: 'No, it’s my own words',
    pause: 'The assistant is paused right now, so I can’t answer this one. Nothing you typed is lost. Please try again in about 30 minutes. If you need someone today, these are public phone lines:',
    pauseQuota: 'The assistant has reached its free daily limit, so I can’t answer this one. Nothing you typed is lost. Please try again in about 30 minutes, or tomorrow. If you need someone today, these are public phone lines:',
    tryAgain: 'Try again', basic: 'Use a basic letter instead',
    basicNote: 'This basic letter was put together from your choices, not written by the assistant. Read it closely and add your details.',
    breathe: 'If it would help, take one minute to breathe before the next step. Or see the public phone lines.',
    breatheBtn: 'Take a breath', phonesBtn: 'Phone lines',
    phonesIntro: 'Next Step is not staffed, so no one here will call you back. These are public lines:',
    holder: 'Type what happened, or paste their message', holderNotes: 'What happened, in your own words', holderFree: 'Ask a question, or tell me what to change',
    kLetter: 'Your letter', kReply: 'Their message and your reply',
    copied: 'Copied. Paste it into an email.', copy: 'Copy',
    sourceOne: 'Source: ', sourceMany: 'Sources: ',
    newChat: 'New chat', untitled: 'New chat'
  };

  /* Public lines. A number shows only if it appears in that source's notes. */
  var PHONES = [
    { src: '2', num: '1-800-927-4357', who: 'California Department of Insurance', what: 'Questions about your policy or a dispute with your insurer' },
    { src: '4', num: '1-800-621-3362', who: 'FEMA disaster assistance', what: 'Help with needs insurance does not cover' },
    { src: '3', num: '1-800-321-2752', who: 'Contractors State License Board', what: 'Check a contractor’s license' }
  ];
  function phones() { return PHONES.filter(function (p) { return SOURCES[p.src] && SOURCES[p.src].notes.indexOf(p.num) !== -1; }); }
  function tel(n) { return 'tel:' + n.replace(/\D/g, ''); }

  /* ---------- state ---------- */
  var store = load();
  var chat = null;          // the open chat
  var pasteMem = {};        // pasted insurer messages, in memory only (never saved)
  var busy = false;

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.chats)) return s; } catch (e) {}
    return { chats: [], cur: null };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }
  function newChat(seed) {
    var c = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), title: '', step: 'start', msgs: [] };
    if (seed) for (var k in seed) c[k] = seed[k];
    return c;
  }
  function persist() {
    if (!chat) return;
    if (chat.msgs.length && store.chats.indexOf(chat) === -1) store.chats.unshift(chat);
    store.chats = store.chats.slice(0, 30);
    store.cur = chat.id;
    save(); renderHistory();
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function L(m) { return m && (m.en || m); }
  function isPhone() { return window.matchMedia('(max-width: 900px)').matches; }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2400); }
  function niceDate(ts) { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function asksFor(sit) { return (C.ASKS[sit] || C.ASKS.other); }
  function askById(sit, id) { return asksFor(sit).filter(function (a) { return a[0] === id; })[0]; }
  var PICK_IF = {
    denied: { a1: 'Pick this if you don’t know exactly why they said no.', a2: 'Pick this if you want to see what their decision was based on.', a3: 'Pick this if you have photos, receipts or estimates that show the loss.' },
    low: { a1: 'Pick this if you can’t tell how they reached their number.', a2: 'Pick this if you have your own contractor’s estimate to send.', a3: 'Pick this if you’re not sure what your policy covers.' },
    quiet: { a1: 'Pick this if you just need to know where things stand.', a2: 'Pick this if you’ve already tried your adjuster more than once.', a3: 'Pick this if you want to know how long each step should take.' },
    smoke: { a1: 'Pick this if no one has explained how they will check your home.', a2: 'Pick this if you want a professional to test your home.' },
    other: { a1: 'Pick this if you’re not sure what they need to move forward.' }
  };

  /* Citations: [n] in a reply becomes a quiet source line under it. */
  function splitCites(text) {
    var ids = [];
    var clean = String(text || '').replace(/\s*\[(\d{1,2})\]/g, function (m, d) { if (SOURCES[d] && ids.indexOf(d) === -1) ids.push(d); return ''; });
    return { text: clean.replace(/ +([.,;:])/g, '$1').trim(), ids: ids };
  }
  function srcLine(ids) {
    if (!ids || !ids.length) return '';
    return '<p class="src">' + (ids.length > 1 ? T.sourceMany : T.sourceOne) + ids.map(function (d) { return '<a href="' + esc(SOURCES[d].url) + '" target="_blank" rel="noopener">' + esc(SOURCES[d].label) + '</a>'; }).join(', ') + '</p>';
  }
  function linkNums(h) { return h.replace(/\b1-\d{3}-\d{3}-\d{4}\b/g, function (n) { return '<a class="num" href="' + tel(n) + '">' + n + '</a>'; }); }
  function linesHtml() {
    return '<ul class="lines">' + phones().map(function (p) { return '<li><span class="who">' + esc(p.who) + '</span><a href="' + tel(p.num) + '">' + esc(p.num) + '</a></li>'; }).join('') + '</ul>';
  }

  /* ---------- rendering the thread ---------- */
  var thread = $('thread');
  function scrollDown() { requestAnimationFrame(function () { thread.scrollTop = thread.scrollHeight; }); }

  function renderAll() {
    thread.innerHTML = '';
    if (!chat.msgs.length) renderOpening();
    chat.msgs.forEach(function (m, i) { thread.appendChild(renderMsg(m, i)); });
    renderPaper(false);
    setComposer();
    jumpDown();
  }
  function jumpDown() {
    var go = function () { thread.style.scrollBehavior = 'auto'; thread.scrollTop = thread.scrollHeight; thread.style.scrollBehavior = ''; };
    go(); requestAnimationFrame(go);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
  }

  function renderOpening() {
    var o = el('div', 'opening');
    o.innerHTML = '<h1 tabindex="-1">' + esc(T.open) + '</h1><p class="sub">' + esc(T.openSub) + '</p>';
    var ch = el('div', 'choices');
    [['push', T.o_push], ['msg', T.o_msg], ['call', T.o_call]].forEach(function (c) {
      var b = el('button', 'choice'); b.type = 'button'; b.dataset.open = c[0]; b.textContent = c[1];
      b.addEventListener('click', function () { if (!busy) startWith(c[0], c[1]); });
      ch.appendChild(b);
    });
    o.appendChild(ch);
    thread.appendChild(o);
  }

  function renderMsg(m, i) {
    if (m.r === 'u') {
      var u = el('div', 'm-u' + (m.paste ? ' paste' : ''));
      var shown = m.paste ? (pasteMem[m.paste] || '[Their message, not saved on this device]') : m.x;
      u.innerHTML = '<p>' + esc(shown) + '</p>';
      return u;
    }
    var a = el('div', 'm-a' + (m.k ? ' ' + m.k : ''));
    a.dataset.i = i;
    var html = '';
    if (m.x) { var c = splitCites(m.x); html += c.text.split(/\n{2,}/).map(function (p) { return '<p class="tx">' + linkNums(esc(p)) + '</p>'; }).join(''); html += srcLine(c.ids); }
    if (m.note) html += '<p class="note">' + esc(m.note) + '</p>';
    if (m.k === 'pause' || m.k === 'phones') html += linesHtml();
    a.innerHTML = html;
    if (m.ch) a.appendChild(renderChoices(m, i));
    return a;
  }

  function renderChoices(m, i) {
    var ch = el('div', 'choices' + (m.ch.inline ? ' inline' : '') + (m.ch.picked != null ? ' done' : ''));
    m.ch.opts.forEach(function (o) {
      var b = el('button', 'choice'); b.type = 'button';
      b.dataset.v = o.v; b.dataset.key = m.ch.key;
      b.innerHTML = esc(o.l) + (o.tag ? '<span class="tag">' + esc(o.tag) + '</span>' : '') + (o.n ? '<small>' + esc(o.n) + '</small>' : '');
      b.setAttribute('aria-pressed', m.ch.picked === o.v ? 'true' : 'false');
      if (m.ch.picked != null) b.disabled = true;
      b.addEventListener('click', function () {
        if (busy || m.ch.picked != null) return;
        m.ch.picked = o.v;
        ch.classList.add('done');
        b.setAttribute('aria-pressed', 'true');
        [].forEach.call(ch.children, function (x) { x.disabled = true; });
        onChoice(m.ch.key, o.v, o.l);
      });
      ch.appendChild(b);
    });
    return ch;
  }

  function say(m) { chat.msgs.push(m); var node = renderMsg(m, chat.msgs.length - 1); var op = thread.querySelector('.opening'); if (op) op.remove(); thread.appendChild(node); persist(); scrollDown(); return node; }
  function me(text, extra) { var m = { r: 'u', x: text }; if (extra) for (var k in extra) m[k] = extra[k]; return say(m); }
  function status(text) { var n = el('div', 'm-a status', '<p class="tx">' + esc(text) + '</p>'); thread.appendChild(n); scrollDown(); return n; }

  /* ---------- the guided path ---------- */
  function startWith(kind, label) {
    if (kind === 'push') { chat.flow = 'letter'; me(label); askSit(); }
    else if (kind === 'msg') { me(label); askPaste(); }
    else if (kind === 'call') { me(label); talk(T.callMsg); }
    title(kind === 'msg' ? 'Their message' : kind === 'call' ? 'Getting ready for a call' : '');
  }
  function title(t) { if (t && !chat.title) { chat.title = t; persist(); } }

  function askSit() {
    chat.step = 'sit';
    say({ r: 'a', x: T.askSit, ch: { key: 'sit', opts: [{ v: 'denied', l: T.s_denied }, { v: 'low', l: T.s_low }, { v: 'quiet', l: T.s_quiet }] } });
    setComposer();
  }
  function askRole() {
    chat.step = 'role';
    say({ r: 'a', x: T.askRole, ch: { key: 'role', inline: true, opts: [{ v: 'own', l: T.r_own }, { v: 'rent', l: T.r_rent }, { v: 'unsure', l: T.r_unsure }] } });
    setComposer();
  }
  function askAsk(lead) {
    chat.step = 'ask';
    var opts = asksFor(chat.sit).map(function (a) { return { v: a[0], l: L(a[2]), n: (PICK_IF[chat.sit] || {})[a[0]] }; });
    say({ r: 'a', x: lead || T.askAsk, ch: { key: 'ask', opts: opts } });
    setComposer();
  }
  function askNotes() {
    chat.step = 'notes';
    say({ r: 'a', x: T.askNotes, ch: { key: 'notes', inline: true, opts: [{ v: 'skip', l: T.skipNotes }] } });
    setComposer();
    if (!isPhone()) $('composerIn').focus();
  }
  function askPaste() {
    chat.step = 'paste';
    say({ r: 'a', x: T.pasteAsk, note: T.pastePrivacy });
    setComposer();
    $('composerIn').focus();
  }
  function nextAfterRole() {
    if (chat.flow === 'reply') return writeLetter();
    if (!chat.ask) return askAsk();
    if (chat.notes == null) return askNotes();
    writeLetter();
  }

  function onChoice(key, v, label) {
    if (key === 'sit') { chat.sit = v; me(label); title(L(C.SIT_LABEL[v])); return chat.role ? askAsk() : askRole(); }
    if (key === 'role') { chat.role = v; me(label); return chat.sit ? (chat.flow === 'reply' ? writeLetter() : askAsk()) : askSit(); }
    if (key === 'ask') {
      chat.ask = v; me(label);
      if (chat.flow === 'reply') return chat.role ? writeLetter() : askRole();
      return chat.notes != null ? writeLetter() : askNotes();
    }
    if (key === 'notes') { chat.notes = ''; me(label); return writeLetter(); }
    if (key === 'more') {
      me(label);
      if (v === 'another') return anotherLetter();
      return;
    }
    if (key === 'isPaste') {
      var last = chat.msgs[chat.msgs.length - 2];
      me(label);
      if (v === 'yes') { var txt = chat.pendingText; chat.pendingText = null; return explain(txt, last); }
      var t2 = chat.pendingText; chat.pendingText = null;
      chat.msgs.forEach(function (m) { if (m.paste && m.paste === chat.pendingPaste) { delete m.paste; m.x = t2; } });
      chat.pendingPaste = null; renderAll(); return talk(t2, true);
    }
    if (key === 'pickAsk') {
      me(label);
      if (v === 'other') { chat.ask = null; return askAsk(T.askAsk); }
      chat.ask = v; return chat.role ? writeLetter() : askRole();
    }
    if (key === 'pause') {
      me(label);
      if (v === 'retry') return retry();
      if (v === 'basic') return basicLetter();
    }
    if (key === 'care') {
      me(label);
      location.hash = v === 'breathe' ? '#/breathe' : '#/phones';
    }
  }

  function anotherLetter() {
    var seed = { role: chat.role, sit: chat.sit, notes: chat.notes, flow: 'letter', title: '' };
    openChat(newChat(seed));
    say({ r: 'a', x: T.askAsk, ch: { key: 'ask', opts: asksFor(chat.sit).map(function (a) { return { v: a[0], l: L(a[2]), n: (PICK_IF[chat.sit] || {})[a[0]] }; }) } });
    chat.step = 'ask'; title(L(C.SIT_LABEL[chat.sit]));
    setComposer();
  }

  /* ---------- the composer ---------- */
  var input = $('composerIn');
  function setComposer() {
    var step = chat.step, form = $('composer');
    form.classList.toggle('tall', step === 'paste');
    input.placeholder = step === 'paste' ? T.pasteHolder : step === 'notes' ? T.holderNotes : chat.letter ? T.holderFree : T.holder;
    $('composerLbl').textContent = step === 'paste' ? T.pasteHolder : 'Message';
    autosize();
  }
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, window.innerHeight * 0.4) + 'px'; $('send').disabled = !input.value.trim() || busy; }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && chat.step !== 'paste' && !isPhone()) { e.preventDefault(); $('composer').requestSubmit(); }
  });
  $('composer').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;
    input.value = ''; autosize();
    onTyped(text);
  });

  function looksPasted(t) { return t.length > 400 && /(dear|claim|policy|sincerely|regards|adjuster)/i.test(t) && (t.match(/[.!?]\s/g) || []).length >= 3; }

  function onTyped(text) {
    var step = chat.step;
    // A step that was waiting on a tap: the person typed instead, so the open choices are closed.
    var lastA = chat.msgs[chat.msgs.length - 1];
    var keep = { more: 1, care: 1 };
    if (lastA && lastA.ch && lastA.ch.picked == null && step !== 'notes' && !keep[lastA.ch.key]) { lastA.ch.picked = '_typed'; var nodes = thread.querySelectorAll('.choices:not(.done)'); [].forEach.call(nodes, function (n) { if (keep[n.firstChild && n.firstChild.dataset.key]) return; n.classList.add('done'); [].forEach.call(n.children, function (b) { b.disabled = true; }); }); }
    if (step === 'paste') { return explain(text); }
    if (step === 'notes') {
      if (lastA && lastA.ch) { lastA.ch.picked = '_typed'; var n2 = thread.querySelector('.choices:not(.done)'); if (n2) n2.classList.add('done'); }
      chat.notes = text; me(text); return writeLetter();
    }
    if (!chat.letter && looksPasted(text)) {
      chat.pendingText = text;
      var id = 'p' + Date.now().toString(36); pasteMem[id] = text; chat.pendingPaste = id;
      me('', { paste: id });
      say({ r: 'a', x: T.isPaste, ch: { key: 'isPaste', inline: true, opts: [{ v: 'yes', l: T.yesExplain }, { v: 'no', l: T.noJustChat }] } });
      return;
    }
    if (chat.letter && looksLikeEdit(text)) { me(text); return revise(text); }
    talk(text);
  }
  // Clear requests to change the letter go straight to the rewrite, so they never depend on the chat model.
  function looksLikeEdit(t) {
    return t.length < 400 && (/^(please |can you |could you )?(make|change|add|remove|take out|delete|fix|replace|shorten|mention|include|put|use|sign|say)\b/i.test(t) || /\bmy (claim|policy) number is\b|\bmy name is\b|\b(shorter|more formal|more polite|less formal)\b/i.test(t));
  }

  /* ---------- talking to the AI ---------- */
  var lastFail = null;
  function convo() {
    var out = [];
    chat.msgs.forEach(function (m) {
      if (m.paste || !m.x || m.k === 'pause' || m.k === 'status') return;
      var role = m.r === 'u' ? 'user' : 'assistant';
      var x = m.x;
      if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n' + x; else out.push({ role: role, content: x });
    });
    return out.slice(-8);
  }
  function askSentence() { var a = chat.ask && askById(chat.sit, chat.ask); return a ? a[1] : ''; }

  function setBusy(b) { busy = b; $('send').disabled = b || !input.value.trim(); document.body.classList.toggle('busy', b); }

  function talk(text, alreadyShown) {
    if (!alreadyShown) me(text);
    if (!chat.title) title(text.length > 42 ? text.slice(0, 40).replace(/\s+\S*$/, '') + '…' : text);
    var node = el('div', 'm-a'); node.innerHTML = '<p class="tx"><span class="typing" aria-hidden="true"></span></p>';
    thread.appendChild(node); scrollDown(); setBusy(true);
    var body = { mode: 'chat', stream: true, lang: 'en', role: chat.role === 'unsure' ? '' : chat.role, messages: convo(), paper: !!chat.letter, ask: askSentence(), breatheOffered: !!store.breathe, stageLabel: chat.sit ? L(C.SIT_LABEL[chat.sit]) : '' };
    stream(body, function (soFar) {
      var c = splitCites(soFar);
      node.innerHTML = c.text.split(/\n{2,}/).map(function (p) { return '<p class="tx">' + esc(p) + '</p>'; }).join('').replace(/<\/p>$/, '<span class="typing" aria-hidden="true"></span></p>');
      scrollDown();
    }).then(function (fin) {
      node.remove(); setBusy(false);
      say({ r: 'a', x: fin.text });
      act(fin.action, text);
    }, function (err) {
      node.remove(); setBusy(false);
      pause(err, function () { talk(text, true); });
    });
  }

  function act(a, userText) {
    if (!a) return;
    if (a.type === 'edit' && chat.letter) return revise(userText);
    if (a.type === 'letter' && !chat.letter) {
      chat.sit = a.arg === 'smoke' || a.arg === 'other' || C.ASKS[a.arg] ? a.arg : 'other';
      chat.flow = 'letter';
      if (chat.notes == null) chat.notes = userText;
      title(L(C.SIT_LABEL[chat.sit]));
      return chat.role ? askAsk() : askRole();
    }
    if (a.type === 'choices' && !chat.letter) return askSit();
    if (a.type === 'paste') return askPaste();
    if (a.type === 'phones') return say({ r: 'a', k: 'phones', x: T.phonesIntro });
    if (a.type === 'breathe' && !store.breathe) {
      store.breathe = true; save();
      return say({ r: 'a', x: T.breathe, ch: { key: 'care', inline: true, opts: [{ v: 'breathe', l: T.breatheBtn }, { v: 'phones', l: T.phonesBtn }] } });
    }
  }

  /* Reads the server's event stream: {t} while writing, then {done,text,action} or {error}. */
  function stream(body, onText) {
    return fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      if (!r.ok || ct.indexOf('text/event-stream') === -1) return r.json().catch(function () { return {}; }).then(function (j) { throw code(j.error || 'http_' + r.status); });
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = '', fin = null;
      function pump() {
        return reader.read().then(function (x) {
          if (x.done) { if (fin) return fin; throw code('empty'); }
          buf += dec.decode(x.value, { stream: true });
          var i;
          while ((i = buf.indexOf('\n\n')) !== -1) {
            var line = buf.slice(0, i); buf = buf.slice(i + 2);
            if (line.indexOf('data: ') !== 0) continue;
            var ev; try { ev = JSON.parse(line.slice(6)); } catch (e) { continue; }
            if (ev.error) throw code(ev.error);
            if (ev.t) onText(ev.t);
            if (ev.done) fin = ev;
          }
          return pump();
        });
      }
      return pump();
    });
  }
  function code(c) { var e = new Error(c); e.code = c; return e; }
  function api(body) {
    return fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.error) throw code(j.error || 'http_' + r.status); return j; });
    }, function () { throw code('network'); });
  }

  /* The honest pause: no fake reply. Phone lines, try again later, and a plain basic letter if that is what they were doing. */
  function pause(err, again) {
    lastFail = again;
    var opts = [{ v: 'retry', l: T.tryAgain }];
    if ((chat.step === 'writing' || chat.flow) && chat.sit && chat.ask && !chat.letter) opts.push({ v: 'basic', l: T.basic });
    say({ r: 'a', k: 'pause', x: err && err.code === 'quota' ? T.pauseQuota : T.pause, ch: { key: 'pause', inline: true, opts: opts } });
  }
  function retry() { if (lastFail) { var f = lastFail; lastFail = null; f(); } }

  /* ---------- the letter ---------- */
  function letterBody() {
    var notes = (chat.notes || '').trim();
    return { mode: 'letter', lang: 'en', sit: chat.sit, sitLabel: L(C.SIT_LABEL[chat.sit]), role: chat.role === 'rent' ? 'rent' : 'own', ask: askSentence(), notes: notes, paste: chat.flow === 'reply' && chat.pasteId ? (pasteMem[chat.pasteId] || '') : '', name: '', claim: '', insurer: '', who: 'me' };
  }
  function writeLetter() {
    chat.step = 'writing'; setComposer();
    var s = status(chat.flow === 'reply' ? T.writingReply : T.writing); setBusy(true);
    var body = letterBody();
    if (chat.flow === 'reply' && !body.paste) body.notes = (body.notes ? body.notes + '\n' : '') + 'I am replying to a message from my insurer.';
    api(body).then(function (j) {
      s.remove(); setBusy(false);
      placeLetter(j.text, true);
      finishLetter();
    }, function (err) {
      s.remove(); setBusy(false); chat.step = 'free';
      pause(err, writeLetter);
    });
  }
  function finishLetter(basic) {
    chat.step = 'free';
    var cdi = phones()[0];
    var msg = (basic ? T.basicNote + '\n\n' : '') + (chat.flow === 'reply' ? T.replyDone : T.done) + ' ' + (isPhone() ? T.doneMobile : T.doneEdit) + '\n\n' + T.next + (cdi ? cdi.num + ' [' + cdi.src + '].' : '');
    say({ r: 'a', x: msg, ch: { key: 'more', inline: true, opts: [{ v: 'another', l: T.another }] } });
    setComposer();
    if (isPhone()) openPaper();
  }
  function basicLetter() {
    var a = askSentence(), home = chat.role === 'rent' ? 'rental home' : 'home';
    var ctx = { denied: 'I received your decision on my claim.', low: 'I received your settlement offer on my claim.', quiet: 'I have not received a response to my recent requests.', smoke: 'My home is still standing, but smoke and ash got in.', other: '' }[chat.sit] || '';
    var out = ['Subject: ' + (C.SIT_SUBJECT[chat.sit] || C.SIT_SUBJECT.other), '', 'Dear Claims Team,', '', 'I am writing about my claim for my ' + home + ', which was affected by the California wildfire. ' + ctx];
    if ((chat.notes || '').trim()) out.push('', 'In my own words: ' + chat.notes.trim().slice(0, 1200));
    out.push('', a, '', 'Please reply in writing within 15 calendar days of receiving this letter. I am keeping a record of all communication on this claim.', '', 'Thank you,', '[your name]');
    placeLetter(out.join('\n'), true);
    chat.basic = true;
    finishLetter(true);
  }

  /* ---------- their message ---------- */
  function explain(text, existing) {
    var id = chat.pendingPaste || ('p' + Date.now().toString(36));
    chat.pendingPaste = null;
    pasteMem[id] = text; chat.pasteId = id; chat.flow = 'reply';
    if (!existing) me('', { paste: id });
    title('Their message');
    chat.step = 'reading'; setComposer();
    var s = status(T.reading); setBusy(true);
    api({ mode: 'explain', lang: 'en', paste: text }).then(function (j) {
      s.remove(); setBusy(false);
      chat.sit = j.sit; chat.explain = j.text;
      var sug = askById(j.sit, j.ask) ? j.ask : asksFor(j.sit)[0][0];
      // Side by side, the explanation lives on the paper; on a phone the paper is tucked away, so it is said in the chat.
      say({ r: 'a', x: isPhone() ? j.text : T.explainedRight });
      var opts = [{ v: sug, l: L(askById(j.sit, sug)[2]), tag: T.suggested, n: (PICK_IF[j.sit] || {})[sug] }];
      opts.push({ v: 'other', l: T.otherAsk });
      chat.step = 'pickAsk';
      say({ r: 'a', x: T.suggest, ch: { key: 'pickAsk', opts: opts } });
      renderPaper(false);
      setComposer();
    }, function (err) {
      s.remove(); setBusy(false); chat.step = 'paste';
      pause(err, function () { explain(text, true); });
    });
  }

  /* ---------- the paper ---------- */
  var letterEl = $('letter');
  function paras(text) { return String(text || '').replace(/\r/g, '').split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean); }
  function paraHtml(p, i, cls) {
    var h = esc(p).replace(/\[[^\]\n]{1,40}\]/g, function (m) { return '<span class="blank">' + m + '</span>'; });
    return '<p class="' + (cls || '') + (i === 0 && /^Subject:/i.test(p) ? ' subj' : '') + '">' + h + '</p>';
  }
  function placeLetter(text, fresh, changedIdx) {
    chat.letter = text; persist();
    var ps = paras(text);
    letterEl.innerHTML = ps.map(function (p, i) { return paraHtml(p, i, (fresh && !reduced ? 'in' : '') + (changedIdx && changedIdx.indexOf(i) !== -1 ? ' changed' : '')); }).join('');
    if (fresh && !reduced) [].forEach.call(letterEl.children, function (p, i) { p.style.animationDelay = (i * 110) + 'ms'; });
    renderPaper(true);
    if (changedIdx && changedIdx.length) setTimeout(function () { [].forEach.call(letterEl.querySelectorAll('.changed'), function (p) { p.classList.remove('changed'); }); }, reduced ? 3000 : 1400);
  }
  function renderPaper(keepLetter) {
    var has = !!(chat.letter || chat.explain);
    $('desk').classList.toggle('has-paper', has);
    $('paperwrap').hidden = !has;
    $('pin').hidden = !has;
    var kind = chat.flow === 'reply' ? T.kReply : T.kLetter;
    $('paperKind').textContent = kind; $('pinKind').textContent = chat.flow === 'reply' ? (chat.letter ? 'Your reply' : 'Their message, explained') : T.kLetter;
    var ex = $('explain');
    if (chat.explain) {
      var c = splitCites(chat.explain);
      ex.hidden = false; ex.classList.toggle('withletter', !!chat.letter);
      ex.innerHTML = '<h2>What their message says</h2>' + c.text.split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    } else { ex.hidden = true; ex.innerHTML = ''; }
    if (!keepLetter) letterEl.innerHTML = chat.letter ? paras(chat.letter).map(function (p, i) { return paraHtml(p, i, ''); }).join('') : '';
    letterEl.hidden = !chat.letter;
    $('copyBtn').disabled = !chat.letter; $('printBtn').disabled = !chat.letter;
  }
  // Typing on the paper: keep the saved letter in step with what is on the sheet.
  var editT;
  letterEl.addEventListener('input', function () {
    clearTimeout(editT);
    editT = setTimeout(function () { chat.letter = readSheet(); persist(); }, 300);
  });
  letterEl.addEventListener('paste', function (e) { e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
  function readSheet() { return [].map.call(letterEl.querySelectorAll('p'), function (p) { return p.innerText.replace(/\n+$/, ''); }).filter(function (x) { return x.trim(); }).join('\n\n') || letterEl.innerText.trim(); }

  function revise(instruction) {
    chat.letter = readSheet();
    var before = paras(chat.letter);
    var s = status(T.editing); setBusy(true);
    api({ mode: 'revise', lang: 'en', sit: chat.sit, letter: chat.letter, instruction: instruction }).then(function (j) {
      s.remove(); setBusy(false);
      var after = paras(j.text), changed = [];
      after.forEach(function (p, i) { if (before.indexOf(p) === -1) changed.push(i); });
      placeLetter(j.text, false, changed);
      say({ r: 'a', x: T.changed });
      if (isPhone()) openPaper();
    }, function (err) {
      s.remove(); setBusy(false);
      pause(err, function () { revise(instruction); });
    });
  }

  $('copyBtn').addEventListener('click', function () {
    var text = chat.letter = readSheet(); persist();
    var done = function () { var b = $('copyBtn'); b.textContent = 'Copied'; toast(T.copied); setTimeout(function () { b.textContent = T.copy; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    else { fallbackCopy(text); done(); }
  });
  function fallbackCopy(t) { var ta = el('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); window.getSelection().removeAllRanges(); }
  $('printBtn').addEventListener('click', function () { window.print(); });
  function openPaper() { if (!isPhone()) return; $('paperwrap').classList.add('open'); document.body.style.overflow = 'hidden'; $('paperClose').focus(); }
  function closePaper() { $('paperwrap').classList.remove('open'); document.body.style.overflow = ''; $('pin').focus(); }
  $('pin').addEventListener('click', openPaper);
  $('paperClose').addEventListener('click', closePaper);

  /* ---------- sidebar and history ---------- */
  function renderHistory() {
    var ul = $('history'); ul.innerHTML = '';
    var list = store.chats.filter(function (c) { return c.msgs && c.msgs.length; });
    $('histEmpty').hidden = list.length > 0;
    list.forEach(function (c) {
      var li = el('li'), a = el('a');
      a.href = '#/c/' + c.id;
      a.innerHTML = esc(c.title || T.untitled) + '<small>' + esc(niceDate(c.at)) + (c.letter ? ', letter' : '') + '</small>';
      if (chat && c.id === chat.id && !location.hash.match(/^#\/(steps|breathe|phones)/)) a.setAttribute('aria-current', 'true');
      li.appendChild(a); ul.appendChild(li);
    });
  }
  function openChat(c) {
    chat = c; store.cur = c.id; save();
    closePage(); renderAll(); renderHistory(); closeSide();
    var h = thread.querySelector('.opening h1'); if (h && !isPhone()) input.focus();
  }
  function fresh() { if (chat && !chat.msgs.length) { closePage(); closeSide(); renderAll(); return; } openChat(newChat()); if (location.hash) history_replace(''); }
  function history_replace(h) { try { history.replaceState(null, '', location.pathname + h); } catch (e) {} }
  $('newChat').addEventListener('click', fresh);
  $('newChatTop').addEventListener('click', fresh);
  function openSide() { $('side').classList.add('open'); $('scrim').hidden = false; $('sideOpen').setAttribute('aria-expanded', 'true'); $('sideClose').focus(); }
  function closeSide() { if (!$('side').classList.contains('open')) return; $('side').classList.remove('open'); $('scrim').hidden = true; $('sideOpen').setAttribute('aria-expanded', 'false'); }
  $('sideOpen').addEventListener('click', openSide);
  $('sideClose').addEventListener('click', function () { closeSide(); $('sideOpen').focus(); });
  $('scrim').addEventListener('click', closeSide);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if ($('paperwrap').classList.contains('open')) return closePaper();
    if ($('side').classList.contains('open')) { closeSide(); $('sideOpen').focus(); return; }
    if (!$('page').hidden) location.hash = '';
  });

  /* ---------- pages: steps of a claim, take a breath, phone lines ---------- */
  var breathTimer = null;
  function closePage() { $('page').hidden = true; $('page').innerHTML = ''; clearInterval(breathTimer); [].forEach.call(document.querySelectorAll('.side-links a'), function (a) { a.removeAttribute('aria-current'); }); }
  function showPage(name, html) {
    var p = $('page');
    p.innerHTML = '<div class="page-in"><a class="back" href="#">← Back to the chat</a>' + html + '</div>';
    p.hidden = false; p.scrollTop = 0;
    p.querySelector('.back').addEventListener('click', function (e) { e.preventDefault(); location.hash = ''; });
    [].forEach.call(document.querySelectorAll('.side-links a'), function (a) { if (a.dataset.page === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    closeSide(); renderHistory();
    var h = p.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function pagePhones() {
    showPage('phones', '<h1>Phone lines</h1><p class="lead">Next Step is an AI guide and is not staffed, so no one here will call you back. These are public lines, open to anyone.</p>' +
      '<ul class="lines">' + phones().map(function (p) { return '<li><span class="who"><b>' + esc(p.who) + '</b>' + esc(p.what) + '</span><a href="' + tel(p.num) + '">' + esc(p.num) + '</a></li>'; }).join('') + '</ul>' +
      srcLine(phones().map(function (p) { return p.src; }).filter(function (v, i, a) { return a.indexOf(v) === i; })));
  }
  var stageRole = 'own';
  function pageSteps() {
    if (chat && chat.role === 'rent') stageRole = 'rent';
    var order = stageRole === 'rent' ? C.RENT_ORDER : C.OWN_ORDER;
    var items = order.map(function (id) {
      var s = C.STAGES[id]; if (!s) return '';
      var srcIds = (s.src || []).map(String).filter(function (d) { return SOURCES[d]; });
      return '<li><div><p class="when">' + esc(L(s.label)) + '</p><h2>' + esc(L(s.title)) + '</h2><ul>' + s.steps.map(function (x) { return '<li>' + esc(L(x)) + '</li>'; }).join('') + '</ul>' + (s.general ? '<p class="src">General guidance, not checked against an official source.</p>' : srcLine(srcIds)) + '</div></li>';
    }).join('');
    showPage('steps', '<h1>Steps of a claim</h1><p class="lead">The usual order of a wildfire claim in California. Yours may differ. Your policy decides.</p>' +
      '<div class="seg" role="group" aria-label="Home"><button type="button" data-r="own" aria-pressed="' + (stageRole === 'own') + '">I own</button><button type="button" data-r="rent" aria-pressed="' + (stageRole === 'rent') + '">I rent</button></div>' +
      '<ol class="stages">' + items + '</ol>');
    [].forEach.call($('page').querySelectorAll('.seg button'), function (b) { b.addEventListener('click', function () { stageRole = b.dataset.r; pageSteps(); $('page').querySelector('.seg button[data-r="' + stageRole + '"]').focus(); }); });
  }
  function pageBreathe() {
    showPage('breathe', '<h1>Take a breath</h1><p class="lead">One minute. Breathe in while the circle grows, and out while it settles. You can stop any time.</p>' +
      '<div class="breath" aria-hidden="true"><div class="ring" id="ring"></div></div><p class="breath-word" id="bword" aria-live="polite"></p><p class="breath-left" id="bleft"></p>' +
      '<div class="row" style="justify-content:center;margin-top:28px"><button class="btn" type="button" id="bstart">Start</button></div>');
    $('bstart').addEventListener('click', function () {
      var btn = $('bstart'); btn.hidden = true;
      var end = Date.now() + 60000, phase = 0, ring = $('ring');
      function step() {
        var left = Math.max(0, Math.round((end - Date.now()) / 1000));
        if (left <= 0) { clearInterval(breathTimer); $('bword').textContent = 'Done. Come back whenever you need to.'; $('bleft').textContent = ''; ring.classList.remove('big'); btn.hidden = false; btn.textContent = 'Again'; return; }
        $('bleft').textContent = left + ' seconds';
      }
      function cycle() {
        if (Date.now() >= end) return;
        if (phase === 0) { ring.classList.remove('out'); ring.classList.add('big'); $('bword').textContent = 'Breathe in'; phase = 1; setTimeout(cycle, 4000); }
        else { ring.classList.add('out'); ring.classList.remove('big'); $('bword').textContent = 'Breathe out'; phase = 0; setTimeout(cycle, 6000); }
      }
      clearInterval(breathTimer); breathTimer = setInterval(step, 500); step(); cycle();
    });
  }

  function route() {
    var h = location.hash;
    if (h === '#/steps') return pageSteps();
    if (h === '#/breathe') return pageBreathe();
    if (h === '#/phones') return pagePhones();
    var m = h.match(/^#\/c\/([\w]+)/);
    if (m) {
      var c = store.chats.filter(function (x) { return x.id === m[1]; })[0];
      if (c && c !== chat) return openChat(c);
    }
    closePage(); renderHistory();
  }
  window.addEventListener('hashchange', route);

  /* ---------- start ---------- */
  function boot() {
    var cur = store.chats.filter(function (c) { return c.id === store.cur; })[0];
    chat = cur || newChat();
    // A chat left mid-way while writing: settle it so it never shows a stuck state.
    if (chat.step === 'writing' || chat.step === 'reading') chat.step = chat.letter ? 'free' : (chat.flow === 'reply' ? 'paste' : 'notes');
    renderAll(); renderHistory(); route();
    window.addEventListener('resize', function () { if (!isPhone()) closePaper(); });
  }
  fetch('/sources.json').then(function (r) { return r.json(); }).then(function (s) { SOURCES = s; }, function () {}).then(boot);
  window.__desk = { state: function () { return { chat: chat, store: store, paste: Object.keys(pasteMem).length }; } };
})();

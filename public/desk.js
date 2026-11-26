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
    newChat: 'New chat', untitled: 'New chat',
    kindQ: 'I can make you a sheet to keep open while it happens. Which one is coming up?',
    k_call: 'A phone call with my insurer', k_visit: 'The adjuster is visiting my home',
    askCallSit: 'What is the call about?',
    c_denied: 'They said no', c_low: 'Their offer', c_quiet: 'I need an update', c_other: 'Something else',
    askHome: 'Is the home still standing?',
    h_standing: 'It’s standing, with damage', h_lost: 'It was destroyed',
    askCallAsk: 'What do you most want from this call? Pick one. The sheet lists a few more things to ask.',
    askCallNotes: 'Anything you want to raise on the call? Dates, amounts and names help. I’ll put it on your sheet and leave blanks for anything missing.',
    askVisitNotes: 'What do you want the adjuster to see? A few words about rooms, damage or worries. I’ll put it on your sheet.',
    skipSheet: 'Skip, make the sheet',
    writingCall: 'Making your call sheet…', writingVisit: 'Making your visit sheet…',
    callDone: 'Your call sheet is ready. Keep it open during the call and fill in the log as you go. When you hang up, save it to your Record, and I can write the follow-up email from it.',
    visitDone: 'Your visit sheet is ready. Keep it with you and fill in the log before the adjuster leaves. Afterward, save it to your Record, and I can write the follow-up email from it.',
    sheetMobile: 'Tap the card above to open it.',
    basicSheet: 'The assistant is paused, so this sheet has the checklist only. What to say first is a plain template, not written by the assistant.',
    useBasicSheet: 'Use the checklist without the assistant',
    kCall: 'Your call sheet', kVisit: 'Your visit sheet',
    saveRecord: 'Save to Record', savedRecord: 'Saved to your Record.', updateRecord: 'Update in Record',
    followup: 'Write the follow-up email', fuNeedLog: 'Fill in what they said first, then I can write the follow-up email.',
    fuLead: 'Here is a follow-up email from your log. It asks them to confirm what was said.',
    general: 'general guidance', sourcesH: 'Sources',
    care: 'This is a lot to carry. If it would help, take one minute before the next step. Nothing here will be lost.',
    careBreath: 'One minute to breathe', careLines: 'Or talk to someone. Next Step isn’t staffed, but these public lines are:',
    keepGoing: 'Keep going', careDone: 'Done. Come back to it whenever you need to.'
  };

  /* Public lines. A number shows only if it appears in that source's notes. */
  var PHONES = [
    { src: '2', num: '1-800-927-4357', who: 'California Department of Insurance', what: 'Questions about your policy or a dispute with your insurer' },
    { src: '4', num: '1-800-621-3362', who: 'FEMA disaster assistance', what: 'Help with needs insurance does not cover' },
    { src: '3', num: '1-800-321-2752', who: 'Contractors State License Board', what: 'Check a contractor’s license' },
    { src: '25', num: '988', who: '988 Suicide & Crisis Lifeline', what: 'Call or text any time, for stress or distress', care: true }
  ];
  /* Insurance lines by default; the care card and the Phone lines page add the 988 line. */
  function phones(withCare) { return PHONES.filter(function (p) { return (withCare || !p.care) && SOURCES[p.src] && SOURCES[p.src].notes.indexOf(p.num) !== -1; }); }
  /* Places to turn that are not phone lines. A source marked pending (TAC, until it approves) is never shown. */
  function handoffs() { return Object.keys(SOURCES).filter(function (k) { return SOURCES[k].handoff && !SOURCES[k].pending && SOURCES[k].url; }).map(function (k) { return SOURCES[k]; }); }
  function tel(n) { return 'tel:' + n.replace(/\D/g, ''); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function niceISO(iso) { var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], m[2] - 1, +m[3]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (iso || ''); }

  /* ---------- state ---------- */
  var store = load();
  var chat = null;          // the open chat
  var pasteMem = {};        // pasted insurer messages, in memory only (never saved)
  var busy = false;

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.chats)) return s; } catch (e) {}
    return { chats: [], cur: null, record: [] };
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
  function linesHtml(list) {
    return '<ul class="lines">' + (list || phones()).map(function (p) { return '<li><span class="who">' + esc(p.who) + '</span><a href="' + tel(p.num) + '">' + esc(p.num) + '</a></li>'; }).join('') + '</ul>';
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
    if (m.k === 'care') html += careHtml();
    a.innerHTML = html;
    if (m.k === 'care') wireCare(a);
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
    else if (kind === 'call') { me(label); askKind(); }
    title(kind === 'msg' ? 'Their message' : '');
  }
  function title(t) { if (t && !chat.title) { chat.title = t; persist(); } }

  function askSit() {
    chat.step = 'sit';
    say({ r: 'a', x: T.askSit, ch: { key: 'sit', opts: [{ v: 'denied', l: T.s_denied }, { v: 'low', l: T.s_low }, { v: 'quiet', l: T.s_quiet }] } });
    setComposer();
  }
  function askKind() {
    chat.step = 'kind';
    say({ r: 'a', x: T.kindQ, ch: { key: 'kind', opts: [{ v: 'call', l: T.k_call }, { v: 'visit', l: T.k_visit }] } });
    setComposer();
  }
  function askCallSit() {
    chat.step = 'sit';
    say({ r: 'a', x: T.askCallSit, ch: { key: 'sit', opts: [{ v: 'denied', l: T.c_denied }, { v: 'low', l: T.c_low }, { v: 'quiet', l: T.c_quiet }, { v: 'other', l: T.c_other }] } });
    setComposer();
  }
  function askHome() {
    chat.step = 'home';
    say({ r: 'a', x: T.askHome, ch: { key: 'home', inline: true, opts: [{ v: 'standing', l: T.h_standing }, { v: 'lost', l: T.h_lost }] } });
    setComposer();
  }
  function isSheetFlow() { return chat.flow === 'call' || chat.flow === 'visit'; }
  /* The next question for whatever is still missing, in the order each exchange asks it. */
  function nextStep() {
    if (chat.flow === 'call') {
      if (!chat.sit) return askCallSit();
      if (!chat.role) return askRole();
      if (!chat.ask) return askAsk(T.askCallAsk);
      if (chat.notes == null) return askNotes();
      return writeSheet();
    }
    if (chat.flow === 'visit') {
      if (!chat.home) return askHome();
      if (!chat.role) return askRole();
      if (chat.notes == null) return askNotes();
      return writeSheet();
    }
    if (chat.flow === 'reply') return chat.role ? writeLetter() : askRole();
    if (!chat.sit) return askSit();
    if (!chat.role) return askRole();
    if (!chat.ask) return askAsk();
    if (chat.notes == null) return askNotes();
    return writeLetter();
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
    var sheet = isSheetFlow();
    say({ r: 'a', x: chat.flow === 'call' ? T.askCallNotes : chat.flow === 'visit' ? T.askVisitNotes : T.askNotes, ch: { key: 'notes', inline: true, opts: [{ v: 'skip', l: sheet ? T.skipSheet : T.skipNotes }] } });
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
    if (key === 'kind') { chat.flow = v; me(label); title(v === 'call' ? 'Getting ready for a call' : 'Getting ready for a visit'); return nextStep(); }
    if (key === 'home') { chat.home = v; me(label); return nextStep(); }
    if (key === 'sit') { chat.sit = v; me(label); if (!isSheetFlow()) title(L(C.SIT_LABEL[v])); return nextStep(); }
    if (key === 'role') { chat.role = v; me(label); return nextStep(); }
    if (key === 'ask') { chat.ask = v; me(label); return nextStep(); }
    if (key === 'notes') { chat.notes = ''; me(label); return nextStep(); }
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
      if (v === 'basicSheet') return basicSheet();
    }
    if (key === 'care') {
      me(label);
      if (v === 'breathe') location.hash = '#/breathe';
      else if (v === 'phones') location.hash = '#/phones';
      else if (v === 'keep' && chat.afterCare) { var ac = chat.afterCare; chat.afterCare = null; act(ac.a, ac.t); }
      setComposer();
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
    input.placeholder = step === 'paste' ? T.pasteHolder : step === 'notes' ? T.holderNotes : (chat.letter || chat.sheet) ? T.holderFree : T.holder;
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
      chat.notes = text; me(text); return nextStep();
    }
    if (!chat.letter && !chat.sheet && looksPasted(text)) {
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
  function askOf(c) { if (c.ask === 'fu') return C.FOLLOWUP; return c.ask && askById(c.sit, c.ask); }
  function askSentence() { var a = askOf(chat); return a ? a[1] : ''; }

  function setBusy(b) { busy = b; $('send').disabled = b || !input.value.trim(); document.body.classList.toggle('busy', b); }

  /* Said plainly that it is too much: the care card comes once, whatever the model answers. */
  function soundsOverwhelmed(t) { return /overwhelm|exhaust|can.?t (do|take|handle|cope with) (this|it|any ?more)|too much for me|falling apart|breaking down|so tired of|hopeless|can.?t cope|give up|losing it|panic/i.test(t); }
  function talk(text, alreadyShown) {
    if (!alreadyShown) me(text);
    var care = soundsOverwhelmed(text) && !store.breathe;
    if (!chat.title) title(text.length > 42 ? text.slice(0, 40).replace(/\s+\S*$/, '') + '…' : text);
    var node = el('div', 'm-a'); node.innerHTML = '<p class="tx"><span class="typing" aria-hidden="true"></span></p>';
    thread.appendChild(node); scrollDown(); setBusy(true);
    var body = { mode: 'chat', stream: true, lang: 'en', role: chat.role === 'unsure' ? '' : chat.role, messages: convo(), paper: !!chat.letter, ask: askSentence(), breatheOffered: !!store.breathe || care, sheet: chat.sheet ? chat.sheet.kind : '', stageLabel: chat.sit ? L(C.SIT_LABEL[chat.sit]) : '' };
    stream(body, function (soFar) {
      var c = splitCites(soFar);
      node.innerHTML = c.text.split(/\n{2,}/).map(function (p) { return '<p class="tx">' + esc(p) + '</p>'; }).join('').replace(/<\/p>$/, '<span class="typing" aria-hidden="true"></span></p>');
      scrollDown();
    }).then(function (fin) {
      node.remove(); setBusy(false);
      say({ r: 'a', x: fin.text });
      // With the care card up, the next step waits for "Keep going" instead of rushing on.
      if (care) { offerCare(); chat.afterCare = fin.action ? { a: fin.action, t: text } : null; persist(); return; }
      act(fin.action, text);
    }, function (err) {
      node.remove(); setBusy(false);
      if (care) offerCare();
      pause(err, function () { talk(text, true); });
    });
  }

  function act(a, userText) {
    if (!a) return;
    if (a.type === 'edit' && chat.letter) return revise(userText);
    if ((a.type === 'call' || a.type === 'visit') && !chat.letter && !chat.sheet) {
      chat.flow = a.type;
      if (chat.notes == null) chat.notes = userText;
      title(a.type === 'call' ? 'Getting ready for a call' : 'Getting ready for a visit');
      return nextStep();
    }
    if (a.type === 'letter' && !chat.letter && !chat.sheet) {
      chat.sit = a.arg === 'smoke' || a.arg === 'other' || C.ASKS[a.arg] ? a.arg : 'other';
      chat.flow = 'letter';
      if (chat.notes == null) chat.notes = userText;
      title(L(C.SIT_LABEL[chat.sit]));
      return chat.role ? askAsk() : askRole();
    }
    if (a.type === 'choices' && !chat.letter) return askSit();
    if (a.type === 'paste') return askPaste();
    if (a.type === 'phones') return say({ r: 'a', k: 'phones', x: T.phonesIntro });
    if (a.type === 'breathe') offerCare();
  }
  /* The gentle card: once per device, never again. */
  function offerCare() {
    if (store.breathe) return;
    store.breathe = true; save();
    say({ r: 'a', k: 'care', x: T.care, ch: { key: 'care', inline: true, opts: [{ v: 'keep', l: T.keepGoing }] } });
  }
  function careHtml() {
    return '<div class="care-in"><button class="btn ghost sm care-go" type="button">' + esc(T.careBreath) + '</button>' +
      '<div class="care-breath" hidden><div class="ring"></div><p class="care-word" aria-live="polite"></p></div>' +
      '<p class="care-lbl">' + esc(T.careLines) + '</p>' + linesHtml(phones(true).filter(function (p) { return p.care || p.src === '2'; })) + '</div>';
  }
  function wireCare(node) {
    var go = node.querySelector('.care-go'); if (!go) return;
    go.addEventListener('click', function () {
      var box = node.querySelector('.care-breath'), ring = box.querySelector('.ring'), word = box.querySelector('.care-word');
      go.hidden = true; box.hidden = false;
      var end = Date.now() + 60000, inhale = true;
      (function cycle() {
        if (!document.body.contains(node)) return;
        if (Date.now() >= end) { ring.classList.remove('big'); word.textContent = T.careDone; go.hidden = false; go.textContent = 'Again'; return; }
        ring.classList.toggle('big', inhale); ring.classList.toggle('out', !inhale);
        word.textContent = inhale ? 'Breathe in' : 'Breathe out';
        setTimeout(cycle, inhale ? 4000 : 6000); inhale = !inhale;
      })();
    });
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
    if (isSheetFlow() && chat.step === 'writing' && !chat.sheet) opts.push({ v: 'basicSheet', l: T.useBasicSheet });
    else if ((chat.step === 'writing' || chat.flow) && chat.sit && chat.ask && !chat.letter && !isSheetFlow()) opts.push({ v: 'basic', l: T.basic });
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

  /* ---------- call and visit sheets ---------- */
  function sheetBody() {
    var a = askOf(chat);
    return { mode: 'sheet', lang: 'en', kind: chat.flow, sit: chat.sit || 'other', sitLabel: chat.sit ? L(C.SIT_LABEL[chat.sit]) : '', home: chat.home || 'standing', role: chat.role === 'unsure' ? '' : chat.role, ask: a ? a[1] : '', notes: (chat.notes || '').trim(), name: '', claim: '' };
  }
  function writeSheet() {
    chat.step = 'writing'; setComposer();
    var s = status(chat.flow === 'call' ? T.writingCall : T.writingVisit); setBusy(true);
    api(sheetBody()).then(function (j) {
      s.remove(); setBusy(false);
      placeSheet({ kind: chat.flow, say: j.say, points: j.points || [] });
      finishSheet();
    }, function (err) {
      s.remove(); setBusy(false);
      pause(err, writeSheet);
      chat.step = 'free';
    });
  }
  function basicSheet() {
    var a = askOf(chat);
    var say = chat.flow === 'call'
      ? 'Hi, my name is [your name], and I am calling about claim [claim number].' + (a ? ' I would like to ask you to ' + L(a[2]).charAt(0).toLowerCase() + L(a[2]).slice(1) + '.' : '')
      : 'Hi, I am [your name], and this is the home on claim [claim number]. I would like to show you all of the damage, and to get a written scope of work afterward.';
    placeSheet({ kind: chat.flow, say: say, points: [], basic: true });
    finishSheet(true);
  }
  function finishSheet(basic) {
    chat.step = 'free';
    say({ r: 'a', x: (basic ? T.basicSheet + '\n\n' : '') + (chat.flow === 'call' ? T.callDone : T.visitDone) + (isPhone() ? ' ' + T.sheetMobile : '') });
    setComposer();
    if (isPhone()) openPaper();
  }
  function placeSheet(sh) {
    sh.log = sh.log || {};
    chat.sheet = sh; persist();
    document.querySelector('.paperscroll').scrollTop = 0;
    renderPaper(false, true);
  }
  /* Which checklist lines apply: a line can be only for some situations, a standing or lost home, or renters. */
  function applies(item) {
    if (!item.only) return true;
    return item.only.some(function (k) { return k === chat.sit || k === chat.home || (k === 'rent' && chat.role === 'rent'); });
  }
  function sheetHtml(fresh) {
    var sh = chat.sheet, def = C.SHEETS[sh.kind], used = [], gen = false;
    function ref(item) {
      if (item.general) { gen = true; return ' <span class="gen">' + esc(T.general) + '</span>'; }
      return '<sup>' + item.src.map(String).filter(function (d) { return SOURCES[d]; }).map(function (d) { if (used.indexOf(d) === -1) used.push(d); return used.indexOf(d) + 1; }).sort(function (x, y) { return x - y; }).join(', ') + '</sup>';
    }
    var a = askOf(chat);
    var CALL_ABOUT = { denied: 'about their decision', low: 'about their offer', quiet: 'for an update on your claim', smoke: 'about smoke and ash', other: 'for your call with the insurer' };
    var head = sh.kind === 'call' ? def.title + ' ' + (CALL_ABOUT[chat.sit] || CALL_ABOUT.other) : def.title + (chat.home === 'lost' ? ' for a home that was destroyed' : ' for a home that is still standing');
    var out = ['<p class="subj">' + esc(head) + '</p><p class="meta">' + esc(def.meta) + '</p>'];
    def.sections.forEach(function (sec) {
      var h = '<section class="ss"><h3>' + esc(sec.h) + '</h3>';
      if (sec.say) h += '<p class="say">' + paraText(sh.say) + '</p>';
      var lis = [];
      if (sec.ask && a) lis.push('<li class="main">' + esc(L(a[2])) + '</li>');
      if ((sec.ask || (sh.kind === 'visit' && /show/i.test(sec.h))) && sh.points) sh.points.forEach(function (pt) { lis.push('<li class="mine">' + paraText(pt) + ' <span class="gen">from your notes</span></li>'); });
      (sec.items || []).filter(applies).forEach(function (it) { lis.push('<li>' + esc(it.t) + ref(it) + '</li>'); });
      if (lis.length) h += '<ul>' + lis.join('') + '</ul>';
      if (sec.followup) h += '<p class="sheetbtns"><button class="btn ghost sm" type="button" data-sheet="followup">' + esc(T.followup) + '</button></p>';
      out.push(h + '</section>');
    });
    out.push('<section class="ss log"><h3>' + (sh.kind === 'call' ? 'Call log' : 'Visit log') + '</h3><div class="fields">' + def.log.map(function (f) {
      var v = esc(sh.log[f[0]] || (f[0] === 'date' ? '' : ''));
      var input = f[2] === 'long' ? '<textarea rows="3" data-log="' + f[0] + '" id="lg-' + f[0] + '">' + v + '</textarea>' : '<input type="' + (f[2] || 'text') + '" data-log="' + f[0] + '" id="lg-' + f[0] + '" value="' + v + '"' + (f[3] ? ' placeholder="' + esc(f[3]) + '"' : '') + '>';
      return '<label class="field' + (f[2] === 'long' ? ' wide' : '') + '" for="lg-' + f[0] + '"><span>' + esc(f[1]) + '</span>' + input + '</label>';
    }).join('') + '</div><p class="sheetbtns"><button class="btn sm" type="button" data-sheet="record">' + esc(sh.recorded ? T.updateRecord : T.saveRecord) + '</button></p></section>');
    if (used.length || gen) out.push('<section class="ss srcs"><h3>' + esc(T.sourcesH) + '</h3><ol>' + used.map(function (d) { return '<li><a href="' + esc(SOURCES[d].url) + '" target="_blank" rel="noopener">' + esc(SOURCES[d].title) + '</a></li>'; }).join('') + '</ol>' + (gen ? '<p class="gennote">Lines marked general guidance are common sense from us, not from a source. Your policy decides.</p>' : '') + '</section>');
    return out.join('');
  }
  function paraText(t) { return esc(t).replace(/\[[^\]\n]{1,40}\]/g, function (m) { return '<span class="blank">' + m + '</span>'; }); }
  function sheetText() {
    var sh = chat.sheet, def = C.SHEETS[sh.kind], a = askOf(chat), lines = [];
    var node = $('sheetDoc');
    lines.push(node.querySelector('.subj').textContent, '');
    def.sections.forEach(function (sec) {
      lines.push(sec.h.toUpperCase());
      if (sec.say) lines.push(sh.say);
      if (sec.ask && a) lines.push('- ' + L(a[2]));
      if ((sec.ask || (sh.kind === 'visit' && /show/i.test(sec.h))) && sh.points) sh.points.forEach(function (pt) { lines.push('- ' + pt); });
      (sec.items || []).filter(applies).forEach(function (it) { lines.push('- ' + it.t); });
      lines.push('');
    });
    lines.push((sh.kind === 'call' ? 'CALL LOG' : 'VISIT LOG'));
    def.log.forEach(function (f) { lines.push(f[1] + ': ' + (f[0] === 'date' ? niceISO(sh.log.date) : (sh.log[f[0]] || ''))); });
    return lines.join('\n');
  }
  function logSummary(sh) {
    var l = sh.log || {}, bits = [];
    var when = [l.date ? 'On ' + niceISO(l.date) : '', l.time ? 'at ' + l.time : ''].filter(Boolean).join(' ');
    bits.push((when ? when + ', ' : '') + (sh.kind === 'call' ? 'I spoke by phone with ' : 'your adjuster visited my home: ') + (l.who || '[name]') + '.');
    if (l.looked) bits.push('They looked at: ' + l.looked);
    if (l.said) bits.push('They said: ' + l.said);
    if (l.next) bits.push('They said the next step is: ' + l.next);
    return bits.join('\n');
  }
  function sheetRecord() {
    var sh = chat.sheet, l = sh.log || {};
    recordPut({ chat: chat.id, kind: sh.kind, date: l.date || todayISO(), who: l.who || '', summary: [l.said, l.next ? 'Next: ' + l.next : ''].filter(Boolean).join(' ') || (sh.kind === 'call' ? 'Call with the insurer' : 'Adjuster visit') });
    sh.recorded = true; persist();
    var b = $('sheetDoc').querySelector('[data-sheet="record"]'); if (b) b.textContent = T.updateRecord;
    toast(T.savedRecord);
  }
  function followUp() {
    var sh = chat.sheet, l = sh.log || {};
    if (!(l.said || l.next || l.looked)) { toast(T.fuNeedLog); var f = $('lg-said'); if (f) f.focus(); return; }
    if (!sh.recorded) sheetRecord();
    var seed = { role: chat.role, sit: chat.sit || 'other', ask: 'fu', notes: logSummary(sh), flow: 'letter', title: 'Follow-up email' };
    openChat(newChat(seed));
    say({ r: 'a', x: T.fuLead });
    writeLetter();
  }
  var sheetDoc = $('sheetDoc');
  sheetDoc.addEventListener('input', function (e) {
    var k = e.target.dataset && e.target.dataset.log; if (!k || !chat.sheet) return;
    chat.sheet.log[k] = e.target.value; clearTimeout(sheetDoc.t); sheetDoc.t = setTimeout(persist, 250);
  });
  sheetDoc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sheet]'); if (!b || !chat.sheet) return;
    if (b.dataset.sheet === 'record') sheetRecord();
    if (b.dataset.sheet === 'followup') followUp();
  });

  /* ---------- the Record: every letter, call and visit, on this device only ---------- */
  function recordPut(e) {
    store.record = store.record || [];
    var i = -1;
    store.record.forEach(function (r, j) { if (e.chat && r.chat === e.chat && r.kind === e.kind) i = j; });
    e.id = i === -1 ? 'r' + Date.now().toString(36) : store.record[i].id;
    if (i === -1) store.record.unshift(e); else store.record[i] = e;
    save();
  }
  function letterRecord() {
    if (!chat.letter) return;
    var subj = (chat.letter.match(/^Subject:\s*(.+)$/m) || [])[1] || 'Letter to the insurer';
    recordPut({ chat: chat.id, kind: 'letter', date: todayISO(), who: 'Your insurer', summary: subj.replace(/\s+-\s+Claim .*$/, '') });
  }
  var KIND_LABEL = { letter: 'Letter', call: 'Call', visit: 'Visit' };
  function recordSorted() { return (store.record || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }); }
  function recordText() {
    return ['My claim record', ''].concat(recordSorted().map(function (r) { return niceISO(r.date) + '. ' + KIND_LABEL[r.kind] + (r.who ? ', ' + r.who : '') + '. ' + r.summary; })).join('\n');
  }
  function pageRecord(adding) {
    var list = recordSorted();
    var rows = list.map(function (r) {
      var c = store.chats.filter(function (x) { return x.id === r.chat; })[0];
      return '<li><span class="r-date">' + esc(niceISO(r.date)) + '</span><div class="r-body"><p class="r-what">' + esc(KIND_LABEL[r.kind]) + (r.who ? '<span>' + esc(r.who) + '</span>' : '') + '</p><p class="r-sum">' + esc(r.summary) + '</p></div>' +
        '<span class="r-act">' + (c ? '<a href="#/c/' + esc(c.id) + '">Open</a>' : '') + '<button type="button" class="linkbtn" data-del="' + esc(r.id) + '">Remove</button></span></li>';
    }).join('');
    showPage('record', '<h1>Record</h1><p class="lead">Every letter you send, call you make and visit you have, in one place. It stays on this device only.</p>' +
      '<div class="row rec-btns">' + (list.length ? '<button class="btn" type="button" id="recCopy">Copy as a summary</button>' : '') + '<button class="btn ghost" type="button" id="recAdd"' + (adding ? ' hidden' : '') + '>Add a call or visit</button></div>' +
      (adding ? '<form class="rec-form" id="recForm"><div class="fields">' +
        '<label class="field"><span>What</span><select id="rfKind"><option value="call">A call</option><option value="visit">A visit</option><option value="letter">A letter I sent</option></select></label>' +
        '<label class="field"><span>Date</span><input type="date" id="rfDate" value="' + todayISO() + '"></label>' +
        '<label class="field wide"><span>Who</span><input type="text" id="rfWho" placeholder="Name and job title"></label>' +
        '<label class="field wide"><span>What was said or sent</span><textarea id="rfSum" rows="3"></textarea></label></div>' +
        '<div class="row"><button class="btn ghost" type="submit">Save</button><button class="btn ghost" type="button" id="rfCancel">Cancel</button></div></form>' : '') +
      (list.length ? '<ul class="record">' + rows + '</ul>' : '<p class="empty">Nothing here yet. When you copy a letter or save a call or visit log, it shows up here.</p>'));
    var pg = $('page');
    var cp = $('recCopy'); if (cp) cp.addEventListener('click', function () { copyText(recordText(), function () { cp.textContent = 'Copied'; toast('Copied. Paste it wherever you keep your notes.'); setTimeout(function () { cp.textContent = 'Copy as a summary'; }, 2000); }); });
    $('recAdd').addEventListener('click', function () { pageRecord(true); $('rfWho').focus(); });
    var f = $('recForm');
    if (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); var sum = $('rfSum').value.trim(); if (!sum && !$('rfWho').value.trim()) { $('rfSum').focus(); return; } recordPut({ kind: $('rfKind').value, date: $('rfDate').value || todayISO(), who: $('rfWho').value.trim(), summary: sum }); pageRecord(false); });
      $('rfCancel').addEventListener('click', function () { pageRecord(false); });
    }
    [].forEach.call(pg.querySelectorAll('[data-del]'), function (b) { b.addEventListener('click', function () { store.record = store.record.filter(function (r) { return r.id !== b.dataset.del; }); save(); pageRecord(false); }); });
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
    if (fresh) document.querySelector('.paperscroll').scrollTop = 0;
    var ps = paras(text);
    letterEl.innerHTML = ps.map(function (p, i) { return paraHtml(p, i, (fresh && !reduced ? 'in' : '') + (changedIdx && changedIdx.indexOf(i) !== -1 ? ' changed' : '')); }).join('');
    if (fresh && !reduced) [].forEach.call(letterEl.children, function (p, i) { p.style.animationDelay = (i * 110) + 'ms'; });
    renderPaper(true);
    if (changedIdx && changedIdx.length) setTimeout(function () { [].forEach.call(letterEl.querySelectorAll('.changed'), function (p) { p.classList.remove('changed'); }); }, reduced ? 3000 : 1400);
  }
  function renderPaper(keepLetter, freshSheet) {
    var has = !!(chat.letter || chat.explain || chat.sheet);
    var sd = $('sheetDoc');
    if (chat.sheet) {
      sd.hidden = false; sd.innerHTML = sheetHtml();
      if (freshSheet && !reduced) [].forEach.call(sd.children, function (n, i) { n.classList.add('in'); n.style.animationDelay = (i * 90) + 'ms'; });
    } else { sd.hidden = true; sd.innerHTML = ''; }
    $('desk').classList.toggle('has-paper', has);
    $('paperwrap').hidden = !has;
    $('pin').hidden = !has;
    var kind = chat.sheet ? (chat.sheet.kind === 'call' ? T.kCall : T.kVisit) : chat.flow === 'reply' ? T.kReply : T.kLetter;
    $('paperKind').textContent = kind; $('pinKind').textContent = chat.sheet ? kind : chat.flow === 'reply' ? (chat.letter ? 'Your reply' : 'Their message, explained') : T.kLetter;
    var ex = $('explain');
    if (chat.explain) {
      var c = splitCites(chat.explain);
      ex.hidden = false; ex.classList.toggle('withletter', !!chat.letter);
      ex.innerHTML = '<h2>What their message says</h2>' + c.text.split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    } else { ex.hidden = true; ex.innerHTML = ''; }
    if (!keepLetter) letterEl.innerHTML = chat.letter ? paras(chat.letter).map(function (p, i) { return paraHtml(p, i, ''); }).join('') : '';
    letterEl.hidden = !chat.letter;
    $('copyBtn').disabled = !(chat.letter || chat.sheet); $('printBtn').disabled = !(chat.letter || chat.sheet);
    $('sheet').classList.toggle('is-sheet', !!chat.sheet);
    // One solid button per screen: on a sheet it is Save to Record, so Copy steps back to a ghost.
    $('copyBtn').classList.toggle('ghost', !!chat.sheet);
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

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    else { fallbackCopy(text); done(); }
  }
  $('copyBtn').addEventListener('click', function () {
    var text;
    if (chat.sheet) text = sheetText();
    else { text = chat.letter = readSheet(); letterRecord(); persist(); }
    copyText(text, function () { var b = $('copyBtn'); b.textContent = 'Copied'; toast(chat.sheet ? 'Copied.' : T.copied); setTimeout(function () { b.textContent = T.copy; }, 2000); });
  });
  function fallbackCopy(t) { var ta = el('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); window.getSelection().removeAllRanges(); }
  $('printBtn').addEventListener('click', function () { if (chat.letter && !chat.sheet) { chat.letter = readSheet(); letterRecord(); persist(); } window.print(); });
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
      a.innerHTML = esc(c.title || T.untitled) + '<small>' + esc(niceDate(c.at)) + (c.sheet ? (c.sheet.kind === 'call' ? ', call sheet' : ', visit sheet') : c.letter ? ', letter' : '') + '</small>';
      if (chat && c.id === chat.id && !location.hash.match(/^#\/(steps|breathe|phones|record)/)) a.setAttribute('aria-current', 'true');
      li.appendChild(a); ul.appendChild(li);
    });
  }
  function openChat(c) {
    chat = c; store.cur = c.id; save();
    document.querySelector('.paperscroll').scrollTop = 0;
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
    if ($('paperwrap').classList.contains('open')) { $('paperwrap').classList.remove('open'); document.body.style.overflow = ''; }
    p.innerHTML = '<div class="page-in"><a class="back" href="#">← Back to the chat</a>' + html + '</div>';
    p.hidden = false; p.scrollTop = 0;
    p.querySelector('.back').addEventListener('click', function (e) { e.preventDefault(); location.hash = ''; });
    [].forEach.call(document.querySelectorAll('.side-links a'), function (a) { if (a.dataset.page === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    closeSide(); renderHistory();
    var h = p.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function pagePhones() {
    showPage('phones', '<h1>Phone lines</h1><p class="lead">Next Step is an AI guide and is not staffed, so no one here will call you back. These are public lines, open to anyone.</p>' +
      '<ul class="lines">' + phones(true).map(function (p) { return '<li><span class="who"><b>' + esc(p.who) + '</b>' + esc(p.what) + '</span><a href="' + tel(p.num) + '">' + esc(p.num) + '</a></li>'; }).join('') + '</ul>' +
      srcLine(phones(true).map(function (p) { return p.src; }).filter(function (v, i, a) { return a.indexOf(v) === i; })) +
      (handoffs().length ? '<h2 class="h-more">Other places to turn</h2><ul class="lines handoffs">' + handoffs().map(function (h) { return '<li><span class="who"><b>' + esc(h.title.replace(/^United Policyholders, /, 'United Policyholders: ')) + '</b>' + esc(h.notes) + '</span><a href="' + esc(h.url) + '" target="_blank" rel="noopener">Open</a></li>'; }).join('') + '</ul>' : '') +
      '<p class="note">If someone is in danger right now, call 911.</p>');
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
    if (h === '#/record') return pageRecord(false);
    var st = h.match(/^#\/start\/(letter|msg|call|visit)$/);
    if (st) {
      history_replace('');
      if (!chat || chat.msgs.length) openChat(newChat()); else { closePage(); renderAll(); }
      if (st[1] === 'letter') return startWith('push', T.o_push);
      if (st[1] === 'msg') return startWith('msg', T.o_msg);
      chat.flow = st[1]; me(st[1] === 'call' ? T.k_call : T.k_visit); title(st[1] === 'call' ? 'Getting ready for a call' : 'Getting ready for a visit'); return nextStep();
    }
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
    if (chat.step === 'writing' || chat.step === 'reading') chat.step = (chat.letter || chat.sheet) ? 'free' : (chat.flow === 'reply' ? 'paste' : 'notes');
    renderAll(); renderHistory(); route();
    window.addEventListener('resize', function () { if (!isPhone()) closePaper(); });
  }
  fetch('/sources.json').then(function (r) { return r.json(); }).then(function (s) { SOURCES = s; }, function () {}).then(boot);
  window.__desk = { state: function () { return { chat: chat, store: store, paste: Object.keys(pasteMem).length }; } };
})();

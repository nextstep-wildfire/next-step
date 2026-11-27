/* Landing page script: English or Spanish words, theme, the floating nav and its phone menu, section reveals,
   the word by word tagline, and the scripted demo. Runs at the end of the page, before it paints.
   Motion is triggered by IntersectionObserver or one scroll listener throttled to a frame, never per scroll event. */
(function () {
  document.documentElement.classList.add('js');
  var LANG = window.nsLang && window.nsLang.current() === 'es' ? 'es' : 'en';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Spanish: an unreviewed draft, like the rest of the site's Spanish. */
  var ES = {
    skip: 'Saltar al contenido', navHow: 'Cómo funciona', navFaq: 'Preguntas', navLines: 'Líneas de ayuda', start: 'Empezar su carta',
    h1a: 'Una carta clara a su aseguradora', h1b: 'después de un incendio en California',
    sub: 'Cuando dicen que no, ofrecen menos o dejan de responder, conteste unas preguntas con unos toques. Next Step escribe una carta lista que pide una sola cosa concreta, lista para enviar.',
    ctaNote: 'Gratis y sin cuenta.',
    proof: 'Basado en guías públicas del Departamento de Seguros de California, United Policyholders, FEMA y Cal OES.',
    demoTitle: 'El Escritorio, escribiendo una carta',
    demoSr: 'Un ejemplo: a alguien su aseguradora le ofreció $42,300 frente a un presupuesto de contratista de $96,000. Responde cuatro preguntas con unos toques, y Next Step escribe una carta breve, en inglés, que pide explicar partida por partida cómo se calculó la oferta.',
    holder: 'Escriba lo que pasó o pegue su mensaje', yourLetter: 'Su carta', copy: 'Copiar', pdf: 'Descargar PDF',
    again: 'Verlo otra vez', demoFoot: 'Una carta real toma más o menos los mismos toques, con sus propios datos. La carta va en inglés, con lo que dice en español debajo.',
    pTitle1: 'Después de un incendio, gran parte del reclamo', pTitle2: 'sucede por escrito',
    pProblem: 'Una negativa. Una oferta muy por debajo del presupuesto de su contratista. Luego semanas de silencio. Cada una necesita una respuesta, por escrito, mientras usted se ocupa de todo lo demás que deja un incendio.',
    pSolution: 'Next Step convierte cada uno de esos momentos en un pedido claro, en palabras sencillas, y le dice qué pasa después.',
    line1: 'Cada palabra a su aseguradora cuenta.', line2: 'Que cada una sea la correcta.',
    bTitle: 'Listo para cada intercambio con su aseguradora',
    b1h: 'Sepa qué pedir', b1p: 'Cada pedido trae una nota sobre cuándo conviene, para que elija el que corresponde a lo que hicieron.',
    b2h: 'Entienda lo que le enviaron', b2p: 'Pegue su mensaje y léalo en palabras sencillas, con su respuesta ya escrita.',
    b3h: 'Llegue preparado a las llamadas', b3p: 'Una hoja para la llamada con qué decir primero, qué pedir y un registro para llenar mientras habla.',
    b4h: 'Esté listo para el ajustador', b4p: 'Una hoja para la visita con qué tener listo, qué preguntar y qué fotografiar.',
    b5h: 'Guarde un solo historial', b5p: 'Cada carta, llamada y visita en una lista que puede copiar, guardada en su dispositivo.',
    hTitle: 'Tres pasos hasta una carta lista',
    s1n: 'Paso 1', s1h: 'Cuente lo que pasó', s1p: 'Toque lo que hizo su aseguradora: dijo que no, ofreció menos o dejó de responder.',
    s2n: 'Paso 2', s2h: 'Elija un pedido', s2p: 'Elija la única cosa que quiere pedir. Cada opción dice cuándo conviene.',
    s3n: 'Paso 3', s3h: 'Envíela a su manera', s3p: 'Cópiela en un correo, ábrala en su aplicación de correo o descárguela como PDF. Usted decide cuándo se envía.',
    qTitle: 'Lo que dicen los sobrevivientes', qNote: 'Marcadores: aquí irán citas reales cuando las personas acepten compartirlas.',
    faqTitle: 'Preguntas antes de empezar',
    q1: '¿Next Step es gratis?', a1: 'Sí. No hay nada que pagar ni cuenta que crear.',
    q2: '¿Una persona lee lo que escribo?', a2: 'No. Next Step es una guía de IA, no una persona, y nadie de aquí le devolverá la llamada. Si necesita a una persona, las líneas públicas de abajo sí tienen personal.',
    q3: '¿Esto es asesoría legal o de seguros?', a3: 'No. Da información general tomada de fuentes públicas como el Departamento de Seguros de California y United Policyholders. Puede equivocarse, y lo que cuenta es su propia póliza.',
    q4: '¿Qué pasa con lo que escribo?', a4: 'Sus conversaciones, cartas e Historial se quedan en este navegador. Cuando pide una carta o una respuesta, lo que escribió se envía a la IA para escribirla y no lo guardamos. Deje fuera lo que no quiera compartir.',
    q5: '¿Esto me conseguirá más dinero?', a5: 'No puede prometer ningún resultado. Le ayuda a pedir una sola cosa clara a la vez, por escrito, para que su pedido quede claro y registrado.',
    q6: '¿Next Step envía la carta por mí?', a6: 'No. Usted la copia en un correo a su ajustador, la abre en su aplicación de correo o la descarga como PDF. Usted decide cuándo se envía.',
    q7: '¿Y si mi aseguradora responde?', a7: 'Pegue su respuesta en el Escritorio. Next Step se la explica en palabras sencillas, le sugiere qué pedir después y escribe su respuesta.',
    q8: '¿Puedo usarlo en español?', a8: 'Sí. Todo lo que es para usted está en español. Las cartas a su aseguradora van en inglés, que es lo que lee el ajustador, con una copia en español al lado.',
    fTitle: 'Empiece con una carta clara', r1: 'Gratis', r2: 'Sin cuenta que crear', r3: 'Usted decide cuándo se envía algo',
    bandTitle: 'Next Step no tiene personal. Estas líneas públicas sí.',
    n1: 'Departamento de Seguros de California, para su póliza o un desacuerdo con su aseguradora', n2: 'Asistencia por desastre de FEMA, para necesidades que el seguro no cubre', n3: '988 Línea de Prevención del Suicidio y Crisis, llame o envíe un mensaje de texto a cualquier hora',
    disclaimer: 'Next Step es una guía de IA, no una persona, y nadie de aquí le devolverá la llamada. Da información general tomada de fuentes públicas como el Departamento de Seguros de California y United Policyholders. No es asesoría legal ni de seguros, puede equivocarse, y lo que cuenta es su propia póliza.',
    foot1: 'Un proyecto estudiantil de la Fung Fellowship, hecho con la orientación de The After Collective.',
    foot2: 'Sus conversaciones, cartas e Historial se quedan en este navegador. Cuando pide una carta o una respuesta, lo que escribió se envía a la IA para escribirla y no lo guardamos. Solo contamos cuántas personas visitan el sitio, abren el Escritorio, copian o envían una carta por correo, o descargan un PDF, sin cookies y sin nada que diga quién es usted.',
    privacy: 'Privacidad', terms: 'Condiciones de uso',
    foot3: 'La versión en español es un borrador que todavía no ha revisado un hablante nativo.',
    darkMode: 'Modo oscuro', lightMode: 'Modo claro', langOther: 'English', openMenu: 'Abrir menú', closeMenu: 'Cerrar menú'
  };
  var EN = { darkMode: 'Dark mode', lightMode: 'Light mode', langOther: 'Español', openMenu: 'Open menu', closeMenu: 'Close menu' };
  var W = LANG === 'es' ? ES : EN;
  if (LANG === 'es') {
    document.documentElement.lang = 'es';
    [].forEach.call(document.querySelectorAll('[data-t]'), function (n) { var v = ES[n.dataset.t]; if (v) n.textContent = v; });
    var f3 = document.querySelector('[data-t="foot3"]'); if (f3) f3.hidden = false;
    document.title = 'Next Step: una carta clara a su aseguradora después de un incendio en California';
  }
  if (window.nsCount) window.nsCount('visit');

  // language and theme, in the nav and in the phone menu
  [document.getElementById('langBtn'), document.getElementById('langBtn2')].forEach(function (b) {
    if (!b) return; b.textContent = W.langOther; b.setAttribute('lang', LANG === 'es' ? 'en' : 'es');
    b.addEventListener('click', function () { window.nsLang.set(LANG === 'es' ? 'en' : 'es'); });
  });
  var tb = document.getElementById('themeBtn'), tb2 = document.getElementById('themeBtn2');
  function themeLabel() {
    var d = window.nsTheme && window.nsTheme.current() === 'dark';
    tb.setAttribute('aria-pressed', d ? 'true' : 'false'); tb.setAttribute('aria-label', d ? W.lightMode : W.darkMode); tb.title = d ? W.lightMode : W.darkMode;
    tb2.textContent = d ? W.lightMode : W.darkMode;
  }
  function toggleTheme() { window.nsTheme.toggle(); themeLabel(); }
  themeLabel(); tb.addEventListener('click', toggleTheme); tb2.addEventListener('click', toggleTheme);

  // phone menu: a full height panel; links arrive one after another, 60ms apart, the whole run capped at 400ms
  var mb = document.getElementById('menuBtn'), menu = document.getElementById('menu');
  function setMenu(open) {
    mb.setAttribute('aria-expanded', open ? 'true' : 'false'); mb.setAttribute('aria-label', open ? W.closeMenu : W.openMenu);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      var items = menu.querySelectorAll('li'), step = Math.min(60, 400 / Math.max(1, items.length));
      [].forEach.call(items, function (li, i) { li.style.transitionDelay = reduced ? '0ms' : Math.round(i * step) + 'ms'; });
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('open'); }); });
    } else { menu.classList.remove('open'); menu.hidden = true; }
  }
  mb.addEventListener('click', function () { setMenu(mb.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mb.getAttribute('aria-expanded') === 'true') { setMenu(false); mb.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1000 && !menu.hidden) setMenu(false); });

  // sections rise into place once as they enter; the nav marks the section being read
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(reveals, function (r) { ro.observe(r); });
    var links = {}; [].forEach.call(document.querySelectorAll('.navlink[href^="#"]'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var a = links[e.target.id]; if (!a) return; if (e.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); } else a.removeAttribute('aria-current'); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  } else [].forEach.call(reveals, function (r) { r.classList.add('in'); });

  // the tagline: each word comes up from a muted tone to full ink in reading order as the section scrolls through
  (function () {
    var h = document.getElementById('lineTitle');
    if (!h || reduced) return;
    var words = [];
    [].forEach.call(h.querySelectorAll('.ln'), function (ln) {
      var parts = ln.textContent.split(/(\s+)/); ln.textContent = '';
      parts.forEach(function (t) { if (!t) return; if (/^\s+$/.test(t)) { ln.appendChild(document.createTextNode(t)); return; } var w = document.createElement('span'); w.className = 'w'; w.textContent = t; ln.appendChild(w); words.push(w); });
    });
    var next = 0, queued = false;
    function check() {
      queued = false;
      var vh = window.innerHeight, r = h.getBoundingClientRect(), p = (vh * 0.6 - r.top) / (r.height + vh * 0.3);
      var want = Math.max(0, Math.min(words.length, Math.ceil(p * words.length)));
      while (next < want) { words[next].classList.add('on'); next++; }
      if (next >= words.length) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); }
    }
    function onScroll() { if (!queued) { queued = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
    check();
    window.__line = { lit: function () { return next; }, total: words.length };
  })();

  // the demo: the Desk's own materials playing one short scripted exchange, once, then resting. Nothing calls the AI.
  var dk = document.getElementById('dk'), thread = document.getElementById('dkThread'), input = document.getElementById('dkIn'), sheet = document.getElementById('dkSheet');
  if (!thread) return;
  var send = document.querySelector('.dk-send');
  var HOLDER = input.textContent;
  var NOTES = LANG === 'es' ? 'Ofrecieron $42,300. El presupuesto de mi contratista es de $96,000.' : 'They offered $42,300. My contractor’s estimate is $96,000.';
  var LETTER = [
    'Subject: Request for an explanation of the settlement offer, line by line',
    'Dear Claims Team,',
    'You offered $42,300 to settle the claim for my home. My contractor’s estimate to repair the damage is $96,000.',
    'Please explain in writing how you calculated the offer, line by line, and what it does not include.',
    'Please reply in writing within 15 calendar days of receiving this letter.',
    'Thank you,\n[your name]'
  ];
  var STEPS = LANG === 'es' ? [
    { a: null, q: '¿Qué está pasando con su aseguradora?', ch: ['Me pusieron trabas con el reclamo', 'Recibí un mensaje de ellos', 'Tengo una llamada o una visita pronto'], pick: 0 },
    { a: 'Es una situación difícil, y ponerlo por escrito es un buen siguiente paso. ¿Qué hicieron?', ch: ['Dijeron que no', 'Ofrecieron menos', 'Dejaron de responder'], pick: 1 },
    { a: '¿La vivienda es suya o la alquila?', ch: ['Es mía', 'La alquilo', 'No lo sé'], pick: 0, inline: true },
    { a: '¿Qué quiere pedirles? Un solo pedido por carta lo mantiene claro.', ch: [['Mostrar cómo se calculó la cifra, partida por partida', 'Elija esto si no entiende cómo llegaron a su cifra.'], ['Revisar el presupuesto de mi propio contratista', 'Elija esto si tiene un presupuesto propio para enviar.']], pick: 0 },
    { a: 'En pocas palabras, ¿qué pasó? Las fechas, cantidades y nombres ayudan.', type: NOTES }
  ] : [
    { a: null, q: 'What’s happening with your insurer?', ch: ['They pushed back on my claim', 'I got a message from them', 'A call or visit is coming up'], pick: 0 },
    { a: 'That’s a hard place to be, and putting it in writing is a good next step. What did they do?', ch: ['They said no', 'They offered less', 'They went quiet'], pick: 1 },
    { a: 'Do you own the home, or rent it?', ch: ['I own it', 'I rent it', 'Not sure'], pick: 0, inline: true },
    { a: 'What do you want to ask them for? One ask per letter keeps it clear.', ch: [['Show how the number was figured, line by line', 'Pick this if you can’t tell how they reached their number.'], ['Review my own contractor’s estimate', 'Pick this if you have your own estimate to send.']], pick: 0 },
    { a: 'In a few words, what happened? Dates, amounts and names help.', type: NOTES }
  ];
  var READY = LANG === 'es' ? 'Su carta está lista. Va en inglés, que es lo que su aseguradora lee, y debajo le muestro lo que dice en español.' : 'Your letter is ready. Fill in anything in [brackets], then copy it into an email to your adjuster.';
  var WRITING = LANG === 'es' ? 'Escribiendo su carta…' : 'Writing your letter…';
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
  function reset() { timers.forEach(clearTimeout); timers = []; thread.innerHTML = ''; sheet.innerHTML = ''; dk.classList.remove('has-paper'); input.textContent = HOLDER; input.classList.remove('typed'); send.classList.remove('on'); }
  function finished() {
    reset();
    STEPS.forEach(function (s) { if (s.a) thread.appendChild(el('p', 'a', s.a)); thread.appendChild(el('p', 'u', s.type || label(s.ch[s.pick]))); });
    thread.appendChild(el('p', 'a', READY)); dk.classList.add('has-paper'); letterLines(false);
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
        later(t, function () { s.box.children[s.pick].classList.add('on'); }); t += 450;
        later(t, function () { s.box.remove(); var q = thread.querySelector('.q'); if (q) q.remove(); thread.appendChild(el('p', 'u', label(s.ch[s.pick]))); }); t += 650;
      } else if (s.type) {
        later(t, function () { input.classList.add('typed'); input.textContent = ''; });
        for (var i = 1; i <= s.type.length; i++) (function (n) { later(t + n * 34, function () { input.textContent = s.type.slice(0, n); if (n === 3) send.classList.add('on'); }); })(i);
        t += s.type.length * 34 + 500;
        later(t, function () { input.textContent = HOLDER; input.classList.remove('typed'); send.classList.remove('on'); thread.appendChild(el('p', 'u', s.type)); }); t += 500;
      }
    });
    later(t, function () { thread.appendChild(el('p', 'a st', WRITING)); }); t += 1100;
    later(t, function () { thread.lastChild.remove(); dk.classList.add('has-paper'); letterLines(true); }); t += LETTER.length * 160 + 700;
    later(t, function () { thread.appendChild(el('p', 'a', READY)); running = false; });
  }
  reset();
  if (reduced) finished();
  else {
    thread.appendChild(el('p', 'q', STEPS[0].q));
    var box = el('div', 'dk-ch'); STEPS[0].ch.forEach(function (c) { box.appendChild(choice(c)); }); thread.appendChild(box);
    var played = false, go = function () { if (!played) { played = true; play(); } };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { threshold: 0.45 });
      io.observe(dk);
    } else go();
  }
  document.getElementById('dkAgain').addEventListener('click', function () { reduced ? finished() : play(); });
  window.__demo = { finished: finished, play: play, running: function () { return running; } };
})();

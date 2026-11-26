/* The landing drawing, played once: the frame draws in with its left corner post missing, a person walks up with a
   letter, posts it and lifts the mailbox flag, steps to the left of the house and knocks the corner post plumb, two
   front steps set at the door and the staked tree grows in. About 7 seconds, then it rests on the finished drawing.
   Under reduced motion (or with no script) it is simply the finished drawing.

   The person is a small hand-made rig drawn in the same 1.5px ink line: a head, a coat-shaped body, single-line limbs.
   Feet are planted on the ground and legs are solved from hip to ankle, so the feet never slide. The near side is
   drawn over the body, the far side behind it, and the head and body are filled with the paper so lines behind them
   are hidden, the way an ink drawing would leave them out. Nothing here loads a library. */
(function () {
  var svg = document.querySelector('.art svg');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var G = 250;                       // the ground line
  var END = 7.2;                     // seconds
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- small helpers ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function span(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function out(t) { return 1 - Math.pow(1 - t, 3); }
  function out2(t) { return 1 - (1 - t) * (1 - t); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  var D2R = Math.PI / 180;
  function f(n) { return Math.round(n * 100) / 100; }
  function pt(p) { return f(p[0]) + ' ' + f(p[1]); }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function polar(r, deg) { return [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)]; }
  function dist(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function angTo(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R; }
  // Two bones from root toward target; side +1 bends the joint backward (elbows), -1 forward (knees).
  function ik(root, target, a, b, side) {
    var d = clamp(dist(root, target), Math.abs(a - b) + 0.01, a + b - 0.01);
    var phi = angTo(root, target);
    var al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)) / D2R;
    var joint = add(root, polar(a, phi + side * al));
    var end = add(root, polar(d, phi));
    return [joint, end];
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }

  /* ---------- the drawing's own lines, each with the time it draws in ---------- */
  function draw(id, a, b) { return { e: svg.querySelector('[data-id="' + id + '"]'), a: a, b: b }; }
  var LINES = [
    draw('ground', 0.00, 0.70),
    draw('path', 0.45, 1.05),
    draw('mailpost', 0.15, 0.45),
    draw('mailbox', 0.30, 0.85),
    draw('maildoor', 0.75, 0.90),
    draw('flagpole', 0.80, 1.00),
    draw('plates', 0.30, 0.80),
    draw('post-r', 0.40, 0.75),
    draw('studs', 0.45, 0.95),
    draw('door', 0.70, 1.05),
    draw('window', 0.75, 1.10),
    draw('roof', 0.80, 1.25),
    draw('truss', 1.00, 1.40),
    draw('post-l', 4.00, 4.35),
    draw('steps', 6.12, 6.50),
    draw('stakes', 6.25, 6.50),
    draw('trunk', 6.35, 6.75),
    draw('tie', 6.65, 6.80),
    draw('leaf1', 6.60, 6.90),
    draw('leaf2', 6.70, 7.02),
    draw('leaf3', 6.80, 7.15)
  ].filter(function (l) { return l.e; });
  LINES.forEach(function (l) { l.e.setAttribute('pathLength', '1'); });
  var flag = svg.querySelector('[data-id="flag"]');
  var postL = svg.querySelector('[data-id="post-l"]');

  /* ---------- walking: planted footsteps, the pelvis rides between them ---------- */
  // P lists where feet land, in order; P[0] and P[1] are where the feet start (P[0] moves first, and it is the near
  // foot). During step k the foot at P[k-2] swings to P[k] over the foot planted at P[k-1].
  function walk(P, t0, durs, easeFirst, easeLast) {
    var steps = [], t = t0;
    for (var k = 2; k < P.length; k++) { steps.push({ k: k, a: t, b: t + durs[k - 2] }); t += durs[k - 2]; }
    return { P: P, steps: steps, a: t0, b: t, easeFirst: easeFirst, easeLast: easeLast };
  }
  var W1 = walk([-51, -28, -5, 18, 41, 64, 82, 86], -0.42, [0.38, 0.38, 0.38, 0.38, 0.40, 0.46], false, true);
  var W2 = walk([82, 86, 108, 130, 151, 172, 192, 181], 2.80, [0.40, 0.37, 0.37, 0.37, 0.38, 0.38], true, true);

  // Where each foot is, and how far the pelvis has gone, at time t inside a walk.
  function walkState(W, t) {
    var P = W.P, n = W.steps.length;
    var feet = { near: { x: P[0], s: -1 }, far: { x: P[1], s: -1 } }, px;
    if (t <= W.a) { px = (P[0] + P[1]) / 2; return { px: px, feet: feet, moving: false }; }
    for (var i = 0; i < n; i++) {
      var st = W.steps[i], k = st.k;
      var who = k % 2 === 0 ? 'near' : 'far', other = who === 'near' ? 'far' : 'near';
      if (t <= st.b || i === n - 1) {
        var u = span(t, st.a, st.b), ue = u;
        if (i === 0 && W.easeFirst) ue = u * u * (2 - u) * 0.9 + u * 0.1;
        if (i === n - 1 && W.easeLast) ue = out2(u);
        px = lerp((P[k - 2] + P[k - 1]) / 2, (P[k - 1] + P[k]) / 2, ue);
        var s = smooth(span(u, 0.08, 0.9));
        feet[who] = { x: lerp(P[k - 2], P[k], s), s: s, from: P[k - 2], to: P[k] };
        feet[other] = { x: P[k - 1], s: -1 };
        return { px: px, feet: feet, moving: t < W.b, u: u };
      }
    }
  }

  /* ---------- the whole performance as poses over time ---------- */
  var HIP = 29.2, TORSO = 17.3, THIGH = 15, SHIN = 15, UARM = 11.8, FARM = 11.8;
  var SLOT = [99.5, 216], FLAG_PIVOT = [103, 220], GRAB = 3, STRIKE_H = 42, HANDLE = 10;
  var TILT = [-7.5, -4.6, -2.0, 0];               // the corner post, knocked plumb in three strikes
  var HITS = [5.20, 5.62, 6.02];
  function postAngle(t) {
    var a = TILT[0];
    for (var i = 0; i < 3; i++) a = lerp(a, TILT[i + 1], out(span(t, HITS[i], HITS[i] + 0.06)));
    return a;
  }
  function onPost(ang, h) { return [212 + h * Math.sin(ang * D2R), G - h * Math.cos(ang * D2R)]; }
  function flagAngle(t) {
    // down (pointing toward the back of the box) until the hand lifts it; it settles with one small wobble
    if (t < 2.52) return 90;
    if (t < 2.80) return 90 * (1 - inOut(span(t, 2.52, 2.80)));
    var tau = t - 2.80;
    return -6 * Math.exp(-tau / 0.12) * Math.sin(tau / 0.11 * Math.PI);
  }
  function grabPoint(a) { return add(FLAG_PIVOT, [GRAB * Math.sin(a * D2R), -GRAB * Math.cos(a * D2R)]); }

  // The hammer stroke: from a raised pose behind the head to the post, then a small recoil.
  function strike(t) {
    // returns { phase, w (0..1 swing amount), psi, recoil } for the hammer arm, or null outside the hammering
    var raiseA = [4.80, 5.34, 5.76], hold = 0.05, swing = 0.10;
    for (var i = 2; i >= 0; i--) {
      var hit = HITS[i], sA = hit - swing, rA = raiseA[i], rB = sA - hold;
      if (t >= rA) return { i: i, raise: inOut(span(t, rA, rB)), swing: Math.pow(span(t, sA, hit), 2.1), after: t - hit, hit: hit };
    }
    return null;
  }

  function pose(t) {
    var w = t < W2.a ? walkState(W1, t) : walkState(W2, t);
    var px = w.px, feet = w.feet;
    var lean = 0, dy = 0, dx = 0;
    // speed lean while walking
    var walking = (t > W1.a && t < W1.b) || (t > W2.a && t < W2.b);
    if (walking) {
      var e1 = t < W2.a ? 1 - smooth(span(t, W1.b - 0.35, W1.b)) : smooth(span(t, W2.a, W2.a + 0.25)) * (1 - smooth(span(t, W2.b - 0.3, W2.b)));
      lean += 3.5 * e1;
    }
    // posting and the flag: lean in, then back
    lean += 4 * smooth(span(t, 1.80, 2.10)) * (1 - smooth(span(t, 2.25, 2.40)));
    lean += 14 * smooth(span(t, 2.30, 2.50)) * (1 - smooth(span(t, 2.70, 2.95)));
    // the strikes: weight back on the raise, forward through the hit, a small dip on contact
    var sk = strike(t);
    if (sk) {
      var back = sk.raise * (1 - sk.swing);
      lean += -3 * back + 6 * sk.swing * (sk.after < 0 ? 1 : Math.exp(-Math.max(0, sk.after) / 0.12));
      dx += -1 * back + 1.4 * sk.swing;
      if (sk.after >= 0) dy += 1.1 * Math.exp(-sk.after / 0.08) * Math.min(1, sk.after / 0.02 + 0.3);
      if (sk.i === 2 && sk.after > 0) {
        var settle = smooth(span(t, HITS[2] + 0.15, HITS[2] + 0.6));
        lean = lerp(lean, -1.5, settle); dx = lerp(dx, 0, settle);
      }
    }
    // after the last strike: stand easy and look up at the frame
    px += dx;

    // pelvis height: as tall as the legs allow, with a little bob
    var ankle = function (ft) {
      if (ft.s < 0) return [ft.x, G - 1.3, 18];
      var lift = 4.2 * Math.sin(Math.PI * ft.s) * (ft.to > ft.from ? 1 : 0.7);
      var pitch = 18 + 26 * (1 - ft.s) * Math.sin(Math.PI * ft.s) - 22 * ft.s * Math.sin(Math.PI * ft.s);
      return [ft.x, G - 1.3 - lift, pitch];
    };
    var aN = ankle(feet.near), aF = ankle(feet.far);
    var py = G - HIP;
    if (w.u != null && walking) py += 0.9 * (1 + Math.cos(2 * Math.PI * w.u)) / 2;
    [aN, aF].forEach(function (a, ix) {
      var ft = ix ? feet.far : feet.near;
      if (ft.s < 0 || ft.s >= 1) { var dxa = a[0] - px; py = Math.max(py, a[1] - Math.sqrt(Math.max(0, 29.6 * 29.6 - dxa * dxa))); }
    });
    py += dy;
    return { t: t, px: px, py: py, lean: lean, aN: aN, aF: aF, feet: feet, sk: sk, walking: walking };
  }

  /* ---------- the person ---------- */
  // the person walks behind the mailbox, in front of the house; the flag is on the far side of the box
  var layer = el('g', { 'class': 'who' });
  svg.insertBefore(layer, svg.querySelector('[data-id="mailpost"]'));
  var clip = el('clipPath', { id: 'rbSlot' }, el('defs', {}, svg));
  // everything except the inside of the mailbox, so the letter disappears into the slot
  el('path', { d: 'M-60 -60H540V360H-60Z M98 202H140V224H98Z', 'clip-rule': 'evenodd' }, clip);
  var farArm = el('path', {}, layer), hammer = el('path', { 'class': 'tool' }, layer), farLeg = el('path', {}, layer);
  var body = el('path', { 'class': 'fill' }, layer), head = el('circle', { 'class': 'fill', r: '5.2' }, layer);
  var nearLeg = el('path', {}, layer), nearArm = el('path', {}, layer);
  var letter = el('path', { 'class': 'fill', 'clip-path': 'url(#rbSlot)' }, layer);

  function render(t) {
    // the drawing's lines
    LINES.forEach(function (l) {
      var p = span(t, l.a, l.b);
      if (p >= 1) { l.e.style.strokeDasharray = ''; l.e.style.strokeDashoffset = ''; l.e.style.visibility = ''; }
      else { l.e.style.strokeDasharray = '1 1'; l.e.style.strokeDashoffset = String(1 - smooth(p)); l.e.style.visibility = p <= 0 ? 'hidden' : ''; }
    });
    var fa = flagAngle(t);
    flag.setAttribute('transform', Math.abs(fa) < 0.01 ? '' : 'rotate(' + f(fa) + ' ' + FLAG_PIVOT[0] + ' ' + FLAG_PIVOT[1] + ')');
    flag.style.visibility = t < 0.95 ? 'hidden' : '';
    flag.style.opacity = String(span(t, 0.95, 1.1));
    var pa = postAngle(t);
    postL.setAttribute('transform', Math.abs(pa) < 0.01 ? '' : 'rotate(' + f(pa) + ' 212 250)');

    var P = pose(t);
    var H = [P.px, P.py];
    var th = P.lean * D2R, U = [Math.sin(th), -Math.cos(th)], F = [Math.cos(th), Math.sin(th)];
    function at(u, v) { return [H[0] + u * U[0] + v * F[0], H[1] + u * U[1] + v * F[1]]; }

    // body: a plain coat shape, rounded at the shoulders
    body.setAttribute('d', 'M' + pt(at(-0.4, -4.2)) + 'Q' + pt(at(7, -5.3)) + ' ' + pt(at(14, -4.5)) + 'C' + pt(at(16.6, -4.4)) + ' ' + pt(at(TORSO, -3)) + ' ' + pt(at(TORSO, 0)) +
      'C' + pt(at(TORSO, 3)) + ' ' + pt(at(16.6, 4.4)) + ' ' + pt(at(14, 4.3)) + 'Q' + pt(at(7, 4.5)) + ' ' + pt(at(0.2, 4)) + 'Q' + pt(at(-0.6, -0.1)) + ' ' + pt(at(-0.4, -4.2)) + 'Z');
    var C = add(at(23.4, 0.7), [0, 0]);
    head.setAttribute('cx', f(C[0])); head.setAttribute('cy', f(C[1]));

    // legs
    function leg(e, root, a) {
      var k = ik(root, [a[0], a[1]], THIGH, SHIN, -1);
      var toe = add(k[1], polar(3.8, a[2]));
      e.setAttribute('d', 'M' + pt(root) + soft(root, k[0], k[1], 0.75) + 'L' + pt(toe));
    }
    leg(farLeg, at(0.4, -0.7), P.aF);
    leg(nearLeg, at(0.4, 0.7), P.aN);

    // arms
    var S = at(15.4, 0.2);
    function fwd(ft) { return clamp((ft[0] - H[0]) / 12, -1, 1); }
    function swingHand(amt, legFwd, R) {
      var b = -amt * legFwd;                        // arms swing against the same-side leg
      return add(S, polar(R - 1.4 * Math.max(0, b / amt), 90 - b - P.lean * 0.6));
    }
    var swingN = P.walking ? 20 : 0, swingF = P.walking ? 11 : 0;

    // near hand: carries the letter, posts it, lifts the flag, then swings free or rests
    var t0 = P.t, hN, rest = add(S, polar(21.6, 92 - P.lean));
    var hold = add(S, [5.4 + 0.8 * Math.sin(t0 * 7), 15.6]);
    if (t0 < 1.80) hN = hold;
    else if (t0 < 2.10) {                            // up and back from the waist, so the letter clears the box
      var q = span(t0, 1.80, 2.10);
      hN = [lerp(hold[0], 87.5, out(q)), lerp(hold[1], SLOT[1], inOut(q))];
    } else if (t0 < 2.27) {                          // into the slot
      hN = [lerp(87.5, SLOT[0], inOut(span(t0, 2.10, 2.27))), SLOT[1]];
    } else if (t0 < 2.52) {                          // along the box to the flag
      var q2 = inOut(span(t0, 2.27, 2.52));
      var g0 = grabPoint(90);
      hN = [lerp(SLOT[0], g0[0], q2), lerp(SLOT[1], g0[1], q2) + 2.5 * Math.sin(Math.PI * q2)];
    } else if (t0 < 2.80) {
      hN = grabPoint(flagAngle(t0));
    } else {
      var off = grabPoint(0);
      var free = P.walking || t0 < W2.b ? swingHand(swingN, fwd(P.aN), 21.4) : rest;
      if (P.sk) free = add(S, polar(18.5, 78 - P.lean));
      hN = lerp2(off, free, inOut(span(t0, 2.80, 3.15)));
      if (P.sk && P.sk.i === 2 && P.sk.after > 0) hN = lerp2(hN, rest, smooth(span(t0, HITS[2] + 0.2, HITS[2] + 0.75)));
    }
    var aNk = ik(S, hN, UARM, FARM, 1);
    nearArm.setAttribute('d', 'M' + pt(S) + soft(S, aNk[0], aNk[1], 0.9));

    // the letter rides in the near hand until it is posted
    if (t0 < 2.27) {
      var lx = aNk[1][0] + 0.6, ly = aNk[1][1];
      letter.setAttribute('d', 'M' + pt([lx, ly - 3.4]) + 'H' + f(lx + 10) + 'V' + f(ly + 3.4) + 'H' + f(lx) + 'Z M' + pt([lx, ly - 3.4]) + 'L' + pt([lx + 5, ly + 0.4]) + 'L' + pt([lx + 10, ly - 3.4]));
      letter.style.visibility = '';
    } else letter.style.visibility = 'hidden';

    // far hand: carries the hammer the whole way, then the three strikes
    var hF, psi, hang = swingHand(swingF || 1, P.walking ? fwd(P.aF) : 0, 21.2);
    var psiHang = 90 + (P.walking ? 7 * fwd(P.aF) : 0);
    hF = hang; psi = psiHang;
    if (P.sk) {
      var sk = P.sk, i = sk.i;
      // at contact the handle stands nearly upright and the head's face meets the post square on
      var CPSI = -80, cdir = polar(1, CPSI), cn = [-cdir[1], cdir[0]];
      function contactAt(ang) { var tip = onPost(ang, STRIKE_H); var hc = [tip[0] - 0.4 - 2.8 * cn[0], tip[1] - 2.8 * cn[1]]; return [hc[0] - cdir[0] * HANDLE, hc[1] - cdir[1] * HANDLE]; }
      var contactW = contactAt(postAngle(sk.hit - 0.001));
      var raisedW = add(S, [-2, -12.5]);
      var raisedPsi = -152;
      var fromW, fromPsi;
      if (i === 0) { fromW = hang; fromPsi = psiHang; }
      else { var k0 = Math.exp(-0.08 / 0.07); fromW = add(contactAt(postAngle(HITS[i - 1] + 0.1)), [-1.4 * k0, 0.6 * k0]); fromPsi = CPSI - 10 * k0; }
      function polarLerp(A, B, q, viaFront) {
        var ra = dist(S, A), rb = dist(S, B), pa = angTo(S, A), pb = angTo(S, B);
        if (viaFront && pa > 0 && pb < -60) { /* down to up through the front */ }
        return add(S, polar(lerp(ra, rb, q), lerp(pa, pb, q)));
      }
      if (sk.swing <= 0) { hF = polarLerp(fromW, raisedW, sk.raise); psi = lerp(fromPsi, raisedPsi, sk.raise); }
      else if (sk.after < 0) { hF = polarLerp(raisedW, contactW, sk.swing); psi = lerp(raisedPsi, CPSI, Math.pow(sk.swing, 1.6)); }
      else {
        // the head rides the post over for a moment, then comes off it a little
        var r = sk.after, rr = Math.max(0, r - 0.06), kick = r < 0.06 ? 0 : Math.exp(-rr / 0.07) * Math.sin(Math.min(1, rr / 0.04) * Math.PI / 2);
        hF = add(contactAt(postAngle(t0)), [-1.4 * kick, 0.6 * kick]);
        psi = CPSI - 10 * kick;
        if (i === 2) {                                 // lower the hammer and stand easy
          var low = inOut(span(r, 0.18, 0.7));
          hF = polarLerp(hF, add(S, polar(20.2, 70 - P.lean)), low); psi = lerp(psi, 28, low);
        }
      }
    }
    var aFk = ik(S, hF, UARM, FARM, 1);
    farArm.setAttribute('d', 'M' + pt(S) + soft(S, aFk[0], aFk[1], 0.9));
    var W = aFk[1], dir = polar(1, psi), nrm = [-dir[1], dir[0]];
    var hc = add(W, [dir[0] * HANDLE, dir[1] * HANDLE]);
    function hp(n, d) { return pt([hc[0] + nrm[0] * n + dir[0] * d, hc[1] + nrm[1] * n + dir[1] * d]); }
    hammer.setAttribute('d', 'M' + pt(add(W, [-dir[0] * 1.2, -dir[1] * 1.2])) + 'L' + hp(0, 0) +
      'M' + hp(2.9, -0.9) + 'L' + hp(2.9, 0.9) + 'L' + hp(-0.6, 0.9) + 'L' + hp(-0.6, -0.9) + 'Z' +
      'M' + hp(-0.6, 0) + 'Q' + hp(-2.6, 0.1) + ' ' + hp(-3.6, -1.6));
  }
  // a limb as one soft stroke that bends at the joint, the way a pen would draw it
  function soft(a, j, b, k) { var m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return 'Q' + pt([j[0] + (j[0] - m[0]) * k, j[1] + (j[1] - m[1]) * k]) + ' ' + pt(b); }
  function lerp2(a, b, q) { return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)]; }

  /* ---------- playing it once ---------- */
  var raf = 0, clock = 0, last = 0, done = false;
  function frame(now) {
    clock += Math.min(0.05, (now - last) / 1000); last = now;
    if (clock >= END) { render(END); done = true; svg.classList.add('rested'); return; }
    render(clock); raf = requestAnimationFrame(frame);
  }
  function play() { cancelAnimationFrame(raf); clock = 0; done = false; svg.classList.remove('rested'); last = performance.now(); render(0); raf = requestAnimationFrame(frame); }
  function seek(t) { cancelAnimationFrame(raf); render(clamp(t, 0, END)); }

  if (reduced) { render(END); done = true; svg.classList.add('rested'); }
  else {
    render(0);
    var go = function () { setTimeout(play, 150); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { threshold: 0.5 });
      io.observe(svg);
    } else go();
  }
  window.__rebuild = { END: END, seek: seek, play: play, done: function () { return done; } };
})();

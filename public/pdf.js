/* Next Step: a real PDF of any paper, made in the browser. No library and no outside request.
   It uses the PDF standard fonts (Times for the paper, Helvetica for small labels), so the file is small and
   opens anywhere. Text is set in WinAnsi, which covers English and Spanish (á é í ó ú ñ ü ¿ ¡ and curly quotes).
   Widths below are the standard font metrics (1000 units per em), so lines wrap where they will print.

   nsPdf.make(blocks, opts) returns a Blob. Each block is { k: kind, t: text }:
     subj   bold heading line          p      a paragraph
     label  small sans label            li     a list line with a hollow square
     say    an italic paragraph         small  a small sans note
     field  a log line: { k, l: label, t: value }   gap    extra space */
(function () {
  'use strict';
  /* Advance widths for WinAnsi bytes 32 to 255. */
  var W = {
      "Times-Roman": [250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,0,744,0,333,500,444,1000,500,500,333,1000,556,333,889,0,611,0,0,333,333,444,444,350,500,1000,333,980,389,333,722,0,444,722,250,333,500,500,500,500,200,500,333,760,276,500,564,333,760,333,400,549,300,300,333,576,453,250,333,300,310,500,750,750,750,444,722,722,722,722,722,722,889,667,611,611,611,611,333,333,333,333,722,722,722,722,722,722,722,564,722,722,722,722,722,722,556,500,444,444,444,444,444,444,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,549,500,500,500,500,500,500,500,500],
      "Times-Bold": [250,333,555,500,500,1000,833,278,333,333,500,570,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,930,722,667,722,722,667,611,778,778,389,500,778,667,944,722,778,611,778,722,556,667,722,722,1000,722,722,667,333,278,333,581,500,333,500,556,444,556,444,333,500,556,278,333,556,278,833,556,500,556,556,444,389,333,556,500,722,500,500,444,394,220,394,520,0,744,0,333,500,500,1000,500,500,333,1000,556,333,1000,0,667,0,0,333,333,500,500,350,500,1000,333,1000,389,333,722,0,444,722,250,333,500,500,500,500,220,500,333,747,300,500,570,333,747,333,400,549,300,300,333,576,540,250,333,300,330,500,750,750,750,500,722,722,722,722,722,722,1000,722,667,667,667,667,389,389,389,389,722,722,778,778,778,778,778,570,778,722,722,722,722,722,611,556,500,500,500,500,500,500,722,444,444,444,444,444,278,278,278,278,500,556,500,500,500,500,500,549,500,556,556,556,556,500,556,500],
      "Times-Italic": [250,333,420,500,500,833,778,214,333,333,500,675,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,675,675,675,500,920,611,611,667,722,611,611,722,722,333,444,667,556,833,667,722,611,722,611,500,556,722,611,833,611,556,556,389,278,389,422,500,333,500,500,444,500,444,278,500,500,278,278,444,278,722,500,500,500,500,389,389,278,500,444,667,444,444,389,400,275,400,541,0,744,0,333,500,556,889,500,500,333,1000,500,333,944,0,556,0,0,333,333,556,556,350,500,889,333,980,389,333,667,0,389,556,250,389,500,500,500,500,275,500,333,760,276,500,675,333,760,333,400,549,300,300,333,576,523,250,333,300,310,500,750,750,750,500,611,611,611,611,611,611,889,667,611,611,611,611,333,333,333,333,722,667,722,722,722,722,722,675,722,722,722,722,722,556,611,500,500,500,500,500,500,500,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,549,500,500,500,500,500,444,500,444],
      "Helvetica": [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,744,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,549,333,333,333,576,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,549,611,556,556,556,556,500,556,500],
      "Helvetica-Bold": [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,744,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,549,333,333,333,576,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,549,611,611,611,611,611,556,611,556],
    };
  var FONT = { R: 'Times-Roman', B: 'Times-Bold', I: 'Times-Italic', S: 'Helvetica', SB: 'Helvetica-Bold' };
  var KEY = { R: 'F1', B: 'F2', I: 'F3', S: 'F4', SB: 'F5' };
  /* Unicode to WinAnsi for the characters outside Latin-1 that letters use. */
  var EXTRA = { 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x2026: 0x85, 0x20AC: 0x80, 0x2122: 0x99 };
  function ansi(s) {
    var out = '';
    s = String(s == null ? '' : s).normalize('NFC');
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c === 9) c = 32;
      if (c >= 32 && c < 127) out += s[i];
      else if (c >= 160 && c <= 255) out += String.fromCharCode(c);
      else if (EXTRA[c]) out += String.fromCharCode(EXTRA[c]);
      else if (c === 0x2192) out += '->';
      else if (c >= 0xD800 && c <= 0xDBFF) { i++; }
      else if (c === 10) out += '\n';
      else if (c !== 13) out += '?';
    }
    return out;
  }
  function width(str, f, size) {
    var w = W[FONT[f]], n = 0;
    for (var i = 0; i < str.length; i++) { var b = str.charCodeAt(i); n += (b >= 32 && b <= 255 ? w[b - 32] : 500) || 500; }
    return n * size / 1000;
  }
  function wrap(str, f, size, max) {
    var words = str.split(/ +/), lines = [], cur = '';
    words.forEach(function (wd) {
      var t = cur ? cur + ' ' + wd : wd;
      if (width(t, f, size) <= max || !cur) {
        // a single word wider than the line (a long link) is cut so it never runs off the page
        while (!cur && width(t, f, size) > max && t.length > 1) {
          var k = t.length; while (k > 1 && width(t.slice(0, k), f, size) > max) k--;
          lines.push(t.slice(0, k)); t = t.slice(k);
        }
        cur = t;
      } else { lines.push(cur); cur = wd; }
    });
    if (cur || !lines.length) lines.push(cur);
    return lines;
  }
  function esc(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function num(n) { return (Math.round(n * 100) / 100).toString(); }

  var STYLE = {
    subj: { f: 'B', size: 13, lead: 18, before: 0, after: 14 },
    p: { f: 'R', size: 11.5, lead: 16, before: 0, after: 10 },
    say: { f: 'I', size: 11.5, lead: 16, before: 0, after: 10 },
    li: { f: 'R', size: 11.5, lead: 15.5, before: 0, after: 5, indent: 16 },
    lim: { f: 'B', size: 11.5, lead: 15.5, before: 0, after: 5, indent: 16 },
    label: { f: 'SB', size: 8.5, lead: 12, before: 12, after: 6, rule: true },
    small: { f: 'S', size: 8.5, lead: 12, before: 0, after: 6 },
    meta: { f: 'S', size: 9.5, lead: 13, before: 0, after: 8 },
    field: { f: 'R', size: 11, lead: 15, before: 0, after: 7 },
    gap: { f: 'R', size: 11, lead: 8, before: 0, after: 0 }
  };

  function make(blocks, opts) {
    opts = opts || {};
    var PW = 612, PH = 792, M = 72, TOP = PH - 72, BOTTOM = 72, MAXW = PW - 2 * M;
    var pages = [], ops = null, y = 0;
    function newPage() { ops = []; pages.push(ops); y = TOP; }
    function text(x, yy, f, size, s) { ops.push('BT /' + KEY[f] + ' ' + num(size) + ' Tf ' + num(x) + ' ' + num(yy) + ' Td (' + esc(s) + ') Tj ET'); }
    function rule(x1, x2, yy, gray) { ops.push(num(gray) + ' G 0.5 w ' + num(x1) + ' ' + num(yy) + ' m ' + num(x2) + ' ' + num(yy) + ' l S 0 G'); }
    function box(x, yy, s) { ops.push('0.35 G 0.6 w ' + num(x) + ' ' + num(yy) + ' ' + num(s) + ' ' + num(s) + ' re S 0 G'); }
    newPage();
    blocks.forEach(function (b, bi) {
      var st = STYLE[b.k] || STYLE.p;
      if (b.k === 'gap') { y -= st.lead; return; }
      var indent = st.indent || 0;
      if (b.k === 'field') {
        var lab = ansi(b.l || '') + ':', val = ansi(b.t || '');
        var lw = Math.min(150, width(lab, 'SB', 9.5) + 8);
        var vlines = val ? [].concat.apply([], val.split(/\r?\n/).map(function (x) { return wrap(x, 'R', st.size, MAXW - 150); })) : [''];
        var need = Math.max(1, vlines.length) * st.lead + st.after;
        if (y - need < BOTTOM) newPage();
        text(M, y - st.size, 'SB', 9.5, lab);
        vlines.forEach(function (ln, i) { if (ln) text(M + 150, y - st.size - i * st.lead, 'R', st.size, ln); });
        rule(M + 150, PW - M, y - st.size - (vlines.length - 1) * st.lead - 4, 0.75);
        y -= vlines.length * st.lead + st.after;
        return;
      }
      var paras = ansi(b.t).split(/\r?\n/);
      var lines = [].concat.apply([], paras.map(function (x) { return wrap(x, st.f, st.size, MAXW - indent); }));
      // keep a label with at least two lines of what follows it
      var keep = st.rule ? st.before + st.lead + 2 * 16 : 0;
      if (y - st.before - Math.min(lines.length, 2) * st.lead - keep < BOTTOM && y !== TOP) newPage();
      if (y !== TOP) y -= st.before;
      if (st.rule) { rule(M, PW - M, y + 4, 0.8); y -= 6; }
      lines.forEach(function (ln, i) {
        if (y - st.lead < BOTTOM) newPage();
        if (i === 0 && (b.k === 'li' || b.k === 'lim')) box(M + 2, y - st.size * 0.62 - 1.5, 4.2);
        text(M + indent, y - st.size, st.f, st.size, ln);
        y -= st.lead;
      });
      y -= st.after;
    });
    // page numbers and the one quiet footer line, only when it runs past one page or a footer is given
    var foot = opts.footer ? ansi(opts.footer) : '';
    pages.forEach(function (p, i) {
      var parts = [];
      if (foot) parts.push(foot);
      if (pages.length > 1) parts.push((opts.pageWord || 'Page') + ' ' + (i + 1) + ' / ' + pages.length);
      if (parts.length) { ops = p; text(M, 40, 'S', 8, parts.join('   ')); }
    });

    // assemble the file: catalog, page tree, five fonts, then each page and its content stream
    var objs = [];
    function add(s) { objs.push(s); return objs.length; }
    var cat = add(''), tree = add('');
    var fonts = ['R', 'B', 'I', 'S', 'SB'].map(function (k) { return add('<< /Type /Font /Subtype /Type1 /BaseFont /' + FONT[k] + ' /Encoding /WinAnsiEncoding >>'); });
    var kids = [];
    pages.forEach(function (p) {
      var stream = p.join('\n');
      var c = add('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
      kids.push(add('<< /Type /Page /Parent ' + tree + ' 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /Font << ' + fonts.map(function (f, i) { return '/F' + (i + 1) + ' ' + f + ' 0 R'; }).join(' ') + ' >> >> /Contents ' + c + ' 0 R >>'));
    });
    objs[cat - 1] = '<< /Type /Catalog /Pages ' + tree + ' 0 R >>';
    objs[tree - 1] = '<< /Type /Pages /Kids [' + kids.map(function (k) { return k + ' 0 R'; }).join(' ') + '] /Count ' + kids.length + ' >>';
    var info = add('<< /Title (' + esc(ansi(opts.title || 'Next Step')) + ') /Producer (Next Step) >>');
    var out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', offs = [];
    objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    var xref = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(function (o) { return ('000000000' + o).slice(-10) + ' 00000 n \n'; }).join('');
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + cat + ' 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    var bytes = new Uint8Array(out.length);
    for (var i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return { bytes: bytes, pages: pages.length };
  }
  function download(blocks, opts) {
    var r = make(blocks, opts);
    var blob = new Blob([r.bytes], { type: 'application/pdf' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (opts && opts.file) || 'next-step.pdf';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    return r;
  }
  var api = { make: make, download: download, ansi: ansi, width: width };
  if (typeof window !== 'undefined') window.nsPdf = api;
  if (typeof module !== 'undefined') module.exports = api;
})();

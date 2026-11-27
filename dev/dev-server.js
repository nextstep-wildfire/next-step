// Local test server: serves ./public and runs the real Pages Function logic with a mocked AI binding.
// Usage: node dev/dev-server.js [port]   (set MOCK=off to simulate no AI, MOCK=quota to simulate the daily limit,
// or ANTHROPIC_API_KEY=... to talk to the real model instead of the pretend one)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handle } from '../lib/core.js';
import { handleCount, handleFeedback } from '../lib/events.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SOURCES = JSON.parse(fs.readFileSync(path.join(root, 'sources.json'), 'utf8'));
const port = Number(process.argv[2] || 8788);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.woff2': 'font/woff2', '.png': 'image/png', '.xml': 'application/xml', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
// With CSP=on, the same security headers the deployed site sends (public/_headers), so a blocked request shows up locally.
// Off by default because the test tool itself evaluates strings, which the policy rightly forbids.
function headersFor(pathname) {
  const out = {}; let on = false;
  if (process.env.CSP !== 'on') return out;
  for (const line of fs.readFileSync(path.join(root, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { on = line.trim() === '/*' || line.trim() === pathname || (line.trim().endsWith('/*') && pathname.startsWith(line.trim().slice(0, -1))); continue; }
    if (on) { const i = line.indexOf(':'); out[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  }
  return out;
}
export const calls = [];
// Counts and feedback the pretend site received (the real one writes to Cloudflare); FEEDBACK=on pretends an inbox is set up.
export const counts = [];
export const feedback = [];

// Wraps a finished answer as a Workers AI style event stream, in small pieces so a word, a [n] source number or the
// ACTION line can be split across pieces. MOCK_DELAY (ms) slows it down for tests.
function sseOf(text) {
  const enc = new TextEncoder();
  const pieces = text.match(/[\s\S]{1,7}/g) || [];
  const delay = Number(process.env.MOCK_DELAY || 0);
  return new ReadableStream({
    async start(c) {
      for (const piece of pieces) {
        c.enqueue(enc.encode('data: ' + JSON.stringify({ response: piece, p: 'x' }) + '\n\n'));
        if (delay) await new Promise((r) => setTimeout(r, delay));
      }
      c.enqueue(enc.encode('data: [DONE]\n\n'));
      c.close();
    },
  });
}

const mockAI = {
  async run(model, input) {
    const out = await mockAI.answer(model, input);
    if (input.stream && out && typeof out.response === 'string') return sseOf(out.response);
    return out;
  },
  async answer(model, input) {
    const mode = process.env.MOCK || 'ok';
    if (mode === 'quota') { const e = new Error('4006: you have used up your daily free allocation of 10,000 neurons'); throw e; }
    const sys = input.messages[0].content;
    const last = input.messages[input.messages.length - 1].content;
    calls.push({ model, sysHead: sys.slice(0, 60), sys, stream: !!input.stream, last: String(last).slice(0, 200), userFull: String(last) });
    if (process.env.DEMO && sys.startsWith('Write a short letter')) {
      return { response: 'Subject: Request for a written claim status update\n\nDear Claims Team,\n\nI reported my claim in January and sent photos of the damage to my home. For the past seven weeks I have called and emailed my adjuster and have not received a reply.\n\nPlease send me a written update on my claim status and the next step.\n\nPlease reply in writing within 15 calendar days of receiving this letter. I am keeping a record of all communication on this claim.\n\nThank you,\n[your name]' };
    }
    if (sys.startsWith('Write a short letter')) {
      const ask = (last.match(/ASK: (.*)/) || [])[1] || '';
      return { response: 'Subject: Request regarding my claim\n\nDear Claims Team,\n\nI am writing about my claim after the wildfire. My adjuster has not responded for several weeks and I need to move forward.\n\n' + ask + '\n\nPlease reply in writing within 15 calendar days of receiving this letter.\n\nThank you,\n[your name]' };
    }
    if (sys.startsWith('You help a California wildfire survivor get ready')) {
      const notes = (last.match(/<notes>([\s\S]*?)<\/notes>/) || [])[1] || '';
      const call = /SHEET: phone call/.test(last);
      if (/ECHO/.test(notes)) return { response: 'SAY: Hi, my name is [your name]. I am calling about claim HO-77812. Please send me a written update on my claim status and the next step.\nPOINT: I want to confirm that my claim number is HO-77812.\nPOINT: I would like the written update to include the current status of my claim.\nPOINT: I need to know what the next step is in the claims process.' };
      const pts = notes.trim() ? notes.split(/[.;]\s*/).filter((x) => x.trim()).slice(0, 3).map((x) => 'POINT: ' + x.trim() + '.') : [];
      return { response: (call ? 'SAY: Hi, my name is [your name], and I am calling about claim [claim number]. I would like you to explain in writing how you calculated the offer, line by line.' : 'SAY: Hi, I am [your name], and this is the home on claim [claim number]. I would like to show you all of the damage, and to get a written scope of work afterward.') + '\n' + pts.join('\n') };
    }
    // Spanish copy of English lines. The pretend translation keeps every number and blank, and can be told to
    // misbehave (an invented number, an added opinion) to prove the checks catch it.
    if (sys.startsWith('You translate short English lines')) {
      const lines = [...String(last).matchAll(/^P(\d+): (.*)$/gm)];
      return { response: lines.map(([, n, t]) => 'P' + n + ': ' + (/GLOSSBAD/.test(t) ? 'Ustedes ofrecieron $99,999, que parece muy baja.' : 'En español: ' + t.replace(/\bI am writing about\b/, 'Le escribo sobre').replace(/\bmy claim\b/g, 'mi reclamo'))).join('\n') };
    }
    if (sys.startsWith('You explain a message') && /FALLBACK/.test(last)) return { response: 'Your insurer is offering $42,300.\nPICK: other a1' };
    if (sys.startsWith('You explain a message') && /Spanish/.test(sys)) return { response: 'Su aseguradora le ofrece $41,200 por las reparaciones de su vivienda. La persona debe firmar y devolver el formulario de liberación antes del 15 de diciembre. No menciona la casa de huéspedes.\nPICK: low a1' };
    if (/LANGUAGE: the person reads Spanish/.test(sys) && /agotad|no puedo m|abrumad/i.test(last) && /BREATHE OFFERED: no/.test(sys)) return { response: 'Es mucho para cargar, y tiene sentido sentirse así. Vamos un paso pequeño a la vez.\nACTION: breathe' };
    if (/LANGUAGE: the person reads Spanish/.test(sys) && /h[aá]gala|m[aá]s corta|reclamo es/i.test(last) && /a letter to the insurer is written/.test(sys)) return { response: 'Hago ese cambio en su carta ahora.\nACTION: edit' };
    if (/LANGUAGE: the person reads Spanish/.test(sys)) return { response: 'Su aseguradora debe acusar recibo de un reclamo dentro de los 15 días siguientes al aviso [10]. También puedo escribirle una carta.\nACTION: letter:quiet' };
    if (sys.startsWith('You explain a message') && /need the following/.test(last)) return { response: 'The person is asked to send a list of damaged items with receipts and photographs.\nPICK: other a1' };
    if (sys.startsWith('You explain a message')) return { response: 'They are offering $41,200 for the repairs to your home. They say this is based on their adjuster\'s estimate, and they ask you to sign and return the release form by December 15.\nPICK: low a1' };
    if (sys.startsWith('You edit a letter')) {
      const letter = (last.match(/<letter>([\s\S]*)<\/letter>/) || [])[1] || '';
      const ins = (last.match(/<instruction>([\s\S]*)<\/instruction>/) || [])[1] || '';
      const paras = letter.split('\n\n');
      if (/LOSEFACTS/.test(ins)) return { response: letter.replace(/\$[\d,]+/g, 'an amount') };
      if (/LOSEWORDS/.test(ins)) return { response: letter.replace(/\bthree\b/gi, 'multiple') };
      if (/short|corta/i.test(ins)) return { response: paras.filter((x, i) => i !== 2).join('\n\n') };
      const num = (ins.match(/\b[A-Z]{0,3}-?\d[\d-]{3,}\b/) || [])[0];
      return { response: num ? letter.replace('[claim number]', num).replace(/^Subject: (.*)$/m, (m, a) => 'Subject: ' + a.replace(/ - Claim .*/, '') + ' - Claim ' + num) : letter.replace('Dear Claims Team,', 'Dear Claims Team,\n\nMy claim number is [claim number].') };
    }
    if (/\b(shorter|change|add|claim number is|fix)\b/i.test(last) && /a letter to the insurer is written/.test(sys)) return { response: 'I will make that change on your letter now.\nACTION: edit' };
    if (/overwhelm|exhausted|can.t do this/i.test(last) && /BREATHE OFFERED: no/.test(sys)) return { response: 'That is a lot to carry, and it makes sense to feel worn down. We can go one small step at a time.\nACTION: breathe' };
    if (/phone|call someone|talk to a person/i.test(last)) return { response: 'Next Step is not staffed, but the California Department of Insurance hotline is 1-800-927-4357 [2].\nACTION: phones' };
    if (/they sent me|got a letter from|got an email/i.test(last)) return { response: 'Paste what they sent and I will explain it in plain words.\nACTION: paste' };
    if (/smoke/i.test(last)) return { response: 'Insurers are directed to investigate smoke damage claims fully and not deny them outright [3]. This is general information and your policy may differ.\nACTION: stage:sm' };
    if (/state farm/i.test(last)) return { response: 'x' };
    if (/complicated/i.test(last)) return { response: 'That makes sense, so let us keep it to one small step. Tell me in your own words what happened, or pick the closest one below.\nACTION: choices' };
    if (/first steps/i.test(last)) return { response: 'Here is where to start.\nACTION: stage:s1' };
    if (/place to stay|hotel/i.test(last)) return { response: 'Help with housing exists.\nACTION: help:stay' };
    if (/insurance words|deductible/i.test(last)) return { response: 'Plain words are available.\nACTION: words' };
    return { response: 'Your insurer must acknowledge a claim within 15 days of notice [10]. I can also write a letter for you.\nACTION: letter:quiet' };
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + req.headers.host);
  if (url.pathname === '/api/chat') {
    const chunks = []; for await (const c of req) chunks.push(c);
    // LIVE: with ANTHROPIC_API_KEY set, the real model answers (the same paid path the deployed site can use).
    const env = process.env.MOCK === 'off' ? {} : process.env.ANTHROPIC_API_KEY ? { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY } : { AI: mockAI };
    const request = new Request(url.href, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const r = await handle(request, env, SOURCES);
    res.writeHead(r.status, Object.assign(Object.fromEntries(r.headers), headersFor('/*')));
    if (r.body) { const rd = r.body.getReader(); for (;;) { const x = await rd.read(); if (x.done) break; res.write(x.value); } }
    res.end(); return;
  }
  if (url.pathname === '/api/count' || url.pathname === '/api/feedback') {
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(url.href, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const env = { COUNTS: { writeDataPoint: (d) => counts.push(d) } };
    if (process.env.FEEDBACK === 'on') env.FEEDBACK_WEBHOOK = 'http://inbox.test/hook';
    const r = url.pathname === '/api/count' ? await handleCount(request, env) : await handleFeedback(request, env, async (u, o) => { feedback.push(JSON.parse(o.body)); return { ok: true }; });
    res.writeHead(r.status, Object.assign(Object.fromEntries(r.headers), headersFor('/*'))); res.end(r.body ? await r.text() : ''); return;
  }
  let p = path.join(root, url.pathname);
  if (url.pathname.endsWith('/')) p = path.join(p, 'index.html');
  else if (fs.existsSync(p) && fs.statSync(p).isDirectory()) { res.writeHead(301, { location: url.pathname + '/' + url.search }); res.end(); return; }
  if (!p.startsWith(root) || !fs.existsSync(p)) { const nf = path.join(root, '404.html'); if (fs.existsSync(nf)) { res.writeHead(404, Object.assign({ 'content-type': 'text/html; charset=utf-8' }, headersFor('/*'))); res.end(fs.readFileSync(nf)); } else { res.writeHead(404); res.end('not found'); } return; }
  res.writeHead(200, Object.assign({ 'content-type': types[path.extname(p)] || 'application/octet-stream' }, headersFor('/*'), headersFor(url.pathname))); res.end(fs.readFileSync(p));
});
if (process.argv[1] && process.argv[1].endsWith('dev-server.js')) server.listen(port, () => console.log('dev server on', port));
export { server };

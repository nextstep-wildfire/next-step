// Local test server: serves ./public and runs the real Pages Function logic with a mocked AI binding.
// Usage: node dev/dev-server.js [port]   (set MOCK=off to simulate no AI, MOCK=quota to simulate the daily limit)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handle } from '../lib/core.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SOURCES = JSON.parse(fs.readFileSync(path.join(root, 'sources.json'), 'utf8'));
const port = Number(process.argv[2] || 8788);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
export const calls = [];

const mockAI = {
  async run(model, input) {
    const mode = process.env.MOCK || 'ok';
    if (mode === 'quota') { const e = new Error('4006: you have used up your daily free allocation of 10,000 neurons'); throw e; }
    const sys = input.messages[0].content;
    const last = input.messages[input.messages.length - 1].content;
    calls.push({ model, sysHead: sys.slice(0, 60), last: String(last).slice(0, 200) });
    if (process.env.DEMO && sys.startsWith('Write a short letter')) {
      return { response: 'Subject: Request for a written claim status update\n\nDear Claims Team,\n\nI reported my claim in January and sent photos of the damage to my home. For the past seven weeks I have called and emailed my adjuster and have not received a reply.\n\nPlease send me a written update on my claim status and the next step.\n\nPlease reply in writing within 15 calendar days of receiving this letter. I am keeping a record of all communication on this claim.\n\nThank you,\n[your name]' };
    }
    if (sys.startsWith('Write a short letter')) {
      const ask = (last.match(/ASK: (.*)/) || [])[1] || '';
      return { response: 'Subject: Request regarding my claim\n\nDear Claims Team,\n\nI am writing about my claim after the wildfire. My adjuster has not responded for several weeks and I need to move forward.\n\n' + ask + '\n\nPlease reply in writing within 15 calendar days of receiving this letter.\n\nThank you,\n[your name]' };
    }
    if (sys.startsWith('You explain a message')) return { response: 'They ask you to send more documents. Questions you could ask in writing:\n- What exactly is missing?\n- By when?' };
    if (/smoke/i.test(last)) return { response: 'Insurers are directed to investigate smoke damage claims fully and not deny them outright [3]. This is general information and your policy may differ.\nACTION: stage:sm' };
    if (/state farm/i.test(last)) return { response: 'x' };
    return { response: 'Your insurer must acknowledge a claim within 15 days of notice [10]. I can also write a letter for you.\nACTION: letter:quiet' };
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + req.headers.host);
  if (url.pathname === '/api/chat') {
    const chunks = []; for await (const c of req) chunks.push(c);
    const env = process.env.MOCK === 'off' ? {} : { AI: mockAI };
    const request = new Request(url.href, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const r = await handle(request, env, SOURCES);
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text()); return;
  }
  let p = path.join(root, url.pathname);
  if (url.pathname.endsWith('/')) p = path.join(p, 'index.html');
  else if (fs.existsSync(p) && fs.statSync(p).isDirectory()) { res.writeHead(301, { location: url.pathname + '/' + url.search }); res.end(); return; }
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(fs.readFileSync(p));
});
if (process.argv[1] && process.argv[1].endsWith('dev-server.js')) server.listen(port, () => console.log('dev server on', port));
export { server };

// Review shots for the handover changes: node dev/review-handover.mjs <dir> [base url]
// 1440 and 375 wide, English and Spanish, light and dark: the check-in, the letter with Open in email, the closed sidebar with the
// New chat icon on a medium screen, the Tell us form. Prints sideways scroll and worst contrast for each shot.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { server } from './dev-server.js';
const require = createRequire(new URL('../', import.meta.url).pathname + 'x.js');
const { chromium } = require('playwright');
const out = process.argv[2] || 'docs/screens'; fs.mkdirSync(out, { recursive: true });
let base = process.argv[3];
if (!base) { await new Promise((r) => server.listen(8796, r)); base = 'http://localhost:8796'; }
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
const seed = { chats: [{ id: 'cold', at: Date.now() - 22 * 86400000, title: 'They went quiet', step: 'free', flow: 'letter', sit: 'quiet', role: 'own', ask: 'a1', msgs: [{ r: 'u', x: 'They pushed back on my claim' }, { r: 'a', x: 'Your letter is ready.' }], letter: 'Subject: Request for a written update on my claim\n\nDear Claims Team,\n\nI have not had a reply.\n\nThank you,\n[your name]' }], cur: 'cold', record: [{ id: 'r1', chat: 'cold', kind: 'letter', date: iso(21), who: 'Your insurer', summary: 'Request for a written update on my claim' }] };
const contrast = (p) => p.evaluate(() => { const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number); const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }; const bgOf = (e) => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] > 0.5)) return c.slice(0, 3); } return [255, 255, 255]; }; let w = 99; for (const e of document.querySelectorAll('body *')) { if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') continue; if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; const cs = getComputedStyle(e); if (parseFloat(cs.opacity) < 1 || e.closest(':disabled')) continue; const a = lum(rgb(cs.color)), b = lum(bgOf(e)); w = Math.min(w, (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)); } return Math.round(w * 100) / 100; });
async function shot(name, o, fn) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, o.ctx || {}));
  if (o.feedback) await ctx.route('**/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.NS_CONFIG = { feedback: true };' }));
  const p = await ctx.newPage();
  if (o.seed) await p.addInitScript((d) => { if (!sessionStorage.getItem('s')) { localStorage.setItem('ns-desk-v1', JSON.stringify(d)); sessionStorage.setItem('s', '1'); } }, seed);
  await p.goto(base + (o.path || '/app/')); await p.waitForTimeout(500);
  if (o.dark) { await p.evaluate(() => window.nsTheme.toggle()); }
  if (fn) await fn(p);
  await p.waitForTimeout(500);
  await p.screenshot({ path: out + '/' + name + '.png' });
  console.log(name.padEnd(34), 'scrollW', await p.evaluate(() => document.documentElement.scrollWidth), 'worst contrast', await contrast(p));
  await ctx.close();
}
const tapN = (p, i) => p.locator('.choices:not(.done) .choice').nth(i).click();
const letter = async (p) => { await tapN(p, 0); await tapN(p, 2); await tapN(p, 0); await tapN(p, 0); await tapN(p, 0); await p.waitForSelector('#letter p.subj', { state: 'attached' }); await p.waitForTimeout(1200); };
const PH = { viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true };
for (const [lang, loc] of [['en', 'en-US'], ['es', 'es-MX']]) for (const dark of [false, true]) for (const [vp, ctx] of [['1440', {}], ['375', PH]]) {
  const t = `${lang}-${dark ? 'dark' : 'light'}-${vp}`, c = Object.assign({ locale: loc }, ctx);
  await shot('checkin-' + t, { ctx: c, seed: true, dark }, null);
  await shot('letter-' + t, { ctx: c, dark }, letter);
  await shot('formtell-' + t, { ctx: c, dark, feedback: true }, async (p) => { await p.click('#tellBtn'); });
}
for (const lang of [['en', 'en-US'], ['es', 'es-MX']]) for (const dark of [false, true]) await shot(`rail-${lang[0]}-${dark ? 'dark' : 'light'}-1000`, { ctx: { locale: lang[1], viewport: { width: 1000, height: 800 } }, dark }, letter);
await shot('landing-firstpaint-1440', {path: '/'}, null);
await browser.close(); if (server.listening) server.close();

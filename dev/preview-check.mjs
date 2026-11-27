// Checks the handover changes on a deployed preview, under its real security policy and with the real model:
//   node dev/preview-check.mjs https://feature-handover-polish.next-step-2fg.pages.dev docs/preview-check
// Writes screenshots and prints one line per check. Sends a few real letter requests to the AI.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(new URL('../', import.meta.url).pathname + 'x.js');
const { chromium } = require('playwright');
const base = process.argv[2], out = process.argv[3] || 'docs/preview-check'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'ok  ' : 'FAIL', m); };
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
async function open(o, path) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, o || {})); const p = await ctx.newPage();
  p.bad = []; p.counts = []; p.on('console', (m) => { if (m.type() === 'error') p.bad.push(m.text()); }); p.on('pageerror', (e) => p.bad.push(String(e)));
  p.on('response', (r) => { if (r.url().includes('/api/count')) p.counts.push(r.status()); });
  await p.goto(base + path); return p;
}
const tap = (p, i) => p.locator('.choices:not(.done) .choice').nth(i).click();
async function letter(p, es) { await tap(p, 0); await tap(p, 2); await tap(p, 0); await tap(p, 0); await tap(p, 0); await p.waitForSelector('#letter p.subj', { state: 'attached', timeout: 90000 }); await p.waitForTimeout(1500); }

// landing
let p = await open({}, '/'); const first = await p.evaluate(() => [...document.querySelectorAll('.art svg [data-id]')].every((e) => !e.style.strokeDasharray && e.style.visibility !== 'hidden'));
await p.screenshot({ path: out + '/landing-first-paint-1440.png' }); ok(first, 'landing: drawing complete at first paint');
await p.waitForTimeout(800); ok(p.counts.length === 1 && p.counts[0] === 204, 'landing: one count sent, answered 204 (' + p.counts + ')');
ok(p.bad.length === 0, 'landing: no console errors under the live policy ' + p.bad.join('|'));
const md = await p.evaluate(() => ({ og: document.querySelector('meta[property="og:image"]').content, canon: document.querySelector('link[rel=canonical]').href, robots: !!document.querySelector('meta[name=robots]') }));
ok(!md.robots && md.og.endsWith('/og.png'), 'landing: no robots meta, og:image set'); await p.context().close();
p = await open({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true }, '/'); await p.waitForTimeout(500); await p.screenshot({ path: out + '/landing-first-paint-375.png' });
ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'landing 375: no sideways scroll'); await p.context().close();

// a letter at 1000px: the sidebar steps aside, Open in email, the rail
p = await open({ viewport: { width: 1000, height: 800 } }, '/app/'); await p.waitForSelector('.opening h1');
ok((await p.locator('#side').boundingBox()).width > 200, '1000px: sidebar open before a paper');
await letter(p); await p.waitForTimeout(500);
ok((await p.locator('#side').boundingBox()).width < 1, '1000px: the sidebar closed itself when the letter opened');
const href = await p.locator('#emailBtn').getAttribute('href'); await p.locator('#emailBtn').click().catch(() => {});
const href2 = await p.locator('#emailBtn').getAttribute('href');
ok(/^mailto:\?subject=.+&body=Dear%20Claims%20Team/.test(href2), 'email: mailto with subject and letter: ' + decodeURIComponent(href2).slice(0, 90).replace(/\r?\n/g, ' / '));
await p.screenshot({ path: out + '/letter-1000-rail.png' });
const ub = await p.locator('#sideUnfold').boundingBox(), nb = await p.locator('#newChatRail').boundingBox();
ok(nb.x - (ub.x + ub.width) < 12 && Math.abs(nb.y - ub.y) < 2, 'rail: New chat icon beside the open sidebar icon');
await p.locator('#copyBtn').click(); await p.waitForTimeout(600);
ok(p.counts.length >= 3 && p.counts.every((s) => s === 204), 'counts: desk, email and copy all answered 204 (' + p.counts + ')');
await p.locator('#newChatRail').click(); await p.waitForTimeout(600); ok((await p.locator('#side').boundingBox()).width > 200 && await p.locator('.opening h1').isVisible(), 'rail: New chat starts fresh and the sidebar comes back');
ok(p.bad.length === 0, 'desk 1000: no console errors under the live policy ' + p.bad.join('|')); await p.context().close();

// 1440 and the phone
p = await open({}, '/app/'); await p.waitForSelector('.opening h1'); await letter(p); await p.screenshot({ path: out + '/letter-1440.png' });
ok((await p.locator('#side').boundingBox()).width > 200, '1440: sidebar stays open with a paper'); await p.context().close();
p = await open({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true }, '/app/'); await p.waitForSelector('.opening h1'); await letter(p); await p.waitForTimeout(400); await p.screenshot({ path: out + '/letter-375.png' });
ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375 && await p.locator('#emailBtn').isVisible(), '375: letter with Open in email, no sideways scroll'); await p.context().close();

// the check-in, Spanish
const seed = { chats: [{ id: 'cold', at: Date.now() - 22 * 86400000, title: 'x', step: 'free', flow: 'letter', sit: 'quiet', role: 'own', ask: 'a1', notes: '', msgs: [{ r: 'u', x: 'a' }, { r: 'a', x: 'b' }], letter: 'Subject: Request for a written update on my claim\n\nDear Claims Team,\n\nI have not had a reply.\n\nThank you,\n[your name]' }], cur: 'cold', record: [{ id: 'r1', chat: 'cold', kind: 'letter', date: iso(21), who: 'Your insurer', summary: 'Request for a written update on my claim' }] };
for (const [loc, nm] of [['en-US', 'en'], ['es-MX', 'es']]) {
  p = await open({ locale: loc }, '/app/'); await p.evaluate((d) => { localStorage.setItem('ns-desk-v1', JSON.stringify(d)); }, seed); await p.goto(base + '/app/'); await p.waitForSelector('.checkin');
  await p.waitForTimeout(500); await p.screenshot({ path: out + '/checkin-' + nm + '-1440.png' });
  ok(/21/.test(await p.locator('.ci-lead').innerText()), 'check-in (' + nm + '): shows after 21 days: ' + (await p.locator('.ci-lead').innerText()));
  await p.locator('.checkin [data-ci="none"]').click(); await p.waitForSelector('#letter p.subj', { state: 'attached', timeout: 90000 }); await p.waitForTimeout(1200);
  const l = await p.locator('#letter').innerText(); ok(/^Subject: Following up on my earlier letter/.test(l), 'check-in (' + nm + '): the real model wrote the follow-up: ' + l.split('\n').filter(Boolean).slice(0, 4).join(' | ').slice(0, 330));
  await p.screenshot({ path: out + '/followup-' + nm + '-1440.png' }); ok(p.bad.length === 0, 'check-in (' + nm + '): no console errors ' + p.bad.join('|')); await p.context().close();
}
await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0);

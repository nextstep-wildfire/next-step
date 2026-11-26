// Screenshots of every Desk state at desktop and phone width, for design review.
// Usage: node dev/screens.mjs [outdir]   (uses the pretend AI; MOCK_DELAY=0)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire(new URL('../', import.meta.url).pathname + 'x.js')('playwright');
const { server } = await import('./dev-server.js');
const out = process.argv[2] || 'screens';
fs.mkdirSync(out, { recursive: true });
await new Promise((r) => server.listen(8797, r));
const base = 'http://localhost:8797';
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const tap = async (p, t) => p.locator('.choices:not(.done) .choice', { hasText: t }).first().click();
const send = async (p, t) => { await p.fill('#composerIn', t); await p.click('#send'); };
for (const [name, opts] of [['desk', { viewport: { width: 1440, height: 900 } }], ['phone', { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const ctx = await browser.newContext(opts); const p = await ctx.newPage();
  const shot = async (n) => { await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${name}-${n}.png` }); };
  await p.goto(base + '/app/'); await p.waitForSelector('.opening'); await shot('01-opening');
  await tap(p, 'pushed back'); await tap(p, 'offered less'); await tap(p, 'I own it'); await shot('02-ask');
  await p.locator('.choices:not(.done) .choice').nth(1).click(); await p.waitForSelector('#composerIn[placeholder*="own words"]');
  await send(p, 'They offered $41,200 on Nov 3. My contractor quoted $68,000 to rebuild the kitchen and garage.');
  await p.waitForSelector('#letter p.subj', { state: 'attached' }); await shot('03-letter');
  if (name === 'phone') { await p.click('#paperClose'); await shot('04-pinned'); }
  await send(p, 'my claim number is HO-55821'); await p.waitForSelector('#letter p.changed'); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/${name}-05-edit.png` });
  if (name === 'phone') await p.click('#paperClose');
  await p.click(name === 'phone' ? '#newChatTop' : '#newChat'); await tap(p, 'message from them'); await shot('06-paste');
  await send(p, 'Dear Policyholder, after review we are offering $41,200 for dwelling repairs based on our adjuster estimate. Please sign and return the enclosed release by December 15.');
  await p.waitForSelector('.choice:has-text("suggested")'); await shot('07-explained');
  await tap(p, 'suggested'); await tap(p, 'I own it'); await p.waitForSelector('#letter p.subj', { state: 'attached' }); await shot('08-reply');
  for (const r of ['phones', 'steps', 'breathe']) { await p.goto(base + '/app/#/' + r); await p.waitForSelector('#page h1'); await shot('09-' + r); }
  await p.goto(base + '/app/'); if (name === 'phone') { await p.click('#sideOpen'); await shot('10-sidebar'); }
  // phase 2: call sheet, visit sheet, Record, care card
  await p.goto(base + '/app/'); await p.click(name === 'phone' ? '#newChatTop' : '#newChat');
  await tap(p, 'call or visit'); await shot('12-kind');
  await tap(p, 'phone call'); await tap(p, 'Their offer'); await tap(p, 'I own it'); await p.locator('.choices:not(.done) .choice').first().click();
  await p.waitForSelector('#composerIn[placeholder*="own words"]'); await send(p, 'They offered $42,300 on Nov 3. My contractor estimate is $96,000. Ask why the detached garage was left out.');
  await p.waitForSelector('#sheetDoc .ss'); await shot('13-callsheet');
  await p.fill('#lg-date', '2026-11-20'); await p.fill('#lg-who', 'Dana Ortiz, adjuster'); await p.fill('#lg-said', 'She will send the line-by-line estimate.');
  await p.locator('#sheetDoc .log').scrollIntoViewIfNeeded(); await shot('14-calllog');
  await p.click('[data-sheet="record"]');
  if (name === 'phone') { await p.click('#paperClose'); await shot('15-pinned-sheet'); await p.click('#newChatTop'); } else await p.click('#newChat');
  await tap(p, 'call or visit'); await tap(p, 'adjuster is visiting'); await tap(p, 'standing'); await tap(p, 'I own it');
  await p.waitForSelector('#composerIn[placeholder*="own words"]'); await send(p, 'Soot on the kitchen ceiling. Smoke smell in the bedroom closets.');
  await p.waitForSelector('#sheetDoc .ss'); await shot('16-visitsheet');
  await p.goto(base + '/app/#/record'); await p.waitForSelector('#page h1'); await shot('17-record');
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ns-desk-v1')); s.breathe = false; localStorage.setItem('ns-desk-v1', JSON.stringify(s)); });
  await p.goto(base + '/app/'); await p.click(name === 'phone' ? '#newChatTop' : '#newChat'); await send(p, 'I am so overwhelmed and exhausted'); await p.waitForSelector('.m-a.care'); await shot('18-care');
  for (const [k, y] of [['19-landing-top', 0], ['20-landing-demo', 'demo'], ['21-landing-exchanges', 'ex'], ['22-landing-band', 'band']]) {
    await p.goto(base + '/'); await p.evaluate((y) => { if (typeof y === 'string') { document.querySelector(y === 'demo' ? '#demo' : '.' + y).scrollIntoView(); } }, y);
    if (y === 'demo') { await p.waitForSelector('#dk.has-paper .dk-sheet p.subj', { timeout: 30000 }); await p.waitForTimeout(2500); await p.evaluate(() => document.getElementById('demo').scrollIntoView()); }
    await shot(k);
  }
  process.env.MOCK = 'off'; await p.goto(base + '/app/'); await p.click(name === 'phone' ? '#newChatTop' : '#newChat'); await send(p, 'What does depreciation mean?'); await p.waitForSelector('.m-a.pause'); await shot('11-pause'); process.env.MOCK = 'ok';
  await ctx.close();
}
await browser.close(); server.close();
console.log('saved to', out);

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
  process.env.MOCK = 'off'; await p.goto(base + '/app/'); await p.click(name === 'phone' ? '#newChatTop' : '#newChat'); await send(p, 'What does depreciation mean?'); await p.waitForSelector('.m-a.pause'); await shot('11-pause'); process.env.MOCK = 'ok';
  await ctx.close();
}
await browser.close(); server.close();
console.log('saved to', out);

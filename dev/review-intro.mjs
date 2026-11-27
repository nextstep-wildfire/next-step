// Review shots for the landing intro and the Desk with the sidebar open and closed.
// 1440 and 375, English and Spanish, light and dark. Prints the measurements the review needs:
// where Start ends on a 375 by 760 phone, sideways scroll, worst text contrast, sheet width.
// Usage: node dev/review-intro.mjs <outdir>   (uses the pretend AI)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire(new URL('../', import.meta.url).pathname + 'x.js')('playwright');
const { server } = await import('./dev-server.js');
const out = process.argv[2] || 'review-intro';
fs.mkdirSync(out, { recursive: true });
await new Promise((r) => server.listen(8797, r));
const base = 'http://localhost:8797';
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const pick = async (p, i) => p.locator('.choices:not(.done) .choice').nth(i).click();
const send = async (p, t) => { await p.fill('#composerIn', t); await p.click('#send'); };
const contrast = (p) => p.evaluate(() => {
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const bgOf = (e) => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] > 0.5)) return c.slice(0, 3); } return [255, 255, 255]; };
  let w = { r: 99 };
  for (const e of document.querySelectorAll('body *')) {
    if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') continue;
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden') continue;
    let o = 1; for (let n = e; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); if (o < 0.99) continue;
    const a = lum(rgb(cs.color)), b = lum(bgOf(e)), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (r < w.r) w = { r: Math.round(r * 100) / 100, t: e.textContent.trim().slice(0, 30) };
  }
  return w;
});
const sizes = [['1440', { viewport: { width: 1440, height: 900 } }], ['375', { viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]];
for (const lang of ['en', 'es']) for (const theme of ['light', 'dark']) for (const [w, opts] of sizes) {
  const ctx = await browser.newContext(Object.assign({ locale: lang === 'es' ? 'es-MX' : 'en-US', reducedMotion: 'reduce' }, opts));
  await ctx.addInitScript((t) => { try { localStorage.setItem('ns-theme', t); } catch (e) {} }, theme);
  const p = await ctx.newPage();
  const tag = `${lang}-${theme}-${w}`;
  const m = [];
  const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({ path: `${out}/${tag}-${n}.png` }); m.push(n + ': scrollW ' + (await p.evaluate(() => document.documentElement.scrollWidth)) + ', worst ' + JSON.stringify(await contrast(p))); };
  await p.goto(base + '/'); await p.waitForTimeout(300);
  const sb = await p.locator('#startBtn').boundingBox();
  m.push('Start bottom ' + Math.round(sb.y + sb.height) + ' of ' + opts.viewport.height);
  await shot('hero');
  await p.goto(base + '/app/'); await p.waitForSelector('.opening');
  await shot('desk-opening');
  await pick(p, 0); await pick(p, 1); await pick(p, 0); await pick(p, 0);
  await send(p, lang === 'es' ? 'Ofrecieron $42.300. Mi contratista dice 96 mil.' : 'They offered $42,300. My contractor quoted $96,000.');
  await p.waitForSelector('#letter p.subj', { state: 'attached' }); await p.waitForSelector('.choices:not(.done) .choice');
  if (w === '1440') {
    const sw = async () => Math.round((await p.locator('#sheet').boundingBox()).width);
    m.push('sheet width open ' + (await sw()));
    await shot('desk-letter-open');
    await p.click('#sideFold'); await p.waitForTimeout(400);
    m.push('sheet width closed ' + (await sw()) + ', focus on ' + (await p.evaluate(() => document.activeElement.id)));
    await shot('desk-letter-closed');
    await p.evaluate(() => document.getElementById('newChat').click()); await p.waitForSelector('.opening');
    await shot('desk-opening-closed');
    await p.goto(base + '/app/#/phones'); await p.waitForSelector('#page h1'); await shot('desk-phones-closed');
    await p.goto(base + '/app/'); await p.waitForSelector('.opening h1, .thread .m-a');
    await p.click('#sideUnfold'); await p.waitForTimeout(400);
  } else {
    await shot('desk-letter-phone');
    await p.click('#paperClose'); await p.click('#sideOpen'); await shot('desk-phone-menu');
  }
  console.log(tag + '\n  ' + m.join('\n  '));
  await ctx.close();
}
await browser.close(); server.close();

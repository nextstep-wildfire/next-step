// Screenshots of the Spanish Desk and of dark mode, at desktop and phone width, for design review.
// Usage: node dev/screens-es.mjs [outdir]   (uses the pretend AI)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire(new URL('../', import.meta.url).pathname + 'x.js')('playwright');
const { server } = await import('./dev-server.js');
const out = process.argv[2] || 'screens-es';
fs.mkdirSync(out, { recursive: true });
await new Promise((r) => server.listen(8796, r));
const base = 'http://localhost:8796';
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const pick = async (p, i) => p.locator('.choices:not(.done) .choice').nth(i).click();
const send = async (p, t) => { await p.fill('#composerIn', t); await p.click('#send'); };
const sizes = [['desk', { viewport: { width: 1440, height: 900 } }], ['phone', { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]];
for (const [theme, lang] of [['light', 'es'], ['dark', 'en'], ['dark', 'es']]) {
  for (const [name, opts] of sizes) {
    const ctx = await browser.newContext(Object.assign({ locale: lang === 'es' ? 'es-MX' : 'en-US' }, opts));
    await ctx.addInitScript((t) => { try { localStorage.setItem('ns-theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage();
    const tag = `${lang}-${theme}-${name}`;
    const shot = async (n) => { await p.waitForTimeout(700); await p.screenshot({ path: `${out}/${tag}-${n}.png` }); };
    const fresh = async () => { await p.goto(base + '/app/'); await p.click(name === 'phone' ? '#newChatTop' : '#newChat'); await p.waitForSelector('.opening'); };
    await p.goto(base + '/app/'); await p.waitForSelector('.opening'); await shot('01-opening');
    await pick(p, 0); await pick(p, 1); await pick(p, 0); await shot('02-ask');
    await pick(p, 0); await p.waitForSelector('#composerIn:focus, #composerIn');
    await send(p, lang === 'es' ? 'Me ofrecieron $42.300 el 3 de noviembre. Mi contratista dice que son 96 mil para reconstruir la cocina.' : 'They offered $41,200 on Nov 3. My contractor quoted $68,000.');
    await p.waitForSelector('#letter p.subj', { state: 'attached' }); await shot('03-letter');
    if (lang === 'es') { await p.locator('#esCopy').scrollIntoViewIfNeeded(); await shot('04-spanish-copy'); }
    if (name === 'phone') { await p.click('#paperClose'); await shot('05-pinned'); }
    await fresh(); await pick(p, 1); await send(p, 'Dear Policyholder, after review we are offering $41,200 for dwelling repairs based on our adjuster estimate. Please sign and return the enclosed release by December 15.');
    await p.waitForSelector('.choice .tag'); await shot('06-explained');
    await fresh(); await pick(p, 2); await pick(p, 0); await pick(p, 1); await pick(p, 0); await pick(p, 0);
    await p.waitForTimeout(200); await send(p, lang === 'es' ? 'Ofrecieron $42,300. Quiero saber por qué no incluyeron el garaje.' : 'They offered $42,300. Ask why the garage was left out.');
    await p.waitForSelector('#sheetDoc .ss'); await shot('07-callsheet');
    await p.locator('#sheetDoc .log').scrollIntoViewIfNeeded(); await shot('08-calllog');
    for (const r of ['record', 'phones', 'steps']) { await p.goto(base + '/app/#/' + r); await p.waitForSelector('#page h1'); await shot('09-' + r); }
    if (name === 'phone') { await p.goto(base + '/app/'); await p.click('#sideOpen'); await shot('10-sidebar'); }
    await p.goto(base + '/'); await shot('11-landing');
    await p.evaluate(() => document.querySelector('.band').scrollIntoView()); await shot('12-band');
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log('saved to', out);

import { createRequire } from 'node:module';
import fs from 'node:fs';
// Playwright: from this folder's node_modules, from PLAYWRIGHT_DIR, or from the old shared tools folder.
let chromium;
for (const dir of [new URL('../', import.meta.url).pathname, process.env.PLAYWRIGHT_DIR, '/opt/npm-tools/'].filter(Boolean)) {
  try { chromium = createRequire(dir.replace(/\/?$/, '/') + 'x.js')('playwright').chromium; break; } catch (e) {}
}
if (!chromium) { console.log('Playwright not found. Run: npm i -D playwright && npx playwright install chromium (or set PLAYWRIGHT_DIR)'); process.exit(1); }
import { server, calls } from '../dev/dev-server.js';

const PORT = 8799;
await new Promise((r) => server.listen(PORT, r));
const base = 'http://localhost:' + PORT;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
// Playwright's own Chromium if installed, otherwise the Chrome already on this computer.
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const SOURCES = JSON.parse(fs.readFileSync(new URL('../public/sources.json', import.meta.url), 'utf8'));
const SRC_TEXT = Object.values(SOURCES).map((s) => s.notes).join(' ');
const DESK = { width: 1440, height: 900 };
const PHONE = { viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true };
async function page(opts, path) {
  const ctx = await browser.newContext(Object.assign({ viewport: DESK }, opts || {}));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(base + (path || '/app/')); p.errs = errs;
  if (!path || path.startsWith('/app')) await p.waitForSelector('.opening h1, .thread .m-a');
  return p;
}
const lastA = (p) => p.locator('.thread .m-a').last();
const tap = async (p, text) => { await p.locator('.choices:not(.done) .choice', { hasText: text }).first().click(); };
const send = async (p, text) => { await p.fill('#composerIn', text); await p.click('#send'); };
// The core task, all by tapping: pushed back, what they did, own or rent, one ask, a few words, the letter.
async function toLetter(p, { sit = 'They went quiet', role = 'I own it', askIx = 0, notes = 'My adjuster has not answered for 7 weeks.' } = {}) {
  await tap(p, 'They pushed back on my claim'); await tap(p, sit); await tap(p, role);
  await p.locator('.choices:not(.done) .choice').nth(askIx).click();
  await p.waitForSelector('#composerIn[placeholder*="own words"]');
  if (notes) await send(p, notes); else await tap(p, 'Skip');
  await p.waitForSelector('#letter p.subj', { state: 'attached' });
  await p.waitForSelector('.choices:not(.done) .choice:has-text("Write another letter")');
}
// Links inside a sentence are exempt from the target size rule (WCAG 2.5.8), so only non-inline controls are measured.
const minSize = (p, sel) => p.$$eval(sel, (els) => els.filter((e) => e.offsetParent && getComputedStyle(e).display !== 'inline' && e.getBoundingClientRect().width).map((e) => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));
// Contrast of every visible piece of text against what is actually behind it (WCAG ratio).
const contrastScan = (p, root) => p.evaluate((rootSel) => {
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const bgOf = (e) => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] > 0.5)) return c.slice(0, 3); } return [255, 255, 255]; };
  const out = [];
  for (const e of document.querySelectorAll((rootSel || 'body') + ' *')) {
    if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') continue;
    const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 1) continue;
    let o = 1; for (let n = e; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    if (o < 0.99) continue;
    if (e.closest(':disabled, [disabled]')) continue;
    const fg = rgb(cs.color).slice(0, 3), bg = bgOf(e);
    const a = lum(fg), b = lum(bg), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    out.push({ t: e.textContent.trim().slice(0, 30), r: Math.round(r * 100) / 100, size: parseFloat(cs.fontSize) });
  }
  return out;
}, root);
const worst = (list) => list.reduce((m, x) => (x.r < m.r ? x : m), { r: 99 });

// 1. landing (rebuilt in phase 2): still opens the Desk, keeps the disclaimer and the real CDI line, new type only
let p = await page({}, '/');
ok((await p.locator('#startBtn').getAttribute('href')) === '/app/', 'landing Start opens the Desk');
ok(/not legal or insurance advice/i.test(await p.locator('#disclaimer').innerText()), 'landing keeps the plain disclaimer');
ok(await p.locator('a[href="tel:18009274357"]').count() >= 1, 'landing lists the CDI number');
let fams = await p.evaluate(async () => { await document.fonts.ready; return [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')))]; });
ok(fams.length === 1 && fams[0] === 'Instrument Sans', 'landing loads only Instrument Sans: ' + fams.join(','));
await p.setViewportSize({ width: 375, height: 700 });
ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'landing: no sideways scroll at 375px');
await p.context().close();

// 2. the Desk opening: one question, three taps, a box to type or paste, no paper yet
p = await page({ colorScheme: 'dark' });
ok((await p.locator('.opening h1').innerText()) === 'What’s happening with your insurer?', 'opening asks what is happening with the insurer');
ok((await p.locator('.opening .choice').allInnerTexts()).join('|') === 'They pushed back on my claim|I got a message from them|A call or visit is coming up', 'opening offers the three exchanges');
ok(await p.locator('#composerIn').isVisible() && /paste/i.test(await p.locator('#composerIn').getAttribute('placeholder')), 'a box to type or paste is always there');
ok(await p.locator('#paperwrap').isHidden() && !(await p.locator('#desk').evaluate((e) => e.classList.contains('has-paper'))), 'no paper until there is one to show; chat is centered');
ok((await p.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(244, 241, 234)', 'light loads first even on a dark device');
ok((await p.locator('.side').evaluate((e) => getComputedStyle(e).backgroundColor)) === 'rgb(31, 27, 23)', 'sidebar is deep ink');
ok((await p.locator('.side-links a').allInnerTexts()).join('|') === 'Steps of a claim|Take a breath|Phone lines', 'sidebar has the three quiet links');
ok(/not legal or insurance advice/.test(await p.locator('#fine').innerText()) && /not staffed/.test(await p.locator('#fine').innerText()), 'honesty is one plain line under the box');
fams = await p.evaluate(async () => { await document.fonts.ready; return [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')))]; });
ok(!fams.includes('EB Garamond') && !fams.includes('Outfit') && fams.includes('Instrument Sans'), 'UI type is Instrument Sans, old fonts gone: ' + fams.join(','));
const radii = await p.$$eval('.choice, .composer, .send, .side-new', (els) => els.map((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius)));
ok(radii.every((r) => r >= 2 && r <= 6), 'corners are crisp, 4 to 6px (' + [...new Set(radii)].join(',') + ')');
ok((await p.locator('.opening h1').evaluate((e) => getComputedStyle(e).fontWeight)) === '400', 'headline is regular weight');
ok((await contrastScan(p)).every((x) => x.r >= 4.5), 'opening: every text passes AA contrast (worst ' + JSON.stringify(worst(await contrastScan(p))) + ')');
await p.context().close();

// 3. the letter, all by tapping, paper appears and eases in
p = await page();
await tap(p, 'They pushed back on my claim');
ok(await p.locator('.opening').count() === 0 && (await p.locator('.m-u').first().innerText()) === 'They pushed back on my claim', 'a tap becomes the person’s message');
ok((await p.locator('.choices:not(.done) .choice').allInnerTexts()).join('|') === 'They said no|They offered less|They went quiet', 'then: said no, offered less, went quiet');
await tap(p, 'They offered less');
ok((await p.locator('.choices:not(.done) .choice').allInnerTexts()).join('|') === 'I own it|I rent it|Not sure', 'then own, rent or not sure, as one quick tap');
await tap(p, 'I own it');
ok(await p.locator('.choices:not(.done) .choice small').count() === 3 && /Pick this if/.test(await p.locator('.choices:not(.done) .choice small').first().innerText()), 'every ask shows a Pick this if note');
ok(await p.locator('.choices.done').count() === 2 && await p.locator('.choices.done').first().isHidden(), 'answered choices fold away; the answer stays as the person’s message');
ok(await p.locator('#paperwrap').isHidden(), 'still no paper before the letter');
const n0 = calls.length;
await p.locator('.choices:not(.done) .choice').nth(1).click();
await p.waitForSelector('#composerIn[placeholder*="own words"]');
await send(p, 'They offered $41,200 on Nov 3. My contractor quoted $68,000.');
await p.waitForSelector('#letter p.subj', { state: 'attached' });
ok(await p.locator('#paperwrap').isVisible() && await p.locator('#desk').evaluate((e) => e.classList.contains('has-paper')), 'the paper appears on the right');
const lc = calls.slice(n0).find((c) => c.sysHead.startsWith('Write a short letter'));
ok(lc && /second contractor estimate/.test(lc.userFull) && /\$68,000/.test(lc.userFull) && /HOME: home/.test(lc.userFull), 'letter request carries the ask, their words and own/rent');
ok(await p.locator('#letter p.in').count() >= 4, 'letter lines ease in as it is written');
ok((await p.locator('#letter').evaluate((e) => getComputedStyle(e).fontFamily)).startsWith('"Source Serif 4"') && (await p.locator('.thread').evaluate((e) => getComputedStyle(e).fontFamily)).startsWith('"Instrument Sans"'), 'serif only on the paper, sans everywhere else');
ok(await p.locator('#letter .blank').count() >= 1, 'blanks to fill in are marked on the letter');
await p.waitForSelector('.choices:not(.done) .choice:has-text("Write another letter")');
const after = await p.locator('.thread .m-a').allInnerTexts();
ok(after.some((t) => /15 days is your request, not a legal deadline/.test(t) && /1-800-927-4357/.test(t) && /Source: CDI wildfire page/.test(t)), 'says what happens next, with the CDI line and its source');
ok((await p.locator('.side-history a').first().innerText()).includes('letter'), 'the chat shows in history, marked with a letter');
ok((await contrastScan(p)).every((x) => x.r >= 4.5), 'letter screen: every text passes AA contrast (worst ' + JSON.stringify(worst(await contrastScan(p))) + ')');
// copy
await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await p.click('#copyBtn');
ok(/Dear Claims Team/.test(await p.evaluate(() => navigator.clipboard.readText())) && (await p.locator('#copyBtn').innerText()) === 'Copied', 'Copy puts the letter on the clipboard and says so');
// edit by telling the chat
const before = await p.locator('#letter p').count();
const n1 = calls.length;
await send(p, 'Can you make it shorter');
await p.waitForSelector('.m-a .tx:has-text("changed lines are highlighted")');
ok(calls.slice(n1).some((c) => c.sysHead.startsWith('You edit a letter')), 'a chat request to change the letter rewrites the letter');
ok((await p.locator('#letter p').count()) === before - 1, 'the letter got shorter');
await send(p, 'my claim number is HO-55821');
await p.waitForSelector('#letter p.changed');
ok((await p.locator('#letter p.changed').first().innerText()).includes('HO-55821'), 'a chat edit briefly highlights the changed line');
await p.waitForFunction(() => !document.querySelector('#letter p.changed'), null, { timeout: 4000 });
ok(true, 'the highlight fades');
// edit by typing on the paper
await p.locator('#letter p').last().click(); await p.keyboard.press('End'); await p.keyboard.type(' Rivera');
await p.waitForTimeout(500);
ok((await p.evaluate(() => JSON.parse(localStorage.getItem('ns-desk-v1')).chats[0].letter)).includes('Rivera'), 'typing on the letter is kept');
// another letter keeps the situation and opens a new chat
await tap(p, 'Write another letter');
ok(await p.locator('#paperwrap').isHidden() && await p.locator('.choices:not(.done) .choice small').count() === 3, 'Write another letter starts fresh at the ask, same situation');
ok(await p.locator('.side-history li').count() === 2, 'the new letter is its own chat in history');
ok(p.errs.length === 0, 'no page errors in the letter flow ' + p.errs.join('|'));
await p.reload(); await p.waitForSelector('.thread');
await p.locator('.side-history a', { hasText: 'letter' }).first().click(); await p.waitForSelector('#letter p.subj', { state: 'attached' });
ok((await p.locator('#letter').innerText()).includes('HO-55821'), 'an earlier chat reopens with its letter from history');
await p.context().close();

// 4. their message: privacy line, plain explanation, suggested ask, reply letter; the paste is never saved
p = await page();
await tap(p, 'I got a message from them');
ok(/sent to the AI to read and is not saved/.test(await lastA(p).innerText()), 'paste screen says the text goes to the AI and is not saved');
ok(await p.locator('.composer.tall').count() === 1, 'the box grows for pasting');
const PASTE = 'Dear Policyholder, after review we are offering $41,200 for dwelling repairs per the adjuster estimate. Please sign and return the enclosed release by December 15. Account 99-1234-77.';
const n2 = calls.length;
await send(p, PASTE);
await p.waitForSelector('.choices:not(.done) .choice:has-text("suggested")');
ok(/\$41,200/.test(await p.locator('.thread').innerText()) && await p.locator('#explain').isVisible() && /What their message says/.test(await p.locator('#explain').innerText()), 'their message is explained in plain words, on the chat and the paper');
ok((await p.locator('.choices:not(.done) .choice').first().innerText()).includes('Show how the number was figured'), 'suggests the ask that fits');
await tap(p, 'suggested'); await tap(p, 'I own it');
await p.waitForSelector('#letter p.subj', { state: 'attached' });
const rc = calls.slice(n2).find((c) => c.sysHead.startsWith('Write a short letter'));
ok(rc && rc.userFull.includes('<insurer_message>') && rc.userFull.includes('December 15'), 'the reply letter is written with their message');
ok((await p.locator('#paperKind').innerText()) === 'Their message and your reply', 'one paper: explanation plus reply letter');
ok(!(await p.evaluate(() => localStorage.getItem('ns-desk-v1'))).includes('99-1234-77'), 'the pasted message is not saved on the device');
await p.reload(); await p.waitForSelector('.thread .m-u');
ok(/not saved on this device/.test(await p.locator('.m-u.paste').innerText()), 'after a reload the paste shows only as not saved');
await p.context().close();

// 5. typing instead of tapping: live answer, sourced, then the right next step; long text is checked before reading it as a paste
p = await page();
await send(p, 'My insurer has not answered in 7 weeks');
await p.waitForSelector('.choices:not(.done) .choice:has-text("I own it")');
ok(/15 days of notice/.test(await p.locator('.thread').innerText()) && await p.locator('.m-a .src a').count() >= 1, 'typed situation gets a sourced live answer');
ok(!/ACTION/.test(await p.locator('.thread').innerText()), 'the ACTION line is never shown');
await tap(p, 'I own it');
await p.locator('.choices:not(.done) .choice').first().click();
ok(/7 weeks/.test(await p.evaluate(() => JSON.stringify(window.__desk.state().chat.notes))), 'what they typed becomes the letter notes');
await p.context().close();
p = await page();
await send(p, PASTE + ' ' + PASTE + ' ' + PASTE);
await p.waitForSelector('.choices:not(.done) .choice:has-text("Yes, explain it")');
ok(true, 'a long pasted message at the start asks before treating it as their message');
await tap(p, 'Yes, explain it'); await p.waitForSelector('#explain:not([hidden])');
ok(true, 'and explains it on yes');
await p.context().close();
p = await page();
await tap(p, 'A call or visit is coming up');
await p.waitForSelector('.thread .m-a .tx');
ok(calls[calls.length - 1].userFull.includes('call or visit'), 'call or visit goes to the live chat for now');
await p.context().close();

// 6. stress: offered once, gently, never repeated
p = await page();
await send(p, 'I am so overwhelmed and exhausted');
await p.waitForSelector('.choices:not(.done) .choice:has-text("Take a breath")');
ok(true, 'an overwhelmed message gets one gentle offer of a breath or phone lines');
await send(p, 'I am so overwhelmed and exhausted');
await p.waitForTimeout(400);
ok(await p.locator('.choice:has-text("Take a breath")').count() === 1 && /BREATHE OFFERED: yes/.test(calls[calls.length - 1].sys), 'the offer is not repeated');
await tap(p, 'Take a breath'); await p.waitForSelector('#page h1:has-text("Take a breath")');
ok(true, 'the offer opens the breathing page');
await p.context().close();

// 7. sidebar pages: steps, breath, phone lines; every phone number on screen is in sources.json
p = await page({}, '/app/#/phones'); await p.waitForSelector('#page h1');
const nums = await p.$$eval('a[href^="tel:"]', (a) => a.map((x) => x.textContent.trim()));
ok(nums.length >= 3 && nums.every((n) => SRC_TEXT.includes(n)), 'phone lines all come from sources.json: ' + nums.join(', '));
ok(/not staffed/.test(await p.locator('#page').innerText()), 'phone lines say Next Step is not staffed');
ok((await p.locator('#page .lines a').first().evaluate((e) => getComputedStyle(e).fontWeight)) === '300', 'numbers people need are set large and light');
await p.click('.side-links a[data-page="steps"]'); await p.waitForSelector('.stages');
ok(await p.locator('.stages > li').count() === 7, 'steps of a claim: seven stages for owners');
await p.click('.seg button[data-r="rent"]'); ok(await p.locator('.stages > li').count() === 5, 'and five for renters');
const stepNums = (await p.locator('#page').innerText()).match(/1-\d{3}-\d{3}-\d{4}/g) || [];
ok(stepNums.every((n) => SRC_TEXT.includes(n)), 'numbers in the steps are in sources.json');
await p.click('.side-links a[data-page="breathe"]'); await p.click('#bstart'); await p.waitForTimeout(300);
ok(/Breathe in/.test(await p.locator('#bword').innerText()), 'take a breath runs one minute of breathing');
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
ok(await p.locator('#page').isHidden(), 'Escape returns to the chat');
await p.click('#newChat'); ok(await p.locator('.opening').count() === 1, 'New chat opens the first question');
ok(p.errs.length === 0, 'no page errors on the pages ' + p.errs.join('|'));
await p.context().close();

// 8. phone: chat fills the screen, the paper is a pinned card that opens full screen with Copy
p = await page(PHONE);
const sizes = [], widths = [];
const snap = async (name) => { widths.push([name, await p.evaluate(() => document.documentElement.scrollWidth)]); sizes.push([name, Math.min(...await minSize(p, '.thread .choice, .send, .topbar button, .pin, .paperbtns button, .side-links a'))]); };
await snap('open');
ok(await p.locator('.side').isHidden(), 'phone: sidebar is tucked away');
await p.click('#sideOpen'); await p.waitForTimeout(300); ok(await p.locator('.side').isVisible(), 'phone: menu opens the sidebar'); await snap('side');
await p.click('#scrim', { position: { x: 360, y: 400 } }); await p.waitForTimeout(300); ok(await p.locator('.side').isHidden(), 'phone: tapping outside closes the menu');
await toLetter(p);
await p.waitForSelector('.paperwrap.open'); await snap('paper');
ok(await p.locator('#copyBtn').isVisible() && await p.locator('#paperClose').isVisible(), 'phone: the letter opens full screen with Copy');
await p.click('#paperClose'); await snap('pinned');
ok(await p.locator('#pin').isVisible() && /Your letter/.test(await p.locator('#pin').innerText()), 'phone: the paper is a pinned card at the top');
await p.click('#pin'); ok(await p.locator('.paperwrap.open').isVisible(), 'phone: tapping the card opens it'); await p.click('#paperClose');
for (const r of ['steps', 'phones', 'breathe']) { await p.goto(base + '/app/#/' + r); await p.waitForSelector('#page h1'); await snap(r); }
ok(widths.every((s) => s[1] <= 375), 'phone: no sideways scroll ' + widths.filter((s) => s[1] > 375).map((s) => s[0]).join(','));
ok(sizes.every((s) => s[1] >= 44), 'phone: tap targets at least 44px ' + sizes.filter((s) => s[1] < 44).map((s) => s[0] + ':' + s[1]).join(','));
const small = await p.evaluate(() => Math.min(...[...document.querySelectorAll('body *')].filter((e) => e.offsetParent && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize))));
ok(small >= 15, 'phone: nothing under 15px (' + small + ')');
ok((await p.locator('#composerIn').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) >= 18 && (await p.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize))) === 18, 'phone: body and the box are 18px');
ok(p.errs.length === 0, 'phone: no page errors ' + p.errs.join('|'));
await p.context().close();

// 9. the honest pause: AI unavailable or out of quota. No fake reply; phone lines; try again; a plain basic letter
for (const mode of ['off', 'quota']) {
  process.env.MOCK = mode;
  p = await page();
  await send(p, 'What does replacement cost mean?');
  await p.waitForSelector('.m-a.pause');
  const t = await p.locator('.m-a.pause').innerText();
  ok(/paused|daily limit/.test(t) && /30 minutes/.test(t) && /1-800-927-4357/.test(t), mode + ': pause says so plainly, suggests 30 minutes, shows the phone lines');
  ok(await p.locator('.thread .m-a').count() === 1, mode + ': no made-up reply');
  await p.click('#newChat');
  await toLetter(p, { sit: 'They said no' }).catch(() => {});
  await p.waitForSelector('.choices:not(.done) .choice:has-text("basic letter")');
  ok(await p.locator('#paperwrap').isHidden(), mode + ': no letter appears by itself');
  await tap(p, 'basic letter'); await p.waitForSelector('#letter p.subj', { state: 'attached' });
  ok(/explain your decision in writing/.test(await p.locator('#letter').innerText()) && /not written by the assistant/.test(await p.locator('.thread').innerText()), mode + ': a basic letter on request, labelled as not from the assistant');
  ok(p.errs.filter((e) => !/Failed to load resource/.test(e)).length === 0, mode + ': no script errors ' + p.errs.join('|'));
  await p.context().close();
}
process.env.MOCK = 'ok';
p = await page();
process.env.MOCK = 'off'; await send(p, 'hello'); await p.waitForSelector('.m-a.pause');
process.env.MOCK = 'ok'; await tap(p, 'Try again'); await p.waitForSelector('.m-a:not(.pause) .tx');
ok(true, 'Try again works once the assistant is back');
await p.context().close();

// 10. reduced motion: the letter is simply there
p = await page({ reducedMotion: 'reduce' });
await toLetter(p);
ok(await p.locator('#letter p.in').count() === 0, 'reduced motion: no easing in');
await p.context().close();

// 11. banned things: no emoji, no em or en dashes, no gradients or blur, no exclamation marks in what the Desk says
p = await page();
await toLetter(p);
const txt = await p.evaluate(() => document.body.innerText);
ok(!/[–—]/.test(txt) && !/\p{Extended_Pictographic}/u.test(txt), 'no dashes or emoji on screen');
ok(!/!/.test(await p.locator('.thread').innerText()), 'no exclamation marks in the chat');
const css = fs.readFileSync(new URL('../public/desk.css', import.meta.url), 'utf8') + fs.readFileSync(new URL('../public/base.css', import.meta.url), 'utf8');
ok(!/gradient\(|backdrop-filter|blur\(/.test(css), 'no gradients, glows or blur in the CSS');
ok(!/\b(seamless|empower|effortless|peace of mind|unlock)\b/i.test(txt + fs.readFileSync(new URL('../public/desk.js', import.meta.url), 'utf8')), 'no banned words');
await p.context().close();
// 15. streaming: the person sees words arrive, and never sees the ACTION line or an unchecked source number
{
  const core = await import('../lib/core.js');
  const S = JSON.parse((await import('node:fs')).readFileSync(new URL('../public/sources.json', import.meta.url), 'utf8'));
  const all = new Set(Object.keys(S));
  // held back: whole and partial ACTION lines, half-written and unknown source numbers
  ok(core.visibleSoFar('Hello there.\nACT', S, all) === 'Hello there.', 'partial ACTION is held back');
  ok(core.visibleSoFar('Hello there. [1', S, all) === 'Hello there.', 'half-written source number is held back');
  ok(core.visibleSoFar('Hello [99] there [3].\nACTION: stage:sm', S, all) === 'Hello  there [3].', 'unknown source number dropped, ACTION line never shown');
  ok(core.visibleSoFar('See [9].', S, new Set(['2', '10'])) === 'See .', 'a source the model was not shown is dropped');
  ok(core.visibleSoFar('Fine ACTION: letter:low', S, all) === 'Fine', 'inline trailing ACTION is held back');
  // note selection: matches keep what the question needs, vague and non-English questions get everything
  const sel = (q, lang) => core.selectNoteIds(S, { lang: lang || 'en', query: q });
  const must = [
    ['What do you know about smoke damage in my house?', ['3', '2']],
    ['Do I need a list of everything I lost?', ['1', '9']],
    ['I need a place to stay, who pays for a hotel?', ['11', '1', '14']],
    ['Can FEMA help me?', ['4', '14']],
    ['They offered way less than my contractor quoted', ['10']],
    ['Can my landlord keep my deposit?', ['13']],
    ['My insurer has not answered in 7 weeks', ['10', '2']],
  ];
  for (const [q, ids] of must) { const got = sel(q); ok(got && ids.every((i) => got.includes(i)) && got.length < 15, 'notes for "' + q.slice(0, 40) + '" include ' + ids.join(',') + ' (got ' + (got ? got.join(',') : 'all') + ')'); }
  ok(sel('I do not know where to start') === null && sel('what are my first steps') === null, 'vague questions get all notes');
  ok(sel('Qué es el deducible de la casa?') === null && sel('hotel', 'es') === null && sel('我需要住的地方') === null, 'non-English questions get all notes');
  const full = core.chatSystemPrompt(S, { lang: 'en' }).length, part = core.chatSystemPrompt(S, { lang: 'en', noteIds: sel('Can FEMA help me?') }).length;
  ok(part < full * 0.6, 'FEMA question prompt is under 60% of the full prompt (' + part + ' of ' + full + ')');
  const pa = core.chatSystemParts(S, { lang: 'en', role: 'rent', who: 'other', stageLabel: 'x' }), pb = core.chatSystemParts(S, { lang: 'en', role: 'own', who: 'me', stageLabel: 'y', stress: 'ok' });
  ok(pa.stable === pb.stable && pa.volatile !== pb.volatile && /RENTS/.test(pa.volatile) && !/RENTS/.test(pa.stable), 'fixed prompt prefix does not change per person (cacheable); rent/who are at the end');
  // paid path: all notes, cache marker on the fixed prefix, stream parsed
  const realFetch = globalThis.fetch; let sent = null;
  globalThis.fetch = async (url, init) => {
    sent = JSON.parse(init.body);
    const enc = new TextEncoder(); const ev = (o) => enc.encode('event: x\ndata: ' + JSON.stringify(o) + '\n\n');
    return new Response(new ReadableStream({ start(c) { c.enqueue(ev({ type: 'message_start' })); for (const t of ['Smoke claims must be inves', 'tigated [3]. ', 'ACTION: stage', ':sm']) c.enqueue(ev({ type: 'content_block_delta', delta: { type: 'text_delta', text: t } })); c.enqueue(ev({ type: 'message_stop' })); c.close(); } }), { status: 200 });
  };
  const req = new Request('http://x/api/chat', { method: 'POST', body: JSON.stringify({ mode: 'chat', stream: true, lang: 'en', messages: [{ role: 'user', content: 'Can FEMA help me with smoke damage?' }] }) });
  const resp = await core.handle(req, { ANTHROPIC_API_KEY: 'k' }, S); const txt = await resp.text(); globalThis.fetch = realFetch;
  ok(sent.stream === true && Array.isArray(sent.system) && sent.system[0].cache_control && sent.system[0].cache_control.type === 'ephemeral' && !sent.system[1].cache_control, 'paid path marks the fixed prefix for caching');
  ok(Object.keys(S).every((k) => sent.system[0].text.includes('[' + k + '] ')), 'paid path sends all notes so the prefix is identical every time');
  const evs = txt.split('\n\n').filter(Boolean).map((l) => JSON.parse(l.replace(/^data: /, '')));
  const fin = evs[evs.length - 1];
  ok(fin.done && fin.text === 'Smoke claims must be investigated [3].' && fin.action && fin.action.arg === 'sm' && evs.every((e) => !/ACTION/.test(e.t || '')), 'paid path stream: text assembled, action parsed, ACTION never in a text event');
}
{
  // new server behaviour: explain picks a checked ask, revise keeps the letter shape, desk context reaches the prompt
  const core = await import('../lib/core.js');
  const S = SOURCES;
  const pe = core.parseExplain('They offer $10.\nPICK: low a2');
  ok(pe.sit === 'low' && pe.ask === 'a2' && pe.text === 'They offer $10.', 'explain: the PICK line is parsed and never shown');
  const bad = core.parseExplain('Unclear.\nPICK: low a9');
  ok(bad.sit === 'other' && bad.ask === 'a1', 'explain: an ask that is not on our list falls back to a safe one');
  ok(core.parseAction('Sure.\nACTION: edit').action.type === 'edit' && core.parseAction('x\nACTION: phones').action.type === 'phones', 'chat can ask the app to edit the letter or show phone lines');
  const withPaper = core.chatSystemPrompt(S, { lang: 'en', paper: true, ask: 'Please send me a status update.' });
  ok(/a letter to the insurer is written/.test(withPaper) && /status update/.test(withPaper) && /not staffed/.test(withPaper), 'chat prompt knows the letter on the desk and never offers a person');
  const r = await core.handle(new Request('http://x/api/chat', { method: 'POST', body: JSON.stringify({ mode: 'revise', letter: '', instruction: 'x' }) }), {}, S);
  ok(r.status === 400, 'revise needs a letter and an instruction');
}
{
  // in the browser: slow stream on the Desk, record everything shown while the reply is written
  process.env.MOCK_DELAY = '45';
  p = await page();
  await p.evaluate(() => { window.__seen = []; new MutationObserver(() => { const m = document.querySelectorAll('.thread .m-a'); if (m.length) window.__seen.push(m[m.length - 1].innerText); }).observe(document.getElementById('thread'), { childList: true, subtree: true, characterData: true }); });
  const n0 = calls.length;
  await send(p, 'What do you know about smoke damage in my house?');
  await p.waitForFunction(() => { const m = document.querySelector('.thread .m-a .typing'); return m && m.parentElement.innerText.length > 20; }, null, { timeout: 5000 });
  ok(await p.locator('.thread .m-a .src').count() === 0, 'words are on screen before the reply is finished (no source line yet)');
  await p.waitForSelector('.thread .m-a .src a');
  const seen = await p.evaluate(() => window.__seen);
  ok(seen.length > 3 && seen.every((t) => !/ACTION/i.test(t)), 'the ACTION line never appeared while streaming (' + seen.length + ' updates)');
  ok(seen.every((t) => !/\[\d*\]?\s*$/.test(t.trim())), 'no half-written [n] shown while streaming');
  ok((await p.locator('.thread .m-a .src').innerText()).includes('CDI smoke damage order'), 'the reply ends with its source by name');
  const sys = calls[n0].sys;
  ok(calls[n0].stream === true && sys.includes('[3] ') && !sys.includes('[13] ') && sys.length < 10000, 'smoke question sends the smoke notes only (' + sys.length + ' chars)');
  ok(p.errs.length === 0, 'no page errors while streaming: ' + p.errs.join('|'));
  await p.context().close();
  delete process.env.MOCK_DELAY;
}
await browser.close(); server.close();
console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);

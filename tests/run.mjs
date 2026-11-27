import { createRequire } from 'node:module';
import fs from 'node:fs';
// Playwright: from this folder's node_modules, from PLAYWRIGHT_DIR, or from the old shared tools folder.
let chromium;
for (const dir of [new URL('../', import.meta.url).pathname, process.env.PLAYWRIGHT_DIR, '/opt/npm-tools/'].filter(Boolean)) {
  try { chromium = createRequire(dir.replace(/\/?$/, '/') + 'x.js')('playwright').chromium; break; } catch (e) {}
}
if (!chromium) { console.log('Playwright not found. Run: npm i -D playwright && npx playwright install chromium (or set PLAYWRIGHT_DIR)'); process.exit(1); }
import { server, calls, counts, feedback } from '../dev/dev-server.js';

const PORT = 8799;
await new Promise((r) => server.listen(PORT, r));
const base = 'http://localhost:' + PORT;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
// Playwright's own Chromium if installed, otherwise the Chrome already on this computer.
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
// Tests never launch the computer's real mail app: the mailto link is read, then its navigation is cancelled.
const NO_MAIL = () => document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href^="mailto:"]'); if (a) e.preventDefault(); });
const newCtx = browser.newContext.bind(browser);
browser.newContext = async (o) => { const c = await newCtx(o); await c.addInitScript(NO_MAIL); return c; };
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
ok(fams.every((f) => f === 'Instrument Sans' || f === 'Source Serif 4') && fams.includes('Instrument Sans'), 'landing loads only Instrument Sans, plus Source Serif 4 for the paper in the demo: ' + fams.join(','));
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
ok((await p.locator('.side-links a').allInnerTexts()).join('|') === 'Record|Steps of a claim|Take a breath|Phone lines', 'sidebar has Record and the three quiet links');
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
ok(await p.locator('#paperNote').isHidden(), 'desktop: no extra note on the paper (the chat beside it says how to finish)');
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
await p.waitForSelector('.choices:not(.done) .choice:has-text("phone call with my insurer")');
ok(true, 'call or visit asks which one is coming up');
await p.context().close();

// 6. stress: offered once, gently, never repeated
p = await page();
await send(p, 'I am so overwhelmed and exhausted');
await p.waitForSelector('.m-a.care .care-go');
ok(true, 'an overwhelmed message gets one gentle card: a minute to breathe or real phone lines');
const careNums = await p.$$eval('.m-a.care a[href^="tel:"]', (a) => a.map((x) => x.textContent.trim()));
ok(careNums.includes('988') && careNums.every((n) => SRC_TEXT.includes(n)), 'the card shows sourced lines, including 988: ' + careNums.join(', '));
ok(!/!/.test(await p.locator('.m-a.care').innerText()), 'the card is calm: no exclamation marks');
await send(p, 'I am so overwhelmed and exhausted');
await p.waitForTimeout(400);
ok(await p.locator('.m-a.care').count() === 1 && /BREATHE OFFERED: yes/.test(calls[calls.length - 1].sys), 'the card is never repeated');
await p.click('.m-a.care .care-go'); await p.waitForTimeout(300);
ok(/Breathe in/.test(await p.locator('.m-a.care .care-word').innerText()), 'the minute of breathing runs right in the card');
await p.reload(); await p.waitForSelector('.thread');
await p.click('#newChat'); await send(p, 'This is too much for me, I am falling apart');
await p.waitForSelector('.thread .m-a .tx >> nth=0'); await p.waitForTimeout(500);
ok(await p.locator('.m-a.care').count() === 0, 'and not offered again in a new chat on the same device');
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
ok(await p.locator('#paperNote').isVisible() && /\[brackets\]/.test(await p.locator('#paperNote').innerText()), 'phone: the open letter says how to finish it ([brackets], Copy, email), since the chat is under it');
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
  ok(Object.keys(S).filter((k) => !S[k].pending).every((k) => sent.system[0].text.includes('[' + k + '] ')), 'paid path sends all live notes so the prefix is identical every time');
  ok(Object.keys(S).filter((k) => S[k].pending).every((k) => !sent.system[0].text.includes('[' + k + '] ') && !sent.system[0].text.includes(S[k].title)), 'a pending source (TAC, until approved) is never sent to the model');
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
  ok(core.stripBadPhones('Call 1-800-927-4357 or 1-800-555-1234.', S) === 'Call 1-800-927-4357 or [number removed: not in our sources].', 'a phone number the model invents is removed; ours stay');
  ok(core.visibleSoFar('Call 1-800-55', S, null) === 'Call', 'a half-written phone number is held back while streaming');
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

// 16. the call sheet, all by tapping: which one, what about, own or rent, one ask, notes, the sheet
{
  p = await page();
  const n0 = calls.length;
  await tap(p, 'A call or visit is coming up'); await tap(p, 'phone call with my insurer'); await tap(p, 'Their offer'); await tap(p, 'I own it');
  await p.locator('.choices:not(.done) .choice').first().click();
  await p.waitForSelector('#composerIn[placeholder*="own words"]');
  await send(p, 'They offered $42,300 on Nov 3. My contractor estimate is $96,000.');
  await p.waitForSelector('#sheetDoc .ss');
  const sheetTxt = await p.locator('#sheetDoc').innerText();
  ok(/Call sheet about their offer/.test(sheetTxt), 'call sheet: titled for the situation');
  ok(['What to say first', 'What to ask for', 'While you talk', 'After the call', 'Call log'].every((h) => sheetTxt.includes(h)), 'call sheet: what to say, what to ask for, and a log');
  ok(/\$42,300/.test(sheetTxt) && /from your notes/.test(sheetTxt), 'call sheet: the person’s own details appear, marked as from their notes');
  ok(/settle on the call/.test(sheetTxt), 'call sheet: offer calls get the do-not-agree-on-the-call line');
  ok(!/asthma|stucco/.test(sheetTxt), 'call sheet: visit-only lines stay off');
  ok(await p.locator('#sheetDoc sup').count() > 4 && await p.locator('#sheetDoc .srcs a').count() >= 3, 'call sheet: sourced lines carry source numbers, listed with links');
  const srcHrefs = await p.$$eval('#sheetDoc .srcs a', (a) => a.map((x) => x.href));
  ok(srcHrefs.every((h) => Object.values(SOURCES).some((x) => x.url === h)), 'call sheet: every source link is in sources.json');
  ok(/general guidance/.test(sheetTxt), 'call sheet: unsourced lines are marked general guidance');
  ok(calls.slice(n0).some((c) => c.sys.startsWith('You help a California wildfire survivor get ready for a phone call')), 'call sheet: the sheet prompt runs on the server');
  ok(await p.locator('.paperwrap').isVisible() && (await p.locator('#paperKind').innerText()) === 'Your call sheet', 'call sheet: on the paper, named');
  // the log, then Record, then the follow-up email
  await p.fill('#lg-date', '2026-11-20'); await p.fill('#lg-who', 'Dana Ortiz, adjuster'); await p.fill('#lg-said', 'She will send the line-by-line estimate.'); await p.fill('#lg-next', 'Estimate by Dec 1');
  await p.click('[data-sheet="record"]'); await p.waitForTimeout(300);
  await p.reload(); await p.waitForSelector('#sheetDoc .ss');
  ok((await p.inputValue('#lg-who')) === 'Dana Ortiz, adjuster', 'call log: what they type is kept on the device');
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.click('#copyBtn'); await p.waitForTimeout(200);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  ok(/WHAT TO SAY FIRST/.test(clip) && /Who you spoke with: Dana Ortiz/.test(clip), 'call sheet: Copy gives the whole sheet and the log as text');
  const fuN = calls.length;
  await p.click('[data-sheet="followup"]');
  await p.waitForSelector('#letter p.subj', { state: 'attached' });
  const fu = calls.slice(fuN).find((c) => c.sysHead.startsWith('Write a short letter'));
  ok(fu && /Dana Ortiz/.test(fu.userFull) && /line-by-line estimate/.test(fu.userFull) && /confirm in writing that this summary/i.test(fu.userFull), 'follow-up email: written from the log, asking them to confirm it');
  await p.goto(base + '/app/#/record'); await p.waitForSelector('#page h1:has-text("Record")');
  const rec = await p.locator('.record').innerText();
  ok(/Nov 20, 2026/.test(rec) && /Call/.test(rec) && /Dana Ortiz/.test(rec), 'Record: the saved call is listed with date, who and summary');
  ok(p.errs.length === 0, 'no page errors on the call sheet ' + p.errs.join('|'));
  await p.context().close();
}

// 17. the visit sheet: standing or destroyed changes the checklist
{
  p = await page();
  await tap(p, 'A call or visit is coming up'); await tap(p, 'adjuster is visiting'); await tap(p, 'standing'); await tap(p, 'I rent it');
  await p.waitForSelector('#composerIn[placeholder*="own words"]');
  await send(p, 'Soot on the kitchen ceiling. Smell in the bedroom closets.');
  await p.waitForSelector('#sheetDoc .ss');
  let v = await p.locator('#sheetDoc').innerText();
  ok(['What to have ready', 'What to say when they arrive', 'What to show them and ask', 'What to photograph', 'Visit log'].every((h) => v.includes(h)), 'visit sheet: what to have ready, what to ask, what to photograph, a log');
  ok(/Soot on the kitchen ceiling/.test(v), 'visit sheet: their own damage is on it');
  ok(/test for smoke and ash/.test(v) && /asthma/.test(v) && /stucco/.test(v), 'visit sheet: a standing home gets the smoke, health and inspection lines');
  ok(/landlord/.test(v), 'visit sheet: renters get the renter line');
  await p.click('#newChat');
  await tap(p, 'A call or visit is coming up'); await tap(p, 'adjuster is visiting'); await tap(p, 'destroyed'); await tap(p, 'I own it'); await tap(p, 'Skip');
  await p.waitForSelector('#sheetDoc .ss');
  v = await p.locator('#sheetDoc').innerText();
  ok(!/asthma/.test(v) && /debris removal/.test(v) && !/landlord/.test(v), 'visit sheet: a destroyed home gets the debris and old-photos lines instead');
  ok(!/from your notes/.test(v), 'visit sheet: skipping notes adds nothing invented');
  await p.context().close();
}

// 18. Record: add by hand, copy as a summary, remove; letters land there when copied
{
  p = await page();
  await toLetter(p);
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.click('#copyBtn'); await p.waitForTimeout(200);
  await p.click('.side-links a[data-page="record"]'); await p.waitForSelector('.record');
  ok((await p.locator('.record li').count()) === 1 && /Letter/.test(await p.locator('.record').innerText()), 'Record: a copied letter is listed');
  await p.click('#recAdd'); await p.selectOption('#rfKind', 'visit'); await p.fill('#rfWho', 'Sam Lee, field adjuster'); await p.fill('#rfSum', 'Looked at the roof and the garage.'); await p.click('#recForm button[type="submit"]');
  ok((await p.locator('.record li').count()) === 2, 'Record: a visit can be added by hand');
  await p.click('#recCopy'); await p.waitForTimeout(200);
  const sum = await p.evaluate(() => navigator.clipboard.readText());
  ok(/My claim record/.test(sum) && /Visit, Sam Lee, field adjuster\. Looked at the roof/.test(sum), 'Record: copies as a plain summary');
  await p.locator('[data-del]').first().click();
  ok((await p.locator('.record li').count()) === 1, 'Record: an entry can be removed');
  ok(/stays on this device only/.test(await p.locator('#page .lead').innerText()), 'Record: says it stays on this device');
  await p.context().close();
}

// 19. handoffs and lines: United Policyholders shown, TAC hidden until approved, 988 sourced
{
  p = await page({}, '/app/#/phones'); await p.waitForSelector('#page h1');
  const t = await p.locator('#page').innerText();
  ok(/United Policyholders/.test(t) && await p.locator('#page a[href="https://uphelp.org/ask-an-expert/"]').count() === 1, 'phone lines page: United Policyholders is a handoff, linked');
  ok(!/After Collective/.test(t), 'phone lines page: The After Collective stays hidden until it approves');
  ok(SOURCES['24'] && SOURCES['24'].pending && /After Collective/.test(SOURCES['24'].title), 'TAC is in sources.json, flagged pending');
  ok(await p.locator('#page a[href="tel:988"]').count() === 1, 'phone lines page: 988 is listed, from a source');
  await p.context().close();
}

// 20. deep links from the landing page start each exchange
{
  for (const [h, want] of [['letter', 'What did they do?'], ['msg', 'Paste what they sent'], ['call', 'What is the call about?'], ['visit', 'Is the home still standing?']]) {
    p = await page({}, '/app/#/start/' + h);
    await p.waitForSelector('.thread .m-a');
    ok((await lastA(p).innerText()).includes(want), 'landing link #/start/' + h + ' opens that exchange');
    await p.context().close();
  }
}

// 21. AI paused while making a sheet: honest pause, and the checklist without the assistant
{
  p = await page();
  await tap(p, 'A call or visit is coming up'); await tap(p, 'phone call with my insurer'); await tap(p, 'I need an update'); await tap(p, 'I own it');
  await p.locator('.choices:not(.done) .choice').first().click(); await p.waitForSelector('#composerIn[placeholder*="own words"]');
  process.env.MOCK = 'off';
  await tap(p, 'Skip'); await p.waitForSelector('.m-a.pause');
  process.env.MOCK = 'ok';
  await tap(p, 'without the assistant'); await p.waitForSelector('#sheetDoc .ss');
  ok(/not written by the assistant/.test(await p.locator('.thread').innerText()) && /\[your name\]/.test(await p.locator('#sheetDoc').innerText()), 'paused: the checklist still comes, labelled, with a plain template');
  await p.context().close();
}

// 22. phone: the sheet is a pinned card that opens full screen; the log fits
{
  p = await page(PHONE);
  await tap(p, 'A call or visit is coming up'); await tap(p, 'phone call with my insurer'); await tap(p, 'They said no'); await tap(p, 'I own it');
  await p.locator('.choices:not(.done) .choice').first().click(); await tap(p, 'Skip');
  await p.waitForSelector('.paperwrap.open #sheetDoc .ss');
  ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'phone: the sheet has no sideways scroll');
  await p.click('#paperClose');
  ok((await p.locator('#pinKind').innerText()) === 'Your call sheet', 'phone: the pinned card names the call sheet');
  const small = await p.evaluate(() => Math.min(...[...document.querySelectorAll('body *')].filter((e) => e.offsetParent && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize))));
  ok(small >= 15, 'phone: nothing under 15px with a sheet (' + small + ')');
  await p.context().close();
}

// 23. landing: the Desk plays a scripted exchange in real HTML; reduced motion shows the finished state; the band
{
  p = await page({ reducedMotion: 'reduce' }, '/');
  await p.waitForTimeout(200);
  ok(await p.locator('#dk .dk-sheet p.subj').count() === 1 && /\$42,300/.test(await p.locator('#dk').innerText()), 'landing demo: reduced motion shows the finished letter at once');
  ok(await p.locator('.band a[href="tel:18009274357"]').count() === 1 && await p.locator('.band a[href="tel:988"]').count() === 1, 'landing band: real public lines');
  ok(/not staffed|not a person/.test(await p.locator('.band').innerText()) && /not legal or insurance advice/.test(await p.locator('.band').innerText()), 'landing band: the honesty line, plain, in the band');
  ok(await p.locator('.hero .btn:not(.ghost)').count() === 1 && await p.locator('.close .btn:not(.ghost)').count() === 1 && await p.locator('.btn:not(.ghost)').count() === 2 && (await p.locator('#startBtn2').getAttribute('href')) === '/app/', 'landing: one solid button per screen, the same Start at the top and the close');
  ok(await p.locator('.faq details').count() === 8 && JSON.parse(await p.locator('script[type="application/ld+json"]').textContent()).mainEntity.length === 8, 'landing: eight plain questions, also as FAQ data for search');
  ok(await p.locator('#lineTitle .w').count() === 0 && (await p.locator('#lineTitle').innerText()).split(/\s+/).length >= 12, 'landing line: under reduced motion it is plain full ink text, no word wrapping');
  ok((await p.locator('a.skip').getAttribute('href')) === '#main' && await p.locator('main#main').count() === 1, 'landing: a skip to content link');
  ok(await p.locator('.label:not(.dk .label)').count() === 0 && (await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => { const b = getComputedStyle(e, '::before'); return b.content !== 'none' && b.content !== 'normal' && parseFloat(b.width) <= 6 && b.borderRadius === '50%'; }).length)) === 0, 'landing: no section labels or dot ornaments above headings');
  const ltxt = await p.evaluate(() => document.body.innerText);
  ok(!/[–—!]/.test(ltxt) && !/\b(seamless|empower|effortless|peace of mind|unlock|get more money)\b/i.test(ltxt), 'landing: no dashes, exclamation marks, banned words or money promises');
  const lcss = fs.readFileSync(new URL('../public/landing.css', import.meta.url), 'utf8');
  ok(!/gradient\(|backdrop-filter|blur\(/.test(lcss), 'landing: no gradients or blur');
  ok(await p.locator('.art svg').count() === 1 && await p.locator('img').count() === 0, 'landing: one line illustration, no photos');
  // the drawing: under reduced motion it is the finished frame at once, the same as the last frame of the animation
  const rest = await p.evaluate(() => {
    const s = document.querySelector('.art svg'), q = (id) => s.querySelector('[data-id="' + id + '"]');
    const drawn = [...s.querySelectorAll('[data-id]')].every((e) => !e.style.strokeDasharray && e.style.visibility !== 'hidden');
    const out = { done: window.__rebuild.done(), rested: s.classList.contains('rested'), drawn, post: q('post-l').getAttribute('transform') || '', flag: q('flag').getAttribute('transform') || '',
      person: !!s.querySelector('.who circle'), letter: s.querySelector('.who [clip-path]').style.visibility, html: s.innerHTML };
    window.__rebuild.seek(window.__rebuild.END);
    out.same = s.innerHTML === out.html; delete out.html;
    return out;
  });
  ok(rest.done && rest.rested && rest.drawn && !rest.post && !rest.flag && rest.person && rest.letter === 'hidden' && rest.same, 'landing drawing: reduced motion shows the final frame at once (every line drawn, post plumb, flag up, the person resting, letter posted) ' + JSON.stringify(rest));
  const tels = await p.$$eval('a[href^="tel:"]', (a) => a.map((x) => x.textContent.trim()));
  ok(tels.every((n) => SRC_TEXT.includes(n)), 'landing: every number is in sources.json: ' + tels.join(', '));
  await p.context().close();
  p = await page({}, '/');
  await p.locator('#demo').scrollIntoViewIfNeeded();
  await p.waitForSelector('#dk.has-paper .dk-sheet p.subj', { timeout: 90000 });
  ok(true, 'landing demo: plays through to the letter');
  const lineStart = await p.evaluate(() => [window.__line.lit(), window.__line.total]);
  await p.evaluate(() => { const r = document.getElementById('lineTitle').getBoundingClientRect(); window.scrollBy(0, r.top - innerHeight * 0.5); });
  await p.waitForTimeout(150);
  const lineMid = await p.evaluate(() => window.__line.lit());
  await p.evaluate(() => document.getElementById('lineTitle').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(150);
  const lineEnd = await p.evaluate(() => window.__line.lit());
  ok(lineStart[0] < lineStart[1] && lineMid > 0 && lineMid < lineStart[1] && lineEnd === lineStart[1], 'landing line: words come up to full ink one by one as it scrolls in, then all of it (' + [lineStart[0], lineMid, lineEnd, lineStart[1]].join('/') + ')');
  await p.evaluate(() => document.querySelector('.art').scrollIntoView({ block: 'center' }));
  await p.waitForFunction(() => window.__rebuild.plays() >= 1, null, { timeout: 20000 });
  ok(true, 'landing drawing: after its first rest the animation plays through to the finished drawing');
  const n0 = await p.evaluate(() => window.__rebuild.plays());
  await p.waitForFunction((n) => window.__rebuild.plays() > n, n0, { timeout: 15000 });
  ok(true, 'landing drawing: after a 2 second rest it draws again while on screen');

  await p.waitForFunction(() => !window.__demo.running(), null, { timeout: 10000 });
  ok(p.errs.length === 0, 'landing: no page errors ' + p.errs.join('|'));
  await p.setViewportSize({ width: 375, height: 760 });
  ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'landing demo: no sideways scroll at 375px');
  await p.context().close();
}

// 24. server: numbers the model invents never reach the paper, and sheets parse
{
  const core = await import('../lib/core.js');
  ok(core.guardNumbers('You offered $42,300 but my estimate is $96,000. Reply within 15 days.', 'offered 42,300 estimate 96000', ['15']) === 'You offered $42,300 but my estimate is $96,000. Reply within 15 days.', 'number guard: keeps the person’s own numbers');
  ok(/\[check this number\]/.test(core.guardNumbers('I waited 8 weeks and paid $3,200.', 'I waited a while', [])), 'number guard: an invented number becomes a blank to check');
  ok(core.guardNumbers('seven weeks ago, about 7 weeks', 'it has been seven weeks', []).indexOf('[') === -1, 'number guard: "seven" in the notes allows a 7');
  ok(/^Subject: Request for a line-by-line explanation of the settlement offer, claim HO-55821$/m.test(core.tidyLetter('Subject: Claim stuff\n\nDear Claims Team,\n\nText.', { subject: 'Request for a line-by-line explanation of the settlement offer', notes: 'My claim number is HO-55821.' })), 'letters: the subject comes from the ask, with the person’s claim number');
  const ASK = 'Please explain in writing how you calculated the offer, line by line, and what it does not include.';
  const fixed = core.restoreAsk('Subject: X\n\nDear Claims Team,\n\nMy estimate is $96,000. Please explain your number.\n\nPlease reply in writing within 15 calendar days of receiving this letter.\n\nThank you,\n[your name]', ASK);
  ok(fixed.includes('\n\n' + ASK + '\n\n') && fixed.includes('My estimate is $96,000.') && !/explain your number/.test(fixed), 'edits: a reworded request is put back word for word, facts kept');
  ok(/"you"/.test(core.explainSystemPrompt('en')) && /never write "the person"/.test(core.explainSystemPrompt('en')), 'explain: speaks to the reader as you');
  ok(/Never join two sentences with a comma/.test(core.sheetSystemPrompt({ kind: 'call' })) && /no "around"/.test(core.sheetSystemPrompt({ kind: 'visit', home: 'lost', role: 'rent' })) && !/scope of work/.test(core.sheetSystemPrompt({ kind: 'visit', home: 'lost', role: 'rent' }).split('\n')[2]), 'sheets: prompt bans comma splices and rounding; a lost rental does not ask for a scope of work');
  const scrubbed = core.scrubLetter('Dear Claims Team,\n\nI recently received your offer of $42,300, which seems to be lower than the estimated cost. My contractor estimated $96,000. I would like to know if my policy covers a hotel.\n\n' + ASK + '\n\nPlease reply in writing within 15 calendar days of receiving this letter.', ASK, 'offer 42300 contractor 96000');
  ok(/I received your offer of \$42,300\. My contractor estimated \$96,000\./.test(scrubbed) && !/recently|seems|hotel/.test(scrubbed) && scrubbed.includes(ASK), 'letters: added timing, opinions and a second request are removed, facts kept');
  const ASK5 = 'Please confirm in writing the deadlines that apply to my claim.';
  const lost = core.scrubLetter('Subject: S\n\nDear Claims Team,\n\nI am writing about my claim.\n\nI would like you to confirm in writing the deadlines that apply to my claim.\n\nPlease reply in writing within 15 calendar days of receiving this letter.\n\nThank you,\n[your name]', ASK5, '');
  ok(!core.hasAsk(lost, ASK5) && core.hasAsk(core.restoreAsk(lost, ASK5), ASK5) && core.restoreAsk(lost, ASK5).indexOf(ASK5) < core.restoreAsk(lost, ASK5).indexOf('within 15'), 'letters: an ask the clean-up removed is put back before the reply-by line');
  ok(core.scrubSpoken('I received an offer from the insurance company. I am concerned that it is not enough. My estimate is $96,000, which is significantly different from the offer.', '') === 'I received an offer from you. My estimate is $96,000.', 'sheets: spoken to the insurer as you, no added worries or comparisons');
  const ps = core.parseSheet('SAY: Hi, my name is [your name].\nI am calling about my claim.\nPOINT: The garage was left out.\n- POINT: none');
  ok(ps.say === 'Hi, my name is [your name]. I am calling about my claim.' && ps.points.length === 1, 'sheet parser: SAY and POINT lines');
  const ex = await (await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'explain', paste: 'To continue we need the following: a list of damaged items with receipts and photographs. Please upload these to the portal.' }) })).json();
  ok(ex.sit === 'other' && ex.ask === 'a2' && /^You are asked/.test(ex.text), 'explain: a message that already lists what they need gets "confirm nothing else is needed", and is said to you');
  const fb = await (await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'explain', paste: 'FALLBACK We are offering $42,300 for dwelling repairs. Please sign the release.' }) })).json();
  ok(fb.sit === 'low' && fb.ask === 'a1', 'explain: when the model falls back to "other" on a plain offer, the offer situation is used');
  const lf = await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'revise', sit: 'low', ask: ASK, instruction: 'LOSEFACTS', letter: 'Subject: S\n\nDear Claims Team,\n\nYou offered $42,300. My contractor estimated $96,000.\n\n' + ASK + '\n\nPlease reply in writing within 15 calendar days of receiving this letter.\n\nThank you,\n[your name]' }) });
  ok(lf.status === 422 && (await lf.json()).error === 'lost_facts', 'edits: a change that would lose an amount is refused, so the letter stays as it was');
  ok(/left it as it was/.test(fs.readFileSync(new URL('../public/desk.js', import.meta.url), 'utf8')), 'edits: the Desk says so plainly');
  const lw = await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'revise', sit: 'quiet', ask: 'Please send me a written update on my claim status and the next step.', instruction: 'LOSEWORDS', letter: 'Subject: S\n\nDear Claims Team,\n\nI emailed my adjuster three times since September 30.\n\nPlease send me a written update on my claim status and the next step.\n\nPlease reply in writing within 15 calendar days of receiving this letter.\n\nThank you,\n[your name]' }) });
  ok(lw.status === 422, 'edits: a change that turns "three times" into "multiple" is refused too (number words are facts)');
  const echo = await (await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'sheet', kind: 'call', sit: 'quiet', ask: 'Please send me a written update on my claim status and the next step.', notes: 'ECHO Claim HO-77812.' }) })).json();
  ok(echo.points.length === 0, 'sheets: points that only echo the ask or what to say are dropped (' + echo.points.join(' | ') + ')');
  const n0 = calls.length;
  const r = await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'sheet', kind: 'visit', home: 'lost', notes: '' }) });
  const j = await r.json();
  ok(r.ok && j.say && j.points.length === 0, 'sheet mode: empty notes give no points');
  ok(/HOME: destroyed/.test(calls[n0].userFull), 'sheet mode: the home state reaches the prompt');
}
// ---------------------------------------------------------------------------
// Phase 3: Spanish, dark mode, a real PDF
// ---------------------------------------------------------------------------
const ES = { locale: 'es-MX' };
const pick = async (p, i) => p.locator('.choices:not(.done) .choice').nth(i).click();
const pdfOf = async (p) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click('#printBtn')]); const b = fs.readFileSync(await d.path()); return { name: d.suggestedFilename(), text: b.toString('latin1') }; };

// 25. server: the guards hold for Spanish input and for the Spanish copy
{
  const core = await import('../lib/core.js');
  const S = SOURCES;
  ok(core.guardNumbers('You offered $42,300. My estimate is $96,000. It has been 7 weeks.', 'Me ofrecieron $42.300. Mi contratista dice 96 mil. Hace siete semanas.', ['15']).indexOf('[') === -1, 'number guard: Spanish notes ($42.300, "96 mil", "siete semanas") allow the same numbers in the English letter');
  ok(/\[check this number\]/.test(core.guardNumbers('You offered $45,000.', 'Me ofrecieron $42.300.', [])), 'number guard: a number not in the Spanish notes is still blanked');
  ok((('mi número de reclamo es HO-55821'.match(core.CLAIM_RE)) || [])[1] === 'HO-55821' && (('reclamo #RN-20431'.match(core.CLAIM_RE)) || [])[1] === 'RN-20431', 'claim numbers are found when written in Spanish');
  const EN = 'You offered $42,300 to settle the claim for my home. My contractor’s estimate is $96,000.';
  ok(core.checkEs('Ustedes ofrecieron $42,300 para resolver el reclamo de mi vivienda. El presupuesto de mi contratista es de $96,000.', EN, S) !== null, 'Spanish copy: a faithful line is kept');
  ok(core.checkEs('Ustedes ofrecieron 42.300 dólares por mi vivienda. Mi contratista calcula 96.000 dólares para la reparación.', EN, S) !== null, 'Spanish copy: Spanish number style (42.300) is read as the same number');
  ok(core.checkEs('Ustedes ofrecieron $45,000 por mi vivienda. Mi contratista calcula $96,000 para todo.', EN, S) === null, 'Spanish copy: an invented number rejects the line');
  ok(core.checkEs('Ustedes ofrecieron $42,300, que parece muy baja. Mi contratista calcula $96,000 para la casa.', EN, S) === null, 'Spanish copy: an added opinion rejects the line');
  ok(core.checkEs('Recientemente ustedes ofrecieron $42,300. Mi contratista calcula $96,000 para la casa.', EN, S) === null, 'Spanish copy: an added timing word rejects the line');
  ok(core.checkEs('Ustedes ofrecieron $42,300. ¿Podrían explicar por qué mi contratista calcula $96,000?', EN, S) === null, 'Spanish copy: an added request rejects the line');
  ok(core.checkEs('Mi número es [claim number] y llamé al 1-800-555-1234 ayer por la tarde.', 'My number is [claim number] and I called 1-800-555-1234 yesterday afternoon.', S) === null, 'Spanish copy: a phone number not in sources.json rejects the line');
  ok(core.checkEs('Escribo sobre mi reclamo por mi vivienda.', 'I am writing about my claim [claim number] for my home.', S) === null, 'Spanish copy: a dropped blank rejects the line');
  ok(core.checkEs('Escribo sobre mi reclamo [claim number] por mi vivienda.', 'I am writing about my claim [claim number] for my home.', S) === 'Escribo sobre mi reclamo [número de reclamo] por mi vivienda.', 'Spanish copy: blanks are named in Spanish');
  ok(core.toUsted('La persona debe firmar. Se le pide a la persona enviar fotos del asegurado.') === 'Usted debe firmar. Se le pide a usted enviar fotos de usted.', 'Spanish explanation: "la persona" becomes usted');
  ok(core.LEAVES_OUT.test('No menciona el garaje.') && core.LEAVES_OUT.test('It does not mention the garage.') && !core.LEAVES_OUT.test('No pueden pagar.'), 'commentary on what a message leaves out is caught in both languages');
  ok(core.OPINION_ES.test('La oferta parece baja.') && core.OPINION_ES.test('Estoy preocupado.') && !core.OPINION_ES.test('La oferta es de $42,300.'), 'Spanish opinion words are recognised');
  ok(/translate the person’s facts faithfully/.test(core.letterSystemPrompt({})) && /letter stays in English/.test(core.reviseSystemPrompt('x')) && /SAY and POINT lines in English/.test(core.sheetSystemPrompt({ kind: 'call' })), 'prompts: Spanish notes and edits still give an English letter and sheet');
  ok(/usted/.test(core.explainSystemPrompt('es')) && !/usted/.test(core.explainSystemPrompt('en')), 'prompts: the Spanish explanation speaks as usted');
  ok(/LANGUAGE: the person reads Spanish/.test(core.chatSystemPrompt(S, { lang: 'es' })) && !/LANGUAGE:/.test(core.chatSystemPrompt(S, { lang: 'en' })), 'chat prompt: Spanish readers are told the letter goes in English with a Spanish copy');
  const post = async (b) => (await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })).json();
  const ASK = 'Please explain in writing how you calculated the offer, line by line, and what it does not include.';
  const ASK_ES = 'Les pido que expliquen por escrito cómo calcularon la oferta, partida por partida, y qué no incluye.';
  const L1 = await post({ mode: 'letter', lang: 'es', sit: 'low', role: 'own', ask: ASK, askEs: ASK_ES, subject: 'Request for a line-by-line explanation of the settlement offer', subjectEs: 'Solicitud de una explicación partida por partida de la oferta de liquidación', notes: 'Me ofrecieron $42.300.' });
  const LP = L1.text.split(/\n{2,}/);
  ok(/^Subject: /.test(L1.text) && L1.text.includes(ASK) && Array.isArray(L1.es) && L1.es.length === LP.length, 'letter in Spanish: the letter is English, with one Spanish line per paragraph');
  ok(L1.es[LP.indexOf(ASK)] === ASK_ES && L1.es[0].startsWith('Asunto: Solicitud') && L1.es.includes('Estimado equipo de reclamos:') && L1.es[L1.es.length - 1] === 'Gracias,\n[su nombre]', 'letter in Spanish: the ask, subject, greeting and sign-off are our own fixed Spanish, never the model’s');
  const L0 = await post({ mode: 'letter', lang: 'en', sit: 'low', role: 'own', ask: ASK, notes: 'x' });
  ok(!('es' in L0), 'letter in English: no Spanish copy is made');
  const bad = await post({ mode: 'gloss', lang: 'es', ask: ASK, askEs: ASK_ES, text: 'Subject: S\n\nDear Claims Team,\n\nGLOSSBAD You offered $42,300.\n\n' + ASK + '\n\nPlease reply in writing within 15 calendar days of receiving this letter.\n\nThank you,\n[your name]' });
  ok(bad.es && bad.es[2] === null && bad.es[3] === ASK_ES, 'Spanish copy: a translated line that invents a number is withheld (shown in English instead), the rest stays');
  const ex = await post({ mode: 'explain', lang: 'es', paste: 'Dear Policyholder, we are offering $41,200 for dwelling repairs. Please sign and return the release by December 15.' });
  ok(/^Su aseguradora le ofrece \$41,200/.test(ex.text) && /Usted debe firmar/.test(ex.text) && !/la persona|No menciona/i.test(ex.text) && ex.sit === 'low', 'their message in Spanish: explained to usted, no commentary on what it leaves out');
  const exEs = await post({ mode: 'explain', lang: 'es', paste: 'FALLBACK Estimado asegurado: le ofrecemos un acuerdo de $42,300 por las reparaciones.' });
  ok(exEs.sit === 'low', 'their message written in Spanish: a plain offer is still read as an offer');
  const sh = await post({ mode: 'sheet', lang: 'es', kind: 'call', sit: 'low', ask: ASK, notes: 'Ofrecieron $42,300. Quiero saber por qué no incluyeron el garaje.' });
  ok(sh.say && /^Hi, my name is/.test(sh.say) && typeof sh.sayEs === 'string' && Array.isArray(sh.pointsEs) && sh.pointsEs.length === sh.points.length, 'sheet in Spanish: what to say stays English (it is said to the insurer), each line with a checked Spanish copy');
}

// 26. the Desk in Spanish, all by tapping: every screen in Spanish, the letter in English with the Spanish copy beside it
{
  p = await page(ES);
  ok((await p.evaluate(() => document.documentElement.lang)) === 'es' && (await p.locator('.opening h1').innerText()) === '¿Qué está pasando con su aseguradora?', 'Spanish: a browser set to Spanish opens the Desk in Spanish');
  ok((await p.locator('.side-links a').allInnerTexts()).join('|') === 'Historial|Pasos de un reclamo|Respire un momento|Líneas telefónicas', 'Spanish: the sidebar is in Spanish');
  ok(/borrador sin revisar/.test(await p.locator('#fine').innerText()) && /no es asesoría legal/.test(await p.locator('#fine').innerText()), 'Spanish: the footer line says the Spanish is an unreviewed draft, and keeps the honesty line');
  const n0 = calls.length;
  await pick(p, 0); await pick(p, 1); await pick(p, 0);
  ok(/^Elija esto si/.test(await p.locator('.choices:not(.done) .choice small').first().innerText()), 'Spanish: every ask shows its "Elija esto si" note');
  await pick(p, 0); await p.waitForSelector('#composerIn[placeholder*="sus palabras"]');
  await send(p, 'Me ofrecieron $42.300 el 3 de noviembre. Mi contratista dice que son 96 mil.');
  await p.waitForSelector('#letter p.subj', { state: 'attached' }); await p.waitForSelector('#esCopy:not([hidden])');
  const lc = calls.slice(n0).find((c) => c.sysHead.startsWith('Write a short letter'));
  ok(lc && /ASK: Please explain in writing how you calculated/.test(lc.userFull) && /\$42\.300/.test(lc.userFull), 'Spanish: the letter request carries the English ask and the person’s Spanish words');
  ok(/^Subject:/.test(await p.locator('#letter p').first().innerText()) && (await p.locator('#letter').getAttribute('lang')) === 'en', 'Spanish: the letter itself is in English');
  const esTxt = await p.locator('#esCopy').innerText();
  ok(/Lo que dice su carta, en español/.test(esTxt) && /Les pido que expliquen por escrito cómo calcularon la oferta/.test(esTxt) && /Asunto: Solicitud/.test(esTxt), 'Spanish: under the letter, what it says in Spanish');
  const chatTxt = await p.locator('.thread').innerText();
  ok(/Va en inglés/.test(chatTxt) && /Fuente: página del CDI sobre incendios/.test(chatTxt), 'Spanish: the chat says the letter goes in English with the Spanish copy, sources named in Spanish');
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.click('#copyBtn');
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  ok(/^Subject:/.test(clip) && !/Lo que dice su carta|Asunto/.test(clip), 'Spanish: Copy gives only the English letter, the one that is sent');
  const pdf = await pdfOf(p);
  ok(pdf.text.startsWith('%PDF-1.4') && /\(Dear Claims Team,\) Tj/.test(pdf.text) && !/Asunto/.test(pdf.text) && /^next-step-carta-\d{4}-\d{2}-\d{2}\.pdf$/.test(pdf.name), 'Spanish: Download PDF gives a real PDF of the English letter (' + pdf.name + ')');
  // edit by telling the chat, in Spanish
  const n1 = calls.length;
  await send(p, 'hágala más corta');
  await p.waitForSelector('.m-a .tx:has-text("líneas cambiadas")');
  ok(calls.slice(n1).some((c) => c.sysHead.startsWith('You edit a letter')) && await p.evaluate(() => { const c = window.__desk.state().chat; return Array.isArray(c.letterEs) && c.letterEs.length === c.letter.split(/\n{2,}/).length; }), 'Spanish: "hágala más corta" rewrites the letter and its Spanish copy, still one line per paragraph');
  await send(p, 'mi número de reclamo es HO-55821');
  await p.waitForSelector('#letter p.changed');
  ok((await p.locator('#letter p.subj').innerText()).includes('HO-55821') && (await p.locator('#esCopy p.subj').innerText()).includes('reclamo HO-55821'), 'Spanish: a claim number given in Spanish lands on the subject line, and on the Spanish copy');
  // typing on the letter makes the copy out of date, and it can be brought up to date
  await p.locator('#letter p').nth(2).click(); await p.keyboard.press('End'); await p.keyboard.type(' I sent photos.');
  await p.waitForSelector('#esUpdate');
  ok(/Esta copia es de antes del cambio/.test(await p.locator('#esCopy').innerText()), 'Spanish: after typing on the letter, the copy says it is from before the change');
  await p.click('#esUpdate'); await p.waitForFunction(() => !document.getElementById('esUpdate'));
  ok(/I sent photos/.test(await p.locator('#esCopy').innerText()), 'Spanish: "Actualizar la copia en español" translates the letter as it is now');
  const shown = await p.evaluate(() => document.body.innerText);
  ok(!/[–—!¡]/.test(shown) && !/\p{Extended_Pictographic}/u.test(shown), 'Spanish: no dashes, exclamation marks or emoji on screen');
  ok((await contrastScan(p)).every((x) => x.r >= 4.5), 'Spanish letter screen: every text passes AA contrast (worst ' + JSON.stringify(worst(await contrastScan(p))) + ')');
  ok(p.errs.length === 0, 'Spanish: no page errors in the letter flow ' + p.errs.join('|'));
  await p.context().close();
}

// 27. Spanish: care card words, sheets, pages, the landing page, switching language
{
  p = await page(ES);
  await send(p, 'Ya no puedo más, estoy agotada');
  await p.waitForSelector('.m-a.care .care-go');
  ok(/Esto es mucho para cargar/.test(await p.locator('.m-a.care').innerText()) && await p.locator('.m-a.care a[href="tel:988"]').count() === 1, 'Spanish: "ya no puedo más, estoy agotada" brings the care card once, with 988');
  await p.click('#newChat');
  await pick(p, 2); await pick(p, 0); await pick(p, 1); await pick(p, 0); await pick(p, 0);
  await p.waitForSelector('#composerIn[placeholder*="sus palabras"]');
  await send(p, 'Ofrecieron $42,300. Quiero saber por qué no incluyeron el garaje.');
  await p.waitForSelector('#sheetDoc .ss');
  const v = await p.locator('#sheetDoc').innerText();
  ok(/Hoja para la llamada sobre su oferta/.test(v) && ['Antes de llamar', 'Qué decir primero', 'Qué pedir', 'Mientras habla', 'Registro de la llamada'].every((h) => v.includes(h)), 'Spanish: the call sheet is in Spanish');
  ok(/intérprete/.test(v) && /orientación general/.test(v), 'Spanish: the call sheet adds the interpreter line, marked as general guidance');
  ok(/Hi, my name is/.test(v) && /En español: /.test(v), 'Spanish: what to say first stays in English, with what it means in Spanish');
  await p.fill('#lg-who', 'Dana Ortiz, ajustadora'); await p.fill('#lg-said', 'Enviará el presupuesto detallado.');
  await p.click('[data-sheet="record"]'); await p.waitForTimeout(200);
  const spdf = await pdfOf(p);
  ok(/\(HOJA PARA LA LLAMADA|\(Hoja para la llamada sobre su oferta\) Tj/.test(spdf.text) && /Qu\xe9 decir primero|QU\xc9 DECIR PRIMERO/.test(spdf.text) && /\(Dana Ortiz, ajustadora\) Tj/.test(spdf.text) && /insurance\.ca\.gov|uphelp\.org/.test(spdf.text), 'Spanish: the sheet PDF keeps the Spanish (accents encoded), the log and the source links');
  await p.goto(base + '/app/#/phones'); await p.waitForSelector('#page h1');
  const ph = await p.locator('#page').innerText();
  ok(/Líneas telefónicas/.test(ph) && /Departamento de Seguros de California/.test(ph) && /llame al 911/.test(ph) && /sin fines de lucro/.test(ph) && !/After Collective/.test(ph), 'Spanish: phone lines in Spanish, United Policyholders explained in Spanish, TAC still hidden');
  await p.goto(base + '/app/#/steps'); await p.waitForSelector('.stages');
  ok(/Pasos de un reclamo/.test(await p.locator('#page h1').innerText()) && /Reporte la pérdida/.test(await p.locator('.stages').innerText()), 'Spanish: steps of a claim in Spanish');
  await p.goto(base + '/app/#/record'); await p.waitForSelector('#page h1');
  ok(/Historial/.test(await p.locator('#page h1').innerText()) && /Llamada/.test(await p.locator('.record').innerText()), 'Spanish: Record (Historial) lists the saved call in Spanish');
  ok(p.errs.length === 0, 'Spanish: no page errors on sheets and pages ' + p.errs.join('|'));
  // switch back to English from the sidebar; the choice is remembered
  await p.goto(base + '/app/'); await p.waitForSelector('#langBtn');
  await Promise.all([p.waitForNavigation(), p.click('#langBtn')]); await p.waitForSelector('.thread');
  ok((await p.evaluate(() => document.documentElement.lang)) === 'en' && (await p.locator('.side-links a').first().innerText()) === 'Record', 'switching language in the sidebar switches the Desk, even on a Spanish browser');
  await p.context().close();
  // landing
  p = await page({}, '/?lang=es');
  ok(/Cada palabra a su aseguradora cuenta/.test(await p.locator('h1').innerText()) && (await p.locator('#startBtn').innerText()) === 'Empezar', 'landing: ?lang=es shows the landing page in Spanish');
  ok(await p.locator('[data-t="foot3"]').isVisible() && /borrador/.test(await p.locator('[data-t="foot3"]').innerText()), 'landing: the footer says the Spanish is an unreviewed draft');
  ok(/no es asesoría legal ni de seguros/i.test(await p.locator('#disclaimer').innerText()), 'landing: the honesty line in Spanish');
  const lt = await p.evaluate(() => document.body.innerText);
  ok(!/[–—!¡]/.test(lt), 'landing in Spanish: no dashes or exclamation marks');
  await p.setViewportSize({ width: 375, height: 760 });
  ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'landing in Spanish: no sideways scroll at 375px');
  await p.goto(base + '/app/'); await p.waitForSelector('.opening h1');
  ok((await p.locator('.opening h1').innerText()).startsWith('¿Qué'), 'the language chosen on the landing page carries into the Desk');
  await p.context().close();
}

// 28. dark mode: a toggle, light first always, remembered; every text passes AA in both themes, measured
{
  p = await page({ colorScheme: 'dark' });
  ok((await p.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(244, 241, 234)', 'dark: light still loads first on a dark device');
  await p.click('#themeBtn');
  ok((await p.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(26, 23, 20)' && (await p.locator('#themeBtn').innerText()) === 'Light mode', 'dark: the sidebar toggle turns it on, and offers light again');
  await p.reload(); await p.waitForSelector('.opening h1');
  ok((await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark', 'dark: the choice is remembered on this device');
  const scan = async (name) => { const s = await contrastScan(p); ok(s.length > 5 && s.every((x) => x.r >= 4.5), 'dark ' + name + ': every text passes AA (worst ' + JSON.stringify(worst(s)) + ')'); };
  await scan('opening');
  ok((await p.locator('.side').evaluate((e) => getComputedStyle(e).backgroundColor)) === 'rgb(15, 13, 11)' && (await p.locator('.side-links a').first().evaluate((e) => getComputedStyle(e).color)) === 'rgb(238, 233, 223)', 'dark: the sidebar stays a deep surface with light text');
  await toLetter(p); await scan('letter');
  await p.click('#newChat'); await pick(p, 2); await pick(p, 0); await pick(p, 1); await pick(p, 0); await pick(p, 0); await tap(p, 'Skip');
  await p.waitForSelector('#sheetDoc .ss'); await scan('call sheet');
  for (const r of ['phones', 'steps', 'record']) { await p.goto(base + '/app/#/' + r); await p.waitForSelector('#page h1'); await scan(r); }
  await p.goto(base + '/'); await p.waitForTimeout(300); await scan('landing');
  ok((await p.locator('.band').evaluate((e) => getComputedStyle(e).backgroundColor)) === 'rgb(15, 13, 11)', 'dark: the landing band stays deep');
  await p.click('#themeBtn');
  ok((await p.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(244, 241, 234)', 'dark: the landing toggle turns it back to light');
  ok(p.errs.length === 0, 'dark: no page errors ' + p.errs.join('|'));
  await p.context().close();
  // light, measured on the screens the earlier checks do not scan
  p = await page();
  await tap(p, 'A call or visit is coming up'); await tap(p, 'adjuster is visiting'); await tap(p, 'standing'); await tap(p, 'I own it'); await tap(p, 'Skip');
  await p.waitForSelector('#sheetDoc .ss');
  const ls = async (name) => { const s = await contrastScan(p); ok(s.every((x) => x.r >= 4.5), 'light ' + name + ': every text passes AA (worst ' + JSON.stringify(worst(s)) + ')'); };
  await ls('visit sheet');
  for (const r of ['phones', 'steps', 'record']) { await p.goto(base + '/app/#/' + r); await p.waitForSelector('#page h1'); await ls(r); }
  await p.goto(base + '/'); await p.waitForTimeout(300); await ls('landing');
  await p.context().close();
}

// 29. a real PDF for every paper, in English: letter, reply, call sheet, visit sheet
{
  p = await page();
  await toLetter(p);
  const L = await pdfOf(p);
  ok(L.text.startsWith('%PDF-1.4') && /%%EOF$/.test(L.text) && /\/BaseFont \/Times-Roman/.test(L.text) && /\(Dear Claims Team,\) Tj/.test(L.text) && /Subject: Request/.test(L.text), 'PDF: the letter downloads as a real PDF, set in Times');
  ok(/startxref\n(\d+)\n%%EOF$/.test(L.text) && L.text.slice(Number(L.text.match(/startxref\n(\d+)/)[1])).startsWith('xref'), 'PDF: the cross-reference table points where it should');
  await p.click('.side-links a[data-page="record"]'); await p.waitForSelector('.record');
  ok(/Letter/.test(await p.locator('.record').innerText()), 'PDF: a letter saved as a PDF is listed in the Record');
  await p.goto(base + '/app/'); await p.click('#newChat'); await tap(p, 'I got a message from them');
  await send(p, 'Dear Policyholder, after review we are offering $41,200 for dwelling repairs per the adjuster estimate. Please sign and return the enclosed release by December 15.');
  await p.waitForSelector('.choices:not(.done) .choice:has-text("suggested")'); await tap(p, 'suggested'); await tap(p, 'I own it');
  await p.waitForSelector('#letter p.subj', { state: 'attached' });
  const R = await pdfOf(p);
  ok(/\(Dear Claims Team,\) Tj/.test(R.text) && /next-step-reply-/.test(R.name), 'PDF: the reply letter downloads as a PDF');
  await p.click('#newChat'); await tap(p, 'A call or visit is coming up'); await tap(p, 'phone call with my insurer'); await tap(p, 'Their offer'); await tap(p, 'I own it');
  await pick(p, 0); await send(p, 'They offered $42,300 on Nov 3.');
  await p.waitForSelector('#sheetDoc .ss'); await p.fill('#lg-who', 'Dana Ortiz, adjuster');
  const C1 = await pdfOf(p);
  ok(/\(CALL LOG\) Tj/.test(C1.text) && /\(WHAT TO SAY FIRST\) Tj/.test(C1.text) && /Dana Ortiz, adjuster/.test(C1.text) && /\(general/.test(C1.text) && /\/Count \d+/.test(C1.text), 'PDF: the call sheet downloads with its sections, log, source numbers and general-guidance marks');
  await p.click('#newChat'); await tap(p, 'A call or visit is coming up'); await tap(p, 'adjuster is visiting'); await tap(p, 'destroyed'); await tap(p, 'I own it'); await tap(p, 'Skip');
  await p.waitForSelector('#sheetDoc .ss');
  const V = await pdfOf(p);
  ok(/\(VISIT LOG\) Tj/.test(V.text) && /debris/.test(V.text) && /next-step-visit-sheet-/.test(V.name), 'PDF: the visit sheet downloads as a PDF');
  ok(p.errs.length === 0, 'PDF: no page errors ' + p.errs.join('|'));
  await p.context().close();
}

// 30a. the page that is not there: branded, a way back, out of search
{
  p = await page({}, '/no-such-page');
  ok(/isn’t here/.test(await p.locator('h1').innerText()) && (await p.locator('.lost a.btn').first().getAttribute('href')) === '/' && (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex', '404: branded page with a way back, not indexed');
  await p.context().close();
}

// 30. landing intro: says what the tool is at a glance, letter first; Demo; one honesty line under the buttons
{
  p = await page({}, '/');
  const big = p.locator('.hero .lede-big');
  ok((await big.innerText()) === 'A free tool that helps you communicate with your insurer after a California wildfire.', 'landing intro: the first line under the headline names the tool');
  const st = await big.evaluate((e) => { const c = getComputedStyle(e); return { color: c.color, size: parseFloat(c.fontSize), body: getComputedStyle(document.body).color }; });
  ok(st.color === st.body && st.size >= 21, 'landing intro: the first line is in ink, at least 21px (' + st.size + 'px)');
  const grey = await p.locator('.hero .lede:not(.lede-big)').innerText();
  ok(/^Start with a letter/.test(grey) && /replies/.test(grey) && /calls/.test(grey) && /adjuster’s visit/.test(grey), 'landing intro: the grey line starts with the letter and mentions replies, calls and the visit');
  const hero = await p.locator('.hero').innerText();
  ok((hero.match(/\bfree\b/gi) || []).length === 1 && !/negotiat/i.test(await p.evaluate(() => document.body.innerText)), 'landing intro: "free" once in the hero, and "negotiate" nowhere');
  ok((await p.locator('#watchBtn').innerText()) === 'Demo' && (await p.locator('#watchBtn').getAttribute('href')) === '#demo', 'landing: the ghost button says Demo and goes to the demo');
  ok((await p.locator('.hero .honest').innerText()) === 'General information from public sources, not legal or insurance advice.', 'landing: only the general information line sits under the buttons');
  await p.context().close();
  p = await page(PHONE, '/');
  const sb = await p.locator('#startBtn').boundingBox();
  ok(sb.y + sb.height <= 760, 'landing intro: Start is above the fold on a 375 by 760 phone (ends at ' + Math.round(sb.y + sb.height) + ')');
  await p.context().close();
  p = await page(Object.assign({ locale: 'es-MX' }, PHONE), '/?lang=es');
  ok((await p.locator('.hero .lede-big').innerText()).startsWith('Una herramienta gratuita que le ayuda a comunicarse') && /^Empiece con una carta/.test(await p.locator('.hero .lede:not(.lede-big)').innerText()) && (await p.locator('#watchBtn').innerText()) === 'Demo', 'landing intro in Spanish: both lines and Demo');
  ok((await p.locator('.hero .honest').innerText()) === 'Información general de fuentes públicas, no es asesoría legal ni de seguros.', 'landing in Spanish: only the general information line under the buttons');
  const sbe = await p.locator('#startBtn').boundingBox();
  ok(sbe.y + sbe.height <= 760 && (await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'landing intro in Spanish: Empezar above the fold on a 375 by 760 phone, no sideways scroll');
  await p.context().close();
}

// 31. the Desk's sidebar on a computer opens and closes, like a drawer; remembered; labelled; the phone menu is unchanged
{
  p = await page();
  const fold = p.locator('#sideFold'), unfold = p.locator('#sideUnfold');
  ok(await fold.isVisible() && !(await unfold.isVisible()) && (await fold.getAttribute('aria-expanded')) === 'true' && (await fold.getAttribute('aria-label')) === 'Close sidebar' && (await fold.getAttribute('aria-controls')) === 'side', 'sidebar: open first, with a labelled close control (aria-expanded true)');
  await toLetter(p);
  const w0 = (await p.locator('#sheet').boundingBox()).width, t0 = (await p.locator('#talk').boundingBox()).width;
  await fold.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(450);
  const w1 = (await p.locator('#sheet').boundingBox()).width, t1 = (await p.locator('#talk').boundingBox()).width;
  ok((await p.locator('#side').boundingBox()).width < 1 && w1 > w0 && t1 > t0, 'sidebar: closing it by keyboard gives the room to the chat and the paper (sheet ' + Math.round(w0) + ' to ' + Math.round(w1) + ')');
  ok(await unfold.isVisible() && (await p.evaluate(() => document.activeElement.id)) === 'sideUnfold' && (await unfold.getAttribute('aria-expanded')) === 'false' && (await unfold.getAttribute('aria-label')) === 'Open sidebar', 'sidebar: the open control appears top left, takes focus, aria-expanded false');
  const ub = await unfold.boundingBox();
  ok(ub.x < 40 && ub.y < 20 && ub.width >= 44 && ub.height >= 44, 'sidebar: the open control sits at the top left of the Desk, 44px or more');
  ok(await p.locator('#side').evaluate((e) => getComputedStyle(e).visibility) === 'hidden', 'sidebar: closed, its links leave the tab order');
  const tb = (await p.locator('#thread').boundingBox()).y;
  ok(tb >= ub.y + ub.height, 'sidebar: closed, the chat scrolls below the open control, never under it');
  ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 1440, 'sidebar: closed, no sideways scroll');
  await p.reload(); await p.waitForSelector('.thread .m-a');
  ok(await unfold.isVisible() && (await p.evaluate(() => document.documentElement.dataset.side)) === 'shut' && (await fold.getAttribute('aria-expanded')) === 'false', 'sidebar: the closed choice is remembered on this device');
  await unfold.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(450);
  ok((await p.locator('#side').boundingBox()).width > 200 && (await p.evaluate(() => document.activeElement.id)) === 'sideFold' && !(await unfold.isVisible()), 'sidebar: opening it again by keyboard brings it back and focus returns to the close control');
  await p.reload(); await p.waitForSelector('.thread .m-a');
  ok((await p.locator('#side').boundingBox()).width > 200, 'sidebar: the open choice is remembered too');
  const tr = await p.locator('.app').evaluate((e) => getComputedStyle(e).transitionDuration);
  ok(/0\.24s/.test(tr), 'sidebar: the motion is gentle, a quarter second (' + tr + ')');
  ok(p.errs.length === 0, 'sidebar: no page errors ' + p.errs.join('|'));
  await p.context().close();
  p = await page({ reducedMotion: 'reduce' });
  ok(/^0s/.test(await p.locator('.app').evaluate((e) => getComputedStyle(e).transitionDuration)), 'sidebar: no motion under reduced motion');
  await p.context().close();
  p = await page(Object.assign({ locale: 'es-MX' }, { viewport: DESK }));
  ok((await p.locator('#sideFold').getAttribute('aria-label')) === 'Cerrar la barra lateral' && (await p.locator('#sideUnfold').getAttribute('aria-label')) === 'Abrir la barra lateral', 'sidebar in Spanish: both controls labelled in Spanish');
  await p.context().close();
  // phone: the menu still opens from the top bar; the desktop control is not shown, even if the sidebar was closed on a computer
  p = await page(PHONE);
  await p.evaluate(() => { localStorage.setItem('ns-side', 'shut'); }); await p.reload(); await p.waitForSelector('.opening h1, .thread .m-a');
  ok(!(await p.locator('#sideFold').isVisible()) && !(await p.locator('#sideUnfold').isVisible()) && await p.locator('#sideOpen').isVisible(), 'sidebar on a phone: the menu button stays, the desktop controls do not show');
  await p.click('#sideOpen'); await p.waitForTimeout(350);
  ok((await p.locator('#side').boundingBox()).x >= -1 && (await p.locator('#sideOpen').getAttribute('aria-expanded')) === 'true', 'sidebar on a phone: the menu still slides in');
  await p.context().close();
}


// ---------------------------------------------------------------------------
// Handover polish (Dec 8): open in email, the 15-day check-in, the sidebar on a medium screen, the drawing at first paint,
// the New chat icon, search engines, the link preview, cookie-free counts and the hidden "Tell us" form.
// ---------------------------------------------------------------------------
const iso = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
const SITE = 'https://next-step-2fg.pages.dev';
const headersText = fs.readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
const flat = (t) => t.replace(/\s+/g, ' ');

// the drawing is there at first paint
{
  const ctx = await browser.newContext({ viewport: DESK }); p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'domcontentloaded' });
  const t0 = Date.now();
  const first = await p.evaluate(() => { const s = document.querySelector('.art svg'); return { lines: [...s.querySelectorAll('[data-id]')].every((e) => !e.style.strokeDasharray && e.style.visibility !== 'hidden'), op: getComputedStyle(s).opacity, rested: s.classList.contains('rested') }; });
  const shot = await p.locator('.art').screenshot();
  await p.evaluate(() => { document.querySelector('.art svg').style.visibility = 'hidden'; });
  const blank = await p.locator('.art').screenshot();
  await p.evaluate(() => { document.querySelector('.art svg').style.visibility = ''; });
  ok(first.lines && first.op === '1' && first.rested && Date.now() - t0 < 2000, 'landing drawing: finished and fully visible at first paint, not blank ' + JSON.stringify(first));
  ok(shot.length > blank.length + 1500, 'landing drawing: the first screenshot has the drawing in it (' + shot.length + ' bytes against ' + blank.length + ' blank)');
  await ctx.close();
  const ctx2 = await browser.newContext({ viewport: DESK, reducedMotion: 'reduce' }); p = await ctx2.newPage(); await p.goto(base + '/');
  const rs = await p.locator('.art').screenshot(); await p.evaluate(() => { document.querySelector('.art svg').style.visibility = 'hidden'; });
  ok(rs.length > (await p.locator('.art').screenshot()).length + 1500, 'landing drawing: under reduced motion it is the finished drawing too');
  await ctx2.close();
}

// search engines and the link preview
{
  const idx = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../public/app/index.html', import.meta.url), 'utf8');
  const robots = fs.readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  const starBlock = headersText.split(/\n(?=\S)/).find((b) => b.startsWith('/*')) || '';
  ok(!/name="robots"/i.test(idx) && !/noindex/i.test(idx), 'search: the landing page has no noindex tag');
  ok(!/x-robots-tag/i.test(starBlock), 'search: _headers no longer blocks the whole site');
  ok(!/^Disallow:\s*\/\s*$/m.test(robots) && /^Allow:\s*\/\s*$/m.test(robots) && /^Sitemap:\s*https:\/\/next-step-2fg\.pages\.dev\/sitemap\.xml/m.test(robots), 'search: robots.txt lets crawlers in and names the sitemap');
  ok(/Disallow:\s*\/api\//.test(robots), 'search: robots.txt keeps crawlers off the API');
  ok(/name="robots" content="noindex, follow"/.test(app) && /\/app\/\*?\n\s+X-Robots-Tag: noindex, follow/.test(headersText), 'search: the Desk shell stays out of results (noindex, follow) and says so');
  const sm = await (await fetch(base + '/sitemap.xml')).text();
  ok(sm.includes('<loc>' + SITE + '/</loc>'), 'search: sitemap lists the landing page');
  const meta = (name, attr = 'property') => (idx.match(new RegExp('<meta ' + attr + '="' + name + '" content="([^"]*)"')) || [])[1];
  ok(idx.includes('<link rel="canonical" href="' + SITE + '/">') && meta('og:url') === SITE + '/', 'preview: canonical and og:url point at the live address');
  ok(meta('og:title') && meta('og:description') && meta('og:type') === 'website' && meta('og:site_name') === 'Next Step', 'preview: Open Graph title, description, type and site name');
  ok(meta('og:image') === SITE + '/og.png' && meta('twitter:image', 'name') === SITE + '/og.png' && meta('twitter:card', 'name') === 'summary_large_image' && meta('og:image:alt') && meta('og:image:width') === '1200' && meta('og:image:height') === '630', 'preview: absolute image address, large card, alt text and size');
  const png = Buffer.from(await (await fetch(base + '/og.png')).arrayBuffer());
  ok(png.slice(1, 4).toString() === 'PNG' && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630 && png.length < 300000, 'preview: og.png is a 1200 by 630 PNG under 300 KB (' + png.length + ' bytes)');
  ok(!/[–—!]/.test([meta('og:title'), meta('og:description'), meta('twitter:description')].join(' ')), 'preview: no dashes or exclamation marks in the preview words');
  ok(!/(guarantee|more money|maximi[sz]e)/i.test(meta('og:description')) && /not legal or insurance advice/.test(meta('og:description')), 'preview: no promise of money, keeps the plain disclaimer');
}

// the CSP still covers everything: same-origin only, and nothing new is allowed in for the counts, the email button or the form
{
  const csp = (headersText.match(/Content-Security-Policy: (.*)/) || [])[1] || '';
  ok(/default-src 'self'/.test(csp) && /connect-src 'self'(;|$)/.test(csp) && /script-src 'self'(;|$)/.test(csp) && !/https?:\/\/|\*/.test(csp.replace(/frame-ancestors 'none'/, '')), 'csp: every source is this site only; no outside host was added');
  ok(/form-action 'none'/.test(csp), 'csp: forms cannot submit natively (the Tell us form sends with script instead)');
  // A whole visit under the real policy: landing, Desk, a letter, Copy, Open in email, PDF, counts, the Tell us form.
  process.env.CSP = 'on';
  const r = await fetch(base + '/app/'); ok(/default-src 'self'/.test(r.headers.get('content-security-policy') || '') && /noindex, follow/.test(r.headers.get('x-robots-tag') || ''), 'csp: the local server sends the real headers for this check');
  const ctx = await browser.newContext({ viewport: DESK }); await ctx.route('**/config.js', (rt) => rt.fulfill({ contentType: 'text/javascript', headers: { 'content-security-policy': r.headers.get('content-security-policy') }, body: 'window.NS_CONFIG = { feedback: true };' }));
  const q = await ctx.newPage(); const bad = []; q.on('console', (m) => { if (m.type() === 'error') bad.push(m.text()); }); q.on('pageerror', (e) => bad.push(String(e))); q.on('requestfailed', (rq) => { if (!rq.url().startsWith('mailto:')) bad.push('failed ' + rq.url()); });
  await q.goto(base + '/'); await q.waitForSelector('#startBtn'); await q.waitForTimeout(500);
  await q.goto(base + '/app/'); await q.waitForSelector('.opening h1');
  await toLetter(q); await q.click('#copyBtn'); await q.locator('#emailBtn').click();
  await Promise.all([q.waitForEvent('download'), q.click('#printBtn')]);
  await q.click('#tellBtn'); await q.fill('#tellIn', 'test'); process.env.FEEDBACK = 'on'; await q.click('#tellSend'); await q.waitForTimeout(500); delete process.env.FEEDBACK;
  await q.goto(base + '/app/#/record'); await q.waitForTimeout(300);
  ok(bad.length === 0, 'csp: a whole visit under the real policy (counts, copy, email, PDF, the form, the Record) breaks nothing ' + bad.join('|'));
  await ctx.close();
  process.env.CSP = 'off';
}

// open in email
{
  p = await page(); await toLetter(p);
  const row = await p.evaluate(() => { const b = (id) => document.getElementById(id).getBoundingClientRect(); return { copy: b('copyBtn'), email: b('emailBtn'), pdf: b('printBtn') }; });
  ok(await p.locator('#emailBtn').isVisible() && (await p.locator('#emailBtn').innerText()) === 'Open in email', 'email: an "Open in email" button shows on the letter');
  ok(row.email.left >= row.copy.right - 1 && row.email.right <= row.pdf.left + 1 && Math.abs(row.email.top - row.copy.top) < 2, 'email: it sits beside Copy, between Copy and Download PDF');
  ok(await p.locator('#copyBtn').evaluate((e) => !e.classList.contains('ghost')) && await p.locator('#emailBtn').evaluate((e) => e.classList.contains('ghost')), 'email: Copy stays the one solid button, email is a ghost');
  const letter = await p.evaluate(() => window.__desk.state().chat.letter);
  const subj = letter.match(/^Subject:\s*(.+)$/m)[1];
  await p.locator('#letter p').last().click(); await p.keyboard.type(' P.S. Typed by hand.'); await p.waitForTimeout(450);
  await p.locator('#emailBtn').click();
  const href = await p.locator('#emailBtn').getAttribute('href');
  const q = new URL(href.replace('mailto:', 'http://x/')).searchParams;
  ok(/^mailto:\?subject=/.test(href) && q.get('subject') === subj, 'email: the mailto link carries the letter’s subject line: ' + q.get('subject'));
  ok(q.get('body').startsWith('Dear Claims Team,') && !/^Subject:/m.test(q.get('body')) && /P\.S\. Typed by hand\./.test(q.get('body')) && /\r\n\r\n/.test(q.get('body')), 'email: the body is the letter as it is now, with the person’s own typing, paragraphs kept');
  ok(!/%0A(?!%)/.test(href.replace(/%0D%0A/g, '')), 'email: line breaks are real mail line breaks');
  ok(/also copied/.test(await p.locator('#toast').innerText()), 'email: it says the letter is also copied, in case no email app opens');
  ok(counts.some((c) => c.blobs[0] === 'email' && c.blobs[2] === 'letter'), 'email: one count, nothing about the letter');
  ok((await p.evaluate(() => window.__desk.state().store.record.some((r) => r.kind === 'letter'))), 'email: the letter goes into the Record, like Copy');
  // a very long letter: the subject opens, the letter is copied, and it says so
  await p.evaluate(() => { const l = document.getElementById('letter'); const x = document.createElement('p'); x.textContent = 'word '.repeat(1800); l.appendChild(x); });
  await p.waitForTimeout(450); await p.locator('#emailBtn').click(); await p.waitForTimeout(400);
  ok(!/body=/.test(await p.locator('#emailBtn').getAttribute('href')) && /long/.test(await p.locator('#toast').innerText()), 'email: a very long letter opens with the subject and is copied, and says so');
  ok(p.errs.length === 0, 'email: no page errors or blocked requests ' + p.errs.join('|'));
  await p.context().close();
  for (const [loc, nm] of [['en-US', 'English'], ['es-MX', 'Spanish']]) {
    p = await page(Object.assign({ locale: loc }, PHONE));
    if (loc === 'en-US') await toLetter(p); else { await pick(p, 0); await pick(p, 2); await pick(p, 0); await pick(p, 0); await pick(p, 0); await p.waitForSelector('#letter p.subj', { state: 'attached' }); }
    await p.waitForSelector('#paperwrap.open'); await p.waitForTimeout(300);
    const bx = await p.evaluate(() => ['paperClose', 'copyBtn', 'emailBtn', 'printBtn'].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return { id, l: r.left, r: r.right, t: r.top, h: r.height }; }));
    ok(bx.every((b) => b.l >= 0 && b.r <= 375 && b.h >= 44) && (await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'email on a 375px phone in ' + nm + ': Close, Copy, Open in email and Download PDF all fit, 44px tall, no sideways scroll ' + JSON.stringify(bx.map((b) => [b.id, Math.round(b.l), Math.round(b.r)])));
    ok(Math.abs(bx[2].t - bx[3].t) < 2 && bx[2].t > bx[1].t, 'email on a 375px phone in ' + nm + ': Open in email and Download PDF share the second row');
    await p.context().close();
  }
  p = await page({ colorScheme: 'dark' }); await toLetter(p); await p.click('#themeBtn'); await p.locator('#emailBtn').hover(); await p.waitForTimeout(300);
  const hv = await p.$eval('#emailBtn', (e) => getComputedStyle(e).backgroundColor + '|' + getComputedStyle(e).color);
  ok(hv.split('|')[0] !== 'rgb(255, 255, 255)', 'dark mode: a ghost button hovered keeps its dark fill and readable text (' + hv + ')');
  await p.context().close();
  p = await page({}, '/app/#/start/call'); await p.waitForSelector('.choices:not(.done) .choice');
  ok(await p.locator('#emailBtn').isHidden(), 'email: not on a call or visit sheet, only on a letter');
  await p.context().close();
  p = await page({ locale: 'es-MX' });
  await pick(p, 0); await pick(p, 2); await pick(p, 0); await pick(p, 0); await pick(p, 0);
  await p.waitForSelector('#letter p.subj', { state: 'attached' });
  ok((await p.locator('#emailBtn').innerText()) === 'Abrir en el correo', 'email in Spanish: the button is labelled in Spanish');
  ok(/^mailto:\?subject=Request/.test(await p.locator('#emailBtn').getAttribute('href')), 'email in Spanish: what opens is the English letter, the one the insurer reads');
  await p.context().close();
}

// the 15-day check-in
{
  const seed = (daysAgo, extra = {}) => ({ chats: [{ id: 'cold', at: Date.now() - (daysAgo + 1) * 86400000, title: 'They went quiet', step: 'free', flow: 'letter', sit: 'quiet', role: 'own', ask: 'a1', notes: 'Seven weeks.', msgs: [{ r: 'u', x: 'They pushed back on my claim' }, { r: 'a', x: 'Your letter is ready.' }], letter: 'Subject: Request for a written update on my claim\n\nDear Claims Team,\n\nI have not had a reply.\n\nThank you,\n[your name]' }], cur: 'cold', record: [Object.assign({ id: 'r1', chat: 'cold', kind: 'letter', date: iso(daysAgo), who: 'Your insurer', summary: 'Request for a written update on my claim' }, extra)] });
  const open = async (data, o = {}, path) => { const ctx = await browser.newContext(Object.assign({ viewport: DESK }, o)); const pg = await ctx.newPage(); pg.errs = []; pg.on('pageerror', (e) => pg.errs.push(String(e))); pg.on('console', (m) => { if (m.type() === 'error') pg.errs.push(m.text()); }); pg.reqs = []; pg.on('request', (r) => pg.reqs.push(new URL(r.url()).pathname)); await pg.addInitScript((d) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('ns-desk-v1', JSON.stringify(d)); sessionStorage.setItem('seeded', '1'); } }, data); await pg.goto(base + (path || '/app/')); await pg.waitForSelector('.thread .m-a, .opening h1'); return pg; };
  p = await open(seed(20));
  ok(await p.locator('.checkin').isVisible() && /It has been 20 days since the letter you copied on/.test(await p.locator('.ci-lead').innerText()) && /Did your insurer reply\?/.test(await p.locator('.ci-lead').innerText()), 'check-in: after 15 days or more the Desk asks whether the insurer replied');
  ok((await p.locator('.checkin .ci-sub').innerText()) === 'Request for a written update on my claim', 'check-in: it names which letter');
  ok((await p.locator('.checkin .choice').allInnerTexts()).join('|') === 'They replied. Explain it|No reply yet. Write a follow-up', 'check-in: offers to explain the reply or write a follow-up');
  ok(await p.locator('.opening .choice').count() === 5 && await p.locator('.opening h1').isVisible(), 'check-in: it sits on a clean Desk, above the usual three choices (the old chat is in the history)');
  ok((await p.locator('#history li').count()) === 1 && !(await p.evaluate(() => window.__desk.state().chat.letter)), 'check-in: the old letter chat is untouched in the history and the Desk starts on a new chat');
  const nets = p.reqs.filter((u) => u.startsWith('/api/') && u !== '/api/count'); ok(nets.length === 0, 'check-in: working it out sends nothing; it only reads this device (' + nets.join(',') + ')');
  ok(/stays?|only what is saved on this device/i.test(await p.locator('.ci-foot').innerText()), 'check-in: says it uses only what is on this device');
  ok(!/[–—!]/.test(await p.locator('.checkin').innerText()), 'check-in: no dashes or exclamation marks');
  const sizes = await minSize(p, '.checkin button'); ok(sizes.every((x) => x >= 44), 'check-in: every tap target is 44px or more');
  ok(worst(await contrastScan(p, '.checkin')).r >= 4.5, 'check-in: text passes AA contrast, light');
  await p.locator('.checkin [data-ci="later"]').click();
  ok(await p.locator('.checkin').count() === 0 && await p.evaluate(() => window.__desk.state().store.record[0].snooze > new Date().toISOString().slice(0, 10)), 'check-in: "Not now" puts it off a week and hides it');
  await p.reload(); await p.waitForSelector('.opening h1, .thread .m-a');
  ok(await p.locator('.checkin').count() === 0, 'check-in: put off, it does not come back on reload');
  await p.context().close();
  p = await open(seed(20));
  await p.locator('.checkin [data-ci="replied"]').click();
  await p.waitForSelector('#composerIn[placeholder*="Paste"]');
  ok(/Paste what they sent/.test(await lastA(p).innerText()) && (await p.evaluate(() => window.__desk.state().store.record[0].checked)) === true, 'check-in: "They replied" goes straight to pasting their message, and is not asked again');
  await p.context().close();
  p = await open(seed(20));
  calls.length = 0;
  await p.locator('.checkin [data-ci="none"]').click();
  await p.waitForSelector('#letter p.subj', { state: 'attached' });
  const fu = await p.evaluate(() => window.__desk.state().chat);
  ok(/Following up on my earlier letter/.test(fu.letter) && fu.ask === 'nr' && fu.sit === 'quiet', 'check-in: "No reply yet" writes a follow-up letter whose subject says so');
  ok(calls.some((c) => /I sent a letter on .* titled “Request for a written update on my claim”\. It has been 20 days and I have not received a reply\./.test(c.userFull)), 'check-in: the follow-up is written from the saved letter: date, subject and days, nothing invented');
  ok(calls.some((c) => /Please respond to the request in my earlier letter\./.test(c.userFull)), 'check-in: the one ask is to respond to the request in the earlier letter');
  await p.reload(); await p.waitForSelector('.thread .m-a');
  ok(await p.locator('.checkin').count() === 0, 'check-in: answered, it is gone');
  await p.context().close();
  p = await open(seed(14)); ok(await p.locator('.checkin').count() === 0 && (await p.evaluate(() => window.__desk.state().chat.letter)).length > 0, 'check-in: at 14 days it stays quiet and the chat is left as it was'); await p.context().close();
  p = await open(seed(15)); ok(await p.locator('.checkin').count() === 1, 'check-in: it starts at exactly 15 days'); await p.context().close();
  p = await open({ chats: [], cur: null, record: [{ id: 'r2', kind: 'call', date: iso(30), who: 'Adjuster', summary: 'Spoke.' }] }); ok(await p.locator('.checkin').count() === 0, 'check-in: a call alone does not trigger it; only a letter does'); await p.context().close();
  p = await open(seed(20), { locale: 'es-MX' });
  ok(/Han pasado 20 días desde la carta que copió el/.test(await p.locator('.ci-lead').innerText()) && (await p.locator('.checkin .choice').allInnerTexts()).join('|') === 'Respondieron. Explíquemelo|Aún no responden. Escribir un seguimiento', 'check-in in Spanish: words and buttons');
  await p.locator('.checkin [data-ci="none"]').click(); await p.waitForSelector('#letter p.subj', { state: 'attached' });
  ok(/Following up on my earlier letter/.test(await p.locator('#letter').innerText()) && /Seguimiento de mi carta anterior/.test(await p.locator('#esCopy').innerText()), 'check-in in Spanish: the follow-up letter is English, with its Spanish copy beside it');
  await p.context().close();
  p = await open(seed(20), { colorScheme: 'dark' }); await p.evaluate(() => window.nsTheme.toggle()); ok(worst(await contrastScan(p, '.checkin')).r >= 4.5, 'check-in: text passes AA contrast, dark'); await p.context().close();
  p = await open(seed(20), PHONE);
  ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375 && await p.locator('.checkin .choice').first().isVisible(), 'check-in on a phone: no sideways scroll, the choices are there');
  ok(await p.evaluate(() => { const r = document.querySelector('.ci-lead').getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; }), 'check-in on a phone: the question is in view when the Desk opens, not scrolled past');
  await p.context().close();
}

// the sidebar steps aside on a medium screen, and the New chat icon sits beside the open icon
{
  const W = (w, h = 800) => ({ viewport: { width: w, height: h } });
  p = await page(W(1000));
  ok((await p.locator('#side').boundingBox()).width > 200, 'medium screen: the sidebar is open before there is a paper');
  await toLetter(p);
  await p.waitForTimeout(450);
  ok((await p.locator('#side').boundingBox()).width < 1 && await p.locator('#sideUnfold').isVisible(), 'medium screen (1000px): the sidebar closes by itself when the paper opens');
  ok((await p.evaluate(() => localStorage.getItem('ns-side'))) === null && (await p.evaluate(() => document.activeElement.id)) !== 'sideUnfold', 'medium screen: closing by itself is not remembered and does not grab focus');
  const sw = (await p.locator('#sheet').boundingBox()).width;
  ok(sw >= 440, 'medium screen: the letter has room (' + Math.round(sw) + 'px wide)');
  ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 1000, 'medium screen: no sideways scroll');
  const bar = await p.evaluate(() => { const r = document.querySelector('.paperbar').getBoundingClientRect(), b = document.querySelector('.paperbtns').getBoundingClientRect(); return { r: r.right, b: b.right, h: r.height }; });
  ok(bar.b <= bar.r && bar.h < 90, 'medium screen: Copy, Open in email and Download PDF fit on one row');
  // the New chat icon beside the open icon
  const ub = await p.locator('#sideUnfold').boundingBox(), nb = await p.locator('#newChatRail').boundingBox();
  ok(await p.locator('#newChatRail').isVisible() && nb.x >= ub.x + ub.width - 1 && nb.x - (ub.x + ub.width) < 12 && Math.abs(nb.y - ub.y) < 2 && nb.width >= 44 && nb.height >= 44, 'new chat icon: beside the open sidebar icon, 44px or more');
  ok((await p.locator('#newChatRail').getAttribute('aria-label')) === 'New chat' && (await p.locator('#newChatRail').getAttribute('title')) === 'New chat', 'new chat icon: labelled New chat');
  await p.locator('#sideUnfold').focus(); await p.keyboard.press('Tab');
  ok((await p.evaluate(() => document.activeElement.id)) === 'newChatRail', 'new chat icon: the next stop after the open sidebar icon in tab order');
  const chatsBefore = await p.evaluate(() => window.__desk.state().store.chats.length);
  await p.keyboard.press('Enter'); await p.waitForTimeout(450);
  ok(await p.locator('.opening h1').isVisible() && await p.locator('#paperwrap').isHidden() && (await p.evaluate(() => window.__desk.state().store.chats.length)) === chatsBefore, 'new chat icon: starts a fresh chat and keeps the old one in the history');
  ok((await p.locator('#side').boundingBox()).width > 200 && !(await p.locator('#newChatRail').isVisible()), 'medium screen: with no paper the sidebar comes back by itself, and the icon goes with the closed state');
  ok((await p.evaluate(() => localStorage.getItem('ns-side'))) === null, 'medium screen: still nothing remembered, so the person’s own choice is never overwritten');
  await toLetter(p); await p.waitForTimeout(450);
  await p.click('#sideUnfold'); await p.waitForTimeout(450);
  ok((await p.locator('#side').boundingBox()).width > 200 && (await p.evaluate(() => localStorage.getItem('ns-side'))) === 'open', 'medium screen: opening it by hand with a paper up is allowed and remembered');
  ok(p.errs.length === 0, 'medium screen: no page errors ' + p.errs.join('|'));
  await p.context().close();
  // closed by hand first: opening a paper and starting a new chat leave it closed
  p = await page(W(1000));
  await p.click('#sideFold'); await p.waitForTimeout(450); await toLetter(p); await p.click('#newChatRail'); await p.waitForTimeout(450);
  ok((await p.locator('#side').boundingBox()).width < 1 && await p.locator('#newChatRail').isVisible(), 'medium screen: a sidebar the person closed stays closed through a new chat');
  await p.context().close();
  for (const [w, shut] of [[901, true], [1150, true], [1151, false], [1440, false]]) {
    p = await page(W(w)); await toLetter(p); await p.waitForTimeout(450);
    ok(((await p.locator('#side').boundingBox()).width < 1) === shut, 'sidebar and paper at ' + w + 'px: ' + (shut ? 'closes itself' : 'stays open'));
    await p.context().close();
  }
  p = await page(PHONE); await p.evaluate(() => 0);
  ok(!(await p.locator('#newChatRail').isVisible()) && await p.locator('#newChatTop').isVisible(), 'phone: the top bar keeps its own New chat; the rail icon is not shown');
  await p.context().close();
  p = await page(Object.assign({ locale: 'es-MX' }, W(1000))); await p.click('#sideFold'); await p.waitForTimeout(450);
  ok((await p.locator('#newChatRail').getAttribute('aria-label')) === 'Nueva conversación', 'new chat icon in Spanish: labelled');
  await p.context().close();
  p = await page({ colorScheme: 'dark', viewport: DESK }); await p.click('#themeBtn'); await p.click('#sideFold'); await p.waitForTimeout(450);
  const ic = await p.$eval('#newChatRail', (e) => getComputedStyle(e).color), bgc = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(ic !== bgc, 'new chat icon: visible against the paper in dark mode (' + ic + ' on ' + bgc + ')');
  await p.context().close();
}

// cookie-free counts
{
  counts.length = 0;
  const ctx = await browser.newContext({ viewport: DESK }); p = await ctx.newPage(); p.errs = []; p.on('console', (m) => { if (m.type() === 'error') p.errs.push(m.text()); });
  const resp = []; p.on('response', (r) => { if (r.url().includes('/api/count')) resp.push(r); });
  await p.goto(base + '/'); await p.waitForTimeout(400);
  ok(counts.length === 1 && counts[0].blobs[0] === 'visit' && counts[0].blobs[1] === 'en', 'counts: a landing visit is one count');
  await p.reload(); await p.waitForTimeout(300);
  ok(counts.length === 1, 'counts: a reload in the same tab is not a second visit');
  await p.goto(base + '/app/'); await p.waitForSelector('.opening h1'); await p.waitForTimeout(400);
  ok(counts.length === 2 && counts[1].blobs[0] === 'desk', 'counts: opening the Desk is one count');
  await toLetter(p);
  await p.click('#copyBtn'); await p.waitForTimeout(300);
  ok(counts.length === 3 && counts[2].blobs.join() === 'copy,en,letter', 'counts: a copied letter is one count: ' + (counts[2] && counts[2].blobs.join()));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#printBtn')]); await p.waitForTimeout(300);
  ok(counts.length === 4 && counts[3].blobs.join() === 'pdf,en,letter', 'counts: a downloaded PDF is one count: ' + (counts[3] && counts[3].blobs.join()));
  ok(counts.every((c) => c.doubles.length === 1 && c.doubles[0] === 1 && c.blobs.length === 3 && c.indexes.length === 1), 'counts: each one is only what happened, the language and letter or sheet; nothing else is sent');
  ok(resp.length >= 4 && resp.every((r) => r.status() === 204 && !r.headers()['set-cookie']), 'counts: answered with nothing, and never sets a cookie');
  ok((await ctx.cookies()).length === 0, 'counts: the browser holds no cookies after a whole visit');
  ok(p.errs.length === 0, 'counts: allowed by the security policy, no console errors ' + p.errs.join('|'));
  await ctx.close();
  // a sheet copy is counted as a sheet, in Spanish as es
  counts.length = 0;
  p = await page(Object.assign({ locale: 'es-MX' }, {}), '/app/#/start/call'); await p.waitForTimeout(300);
  ok(counts.some((c) => c.blobs[0] === 'desk' && c.blobs[1] === 'es'), 'counts: the language is counted as es for a Spanish reader');
  await p.context().close();
  // Do Not Track and Global Privacy Control are never counted
  counts.length = 0;
  for (const flag of ['doNotTrack', 'globalPrivacyControl']) {
    const c2 = await browser.newContext({ viewport: DESK }); const q = await c2.newPage();
    await q.addInitScript((f) => { Object.defineProperty(navigator, f, { value: f === 'doNotTrack' ? '1' : true }); }, flag);
    await q.goto(base + '/'); await q.goto(base + '/app/'); await q.waitForSelector('.opening h1'); await q.waitForTimeout(300); await c2.close();
  }
  ok(counts.length === 0, 'counts: a browser that says Do Not Track or Global Privacy Control is never counted');
  // the server side
  const ev = await import('../lib/events.js');
  const mk = (b, h) => new Request('http://x.test/api/count', { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, h || {}), body: typeof b === 'string' ? b : JSON.stringify(b) });
  const wrote = []; const env = { COUNTS: { writeDataPoint: (d) => wrote.push(d) } };
  ok((await ev.handleCount(mk({ e: 'pdf', l: 'es', w: 'sheet' }), env)).status === 204 && wrote[0].blobs.join() === 'pdf,es,sheet', 'counts server: a good event is written');
  ok((await ev.handleCount(mk({ e: 'visit', l: 'xx', w: 'secret text', ip: '1.2.3.4', text: 'my claim' }), env)).status === 204 && wrote[1].blobs.join() === 'visit,en,' && !JSON.stringify(wrote[1]).includes('secret') && !JSON.stringify(wrote[1]).includes('1.2.3.4'), 'counts server: anything else in the request is dropped, never stored');
  ok((await ev.handleCount(mk({ e: 'hack' }), env)).status === 400 && (await ev.handleCount(mk('nope'), env)).status === 400 && (await ev.handleCount(mk({ e: 'copy', pad: 'x'.repeat(400) }), env)).status === 400, 'counts server: unknown events, bad JSON and big bodies are refused');
  ok((await ev.handleCount(mk({ e: 'copy' }, { origin: 'https://evil.example' }), env)).status === 403 && (await ev.handleCount(new Request('http://x.test/api/count'), env)).status === 405, 'counts server: other sites and GET are refused');
  ok((await ev.handleCount(mk({ e: 'copy' }), {})).status === 204, 'counts server: with no Cloudflare dataset (a local run) it does nothing and does not fail');
  const wr = fs.readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  ok(/^# \[\[analytics_engine_datasets\]\]\n# binding = "COUNTS"\n# dataset = "next_step_counts"/m.test(wr) && !/^\[\[analytics_engine_datasets\]\]/m.test(wr) && /Analytics Engine > enable/.test(wr), 'counts: the dataset binding is ready in wrangler.toml, off until Analytics Engine is enabled (Cloudflare refuses a deploy that names it before then)');
  const priv = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  ok(/data-t="foot2">[^<]*We only count how many people visit, open the Desk, copy or email a letter, or download a PDF, with no cookies and nothing that says who you are\./.test(priv), 'counts: the landing privacy line says so in one plain sentence');
  p = await page({}, '/'); ok(/no cookies/.test(await p.locator('[data-t="foot2"]').innerText()) && !/[–—!]/.test(await p.locator('[data-t="foot2"]').innerText()), 'counts: that sentence shows on the landing page'); await p.context().close();
  p = await page({}, '/?lang=es'); ok(/sin cookies/.test(await p.locator('[data-t="foot2"]').innerText()), 'counts: and in Spanish'); await p.context().close();
  p = await page(); ok(/no cookies/.test(await p.locator('.side-privacy').innerText()), 'counts: the Desk says it too, in its sidebar'); await p.context().close();
  p = await page(ES); ok(/sin cookies/.test(await p.locator('.side-privacy').innerText()), 'counts: the Desk says it in Spanish'); await p.context().close();
  p = await page({ viewport: DESK }, '/?lang=es'); ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 1440, 'counts: Spanish footer fits'); await p.context().close();
}

// "Something unclear? Tell us": built, hidden until there is an inbox
{
  p = await page();
  ok(await p.locator('#tell').isHidden() && await p.locator('#tellForm').isHidden() && !/Something unclear/.test(await p.evaluate(() => document.body.innerText)), 'tell us: hidden by default, no trace on screen');
  ok(/feedback: false/.test(fs.readFileSync(new URL('../public/config.js', import.meta.url), 'utf8')), 'tell us: the one setting, public/config.js, is off');
  await p.context().close();
  const on = async (o, path) => { const ctx = await browser.newContext(Object.assign({ viewport: DESK }, o || {})); await ctx.route('**/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.NS_CONFIG = { feedback: true };' })); const pg = await ctx.newPage(); pg.errs = []; pg.on('console', (m) => { if (m.type() === 'error') pg.errs.push(m.text()); }); await pg.goto(base + (path || '/app/')); await pg.waitForSelector('.opening h1, .thread .m-a'); return pg; };
  p = await on();
  ok(await p.locator('#tellBtn').isVisible() && (await p.locator('#tellBtn').innerText()) === 'Something unclear? Tell us', 'tell us: with the setting on, one quiet line says Something unclear? Tell us');
  ok((await p.locator('#tellBtn').evaluate((e) => getComputedStyle(e).textDecorationLine)) !== undefined && (await minSize(p, '#tellBtn')).every((x) => x >= 44), 'tell us: the line is a 44px tap target');
  ok(worst(await contrastScan(p, '#tell')).r >= 4.5, 'tell us: the line passes AA contrast');
  await p.click('#tellBtn');
  ok(await p.locator('#tellForm').isVisible() && /leave out names, claim numbers and account details/.test(await p.locator('#tellLead').innerText()) && /cannot reply/.test(await p.locator('#tellLead').innerText()), 'tell us: the form is honest that nobody replies, and says what to leave out');
  ok(worst(await contrastScan(p, '#tellForm')).r >= 4.5 && !/[–—!]/.test(await p.locator('#tellForm').innerText()), 'tell us: form passes AA contrast, no dashes or exclamation marks');
  feedback.length = 0; process.env.FEEDBACK = 'off';
  await p.fill('#tellIn', 'I did not understand what the 15 days means.'); await p.click('#tellSend'); await p.waitForTimeout(400);
  ok(/did not send/.test(await p.locator('#toast').innerText()) && (await p.inputValue('#tellIn')).length > 0 && feedback.length === 0, 'tell us: with no inbox set up it says it did not send, and keeps what was typed');
  process.env.FEEDBACK = 'on';
  await p.click('#tellSend'); await p.waitForTimeout(500);
  ok(feedback.length === 1 && feedback[0].message === 'I did not understand what the 15 days means.' && feedback[0].where === 'chat' && feedback[0].language === 'en' && Object.keys(feedback[0]).sort().join() === 'language,message,text,where', 'tell us: sends only the words typed, the language and where on the Desk, nothing from the chat or letter');
  ok(/Thank you/.test(await p.locator('#toast').innerText()) && await p.locator('#tellForm').isHidden() && await p.locator('#tellBtn').isVisible(), 'tell us: thanks them and puts the form away');
  await p.click('#tellBtn'); await p.evaluate(() => { document.getElementById('tellHp').value = 'bot'; }); await p.fill('#tellIn', 'spam'); await p.click('#tellSend'); await p.waitForTimeout(300);
  ok(feedback.length === 1, 'tell us: a filled-in hidden field (a bot) sends nothing');
  ok(p.errs.filter((e) => !/503/.test(e)).length === 0, 'tell us: no blocked requests or page errors (the one 503 is the test of a missing inbox) ' + p.errs.join('|'));
  await p.context().close();
  p = await on(ES);
  ok((await p.locator('#tellBtn').innerText()) === '¿Algo no quedó claro? Cuéntenos', 'tell us in Spanish: the line'); await p.click('#tellBtn');
  ok(/no podemos responder/.test(await p.locator('#tellLead').innerText()), 'tell us in Spanish: the form'); await p.context().close();
  p = await on(PHONE); ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375 && await p.locator('#tellBtn').isVisible(), 'tell us on a phone: no sideways scroll'); await p.click('#tellBtn'); ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'tell us on a phone: the open form fits'); await p.context().close();
  const ev = await import('../lib/events.js');
  const fr = (b) => new Request('http://x.test/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  ok((await ev.handleFeedback(fr({ text: 'hello' }), {})).status === 503, 'tell us server: with no inbox set it says no_inbox and sends nothing');
  ok((await ev.handleFeedback(fr({ text: '   ' }), { FEEDBACK_WEBHOOK: 'x' })).status === 400, 'tell us server: an empty message is refused');
  let sent = null;
  const r3 = await ev.handleFeedback(fr({ text: 'a'.repeat(1200), where: 'bogus', lang: 'es', ssn: '1' }), { FEEDBACK_WEBHOOK: 'https://hook.test/x' }, async (u, o) => { sent = { u, b: JSON.parse(o.body) }; return { ok: true }; });
  ok(r3.status === 200 && sent.u === 'https://hook.test/x' && sent.b.message.length === 1000 && sent.b.where === 'chat' && !JSON.stringify(sent.b).includes('ssn'), 'tell us server: forwards to the one webhook, 1000 characters at most, only known fields');
  ok((await ev.handleFeedback(fr({ text: 'hi' }), { FEEDBACK_WEBHOOK: 'https://hook.test/x' }, async () => ({ ok: false }))).status === 502, 'tell us server: if the inbox fails, it says so rather than pretending');
  delete process.env.FEEDBACK;
}

await browser.close(); server.close();
console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);

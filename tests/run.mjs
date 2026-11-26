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
const browser = await chromium.launch();
const SOURCES = JSON.parse(fs.readFileSync(new URL('../public/sources.json', import.meta.url), 'utf8'));
async function page(opts, path) {
  const ctx = await browser.newContext(opts || {});
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(base + (path || '/app/')); p.errs = errs;
  if (!path || path.startsWith('/app')) await p.waitForSelector('main .screen');
  return p;
}

// Walks the core task the way a first-time visitor would: role, what happened, one ask, notes, letter.
async function toLetter(p, { role = 'own', sit = 'quiet', askIx = 0, notes = 'My adjuster has not answered for 7 weeks.' } = {}) {
  await p.click('.choice[data-role="' + role + '"]'); await p.waitForSelector('.v-what');
  if (sit === 'smoke' || sit === 'other') { await p.click('a[href="#/more"]'); await p.waitForSelector('.choice[data-sit="' + sit + '"]'); }
  await p.click('.choice[data-sit="' + sit + '"]'); await p.waitForSelector('.v-ask');
  await p.locator('label.ask').nth(askIx).click(); await p.click('#askGo'); await p.waitForSelector('#nNotes');
  if (notes) await p.fill('#nNotes', notes);
  await p.click('#writeBtn'); await p.waitForSelector('#letterText');
}
// Links inside a sentence are exempt from the target size rule (WCAG 2.5.8), so only non-inline controls are measured.
const minSize = (p, sel) => p.$$eval(sel, (els) => els.filter((e) => e.offsetParent && getComputedStyle(e).display !== 'inline').map((e) => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));

// 1. landing: everything is there on first paint, one action, a visible disclaimer, no video
let p = await page({ viewport: { width: 1280, height: 800 } }, '/');
const firstPaint = await p.evaluate(() => { const vis = (s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.height > 0 && r.top < innerHeight && cs.opacity === '1' && cs.visibility !== 'hidden'; }; return { h1: vis('h1'), start: vis('#startBtn'), disc: vis('#disclaimer') }; });
ok(firstPaint.h1 && firstPaint.start && firstPaint.disc, 'landing: headline, Start and disclaimer are visible at once, no fade-in ' + JSON.stringify(firstPaint));
ok(/insurance claims/i.test(await p.locator('.eyebrow').innerText()) && /no, offers less, or goes quiet/.test(await p.locator('h1').innerText()), 'landing says it is for insurance claims and names the three situations');
ok((await p.locator('#startBtn').getAttribute('href')) === '/app/' && await p.locator('main .btn').count() === 1, 'landing has one primary action, and it opens the guide');
ok(/not legal or insurance advice/i.test(await p.locator('#disclaimer').innerText()) && parseFloat(await p.locator('#disclaimer').evaluate((e) => getComputedStyle(e).fontSize)) >= 16, 'landing disclaimer is plain and at least 16px');
ok(await p.locator('video, iframe').count() === 0, 'landing has no video and no native video controls');
ok(await p.locator('a[href="tel:18009274357"]').count() === 1 && /not staffed/i.test(await p.locator('.people').innerText()), 'landing lists the CDI number and says Next Step is not staffed');
const anims = await p.evaluate(() => document.getAnimations().length);
ok(anims <= 1, 'landing runs at most one ambient animation (' + anims + ')');
const fams = await p.evaluate(async () => { await document.fonts.ready; return [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')))]; });
ok(fams.length <= 2 && fams.includes('EB Garamond') && fams.includes('Outfit'), 'two type families only, both bundled: ' + fams.join(','));
const th0 = await p.evaluate(() => window.nsTheme.current()); await p.click('#themeBtn');
ok((await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === (th0 === 'dark' ? 'light' : 'dark'), 'landing theme button switches theme');
ok((await minSize(p, 'a, button')).every((x) => x >= 44), 'landing tap targets are at least 44px');
ok((await p.evaluate(() => Math.min(...[...document.querySelectorAll('p, li, span, a, b')].filter((e) => e.offsetParent && e.textContent.trim()).map((e) => parseFloat(getComputedStyle(e).fontSize))))) >= 15, 'landing has no text smaller than 15px');
await p.setViewportSize({ width: 375, height: 700 });
ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'landing: no sideways scroll at 375px');
ok(await p.evaluate(() => document.getElementById('startBtn').getBoundingClientRect().bottom < innerHeight), 'landing: Start is in the first phone screen');
await p.context().close();
p = await page({ reducedMotion: 'reduce' }, '/');
ok((await p.evaluate(() => document.getAnimations().length)) === 0, 'landing: reduced motion stops the ambient motion');
await p.locator('#startBtn').click(); await p.waitForSelector('.v-start');
ok(true, 'Start opens the guide');
await p.context().close();

// 2. the guided path, first visit
p = await page();
ok(/own|rent/i.test(await p.locator('h1').innerText()) && await p.locator('.choice[data-role]').count() === 3, 'guide asks own, rent or not sure first');
ok(await p.locator('#thread, #chips, #input, .side').count() === 0, 'no chat thread, chips, message box or chat sidebar');
ok((await p.locator('.stepn').innerText()).includes('1 of 4'), 'step counter shows Step 1 of 4');
await p.click('.choice[data-role="own"]'); await p.waitForSelector('.v-what');
ok((await p.locator('.choice[data-sit] b').allInnerTexts()).join('|') === 'They said no|They offered less|They went quiet', 'then the three situations');
await p.click('.choice[data-sit="low"]'); await p.waitForSelector('.v-ask');
ok(await p.locator('input[name="ask"]:checked').count() === 0, 'no ask is pre-selected');
ok(await p.locator('label.ask small').count() === 4, 'every ask shows a plain note on when it fits');
ok((await p.locator('label.ask b').allInnerTexts()).includes('Get a second contractor estimate'), 'offered-less ask says Get a second contractor estimate');
ok(/another letter/i.test(await p.locator('.lead').innerText()), 'the ask screen says you can write another letter for a different ask');
await p.click('#askGo');
ok(await p.locator('#askErr').isVisible() && /pick the one thing/i.test(await p.locator('#askErr').innerText()), 'Continue with no ask shows a plain message');
await p.locator('label.ask').last().click(); await p.click('#askGo');
ok(/write what you want/i.test(await p.locator('#askErr').innerText()), 'Something else needs words');
await p.fill('#ownAsk', 'send someone else to inspect the damage the first adjuster missed'); await p.click('#askGo'); await p.waitForSelector('#nNotes');
ok(/offered/i.test(await p.locator('#nNotes').getAttribute('placeholder')), 'notes example matches the situation');
ok(await p.locator('#nExtra').isVisible(), 'there is a visible box for extra details (numbers, dates, names)');
await p.fill('#nNotes', 'They offered $42,300. My contractor quoted $96,000.'); await p.fill('#nExtra', 'Second estimate dated March 3');
await p.click('#writeBtn'); await p.waitForSelector('#letterText');
let last = calls[calls.length - 1].userFull;
ok(/ASK: Please send someone else to inspect/.test(last) && /Details to include: Second estimate dated March 3/.test(last), 'own ask and extra details reach the letter writer');
let letter = await p.locator('#letterText').inputValue();
ok(/Dear Claims Team/.test(letter) && !/My contractor quoted \$96,000\./.test(letter), 'letter is written and reworded, not pasted');
ok(/draft, not legal advice/i.test(await p.locator('.v-letter .notice').innerText()), 'letter screen shows the draft, not legal advice notice');
ok((await p.locator('#copyBtn').boundingBox()).height >= 48, 'Copy letter is a big button');
await p.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
await p.locator('#letterText').fill(letter + '\nEDITED'); await p.click('#copyBtn'); await p.waitForTimeout(200);
ok(await p.locator('#copied').isVisible() && /paste it into an email/i.test(await p.locator('#copied').innerText()), 'copy confirms on screen and says what to do next');
const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => 'n/a'));
ok(clip === 'n/a' || clip.includes('EDITED'), 'clipboard has the edited letter');
ok(await p.locator('ol.nums li').count() === 4 && /15 calendar days/.test(await p.locator('ol.nums').innerText()) && /not a legal deadline/.test(await p.locator('ol.nums').innerText()), 'what happens next: four numbered steps, 15 days called a request');
ok(await p.locator('.v-letter a[href="tel:18009274357"]').count() === 1, 'next steps give the CDI number');
await p.click('#sentBtn');
ok(await p.locator('#openClaim').isVisible() && (await p.locator('#openClaim').getAttribute('href')) === '#/claim', 'after I sent it, a visible link to where it was saved');
ok(!(await p.locator('#claimLink').isHidden()) && (await p.locator('#claimCount').innerText()) === '1', 'header shows My claim with a count');
await p.click('#openClaim'); await p.waitForSelector('.v-claim');
ok((await p.locator('.letters').innerText()).includes('Sent'), 'My claim lists the letter as sent');
ok((await p.locator('.loglist').innerText()).includes('Sent a letter'), 'sending is in the call and message log');
await p.goBack(); await p.waitForSelector('#letterText');
ok((await p.locator('#letterText').inputValue()).includes('EDITED'), 'going back keeps the edited letter');
await p.click('#shortBtn'); await p.waitForSelector('#letterText'); await p.waitForTimeout(200);
ok(calls[calls.length - 1].sys.includes('130 words'), 'Make it shorter asks for a shorter letter');
await p.click('#anotherBtn'); await p.waitForSelector('.v-ask');
ok(await p.locator('input[name="ask"]:checked').count() === 0, 'Write another letter goes back to the asks, nothing chosen');
await p.locator('label.ask').first().click(); await p.click('#askGo'); await p.waitForSelector('#nNotes');
ok((await p.locator('#nNotes').inputValue()).includes('$42,300'), 'and keeps the notes already written');
ok(p.errs.length === 0, 'no page errors on the core path: ' + p.errs.join(' | '));
await p.context().close();

// 2b. a double tap on a choice does not also pick the card under the finger on the next screen
p = await page(); await p.locator('.choice[data-role="own"]').dblclick(); await p.waitForTimeout(300);
ok((await p.evaluate(() => location.hash)) === '#/what', 'double tap on a choice moves one step only');
await p.context().close();

// 3. renter, smoke and other paths, someone else
p = await page(); await toLetter(p, { role: 'rent', sit: 'denied' });
last = calls[calls.length - 1].last;
ok(/HOME: rental home/.test(last) && /explain your decision in writing/.test(last), 'renter letter uses rental home and the denied ask');
await p.goto(base + '/app/#/stages'); await p.waitForSelector('.stagelist');
ok(/renters/i.test(await p.locator('.rolenote').innerText()) && (await p.locator('ol.stagelist li').count()) === 5, 'renter sees five renter stages');
await p.context().close();
p = await page(); await toLetter(p, { sit: 'smoke' });
ok(/smoke and ash/.test(calls[calls.length - 1].last), 'Something else leads to the smoke letter');
await p.context().close();
p = await page(); await p.check('#forOther'); await p.fill('#otherName', 'my mom'); await toLetter(p, { sit: 'denied' });
ok(/WRITING FOR: someone else \(my mom\)/.test(calls[calls.length - 1].last), 'API is told the letter is for someone else');
await p.context().close();
{ const { letterSystemPrompt } = await import('../lib/core.js'); const sp = letterSystemPrompt({ who: 'other' });
  ok(!/what it needs from the policyholder/.test(sp) && /Do NOT add any extra request/.test(sp), 'someone-else letter prompt allows only the one ask');
  ok(/Use ONLY the facts the person gave/.test(sp) && /eager/.test(sp), 'letter prompt forbids invented feelings and facts');
  ok(/If NO <insurer_message> is included, never write "your recent message"/.test(sp), 'letter prompt: no "your recent message" without a pasted message');
  ok(/Never turn a question, worry or wish in the notes into a fact/.test(sp) && /staying in a hotel/.test(sp), 'letter prompt: questions in the notes are not facts');
  ok(/unfortunately/.test(sp) && /"recently"/.test(sp) && /If the notes are empty/.test(sp), 'letter prompt: no judging words, no made-up timing, plain letter for empty notes');
  const { tidyLetter } = await import('../lib/core.js');
  const raw = 'Subject: Claim \n\nDear Claims Team,\n\nI received an offer of $42,300 on March 3. \nPlease review the estimate.\nPlease reply in writing within 15 calendar days of receiving this letter.\nThank you,\n[Your Name]';
  const tidy = tidyLetter(raw, { sit: 'low', claim: 'HO-1' });
  ok(tidy === 'Subject: Request for a written explanation of the settlement offer - Claim HO-1\n\nDear Claims Team,\n\nI received an offer of $42,300 on March 3.\n\nPlease review the estimate.\n\nPlease reply in writing within 15 calendar days of receiving this letter.\n\nThank you,\n[your name]', 'letter tidy: blank lines between parts, name under the sign-off, a real subject');
  ok(tidyLetter('Subject: Request for a written update\nDear Claims Team,\nMy adjuster\nhas not answered.\nThank you,\nMaria', { sit: 'quiet' }).includes('My adjuster has not answered.'), 'letter tidy: a sentence wrapped across lines is joined, not split');
  const words = (t) => t.replace(/\s+/g, ' ').trim();
  ok(words(tidyLetter(raw.replace('Subject: Claim ', 'Subject: Request for a written explanation of the offer'), { sit: 'low' })) === words(raw.replace('Subject: Claim ', 'Subject: Request for a written explanation of the offer').replace('[Your Name]', '[your name]')), 'letter tidy never changes the wording'); }

// 4. stages as a numbered column, a clear checklist that saves
p = await page({}, '/app/#/stages'); await p.waitForSelector('.stagelist');
const tops = await p.$$eval('ol.stagelist .stage', (els) => els.map((e) => [Math.round(e.getBoundingClientRect().left), Math.round(e.getBoundingClientRect().top)]));
ok(tops.length === 7 && tops.every((x, i) => x[0] === tops[0][0] && (i === 0 || x[1] > tops[i - 1][1])), 'owner stages are one numbered column in order');
ok((await p.locator('ol.stagelist .n').allInnerTexts()).join('') === '1234567', 'stages are numbered 1 to 7');
ok((await p.locator('ol.stagelist').innerText()).includes('adjuster is coming'), 'adjuster visit stage listed');
await p.click('a[href="#/stage/s2"]'); await p.waitForSelector('.ticks');
ok(/your checklist/i.test(await p.locator('section.check h2').innerText()) && /saved on this device/i.test(await p.locator('section.check').innerText()), 'stage shows a titled checklist that says it is saved');
ok((await p.locator('#prog').innerText()) === '0 of 4 done', 'checklist shows progress');
await p.locator('.tick').first().click();
ok((await p.locator('#prog').innerText()) === '1 of 4 done', 'ticking updates progress');
ok(await p.locator('.srcs a').count() >= 2, 'stage shows its sources');
await p.reload(); await p.waitForSelector('.ticks');
ok(await p.locator('.tick input:checked').count() === 1, 'ticks are saved after reload');
await p.goto(base + '/app/#/stages'); await p.waitForSelector('.stagelist');
ok((await p.locator('a[href="#/stage/s2"]').innerText()).includes('1 of 4 done'), 'stage list shows which checklists are started');
await p.click('a[href="#/stage/s2"]'); await p.click('#toolBtn'); await p.fill('#dIn', '2026-01-10'); await p.click('#dGo');
ok((await p.locator('#dOut').innerText()).includes('January 25, 2026'), 'key dates tool adds 15 days');
await p.goto(base + '/app/#/stage/ts'); await p.waitForSelector('.ticks'); await p.click('#toolBtn'); await p.fill('#lgW', 'Adjuster Kim'); await p.fill('#lgS', 'Promised a call Friday'); await p.click('#lgAdd');
ok((await p.locator('#lgList').innerText()).includes('Adjuster Kim'), 'contact log adds an entry');
await p.goto(base + '/app/#/words'); await p.waitForSelector('dl.words');
ok((await p.locator('dl.words').innerText()).includes('Deductible'), 'insurance words page');
await p.context().close();

// 5. help: real numbers, never a pretend person
p = await page({}, '/app/#/help'); await p.waitForSelector('.group');
ok(/not a service/i.test(await p.locator('.lead').innerText()) && /no one here will call you back/i.test(await p.locator('.lead').innerText()), 'help says plainly no one here will call back');
ok(await p.locator('a[href="tel:18009274357"]').count() >= 1 && await p.locator('a[href="tel:18006213362"]').count() === 1, 'help has tap-to-call CDI and FEMA');
const allText = (await p.locator('body').innerText()).toLowerCase();
ok(!/talk to a person|connect you|a helper will|someone will (call|follow)/.test(allText), 'nothing suggests a live person');
await p.goto(base + '/app/#/question'); await p.fill('#qIn', 'can I talk to a real person'); await p.click('#qGo');
ok(/no staff/i.test(await p.locator('#qOut').innerText()) && await p.locator('#qOut a[href="tel:18009274357"]').count() === 1, 'asking for a person gets the honest answer and a real number');
await p.fill('#qIn', 'What forms does State Farm need from me?'); await p.click('#qGo');
ok(/no checked, insurer-specific forms/i.test(await p.locator('#qOut').innerText()), 'insurer-specific questions get the honest answer');
await p.context().close();

// 6. breathing: calm, soft, can stop
p = await page({}, '/app/#/breathe'); await p.click('#bBtn'); await p.waitForTimeout(300);
ok((await p.locator('#aura').getAttribute('data-phase')) === 'in' && (await p.locator('#bword').innerText()) === 'Breathe in', 'breathing starts with Breathe in');
const glow = await p.locator('.aura .glow').evaluate((e) => getComputedStyle(e).filter);
ok(/blur/.test(glow), 'the circle has a soft aura');
await p.click('#bBtn'); ok((await p.locator('#bword').innerText()).startsWith('Done'), 'Stop ends it calmly');
await p.context().close();

// 7. languages (UI translated, letter stays English)
for (const [l, word] of [['es', 'alquila'], ['zh', '租']]) {
  p = await page({}, '/app/?lang=' + l); await p.waitForSelector('.v-start');
  ok((await p.locator('h1').innerText()).includes(word), 'start screen in ' + l);
  await toLetter(p, { sit: 'low' });
  ok(/Dear Claims Team/.test(await p.locator('#letterText').inputValue()), 'letter in English from ' + l + ' UI');
  ok(p.errs.length === 0, 'no errors in ' + l + ': ' + p.errs.join('|'));
  await p.context().close();
}

// 8. phone width, both themes, tap targets, readable fine print
for (const scheme of ['light', 'dark']) {
  p = await page({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true, colorScheme: scheme });
  const screens = [];
  const check = async (name) => { screens.push([name, await p.evaluate(() => document.documentElement.scrollWidth), Math.min(...await minSize(p, 'main a, main button, main label.ask, main .tick, header a, header button'))]); };
  await check('start'); await p.click('.choice[data-role="own"]'); await check('what'); await p.click('.choice[data-sit="quiet"]'); await check('ask');
  await p.locator('label.ask').nth(1).click(); await p.click('#askGo'); await p.waitForSelector('#nNotes'); await check('notes');
  await p.fill('#nNotes', 'No reply in 7 weeks.'); await p.click('#writeBtn'); await p.waitForSelector('#letterText'); await check('letter');
  for (const r of ['stages', 'stage/s1', 'claim', 'help', 'breathe', 'question']) { await p.goto(base + '/app/#/' + r); await p.waitForTimeout(150); await check(r); }
  ok(screens.every((s) => s[1] <= 375), scheme + ': no sideways scroll at 375px on any screen ' + screens.filter((s) => s[1] > 375).map((s) => s[0]).join(','));
  ok(screens.every((s) => s[2] >= 44), scheme + ': tap targets at least 44px ' + screens.filter((s) => s[2] < 44).map((s) => s[0] + ':' + s[2]).join(','));
  const fine = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.fine p, .hint, .srcs, .notice')].filter((e) => e.offsetParent).map((e) => parseFloat(getComputedStyle(e).fontSize))));
  ok(fine >= 15, scheme + ': fine print is at least 15px (' + fine + ')');
  const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(scheme === 'dark' ? bg === 'rgb(20, 26, 29)' : bg === 'rgb(244, 242, 236)', scheme + ': follows the device theme (' + bg + ')');
  ok(p.errs.length === 0, scheme + ': no page errors on phone ' + p.errs.join('|'));
  await p.context().close();
}

// 9. menu and theme inside the guide
p = await page(); await p.click('#menuBtn');
ok(await p.locator('#menu').isVisible() && await p.locator('#menuList a').count() === 6, 'menu opens with six plain links');
await p.click('#thDark'); ok((await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark', 'theme switch in the menu');
await p.keyboard.press('Escape'); ok(await p.locator('#menu').isHidden(), 'Escape closes the menu');
ok((await p.locator('.fine').innerText()).includes('not legal or insurance advice') && (await p.locator('.fine').innerText()).includes('Fung Fellowship'), 'footer keeps the disclaimer and names the project');
await p.context().close();

// 10. fallbacks: daily limit reached, and no AI at all
for (const mode of ['quota', 'off']) {
  process.env.MOCK = mode;
  p = await page(); await toLetter(p, { sit: 'denied', notes: 'They denied my claim on Oct 3.' });
  const lt = await p.locator('#letterText').inputValue();
  ok(/Dear Claims Team/.test(lt) && /explain your decision in writing/.test(lt) && /They denied my claim on Oct 3\./.test(lt), mode + ': template letter still works');
  ok((await p.locator('.v-letter .notice').innerText()).includes(mode === 'quota' ? 'free daily limit' : 'not available right now'), mode + ': person is told why');
  ok(await p.locator('#shortBtn').count() === 0, mode + ': no Make it shorter when the AI is off');
  await p.goto(base + '/app/#/question'); await p.fill('#qIn', 'how long do I have to settle'); await p.click('#qGo'); await p.waitForTimeout(300);
  ok(await p.locator('#qOut .btn').count() >= 1, mode + ': a question still gets somewhere useful');
  ok(p.errs.filter((e) => !/Failed to load resource/.test(e)).length === 0, mode + ': no script errors ' + p.errs.join('|'));
  await p.context().close();
}
process.env.MOCK = 'ok';

// 11. returning visitor and old saved data
p = await page();
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('next-step-v4', JSON.stringify({ chats: [{ id: 'c1', role: 'rent', letters: [{ d: 'Nov 2', sub: 'Old letter', text: 'Subject: Old letter' }], contacts: [], done: { 'r1.0': true } }], cur: 'c1' })); });
await p.reload(); await p.waitForSelector('.v-start');
ok((await p.locator('#claimCount').innerText()) === '1', 'letters from the previous version carry over');
await p.goto(base + '/app/#/claim'); await p.waitForSelector('.letters');
ok((await p.locator('.letters').innerText()).includes('Old letter'), 'old letter shows in My claim');
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
  // in the browser: slow stream, record everything shown in the answer box
  process.env.MOCK_DELAY = '45';
  p = await page({}, '/app/#/question'); await p.waitForSelector('#qIn');
  await p.evaluate(() => { window.__seen = []; new MutationObserver(() => { const m = document.querySelector('#qOut .abody'); if (m) window.__seen.push(m.innerText); }).observe(document.getElementById('qOut'), { childList: true, subtree: true, characterData: true }); });
  const n0 = calls.length;
  await p.fill('#qIn', 'What do you know about smoke damage in my house?'); await p.click('#qGo');
  await p.waitForFunction(() => { const m = document.querySelector('#qOut .abody'); return m && m.innerText.length > 20; }, null, { timeout: 5000 });
  ok(!(await p.locator('#qOut sup.cite').count()) && !(await p.locator('#qOut .srcs').count()), 'words are on screen before the answer is finished (no source row yet)');
  await p.waitForSelector('#qOut sup.cite'); await p.waitForSelector('#qOut a.btn[href="#/stage/sm"]');
  const seen = await p.evaluate(() => window.__seen);
  ok(seen.length > 3 && seen.every((t) => !/ACTION/i.test(t)), 'the ACTION line never appeared on screen while streaming (' + seen.length + ' updates)');
  ok(seen.every((t) => !/\[\d*\]?$/.test(t.trim()) || /sources/i.test(t)), 'no half-written [n] shown while streaming');
  ok(await p.locator('#qOut .srcs a').count() === 1, 'the answer ends with its source');
  const sys = calls[n0].sys;
  ok(calls[n0].stream === true && sys.includes('[3] ') && !sys.includes('[13] ') && sys.length < 9000, 'smoke question sends the smoke notes only (' + sys.length + ' chars)');
  ok(p.errs.length === 0, 'no page errors while streaming: ' + p.errs.join('|'));
  await p.context().close(); p = await page({}, '/app/#/question'); await p.waitForSelector('#qIn');
  await p.fill('#qIn', 'it is too complicated'); await p.click('#qGo'); await p.waitForSelector('#qOut a.btn[href="#/start"]');
  const sys2 = calls[calls.length - 1].sys;
  ok(Object.keys(SOURCES).every((k) => sys2.includes('[' + k + '] ')), 'a vague question sends all notes, and offers to start a letter');
  await p.context().close();
  delete process.env.MOCK_DELAY;
}
await browser.close(); server.close();
console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);

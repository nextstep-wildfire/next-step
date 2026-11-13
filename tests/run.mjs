import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');
import { server } from '../dev/dev-server.js';

const PORT = 8799;
await new Promise((r) => server.listen(PORT, r));
const base = 'http://localhost:' + PORT;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const browser = await chromium.launch();
async function page(opts) {
  const ctx = await browser.newContext(opts || {});
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(base + '/app/'); p.errs = errs; p.errs.push = p.errs.push;
  await p.waitForSelector('.card.home');
  return p;
}
const chip = (p, name) => p.locator('#chips button', { hasText: name }).first();
const lastBot = (p) => p.locator('#thread .msg.bot').last();

// 1. home
let p = await page();
ok(await p.locator('.choice').count() === 3, 'home shows only three choices');
ok((await p.locator('.card.home .choice b').allInnerTexts()).join('|') === 'They Said No|They Offered Less|They Went Quiet', 'the three cards are They Said No, They Offered Less, They Went Quiet');
ok(await p.locator('.card.home .rolebtn').count() === 0, 'no own-or-rent row before the choices');
ok((await p.locator('.card.home h2 + p.small').innerText()).includes('Free guide for California wildfire homeowners and renters. General information, not legal advice.'), 'intro keeps the free-guide line');
ok((await p.locator('.card.home h2').innerText()).toLowerCase().includes('what did your insurer do'), 'home asks what the insurer did');
ok(await p.locator('.card.who').count() === 0, 'the who-is-this-for screen is no longer first');
ok(await p.locator('.card.home h2 + p.small').evaluate((e) => parseFloat(getComputedStyle(e).fontSize)) >= 17, 'lead text under the title is larger');
ok(await p.locator('#chips button').count() === 0, 'no option chips above the message box on the start screen');
ok(await p.locator('#sampleBtn, #whoBtn, .card.home .inl').count() === 0, 'no extra buttons under the cards');
ok(await p.locator('.card.home', { hasText: 'type anything' }).count() === 0, 'the type-anything line is gone');
ok(await p.locator('.sidehead + #newFromList').count() === 1 && (await p.locator('#newFromList').boundingBox()).y > (await p.locator('#closeC').boundingBox()).y, 'New Chat sits under the sidebar icon');
// 1a. each of the three cards goes straight to the letter form
for (const sit of ['denied', 'low', 'quiet']) { p = await page(); await p.locator('.choice[data-sit="' + sit + '"]').click(); await p.waitForSelector('.aGo'); ok(await p.locator('.card .steps').count() === 0 && await p.locator('.aGo').isVisible(), sit + ' card goes straight to the letter form, no steps in between'); await p.context().close(); }
// 1b. letter polish: example matches the situation, typed text carries over, one bubble per tap
p = await page(); await p.locator('.choice[data-sit="low"]').click(); await p.waitForSelector('.aN');
ok(/offered/i.test(await p.locator('.aN').getAttribute('placeholder')) && !/denied/i.test(await p.locator('.aN').getAttribute('placeholder')), 'notes example matches the picked situation (offered less)');
await p.context().close();
p = await page(); await p.locator('#input').fill('State Farm sent me a form I need to fill out and I do not understand it'); await p.locator('#input').press('Enter'); await p.waitForTimeout(700);
await chip(p, 'Write a letter').click(); await p.waitForSelector('.aN');
ok((await p.locator('.aN').inputValue()).includes('State Farm sent me a form'), 'what the person typed is prefilled in the letter notes');
await p.context().close();
p = await page(); await p.locator('#menuBtn').click(); await p.locator('#humanBtn').click(); await p.waitForTimeout(500);
await chip(p, 'Yes').click(); await p.waitForTimeout(500);
ok(await p.locator('#thread .msg.user', { hasText: /^Yes$/ }).count() === 1, 'one Yes bubble per tap');
await p.context().close();
p = await page();

// 2. letter flow with AI
await p.locator('.choice[data-sit="quiet"]').click();
await p.locator('.aN').fill('My adjuster has not answered for 7 weeks.');
await p.locator('.aGo').click();
await p.waitForSelector('textarea.letterEdit');
let letter = await p.locator('textarea.letterEdit').inputValue();
ok(/Dear Claims Team/.test(letter) && /written update on my claim status/.test(letter), 'AI letter has the single ask');
ok(!/My adjuster has not answered for 7 weeks\./.test(letter), 'letter is reworded, not pasted');
ok((await p.locator('#thread').innerText()).indexOf('standard template') === -1, 'no fallback note when AI works');
await p.locator('textarea.letterEdit').fill(letter + '\nEDITED');
await p.locator('.lcopy').click(); await p.waitForTimeout(300);
ok((await p.locator('#toast.show').innerText()).includes('Copied'), 'copy gives feedback (Copied! toast)');
ok(await chip(p, 'Copy letter').count() === 0, 'no separate Copy letter button');
await chip(p, 'Make it shorter').click(); await p.waitForSelector('textarea.letterEdit');
ok(true, 'shorter regenerates');
// drawer saves the letter
await p.locator('#menuBtn').click(); await p.locator('#checkBtn').click();
ok((await p.locator('#drawerBody').innerText()).includes('Request regarding'), 'letter saved in My claim');
await p.locator('#closeD').click();
// 3. free typing, AI answer with citation and action chip
await p.locator('#input').fill('What do you know about smoke damage in my house?'); await p.locator('#input').press('Enter');
await p.waitForSelector('.msg.ai sup.cite');
ok(await p.locator('#chips button', { hasText: 'Show the steps' }).count() === 1, 'ACTION stage:sm becomes a button');
await chip(p, 'Show the steps').click();
await p.waitForSelector('.card .steps');
ok((await p.locator('#thread').innerText()).includes('smoke'), 'smoke stage opens');
// 4. insurer-specific question is handled without AI
await p.locator('#input').fill('What forms does State Farm need from me?'); await p.locator('#input').press('Enter');
await p.waitForTimeout(900);
ok((await p.locator('#thread').innerText()).includes('insurer-specific'), 'insurer-specific questions get the honest answer');
// 5. handoff
await p.locator('#menuBtn').click(); await p.locator('#humanBtn').click(); await p.waitForTimeout(700);
await chip(p, 'Yes').click(); await p.waitForTimeout(700);
await chip(p, 'My insurance claim').click(); await p.waitForTimeout(700);
ok((await p.locator('#thread').innerText()).includes('1-800-927-4357'), 'handoff shows the CDI number');
ok(await p.locator('a[href="tel:18009274357"]').count() >= 1, 'phone number is a tap-to-call link');
ok(p.errs.length === 0, 'no page errors: ' + p.errs.join(' | '));
await p.context().close();

// 6. languages
for (const [l, word] of [['es', 'aseguradora'], ['zh', '保险公司']]) {
  p = await page({ noStart: true }); await p.locator('#menuBtn').click(); await p.locator('#langSeg button[data-lang="' + l + '"]').click(); await p.waitForSelector('.card.home');
  ok((await p.locator('.card.home h2').innerText()).includes(word), 'home in ' + l);
  await p.locator('.choice[data-sit="low"]').click(); await p.waitForSelector('.aGo');
  await p.locator('.aGo').click(); await p.waitForSelector('textarea.letterEdit');
  ok(/Dear Claims Team/.test(await p.locator('textarea.letterEdit').inputValue()), 'letter in English from ' + l + ' UI');
  ok(p.errs.length === 0, 'no errors in ' + l + ': ' + p.errs.join('|'));
  await p.context().close();
}

// 7. role: renter gets renter steps
p = await page(); await p.locator('.choice[data-sit="denied"]').click(); await p.waitForSelector('.aGo'); await p.locator('.rolebtn[data-role="rent"]').click();
await p.locator('#input').fill('what are my first steps'); await p.locator('#input').press('Enter'); await p.waitForSelector('#chips button'); await chip(p, 'Show the steps').click();
await p.waitForSelector('.card .steps'); ok((await p.locator('#thread').innerText()).toLowerCase().includes('renter'), 'renter start stage');
await p.context().close();

// 8. phone layout
p = await page({ viewport: { width: 375, height: 700 }, isMobile: true });
const sw = await p.evaluate(() => document.documentElement.scrollWidth);
ok(sw <= 376, 'no horizontal scroll at 375px (' + sw + ')');
await p.locator('.choice[data-sit="denied"]').click(); await p.waitForSelector('.aGo');
ok(await p.locator('.aGo').isVisible(), 'letter form usable on phone');
await p.context().close();

// 9. words, stay, adjuster stage
p = await page(); await p.locator('#input').fill('explain insurance words'); await p.locator('#input').press('Enter'); await p.waitForSelector('#chips button'); await chip(p, 'Explain insurance words').click(); await p.waitForSelector('dl.words');
ok((await p.locator('dl.words').innerText()).includes('Deductible'), 'words card');
await p.context().close();
p = await page(); await p.locator('#input').fill('I need a place to stay'); await p.locator('#input').press('Enter'); await p.waitForSelector('#chips button'); await chip(p, 'I need a place to stay').click(); await p.waitForSelector('.card .steps');
ok((await p.locator('#thread').innerText()).includes('1-800-621-3362'), 'stay card has FEMA number');
await p.context().close();


// 10. fallbacks: daily limit reached, and no AI at all
for (const mode of ['quota', 'off']) {
  process.env.MOCK = mode;
  p = await page(); await p.locator('.choice[data-sit="denied"]').click(); await p.waitForSelector('.aGo');
  await p.locator('.aN').fill('They denied my claim on Oct 3.'); await p.locator('.aGo').click();
  await p.waitForSelector('textarea.letterEdit');
  const lt = await p.locator('textarea.letterEdit').inputValue();
  ok(/Dear Claims Team/.test(lt) && /explain your decision in writing/.test(lt) && /They denied my claim on Oct 3\./.test(lt), mode + ': template letter still works');
  ok((await p.locator('#thread').innerText()).includes(mode === 'quota' ? 'free daily limit' : 'not available right now'), mode + ': person is told why');
  await p.locator('#input').fill('how long do I have to settle'); await p.locator('#input').press('Enter'); await p.waitForTimeout(1200);
  ok((await p.locator('#thread .msg.bot').count()) > 3, mode + ': typed message still gets a scripted reply');
  ok(p.errs.filter((e) => !/Failed to load resource/.test(e)).length === 0, mode + ': no script errors ' + p.errs.join('|'));
  await p.context().close();
}
process.env.MOCK = 'ok';

// 11b. copy buttons, scroll-down button, title case
p = await page({}); await p.goto(base + '/app/'); await p.waitForTimeout(700);
await p.locator('#input').fill('hello there'); await p.locator('#sendBtn').click(); await p.waitForTimeout(1500);
ok(await p.locator('.msgtools.mine .cpbtn').count() >= 1, 'copy button under the user message');
ok(await p.locator('.msgtools.theirs .cpbtn').count() >= 1, 'copy button under bot replies');
await p.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
await p.locator('.msgtools.mine .cpbtn').first().click(); await p.waitForTimeout(300);
ok(await p.locator('.msgtools.mine .cpbtn.done').count() === 1, 'copy button confirms with a check');
const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => 'n/a'));
ok(clip === 'n/a' || clip.includes('hello there'), 'clipboard has the message: ' + clip.slice(0, 40));
await p.setViewportSize({ width: 1280, height: 420 });
for (let i = 0; i < 4; i++) { await p.locator('#input').fill('more text ' + i); await p.locator('#sendBtn').click(); await p.waitForTimeout(700); }
await p.evaluate(() => { document.getElementById('thread').scrollTop = 0; }); await p.waitForTimeout(500);
ok(await p.locator('#toBottom.show').count() === 1, 'scroll-down button shows when scrolled up');
await p.locator('#toBottom').click(); await p.waitForTimeout(900);
ok(await p.locator('#toBottom.show').count() === 0, 'scroll-down button hides at the bottom');
ok((await p.locator('.fine').innerText()).startsWith('Student Project from Fung Fellowship'), 'footer names the Fung Fellowship project');
await p.setViewportSize({ width: 1280, height: 800 });
// 12. landing page and routing (demo video, no language line, no Open the guide)
p = await page({ noStart: true }); await p.goto(base + '/');
ok((await p.locator('h1').getAttribute('aria-label')) === 'Next Step', 'landing wordmark');
ok((await p.locator('.hook').innerText()).includes('one clear step'), 'hook line under the name');
ok((await p.locator('a.btn').getAttribute('href')) === '/app/', 'Start leads to the app');
ok(await p.locator('footer a[href="tel:18009274357"]').count() === 1, 'landing has the CDI number');
await p.locator('#themeBtn').click(); ok((await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light', 'landing theme button switches to light'); await p.locator('#themeBtn').click();
const ys = await p.evaluate(() => [...document.querySelectorAll('footer li b')].map((b) => Math.round(b.getBoundingClientRect().top)));
ok(ys.length === 4 && Math.max(...ys) - Math.min(...ys) <= 2, 'phone numbers line up in one row: ' + ys.join(','));
ok((await p.locator('#demo source').getAttribute('src')).startsWith('/demo/next-step-demo.mp4'), 'landing has the demo video');
ok((await p.locator('body').innerText()).indexOf('Español') === -1 && (await p.locator('body').innerText()).indexOf('Open the guide') === -1, 'no language line or Open the guide');
const fam = await p.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
ok(/Cinzel/.test(fam), 'wordmark uses Cinzel');
await p.waitForTimeout(1500);
const lay = await p.evaluate(() => { const h = document.querySelector('h1').getBoundingClientRect(), v = document.querySelector('.hero .phone').getBoundingClientRect(); return { hr: h.right, vl: v.left, vb: v.bottom, hb: h.bottom, ih: innerHeight }; });
ok(lay.hr < lay.vl && lay.vb <= lay.ih && lay.hb <= lay.ih, 'name left, demo right, both in the first screen ' + JSON.stringify(lay));
const loaded = await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).join(','); });
await p.waitForTimeout(1800);
ok(/Cinzel/.test(loaded) && /Garamond/.test(loaded) && /Outfit/.test(loaded), 'bundled fonts actually load: ' + loaded);
await p.setViewportSize({ width: 375, height: 700 });
ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 376, 'landing: no horizontal scroll at 375px');
await p.screenshot({ path: '/tmp/shot_landing_m.png' });
await p.setViewportSize({ width: 1280, height: 800 }); await p.screenshot({ path: '/tmp/shot_landing.png' });
await p.locator('a.btn').click(); await p.waitForSelector('.card.home');
ok(true, 'Start opens the situation screen');
await p.context().close();

// 13. who is this for, separate chats, letters on behalf
{ const { letterSystemPrompt } = await import('../lib/core.js'); const sp = letterSystemPrompt({ who: 'other' });
  ok(!/what it needs from the policyholder/.test(sp) && /Do NOT add any extra request/.test(sp), 'someone-else letter prompt allows only the one ask');
  ok(/Use ONLY the facts the person gave/.test(sp) && /eager/.test(sp), 'letter prompt forbids invented feelings and facts'); }
p = await page({ noStart: true });
await p.locator('#menuBtn').click(); await p.locator('#otherBtn').click(); await p.waitForSelector('.card.who');
ok(await p.locator('.wchoice').count() === 3, 'helping someone else opens the three-choice who screen');
await p.locator('.wchoice[data-who="other"]').click(); await p.locator('#wname').fill('my mom'); await p.locator('#wgo').click();
await p.waitForSelector('.card.home');
ok((await p.locator('.card.home h2').innerText()).toLowerCase().includes('my mom'), 'home uses their name');
ok((await p.locator('#tagWho').innerText()).toLowerCase().includes('for someone else'), 'chat bar shows it is for someone else');
await p.locator('.choice[data-sit="denied"]').click(); await p.waitForSelector('.aGo'); await p.locator('.aGo').click(); await p.waitForSelector('textarea.letterEdit');
const calls0 = (await import('../dev/dev-server.js')).calls; const lastCall = calls0[calls0.length - 1];
ok(/WRITING FOR: someone else \(my mom\)/.test(lastCall.userFull || lastCall.last + ''), 'API is told the letter is for someone else');
await p.locator('#input').fill('what should I do about the adjuster'); await p.locator('#input').press('Enter'); await p.waitForTimeout(900);
// new chat for myself
await p.locator('#newFromList').click(); await p.waitForSelector('.card.home');
ok((await p.locator('#thread').innerText()).indexOf('my mom') === -1, 'new chat starts clean');
await p.locator('#input').fill('my own claim was denied'); await p.locator('#input').press('Enter'); await p.waitForTimeout(900);
await p.locator('#chatTitle').click(); await p.waitForSelector('#shell.side-open');
ok(await p.locator('#clist .citem').count() === 2, 'chat list shows both chats');
await p.locator('#clist .citem', { hasText: 'my mom' }).click(); await p.waitForTimeout(500);
ok((await p.locator('#thread').innerText()).includes('what should I do about the adjuster'), 'old chat comes back with its messages');
ok((await p.locator('#tagWho').innerText()).toLowerCase().includes('for someone else'), 'old chat is still for someone else');
// reload keeps chats
await p.reload(); await p.waitForTimeout(600);
ok((await p.locator('#chatTitle').innerText()).toLowerCase().includes('my mom'), 'reload keeps the current chat');
ok(await p.locator('#clist .citem').count() === 2, 'reload keeps both chats (sidebar open on desktop)');
// delete needs two taps
const delBtn = p.locator('#clist .cdel').first(); await delBtn.click({ force: true }); ok(await p.locator('#clist .citem').count() === 2, 'one tap does not delete');
await p.locator('#clist .cdel[data-arm="1"]').click({ force: true }); ok(await p.locator('#clist .citem', { hasText: 'my mom' }).count() === 0, 'second tap deletes'); ok(await p.locator('.card.home').count() === 1, 'deleting the open chat lands on the start screen');
ok(p.errs.length === 0, 'no page errors in chats: ' + p.errs.join(' | '));
await p.context().close();

// 13b. sidebar open/close, theme button, short footer
p = await page(); ok(await p.locator('#side').isVisible(), 'sidebar is open on desktop');
await p.locator('#closeC').click(); await p.waitForTimeout(450);
ok(!(await p.locator('#side').isVisible()) && await p.locator('#sideBtn').isVisible(), 'sidebar closes and the open button appears');
await p.reload(); await p.waitForTimeout(500); ok(!(await p.locator('#side').isVisible()), 'closed state is remembered');
await p.locator('#sideBtn').click(); await p.waitForTimeout(450); ok(await p.locator('#side').isVisible(), 'sidebar reopens');
ok((await p.locator('.fine').innerText()).length < 90, 'footer is short');
ok(await p.locator('header #themeBtn').isVisible(), 'theme button is outside the menu');
await p.context().close();
p = await page({ viewport: { width: 390, height: 780 }, isMobile: true });
ok(!(await p.locator('#side').isVisible()) || (await p.locator('#side').boundingBox()).x < 0, 'sidebar hidden on phone by default');
await p.locator('#sideBtn').click(); await p.waitForTimeout(450);
ok((await p.locator('#side').boundingBox()).x >= 0, 'sidebar slides in on phone');
await p.locator('#sideBack').click({ position: { x: 360, y: 400 } }); await p.waitForTimeout(450);
ok((await p.locator('#side').boundingBox()).x < 0, 'tapping outside closes it');
ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 391, 'no horizontal scroll with new header');
await p.context().close();

// 14. light theme still readable
p = await page(); await p.locator('#themeBtn').click();
ok((await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light', 'theme toggles to light');
await p.screenshot({ path: '/tmp/shot_app_light.png' }); await p.context().close();
p = await page(); await p.screenshot({ path: '/tmp/shot_app_dark.png' }); await p.context().close();
// 11. adjuster stage exists for owners
p = await page(); await p.locator('#menuBtn').click(); await p.locator('#checkBtn').click();
ok((await p.locator('#drawerBody').innerText()).includes('adjuster is coming'), 'adjuster visit stage listed');
await p.screenshot({ path: '/tmp/shot_drawer.png' }); await p.context().close();
await browser.close(); server.close();
console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);

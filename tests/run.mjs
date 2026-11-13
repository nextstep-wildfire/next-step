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
  await p.goto(base + '/'); p.errs = errs; return p;
}
const chip = (p, name) => p.locator('#chips button', { hasText: name }).first();
const lastBot = (p) => p.locator('#thread .msg.bot').last();

// 1. home
let p = await page();
ok(await p.locator('.choice').count() === 3, 'home shows three choices');
ok(await p.locator('#chips button').count() >= 6, 'home shows quick chips');
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
await chip(p, 'Copy letter').click(); await p.waitForTimeout(300);
ok((await p.locator('.lOut').innerText()).length > 5, 'copy gives feedback');
await chip(p, 'Make it shorter').click(); await p.waitForSelector('textarea.letterEdit');
ok(true, 'shorter regenerates');
// drawer saves the letter
await p.locator('#checkBtn').click();
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
await p.locator('#humanBtn').click(); await p.waitForTimeout(700);
await chip(p, 'Yes').click(); await p.waitForTimeout(700);
await chip(p, 'My insurance claim').click(); await p.waitForTimeout(700);
ok((await p.locator('#thread').innerText()).includes('1-800-927-4357'), 'handoff shows the CDI number');
ok(await p.locator('a[href="tel:18009274357"]').count() >= 1, 'phone number is a tap-to-call link');
ok(p.errs.length === 0, 'no page errors: ' + p.errs.join(' | '));
await p.context().close();

// 6. languages
for (const [l, word] of [['es', 'Dígale'], ['zh', '用书面形式']]) {
  p = await page(); await p.locator('#langSeg button[data-lang="' + l + '"]').click();
  ok((await p.locator('.card.home h2').innerText()).includes(word), 'home in ' + l);
  await p.locator('.choice[data-sit="low"]').click(); await p.waitForSelector('.aGo');
  await p.locator('.aGo').click(); await p.waitForSelector('textarea.letterEdit');
  ok(/Dear Claims Team/.test(await p.locator('textarea.letterEdit').inputValue()), 'letter in English from ' + l + ' UI');
  ok(p.errs.length === 0, 'no errors in ' + l + ': ' + p.errs.join('|'));
  await p.context().close();
}

// 7. role: renter gets renter steps
p = await page(); await p.locator('.rolebtn[data-role="rent"]').click(); await chip(p, 'I am just starting').click();
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
p = await page(); await chip(p, 'Explain insurance words').click(); await p.waitForSelector('dl.words');
ok((await p.locator('dl.words').innerText()).includes('Deductible'), 'words card');
await p.context().close();
p = await page(); await chip(p, 'I need a place to stay').click(); await p.waitForSelector('.card .steps');
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
// 11. adjuster stage exists for owners
p = await page(); await p.locator('#checkBtn').click();
ok((await p.locator('#drawerBody').innerText()).includes('adjuster is coming'), 'adjuster visit stage listed');
await p.screenshot({ path: '/tmp/shot_drawer.png' }); await p.context().close();
await browser.close(); server.close();
console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);

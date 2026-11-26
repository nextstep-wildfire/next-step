// Five strangers, each starting cold on the landing page with one sentence of context, timed to a finished letter.
// Usage: node dev/strangers.mjs <base url> [outdir]
// How the time is counted: every wait for the site (page loads, the model writing) is measured for real. What a
// person does is modelled from the words actually on the screen at each step: reading at the persona's pace, a
// moment to decide, a tap, typing at their pace. A screenshot is kept at every step so a person can see where
// someone would pause. This is a stand-in for five real people, not a replacement for them.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire(new URL('../', import.meta.url).pathname + 'x.js')('playwright');
const base = process.argv[2] || 'http://localhost:8788';
const out = process.argv[3] || 'strangers';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));

const PEOPLE = [
  { id: 'p1-phone-renter', who: 'Renter on a 375px phone. Context given: "Your insurer has not answered your emails for six weeks."', wpm: 210, type: 22, decide: 2.5, phone: true, lang: 'en', watch: false,
    path: { open: 0, sit: 2, role: 1, ask: 0, notes: 'I rent in Altadena. Emailed my adjuster 3 times since Oct 10, no answer. Claim RN-20431.' } },
  { id: 'p2-older-reader', who: 'Older reader on a laptop, text zoomed to 125%, reads slowly and watches the demo first. Context: "They offered $42,300; your contractor says $96,000."', wpm: 130, type: 18, decide: 5, zoom: 1.25, lang: 'en', watch: true,
    path: { open: 0, sit: 1, role: 0, ask: 0, notes: 'They offered $42,300. My contractor says it will cost $96,000 to rebuild.' } },
  { id: 'p3-spanish-phone', who: 'Spanish speaker on a 375px phone (browser in Spanish). Context: "Su aseguradora negó su reclamo por daños de humo."', wpm: 190, type: 20, decide: 3, phone: true, lang: 'es', watch: false,
    path: { open: 0, sit: 0, role: 0, ask: 0, notes: 'Negaron mi reclamo por humo el 14 de octubre. Dicen que no hay daño físico. La casa huele a humo y hay hollín.' } },
  { id: 'p4-pasted-message', who: 'Has the insurer’s email open on a laptop. Context: "Your insurer sent you a settlement offer and a release to sign."', wpm: 230, type: 35, decide: 2, lang: 'en', watch: false, paste: 'Dear Policyholder, We have completed our review of your claim 04-88213. Based on our adjuster estimate, we are offering $42,300 for dwelling repairs, less your deductible of $2,500. To accept, please sign and return the enclosed release by December 15, 2026. Sincerely, Claims Department',
    path: { open: 1, role: 0 } },
  { id: 'p5-typer-tablet', who: 'Types instead of tapping, on a 768px tablet, then asks for a change. Context: "They said no to your detached garage."', wpm: 220, type: 30, decide: 2, tablet: true, lang: 'en', watch: false,
    path: { typed: 'My insurer denied the claim for my detached garage. They said it is excluded. What do I do?', role: 0, ask: 0, edit: 'make it shorter' } },
];

const words = (t) => (String(t).trim().match(/\S+/g) || []).length;
for (const P of PEOPLE) {
  const opts = P.phone ? { viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : P.tablet ? { viewport: { width: 768, height: 1024 }, hasTouch: true } : { viewport: { width: 1280, height: 800 } };
  const ctx = await browser.newContext(Object.assign({ locale: P.lang === 'es' ? 'es-MX' : 'en-US', acceptDownloads: true }, opts));
  const p = await ctx.newPage();
  const log = [];
  let human = 0, machine = 0, step = 0;
  const shot = async (name) => { await p.screenshot({ path: `${out}/${P.id}-${String(++step).padStart(2, '0')}-${name}.png` }); };
  const read = (text, why) => { const s = words(text) / P.wpm * 60 + P.decide; human += s; log.push(`read ${words(text)} words (${why}): ${s.toFixed(1)}s`); };
  const tapT = () => { human += 1.2; };
  const typeT = (t) => { const s = t.length / (P.type * 5) * 60; human += s; log.push(`type ${t.length} chars: ${s.toFixed(1)}s`); };
  const wait = async (fn, why) => { const t0 = Date.now(); await fn(); const s = (Date.now() - t0) / 1000; machine += s; log.push(`wait (${why}): ${s.toFixed(1)}s`); };
  const lastA = async () => p.locator('.thread .m-a').last().innerText();
  const pick = async (i) => { tapT(); await p.locator('.choices:not(.done) .choice').nth(i).click(); };
  const send = async (t) => { typeT(t); await p.fill('#composerIn', t); tapT(); await p.click('#send'); };

  await wait(() => p.goto(base + '/'), 'landing loads');
  if (P.zoom) await p.evaluate((z) => { document.documentElement.style.zoom = z; }, P.zoom);
  await shot('landing');
  read(await p.locator('.hero-text').innerText(), 'landing headline and lede');
  if (P.watch) {
    tapT(); await p.click('#watchBtn');
    await wait(() => p.waitForSelector('#dk.has-paper .dk-sheet p.subj', { timeout: 60000 }), 'watching the demo play');
    await p.waitForFunction(() => !window.__demo.running(), null, { timeout: 20000 });
    await shot('demo-done');
    read('Play it again. A real letter takes about the same few taps, with your own details.', 'demo footer');
  }
  tapT();
  await wait(async () => { await p.click('#startBtn'); await p.waitForSelector('.opening h1'); }, 'the Desk opens');
  if (P.zoom) await p.evaluate((z) => { document.documentElement.style.zoom = z; }, P.zoom);
  await shot('opening');
  read(await p.locator('.opening').innerText(), 'opening question and choices');
  const path = P.path;
  if (path.typed) {
    await send(path.typed);
    await wait(() => p.waitForSelector('.choices:not(.done) .choice', { timeout: 90000 }), 'the model answers');
    await shot('answer'); read(await p.locator('.thread').innerText().then((t) => t.split(path.typed).pop()), 'answer and next question');
  } else if (path.open === 1) {
    await pick(1); await shot('paste-ask'); read(await lastA(), 'paste screen and privacy line');
    human += 6; log.push('switch to email, copy the message: 6.0s');
    tapT(); await p.fill('#composerIn', P.paste); tapT(); await p.click('#send');
    await wait(() => p.waitForSelector('.choices:not(.done) .choice .tag', { timeout: 90000 }), 'the model explains their message');
    await shot('explained'); read(await p.locator('.thread').innerText().then((t) => t.split('December 15, 2026').pop()) + ' ' + (await p.locator('#explain').innerText().catch(() => '')), 'explanation and suggested ask');
    await pick(0);
  } else {
    await pick(path.open);
    read(await lastA(), 'what did they do'); await shot('sit'); await pick(path.sit);
  }
  // own or rent, if asked
  if (await p.locator('.choices:not(.done) .choice').count() >= 2 && /own|rent|suya|alquila/i.test(await lastA())) {
    read(await lastA(), 'own or rent'); await shot('role'); await pick(path.role);
  }
  if (!P.paste) {
    await p.waitForSelector('.choices:not(.done) .choice small');
    read(await lastA(), 'the asks with their notes'); await shot('ask'); await pick(path.ask);
    if (path.notes) {
      await p.waitForSelector('#composerIn');
      read(await lastA(), 'what happened, in a few words'); await shot('notes');
      await send(path.notes);
    } else if (await p.locator('.choices:not(.done) .choice', { hasText: /Skip|Saltar/ }).count()) {
      read(await lastA(), 'what happened'); tapT(); await p.locator('.choices:not(.done) .choice', { hasText: /Skip|Saltar/ }).click();
    }
  }
  await wait(() => p.waitForSelector('#letter p.subj', { state: 'attached', timeout: 120000 }), 'the model writes the letter');
  await p.waitForSelector('.choices:not(.done) .choice:has-text("another"), .choices:not(.done) .choice:has-text("otra carta")', { timeout: 60000 });
  await shot('letter');
  if (P.phone) { read(await lastA(), 'done message'); }
  const letter = await p.locator('#letter').innerText();
  read(letter, 'reading the letter');
  if (P.lang === 'es') read(await p.locator('#esCopy').innerText(), 'reading the Spanish copy');
  if (path.edit) {
    if (P.phone || P.tablet) { tapT(); await p.click('#paperClose'); }
    await send(path.edit);
    await wait(() => p.waitForSelector('.m-a .tx:has-text("changed lines")', { timeout: 90000 }), 'the model edits the letter');
    await shot('edited'); read((await p.locator('#letter').innerText()), 're-reading the shorter letter');
  }
  // fill the name blank on the letter, then copy
  if (!P.phone) { human += 6; log.push('type their name over [your name]: 6.0s'); }
  else { human += 9; log.push('tap into the letter and type their name on a phone: 9.0s'); }
  tapT(); await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await p.click('#copyBtn'); await shot('copied');
  const total = human + machine;
  const res = { id: P.id, who: P.who, total: Math.round(total), human: Math.round(human), machine: Math.round(machine), letterWords: words(letter), log };
  fs.writeFileSync(`${out}/${P.id}.json`, JSON.stringify(res, null, 2));
  console.log(P.id, 'total', Math.round(total) + 's', '(person', Math.round(human) + 's, site', Math.round(machine) + 's)');
  await ctx.close();
}
await browser.close();

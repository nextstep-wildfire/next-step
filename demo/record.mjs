// Records the landing-page demo video from the real app, using the local dev server with a scripted letter.
// Usage: DEMO=1 node demo/record.mjs   (needs Playwright and ffmpeg)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');
process.env.DEMO = '1';
const { server } = await import('../dev/dev-server.js');
await new Promise((r) => server.listen(8811, r));
const out = '/tmp/demo-rec'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
// Crisp capture: take screencast frames at device resolution through DevTools, with timestamps.
const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  const name = out + '/f' + String(frames.length).padStart(5, '0') + '.jpg';
  fs.writeFileSync(name, Buffer.from(f.data, 'base64'));
  frames.push({ name, t: f.metadata.timestamp });
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) {}
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 780, maxHeight: 1560, everyNthFrame: 1 });
await p.goto('http://localhost:8811/app/');
await p.addStyleTag({ content: `
  #demoCap { position: fixed; left: 50%; top: 66px; transform: translateX(-50%); z-index: 99; background: #f2994a; color: #1a1004; font: 600 14px/1.2 Literata, Georgia, serif; padding: 9px 16px; border-radius: 999px; white-space: nowrap; opacity: 0; transition: opacity .35s ease; box-shadow: 0 6px 24px rgba(0,0,0,.4); }
  #demoCap.on { opacity: 1; }
  #demoTap { position: fixed; z-index: 100; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; background: rgba(244,239,232,.55); border: 2px solid rgba(244,239,232,.9); pointer-events: none; left: 195px; top: 700px; transition: left .55s cubic-bezier(.3,.7,.2,1), top .55s cubic-bezier(.3,.7,.2,1), transform .18s ease, opacity .3s; opacity: 0; }
  #demoTap.on { opacity: 1; } #demoTap.press { transform: scale(.7); }
` });
await p.evaluate(() => { const c = document.createElement('div'); c.id = 'demoCap'; document.body.appendChild(c); const t = document.createElement('div'); t.id = 'demoTap'; document.body.appendChild(t); });
const cap = async (txt) => { await p.evaluate((t) => { const c = document.getElementById('demoCap'); c.classList.remove('on'); setTimeout(() => { c.textContent = t; c.classList.add('on'); }, 250); }, txt); };
const tap = async (loc) => {
  await loc.scrollIntoViewIfNeeded(); await p.waitForTimeout(250);
  const b = await loc.boundingBox();
  await p.evaluate(([x, y]) => { const t = document.getElementById('demoTap'); t.classList.add('on'); t.style.left = x + 'px'; t.style.top = y + 'px'; }, [b.x + b.width / 2, b.y + b.height / 2]);
  await p.waitForTimeout(750);
  await p.evaluate(() => document.getElementById('demoTap').classList.add('press')); await p.waitForTimeout(160);
  await loc.click(); await p.evaluate(() => document.getElementById('demoTap').classList.remove('press'));
  await p.waitForTimeout(250);
};
await p.waitForTimeout(900);
await cap('1  Say who it is for'); await p.waitForTimeout(2200);
await tap(p.locator('.wchoice[data-who="me"]')); await p.waitForTimeout(1200);
await cap('2  Tell it what happened'); await p.waitForTimeout(2000);
await tap(p.locator('.choice[data-sit="quiet"]')); await p.waitForTimeout(1500);
const notes = p.locator('.aN'); await tap(notes);
await notes.pressSequentially('I reported my claim in January and sent photos. My adjuster has not answered my calls or emails for 7 weeks.', { delay: 28 });
await p.waitForTimeout(700);
await cap('3  Pick one clear ask'); await p.waitForTimeout(2300);
await tap(p.locator('.aGo'));
await p.waitForSelector('textarea.letterEdit'); await p.waitForTimeout(600);
await cap('4  Edit it, copy it, send it'); await p.waitForTimeout(3600);
const copy = p.locator('#chips button', { hasText: 'Copy letter' }); if (await copy.count()) await tap(copy.first());
await p.waitForTimeout(2200);
await p.evaluate(() => { document.getElementById('demoCap').classList.remove('on'); document.getElementById('demoTap').classList.remove('on'); });
await p.waitForTimeout(700);
await cdp.send('Page.stopScreencast'); await ctx.close(); await browser.close(); server.close();
let list = '';
for (let i = 0; i < frames.length; i++) { const d = i < frames.length - 1 ? Math.max(0.01, frames[i + 1].t - frames[i].t) : 0.5; list += "file '" + frames[i].name + "'\nduration " + d.toFixed(4) + '\n'; }
list += "file '" + frames[frames.length - 1].name + "'\n";
fs.writeFileSync(out + '/list.txt', list);
execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${out}/list.txt -vf "fps=30,scale=600:-2:flags=lanczos" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -an public/demo/next-step-demo.mp4`);
console.log('frames', frames.length);
execSync(`ffmpeg -y -loglevel error -ss 15 -i public/demo/next-step-demo.mp4 -frames:v 1 -q:v 4 public/demo/poster.jpg`);
console.log('done', fs.statSync('public/demo/next-step-demo.mp4').size, 'bytes');

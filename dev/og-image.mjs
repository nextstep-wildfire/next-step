// Makes public/og.png (1200 x 630), the picture a link shows when it is shared: the real headline and the real drawing,
// in the site's own fonts and colors. Run again if the headline or the drawing changes:  node dev/og-image.mjs
import { createRequire } from 'node:module';
import { server } from './dev-server.js';
const require = createRequire(new URL('../', import.meta.url).pathname + 'x.js');
const { chromium } = require('playwright');
await new Promise((r) => server.listen(8797, r));
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto('http://localhost:8797/');
await page.evaluate(async () => {
  await document.fonts.ready;
  const art = document.querySelector('.art svg').outerHTML;
  document.body.innerHTML = '<div id="og" style="width:1200px;height:630px;box-sizing:border-box;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between;background:var(--paper)">' +
    '<div class="brand" style="font-size:30px"><svg viewBox="0 0 18 18" style="width:30px;height:30px;margin-right:10px"><path d="M1 16.5h5.5V11H12V5.5h5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Next Step</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center">' +
      '<div><h1 style="font-size:68px;line-height:1.04;letter-spacing:-0.035em;font-weight:400;margin:0">Every word to your insurer counts. Get each one right.</h1>' +
      '<p style="font-size:26px;line-height:1.35;margin:26px 0 0;color:var(--ink-2)">A free tool for California wildfire survivors.</p></div>' +
      '<div id="ogart" style="color:var(--ink)">' + art + '</div></div>' +
    '<p style="font-size:22px;color:var(--ink-2);margin:0">General information from public sources, not legal or insurance advice.</p></div>';
  document.querySelector('#ogart svg').style.width = '100%';
});
await page.locator('#og').screenshot({ path: new URL('../public/og.png', import.meta.url).pathname });
await browser.close(); server.close();

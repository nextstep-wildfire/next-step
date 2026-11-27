// Builds public/index.html from dev/lp-src.html: inlines Phosphor icons (regular weight, MIT) and the FAQ data.
// Run: node dev/build-lp.mjs
import fs from 'node:fs';
const src = fs.readFileSync(new URL('./lp-src.html', import.meta.url), 'utf8');
const icon = (n) => fs.readFileSync(new URL(`../node_modules/@phosphor-icons/core/assets/regular/${n}.svg`, import.meta.url), 'utf8')
  .trim().replace('<svg ', '<svg class="ph" aria-hidden="true" focusable="false" ');
let out = src.replace(/<!--icon:([a-z-]+)-->/g, (_, n) => icon(n));
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/<[^>]+>/g, '');
const qa = [...out.matchAll(/<span data-t="q\d">(.*?)<\/span>.*?<p class="[^"]*" data-t="a\d">(.*?)<\/p>/g)];
const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([, q, a]) => ({ '@type': 'Question', name: unesc(q), acceptedAnswer: { '@type': 'Answer', text: unesc(a) } })) };
out = out.replace('<!--FAQLD-->', `<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
fs.writeFileSync(new URL('../public/index.html', import.meta.url), out);
console.log('built index.html with', qa.length, 'questions');

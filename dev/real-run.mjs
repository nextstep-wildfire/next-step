// Runs real situations against a deployed preview (the real model) and writes every input and output to a file
// for a person to read. Usage: node dev/real-run.mjs https://<branch>.next-step-2fg.pages.dev docs/real-ai/run-1.md
// It also flags the mechanical problems a script can see: a number not in the person's details, a phone number
// not in sources.json, a missing ask, words the letter rules ban.
import fs from 'node:fs';
const base = process.argv[2];
const out = process.argv[3] || 'real-run.md';
if (!base) { console.log('usage: node dev/real-run.mjs <preview url> [out.md]'); process.exit(1); }
const SOURCES = JSON.parse(fs.readFileSync(new URL('../public/sources.json', import.meta.url), 'utf8'));
const KNOWN = Object.values(SOURCES).map((s) => s.notes).join(' ');
global.window = {}; await import('../public/content.js');
const C = window.NS_CONTENT;
const ask = (sit, id) => (id === 'fu' ? C.FOLLOWUP : C.ASKS[sit].find((a) => a[0] === id));

async function post(body) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ error: 'not_json_' + r.status }));
    if (!j.error || i === 2) return j;
    await new Promise((res) => setTimeout(res, 2500));
  }
}
const nums = (t) => (String(t).match(/\$?\b\d[\d,]*(?:\.\d+)?\b/g) || []).map((n) => n.replace(/[$,]/g, ''));
function flags(text, given, { letter, askText } = {}) {
  const f = [];
  const g = String(given).replace(/,/g, '');
  for (const n of nums(text)) if (n !== '15' && g.indexOf(n) === -1) f.push('number not given: ' + n);
  if (/\[check this number\]/.test(text)) f.push('guard replaced an invented number');
  for (const p of String(text).match(/\b1?-?\d{3}-\d{3}-\d{4}\b/g) || []) if (KNOWN.indexOf(p.replace(/^1-/, '')) === -1 && KNOWN.indexOf(p) === -1) f.push('phone not in sources: ' + p);
  if (/unfortunately|sadly|regrettabl|frankly|disappoint|frustrat|eager|surpris/i.test(text)) f.push('banned feeling word');
  if (/[–—]/.test(text)) f.push('dash');
  if (letter) {
    if (!/^Subject: /m.test(text)) f.push('no subject');
    if (!/Dear Claims Team,/.test(text)) f.push('no greeting');
    if (!/within 15 calendar days/.test(text)) f.push('no 15-day line');
    if (/your recent message/i.test(text) && !letter.paste) f.push('"your recent message" without a pasted message');
    if (askText) { const key = askText.split(/\s+/).filter((w) => w.length > 5).slice(0, 3); if (!key.every((w) => text.toLowerCase().includes(w.toLowerCase().replace(/[.,]/g, '')))) f.push('ask may be missing: ' + key.join(' ')); }
  }
  return f;
}

const LETTERS = [
  { id: 'L1', who: 'Phillipa, low offer, line by line', sit: 'low', ask: 'a1', role: 'own', notes: 'My contractor estimated $96,000 to rebuild. The insurer offered $42,300.' },
  { id: 'L2', who: 'Phillipa, low offer, second estimate', sit: 'low', ask: 'a2', role: 'own', notes: 'Estimate from my contractor is $96,000. Their offer was $42,300 on October 28.' },
  { id: 'L3', who: 'Smoke damage denied', sit: 'denied', ask: 'a1', role: 'own', notes: 'They denied my smoke damage claim on Oct 14. The letter said there was no direct physical loss. The house still smells of smoke and there is soot in the vents.' },
  { id: 'L4', who: 'Renter, insurer silent', sit: 'quiet', ask: 'a1', role: 'rent', notes: 'I rent an apartment in Altadena. I emailed my adjuster Mark Chen three times since September 30 and have not heard back. Claim number RN-20431.' },
  { id: 'L5', who: 'No notes at all', sit: 'quiet', ask: 'a3', role: 'own', notes: '' },
  { id: 'L6', who: 'Worried about the hotel (question, not fact)', sit: 'other', ask: 'a1', role: 'own', notes: 'Does my policy cover a hotel while the house is rebuilt? I do not know what they need from me.' },
];
const PASTES = [
  { id: 'E1', who: 'Settlement offer with a release', paste: 'Dear Policyholder, We have completed our review of your claim 04-88213 for the dwelling at 1420 Canyon Rd. Based on our adjuster estimate, we are offering $42,300 for dwelling repairs, less your deductible of $2,500. To accept, please sign and return the enclosed release by December 15, 2026. Sincerely, Claims Department' },
  { id: 'E2', who: 'Denial for the detached garage', paste: 'Re: Claim 7731-HX. After inspection on October 20, we have determined that the damage to the detached garage is excluded under Section I, Exclusion 3 (wear and tear and deterioration). Coverage for the main dwelling remains under review. If you have additional information, please submit it within 30 days of this letter.' },
  { id: 'E3', who: 'Request for documents', paste: 'Hello, to continue processing your contents claim we need the following: a list of damaged personal property with the age and purchase price of each item, receipts where available, and photographs. Please upload these to the claim portal. Thank you, Jordan, Claims Associate' },
];
const SHEETS = [
  { id: 'S1', who: 'Phillipa, call about the offer', kind: 'call', sit: 'low', ask: 'a1', role: 'own', notes: 'They offered $42,300. My contractor says $96,000. I want to know why the detached garage is not in their estimate.' },
  { id: 'S2', who: 'Call for an update, claim number given', kind: 'call', sit: 'quiet', ask: 'a2', role: 'own', notes: 'Claim HO-77812. Last heard from my adjuster on October 2. I want to know if my living expense extension was approved.' },
  { id: 'S3', who: 'Call about a denial, no notes', kind: 'call', sit: 'denied', ask: 'a2', role: 'rent', notes: '' },
  { id: 'S4', who: 'Visit, standing home with smoke', kind: 'visit', home: 'standing', role: 'own', notes: 'Soot on the kitchen ceiling and smoke smell in the bedroom closets. My daughter has asthma. The HVAC was running during the fire.' },
  { id: 'S5', who: 'Visit, destroyed rental', kind: 'visit', home: 'lost', role: 'rent', notes: 'The apartment burned down. I lost all my furniture, clothes and my work laptop. I have old photos on my phone.' },
];
const CHATS = [
  { id: 'C1', who: 'Adjuster coming', text: 'The adjuster is coming out to see the house next Tuesday. What should I do?', want: 'visit' },
  { id: 'C2', who: 'Call tomorrow', text: 'I have a phone call with my insurance company tomorrow about my claim and I am nervous.', want: 'call' },
  { id: 'C3', who: 'Overwhelmed', text: 'I honestly can’t do this anymore, it is too much and I am exhausted.', want: 'breathe' },
  { id: 'C4', who: 'Who else can help', text: 'Is there anyone besides the insurance department who can help me with my claim?', want: null },
];

const md = ['# Real model output, ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC', '', 'Preview: ' + base, ''];
const summary = [];
const note = (id, who, fl) => summary.push('| ' + id + ' | ' + who + ' | ' + (fl.length ? fl.join('; ') : 'none') + ' |');

for (const L of LETTERS) {
  const a = ask(L.sit, L.ask);
  const j = await post({ mode: 'letter', lang: 'en', subject: C.ASK_SUBJECT[L.sit][L.ask], sit: L.sit, sitLabel: C.SIT_LABEL[L.sit].en, role: L.role, ask: a[1], notes: L.notes, name: '', claim: '', insurer: '', who: 'me' });
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, L.notes, { letter: {}, askText: a[1] });
  md.push('## ' + L.id + '. Letter: ' + L.who, '', '- Situation: ' + L.sit + ', ' + L.role + '. Ask: ' + a[1], '- Notes: ' + (L.notes || '(none)'), '', '```', j.text || JSON.stringify(j), '```', '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(L.id, 'Letter: ' + L.who, fl);
  L.text = j.text;
}
for (const R of [{ id: 'R1', ins: 'make it shorter', base: 'L1' }, { id: 'R2', ins: 'my claim number is HO-55821 and my name is Phillipa Moore', base: 'L1' }, { id: 'R3', ins: 'say I sent photos of the vents on Nov 2', base: 'L3' }, { id: 'R4', ins: 'make it more formal and shorter', base: 'L4' }]) {
  const src = LETTERS.find((l) => l.id === R.base);
  const j = await post({ mode: 'revise', lang: 'en', sit: src.sit, ask: ask(src.sit, src.ask)[1], letter: src.text, instruction: R.ins });
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, src.notes + ' ' + R.ins, { letter: {}, askText: ask(src.sit, src.ask)[1] });
  md.push('## ' + R.id + '. Edit of ' + R.base + ': "' + R.ins + '"', '', '```', j.text || JSON.stringify(j), '```', '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(R.id, 'Edit: ' + R.ins, fl);
}
for (const E of PASTES) {
  const j = await post({ mode: 'explain', lang: 'en', paste: E.paste });
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, E.paste);
  md.push('## ' + E.id + '. Their message: ' + E.who, '', '> ' + E.paste, '', 'Explanation:', '', '```', j.text || JSON.stringify(j), '```', '', 'Picked: ' + j.sit + ' ' + j.ask + (j.sit ? ' (' + ask(j.sit, j.ask)[1] + ')' : ''), '');
  let rfl = [];
  if (j.sit) {
    const a = ask(j.sit, j.ask);
    const r = await post({ mode: 'letter', lang: 'en', subject: C.ASK_SUBJECT[j.sit][j.ask], sit: j.sit, sitLabel: C.SIT_LABEL[j.sit].en, role: 'own', ask: a[1], notes: '', paste: E.paste, name: '', claim: '', insurer: '', who: 'me' });
    rfl = r.error ? ['ERROR ' + r.error] : flags(r.text, E.paste, { letter: { paste: true }, askText: a[1] });
    md.push('Reply letter:', '', '```', r.text || JSON.stringify(r), '```', '');
  }
  md.push('Flags: explanation ' + (fl.join('; ') || 'none') + '; reply ' + (rfl.join('; ') || 'none'), '');
  note(E.id, 'Their message: ' + E.who + ' (picked ' + j.sit + ' ' + j.ask + ')', fl.concat(rfl.map((x) => 'reply: ' + x)));
}
for (const S of SHEETS) {
  const a = S.ask ? ask(S.sit, S.ask) : null;
  const j = await post({ mode: 'sheet', lang: 'en', kind: S.kind, sit: S.sit || 'other', sitLabel: S.sit ? C.SIT_LABEL[S.sit].en : '', home: S.home || 'standing', role: S.role, ask: a ? a[1] : '', notes: S.notes, name: '', claim: '' });
  const all = j.error ? '' : j.say + '\n' + j.points.join('\n');
  const fl = j.error ? ['ERROR ' + j.error] : flags(all, S.notes + ' ' + (a ? a[1] : ''));
  if (!j.error && !S.notes && j.points.length) fl.push('points with no notes');
  md.push('## ' + S.id + '. ' + (S.kind === 'call' ? 'Call' : 'Visit') + ' sheet: ' + S.who, '', '- ' + (S.kind === 'call' ? 'About: ' + S.sit + '. Ask: ' + a[1] : 'Home: ' + S.home) + '. ' + S.role, '- Notes: ' + (S.notes || '(none)'), '', 'What to say:', '', '> ' + (j.say || JSON.stringify(j)), '', 'From their notes:', '', ...(j.points || []).map((p) => '- ' + p), '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(S.id, (S.kind === 'call' ? 'Call' : 'Visit') + ' sheet: ' + S.who, fl);
}
for (const Q of CHATS) {
  const j = await post({ mode: 'chat', lang: 'en', messages: [{ role: 'user', content: Q.text }], breatheOffered: false });
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, Q.text);
  const got = j.action ? j.action.type : null;
  if (Q.want && got !== Q.want) fl.push('wanted ACTION ' + Q.want + ', got ' + got);
  md.push('## ' + Q.id + '. Chat: ' + Q.who, '', '> ' + Q.text, '', '```', j.text || JSON.stringify(j), '```', '', 'Action: ' + JSON.stringify(j.action || null), '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(Q.id, 'Chat: ' + Q.who + ' (action ' + got + ')', fl);
}
md.splice(4, 0, '## Script flags (a person still reads every output below)', '', '| # | Case | Flags |', '|---|---|---|', ...summary, '');
fs.mkdirSync(new URL('.', 'file://' + fs.realpathSync('.') + '/' + out).pathname, { recursive: true });
fs.writeFileSync(out, md.join('\n'));
console.log(summary.join('\n'));
console.log('wrote', out);

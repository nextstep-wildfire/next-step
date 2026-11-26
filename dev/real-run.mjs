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
const core = await import('../lib/core.js');
const C = window.NS_CONTENT;
const ask = (sit, id) => (id === 'fu' ? C.FOLLOWUP : C.ASKS[sit].find((a) => a[0] === id));

async function post(body) {
  for (let i = 0; i < 3; i++) {
    let j;
    try {
      const r = await fetch(base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
      j = await r.json().catch(() => ({ error: 'not_json_' + r.status }));
    } catch (e) { j = { error: 'timeout_or_network' }; }
    if (!j.error || i === 2) return j;
    await new Promise((res) => setTimeout(res, 2500));
  }
}
const nums = (t) => (String(t).match(/\$?\b\d[\d,]*(?:\.\d+)?\b/g) || []).map((n) => n.replace(/[$,]/g, ''));
function flags(text, given, { letter, askText, extra } = {}) {
  const f = [];
  // the same reading of numbers the server uses: 42.300, "96 mil" and "siete" count as given
  text = String(text).replace(/\[\d{1,2}\]/g, '');   // a source number like [10] is not a fact
  const guarded = core.guardNumbers(String(text), String(given) + ' ' + (extra || ''), ['15']);
  if (/\b(however|despite|nevertheless)\b/i.test(text) && !/\b(however|but|despite|pero|sin embargo)\b/i.test(given)) f.push('contrast word not in the notes');
  if (/\b(concerns?|concerned|worried)\b|preocupaci/i.test(text) && !/\b(concern|worr)|preocup/i.test(given)) f.push('worry not in the notes');
  if (guarded !== String(text)) for (const m of guarded.match(/\[check this number\]/g) || []) f.push('number not given');
  if (/\[check this number\]/.test(text)) f.push('guard replaced an invented number');
  for (const p of String(text).match(/\b1?-?\d{3}-\d{3}-\d{4}\b/g) || []) if (KNOWN.indexOf(p.replace(/^1-/, '')) === -1 && KNOWN.indexOf(p) === -1) f.push('phone not in sources: ' + p);
  if (/unfortunately|sadly|regrettabl|frankly|disappoint|frustrat|eager|surpris/i.test(text)) f.push('banned feeling word');
  if (/[–—]/.test(text)) f.push('dash');
  if (letter) {
    if (!/^Subject: /m.test(text)) f.push('no subject');
    if (!/Dear Claims Team,/.test(text)) f.push('no greeting');
    if (!/within 15 calendar days/.test(text)) f.push('no 15-day line');
    if (/your recent message/i.test(text) && !letter.paste) f.push('"your recent message" without a pasted message');
    const n = (t) => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
    if (askText && n(text).indexOf(n(askText)) === -1) f.push('ask not word for word');
    const facts = text.split(/\n{2,}/).filter((p) => !/^Subject:|^Dear |within 15 calendar days|^(Thank you|Thanks|Sincerely)/i.test(p) && (!askText || n(p) !== n(askText)));
    if (facts.some((p) => /\?/.test(p))) f.push('question in the facts');
    if (facts.some((p) => /(^|[.!?]\s+)(You should|You must|You need to|Please )/.test(p))) f.push('second request in the facts');
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
  { id: 'L7', who: 'Follow-up email from a call log', sit: 'quiet', ask: 'fu', role: 'rent', notes: 'On Nov 25, 2026 at 10:30, I spoke by phone with Mark Chen, adjuster.\nThey said: A supervisor will look at the claim this week.\nThey said the next step is: Supervisor calls me by Dec 3' },
  { id: 'L8', who: 'Follow-up email from a visit log', sit: 'other', ask: 'fu', role: 'own', notes: 'On Nov 21, 2026, your adjuster visited my home: Sam Lee, Allied Claims.\nThey looked at: Kitchen ceiling, bedroom closets, HVAC ducts\nThey said: Smoke testing will be ordered.\nThey said the next step is: Scope of work by email within two weeks' },
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

// ---------- Spanish: a Spanish speaker's notes, edits, messages, sheets and chats ----------
const LETTERS_ES = [
  { id: 'LS1', who: 'Oferta baja, partida por partida', sit: 'low', ask: 'a1', role: 'own', notes: 'Mi contratista calculó $96.000 para reconstruir. La aseguradora ofreció $42.300.' },
  { id: 'LS2', who: 'Inquilina, la aseguradora no responde', sit: 'quiet', ask: 'a1', role: 'rent', notes: 'Alquilo un apartamento en Altadena. Le escribí a mi ajustador Mark Chen tres veces desde el 30 de septiembre y no me ha respondido. Número de reclamo RN-20431.' },
  { id: 'LS3', who: 'Humo, reclamo negado', sit: 'denied', ask: 'a1', role: 'own', notes: 'Negaron mi reclamo por daños de humo el 14 de octubre. La carta decía que no hubo pérdida física directa. La casa todavía huele a humo y hay hollín en los ductos.' },
  { id: 'LS4', who: 'Pregunta sobre el hotel (no es un hecho)', sit: 'other', ask: 'a1', role: 'own', notes: '¿Mi póliza cubre un hotel mientras reconstruyen la casa? No sé qué necesitan de mí.' },
  { id: 'LS5', who: 'Sin notas', sit: 'quiet', ask: 'a3', role: 'own', notes: '' },
  { id: 'LS6', who: 'Correo de seguimiento desde un registro en español', sit: 'quiet', ask: 'fu', role: 'rent', notes: 'On Nov 25, 2026 at 10:30, I spoke by phone with Mark Chen, ajustador.\nThey said: Un supervisor revisará el reclamo esta semana.\nThey said the next step is: El supervisor me llama antes del 3 de diciembre' },
  { id: 'LS7', who: 'Números en palabras', sit: 'low', ask: 'a2', role: 'own', notes: 'Hace siete semanas me ofrecieron 42 mil. Mi contratista dice que son 96 mil.' },
];
const PASTES_ES = [
  { id: 'ES1', who: 'Oferta con liberación (mensaje en inglés)', paste: PASTES[0].paste },
  { id: 'ES2', who: 'Oferta escrita en español por la aseguradora', paste: 'Estimado asegurado: Hemos revisado su reclamo 04-88213. Con base en el estimado de nuestro ajustador, le ofrecemos $42,300 por las reparaciones de la vivienda, menos su deducible de $2,500. Para aceptar, firme y devuelva el formulario adjunto antes del 15 de diciembre de 2026. Atentamente, Departamento de Reclamos' },
  { id: 'ES3', who: 'Pedido de documentos (mensaje en inglés)', paste: PASTES[2].paste },
];
const SHEETS_ES = [
  { id: 'SS1', who: 'Llamada sobre la oferta', kind: 'call', sit: 'low', ask: 'a1', role: 'own', notes: 'Ofrecieron $42.300. Mi contratista dice $96.000. Quiero saber por qué el garaje no está en su estimado.' },
  { id: 'SS2', who: 'Visita, casa en pie con humo', kind: 'visit', home: 'standing', role: 'own', notes: 'Hollín en el techo de la cocina y olor a humo en los clósets. Mi hija tiene asma.' },
  { id: 'SS3', who: 'Visita, apartamento destruido', kind: 'visit', home: 'lost', role: 'rent', notes: 'El apartamento se quemó. Perdí todos mis muebles, la ropa y mi laptop del trabajo.' },
];
const CHATS_ES = [
  { id: 'CS1', who: 'Viene el ajustador', text: 'El ajustador viene a ver la casa el próximo martes. ¿Qué debo hacer?', want: 'visit' },
  { id: 'CS2', who: 'Llamada mañana', text: 'Mañana tengo una llamada con mi aseguradora sobre mi reclamo y estoy nervioso.', want: 'call' },
  { id: 'CS3', who: 'Agotada', text: 'Ya no puedo más, es demasiado y estoy agotada.', want: 'breathe' },
  { id: 'CS4', who: 'Plazos', text: '¿Cuánto tiempo tiene mi aseguradora para responder a mi reclamo?', want: null },
  { id: 'CS5', who: 'Adelanto para gastos de vida', text: '¿Me pueden adelantar dinero para vivir si perdí la casa?', want: null },
];
// a Spanish copy: every line kept is checked again here; a withheld line (null) is reported, not hidden
function esFlags(es, english) {
  const f = [];
  if (!Array.isArray(es)) return ['no Spanish copy'];
  const en = String(english).split(/\n{2,}/);
  if (es.length !== en.length) f.push('copy has ' + es.length + ' lines for ' + en.length + ' paragraphs');
  es.forEach((x, i) => {
    if (x === null) { f.push('line ' + (i + 1) + ' withheld (shown in English)'); return; }
    if (core.guardNumbers(x, en[i] || '', ['15']).indexOf('[check this number]') !== -1) f.push('copy line ' + (i + 1) + ': number not in the English');
    for (const p of String(x).match(/\b1?-?\d{3}-\d{3}-\d{4}\b/g) || []) if (KNOWN.indexOf(p.replace(/^1-/, '')) === -1) f.push('copy: phone not in sources: ' + p);
  });
  return f;
}
const englishOnly = (t) => (/[áéíóúñ¿¡]/i.test(t.replace(/\[[^\]]*\]/g, '')) ? ['Spanish words in the English letter'] : []);

const md = ['# Real model output, ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC', '', 'Preview: ' + base, ''];
const summary = [];
const note = (id, who, fl) => summary.push('| ' + id + ' | ' + who + ' | ' + (fl.length ? fl.join('; ') : 'none') + ' |');

for (const L of LETTERS) {
  const a = ask(L.sit, L.ask);
  const j = await post({ mode: 'letter', lang: 'en', subject: L.ask === 'fu' ? C.ASK_SUBJECT.fu : C.ASK_SUBJECT[L.sit][L.ask], sit: L.sit, sitLabel: C.SIT_LABEL[L.sit].en, role: L.role, ask: a[1], notes: L.notes, name: '', claim: '', insurer: '', who: 'me' });
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
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, Q.text, { extra: KNOWN });
  const got = j.action ? j.action.type : null;
  if (Q.want && got !== Q.want) fl.push('wanted ACTION ' + Q.want + ', got ' + got);
  md.push('## ' + Q.id + '. Chat: ' + Q.who, '', '> ' + Q.text, '', '```', j.text || JSON.stringify(j), '```', '', 'Action: ' + JSON.stringify(j.action || null), '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(Q.id, 'Chat: ' + Q.who + ' (action ' + got + ')', fl);
}
md.push('---', '', '# Spanish', '', 'A Spanish speaker. Letters, emails and what to say on a call are in English (what the insurer reads); the Spanish copy and everything for the person is in Spanish.', '');
for (const L of LETTERS_ES) {
  const a = ask(L.sit, L.ask);
  const sub = L.ask === 'fu' ? [C.ASK_SUBJECT.fu, C.ASK_SUBJECT_ES.fu] : [C.ASK_SUBJECT[L.sit][L.ask], C.ASK_SUBJECT_ES[L.sit][L.ask]];
  const askEs = L.ask === 'fu' ? C.ASK_ES.fu : C.ASK_ES[L.sit][L.ask];
  const j = await post({ mode: 'letter', lang: 'es', subject: sub[0], subjectEs: sub[1], askEs, sit: L.sit, sitLabel: C.SIT_LABEL[L.sit].en, role: L.role, ask: a[1], notes: L.notes, name: '', claim: '', insurer: '', who: 'me' });
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, L.notes, { letter: {}, askText: a[1] }).concat(englishOnly(j.text), esFlags(j.es, j.text));
  md.push('## ' + L.id + '. Carta: ' + L.who, '', '- Situación: ' + L.sit + ', ' + L.role + '. Pedido: ' + a[1], '- Notas: ' + (L.notes || '(ninguna)'), '', '```', j.text || JSON.stringify(j), '```', '', 'Copia en español:', '', '```', (j.es || []).map((x) => (x === null ? '(sin traducir: se muestra en inglés)' : x)).join('\n\n'), '```', '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(L.id, 'Letter (es): ' + L.who, fl);
  L.text = j.text;
}
for (const R of [{ id: 'RS1', ins: 'hágala más corta', base: 'LS1' }, { id: 'RS2', ins: 'mi número de reclamo es HO-55821 y me llamo Phillipa Moore', base: 'LS1' }, { id: 'RS3', ins: 'diga que envié fotos de los ductos el 2 de noviembre', base: 'LS3' }]) {
  const src = LETTERS_ES.find((l) => l.id === R.base);
  const a = ask(src.sit, src.ask);
  const j = await post({ mode: 'revise', lang: 'es', sit: src.sit, ask: a[1], askEs: C.ASK_ES[src.sit][src.ask], subject: C.ASK_SUBJECT[src.sit][src.ask], subjectEs: C.ASK_SUBJECT_ES[src.sit][src.ask], letter: src.text, instruction: R.ins });
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, src.notes + ' ' + src.text + ' ' + R.ins, { letter: {}, askText: a[1] }).concat(englishOnly(j.text), esFlags(j.es, j.text));
  md.push('## ' + R.id + '. Cambio de ' + R.base + ': "' + R.ins + '"', '', '```', j.text || JSON.stringify(j), '```', '', 'Copia en español:', '', '```', (j.es || []).map((x) => (x === null ? '(sin traducir)' : x)).join('\n\n'), '```', '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(R.id, 'Edit (es): ' + R.ins, fl);
}
for (const E of PASTES_ES) {
  const j = await post({ mode: 'explain', lang: 'es', paste: E.paste });
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, E.paste);
  if (!j.error && /\b(the|your|you|they)\b/i.test(j.text)) fl.push('English words in the Spanish explanation');
  md.push('## ' + E.id + '. Su mensaje: ' + E.who, '', '> ' + E.paste, '', 'Explicación:', '', '```', j.text || JSON.stringify(j), '```', '', 'Picked: ' + j.sit + ' ' + j.ask, '');
  note(E.id, 'Their message (es): ' + E.who + ' (picked ' + j.sit + ' ' + j.ask + ')', fl);
}
for (const S of SHEETS_ES) {
  const a = S.ask ? ask(S.sit, S.ask) : null;
  const j = await post({ mode: 'sheet', lang: 'es', kind: S.kind, sit: S.sit || 'other', sitLabel: S.sit ? C.SIT_LABEL[S.sit].en : '', home: S.home || 'standing', role: S.role, ask: a ? a[1] : '', notes: S.notes, name: '', claim: '' });
  const all = j.error ? '' : j.say + '\n' + j.points.join('\n');
  const fl = j.error ? ['ERROR ' + j.error] : flags(all, S.notes + ' ' + (a ? a[1] : ''));
  if (!j.error) {
    if (j.sayEs === null) fl.push('what-to-say copy withheld');
    (j.pointsEs || []).forEach((x, i) => { if (x === null) fl.push('point ' + (i + 1) + ' copy withheld'); });
    fl.push(...englishOnly(all));
  }
  md.push('## ' + S.id + '. Hoja (' + S.kind + '): ' + S.who, '', '- Notas: ' + S.notes, '', 'What to say:', '', '> ' + (j.say || JSON.stringify(j)), '', 'En español:', '', '> ' + (j.sayEs === null ? '(sin traducir)' : j.sayEs || ''), '', 'From their notes:', '', ...(j.points || []).map((p, i) => '- ' + p + '  /  ' + ((j.pointsEs || [])[i] === null ? '(sin traducir)' : (j.pointsEs || [])[i])), '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(S.id, 'Sheet (es): ' + S.who, fl);
}
for (const Q of CHATS_ES) {
  const j = await post({ mode: 'chat', lang: 'es', messages: [{ role: 'user', content: Q.text }], breatheOffered: false });
  // a number in a chat answer must come from the question or the source notes
  const fl = j.error ? ['ERROR ' + j.error] : flags(j.text, Q.text, { extra: KNOWN });
  const got = j.action ? j.action.type : null;
  if (Q.want && got !== Q.want) fl.push('wanted ACTION ' + Q.want + ', got ' + got);
  md.push('## ' + Q.id + '. Chat: ' + Q.who, '', '> ' + Q.text, '', '```', j.text || JSON.stringify(j), '```', '', 'Action: ' + JSON.stringify(j.action || null), '', 'Flags: ' + (fl.join('; ') || 'none'), '');
  note(Q.id, 'Chat (es): ' + Q.who + ' (action ' + got + ')', fl);
}
md.splice(4, 0, '## Script flags (a person still reads every output below)', '', '| # | Case | Flags |', '|---|---|---|', ...summary, '');
fs.mkdirSync(new URL('.', 'file://' + fs.realpathSync('.') + '/' + out).pathname, { recursive: true });
fs.writeFileSync(out, md.join('\n'));
console.log(summary.join('\n'));
console.log('wrote', out);

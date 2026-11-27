// The two small endpoints besides the chat: /api/count (cookie-free counts) and /api/feedback ("Something unclear? Tell us").
// Nothing here reads or keeps an address, a cookie, a user agent or anything typed in the chat or the letter.

const EVENTS = ['visit', 'desk', 'copy', 'email', 'pdf'];
const WHAT = ['', 'letter', 'sheet'];
const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function sameSite(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch (e) { return false; }
}
async function readJson(request, max) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > max) return null;
  try { const raw = await request.text(); if (raw.length > max) return null; return JSON.parse(raw); } catch (e) { return null; }
}

// One data point per event: blobs are [event, language, letter or sheet]. Without the binding (a local run) it does nothing.
export async function handleCount(request, env) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!sameSite(request)) return json({ error: 'forbidden' }, 403);
  const b = await readJson(request, 300);
  if (!b || EVENTS.indexOf(b.e) === -1) return json({ error: 'bad_request' }, 400);
  const lang = b.l === 'es' ? 'es' : 'en', what = WHAT.indexOf(b.w) === -1 ? '' : b.w;
  try { if (env && env.COUNTS) env.COUNTS.writeDataPoint({ indexes: [b.e], blobs: [b.e, lang, what], doubles: [1] }); } catch (e) {}
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}

// The message goes to one webhook the owners set (FEEDBACK_WEBHOOK, a secret in Cloudflare) and nowhere else.
// Until that is set the answer is "not available", so the form never pretends to have sent anything.
export async function handleFeedback(request, env, fetchImpl) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!sameSite(request)) return json({ error: 'forbidden' }, 403);
  const b = await readJson(request, 2500);
  const text = b && typeof b.text === 'string' ? b.text.trim().slice(0, 1000) : '';
  if (!text) return json({ error: 'bad_request' }, 400);
  if (!env || !env.FEEDBACK_WEBHOOK) return json({ error: 'no_inbox' }, 503);
  const where = ['letter', 'sheet', 'chat'].indexOf(b.where) === -1 ? 'chat' : b.where;
  const lang = b.lang === 'es' ? 'es' : 'en';
  try {
    const r = await (fetchImpl || fetch)(env.FEEDBACK_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Next Step, something unclear (' + lang + ', ' + where + '): ' + text, message: text, language: lang, where: where }) });
    if (!r.ok) return json({ error: 'upstream' }, 502);
  } catch (e) { return json({ error: 'upstream' }, 502); }
  return json({ ok: true });
}

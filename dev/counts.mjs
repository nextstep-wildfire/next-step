// Reads the cookie-free counts back out of Cloudflare, by day:
//   CF_ACCOUNT_ID=... CF_API_TOKEN=... node dev/counts.mjs [days]
// The token needs one permission only: Account > Account Analytics > Read. It is made once in the Cloudflare dashboard
// (My Profile > API Tokens > Create Token > Create Custom Token). Steps and what each number means: "Hand-over" in docs/DESIGN.md.
// Events: visit (landing page, once per tab), desk (Desk opened, once per tab), copy, email, pdf (each press), with the language
// and whether it was a letter or a call or visit sheet. Nothing else is stored: no address, no cookie, nothing typed.
const id = process.env.CF_ACCOUNT_ID, token = process.env.CF_API_TOKEN, days = Math.max(1, Math.min(365, Number(process.argv[2] || 30)));
if (!id || !token) { console.log('Set CF_ACCOUNT_ID and CF_API_TOKEN first (see the top of this file).'); process.exit(1); }
const sql = `SELECT toDate(timestamp) AS day, blob1 AS event, blob2 AS lang, blob3 AS what, SUM(_sample_interval) AS n
FROM next_step_counts WHERE timestamp > NOW() - INTERVAL '${days}' DAY GROUP BY day, event, lang, what ORDER BY day DESC, event FORMAT JSON`;
const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${id}/analytics_engine/sql`, { method: 'POST', headers: { authorization: 'Bearer ' + token }, body: sql });
const j = await r.json().catch(() => null);
if (!r.ok || !j || !j.data) { console.log('Cloudflare said no (' + r.status + '):', JSON.stringify(j || {}).slice(0, 400)); process.exit(1); }
const total = {};
for (const x of j.data) { total[x.event] = (total[x.event] || 0) + Number(x.n); }
console.log('Last ' + days + ' days, all days together:'); console.table(total);
console.log('By day:'); console.table(j.data.map((x) => ({ day: x.day, event: x.event, lang: x.lang, what: x.what, count: Number(x.n) })));

# Next Step (v3)

A free guide for California wildfire survivors dealing with a home insurance claim. Student prototype built with mentorship from The After Collective. Not legal or insurance advice.

- `public/` is the website (plain HTML, CSS and JavaScript, no build step).
- `functions/api/chat.js` and `lib/core.js` are the small backend. It answers typed questions, writes letters and explains insurer messages. All prompts live on the server, and every rule, number and phone number must come from `public/sources.json`.
- `dev/dev-server.js` runs everything on your laptop with a pretend AI, so you can test with no account.
- `tests/run.mjs` is the automated browser test (129 checks).
- `docs/DESIGN.md` explains the look (colour, type, layout) and lists what is flagged and not settled.
- `docs/FEEDBACK_MAP.md` shows which interview feedback went into this version and what is still open.

## Cost: $0

| Piece | Where it runs | Free allowance |
|---|---|---|
| Website files | Cloudflare Pages | Unlimited requests and bandwidth, 500 builds a month |
| Chat backend | Pages Functions | 100,000 requests a day |
| AI | Workers AI | 10,000 "Neurons" a day, no card needed, resets at midnight UTC (4 PM Pacific in winter) |

The website address is `https://<project-name>.pages.dev`. A custom domain such as `nextstep.org` costs money. Ask The After Collective whether they can give you a subdomain, and ask them before using any branded address.

**What 10,000 Neurons means:** roughly 140 to 160 live AI chat replies a day with the default 70B model (about 109 before the Nov 20 speed update), computed from Cloudflare's price list at about 90 output tokens per reply, or roughly 600 a day if you switch to the smaller 8B model (see below). These are estimates from Cloudflare's price list. Check the real number in the Cloudflare dashboard under Workers AI after your first day of use.

**When the free allowance runs out**, nothing breaks. The site tells the person live rewording is paused, then keeps working with the guided steps, checklists, phone numbers and a standard letter template. It tries the AI again after 30 minutes.

## Deploy in about 15 minutes

You need a free GitHub account and a free Cloudflare account. No credit card.

1. **Put the folder on GitHub.** Create a new repository (private is fine), then upload everything in this folder. The web page "Add file, Upload files" works. Do not upload `node_modules`.
2. **Create the site.** In Cloudflare, open Workers & Pages, then Create, then the Pages tab, then Connect to Git. Pick the repository.
3. **Build settings.** Framework preset: None. Build command: leave empty. Build output directory: `public`. Save and deploy.
4. **Turn on the AI.** Open the new project, go to Settings, then Bindings (or Functions, then Bindings), then Add, then Workers AI. Variable name must be exactly `AI`. Add it for Production (and Preview if you want). Then go to Deployments and Retry the latest deployment so it picks up the binding.
5. **Test it.** Open your `.pages.dev` address. Tap Start my letter, pick own or rent, tap "They went quiet", pick an ask, add a line, and write the letter. If the page says live answers are unavailable, step 4 was missed.

The `wrangler.toml` file also declares the AI binding. If Cloudflare reads it, step 4 is already done. If the dashboard shows the binding as locked or missing, use step 4.

After that, every change you push to GitHub deploys automatically in about a minute.

## Test it on your laptop first (optional)

Needs Node 20 or newer.

```
cd next-step
node dev/dev-server.js 8788      # open http://localhost:8788
```

The AI here is a pretend one, so replies are fixed text. Set `MOCK=quota` or `MOCK=off` before the command to see what people see when the free limit is reached or the AI is off.

The automated test needs Playwright installed: `npm i -D playwright`, then `npx playwright install chromium`, then `node tests/run.mjs`. If Playwright lives somewhere else, point to its folder with `PLAYWRIGHT_DIR=/path/to/folder node tests/run.mjs`.

## Protecting the free allowance and survivor privacy

- Only pages on the same address can call the backend, messages are capped in size, and the server prompt keeps the AI on wildfire claims. This is basic protection, not a guarantee. If you see strange traffic, turn on Cloudflare's free rate limiting rule for `/api/chat`.
- Nothing a person types is stored by us. The server writes only a short error label to its logs, never message text. Checklists, letters and the contact log are saved in the person's own browser.
- Workers AI runs Meta's Llama models on Cloudflare. Read Cloudflare's current Workers AI data terms before sharing the link widely, since this is survivor data. I have not verified how they treat prompts.
- The page tells people not to type Social Security or bank numbers. Nothing blocks them from doing it, so keep that warning.
- `robots.txt` and a header ask search engines not to list the site while it is a prototype.

## Changing things

- **Facts and source links:** `public/sources.json` (the server and the page both read this one file, so the website and the AI never disagree). Stage steps, asks and the glossary are in `public/content.js`; screen wording is in `public/app.js`. There is no build step.
- **How a reply is sent:** answers on the Ask a question page stream, so words appear as the model writes them. The server holds back the `ACTION:` line and any source number that is half-written or not allowed, so what appears on screen has already passed the checks; the last message replaces it with the final answer, source links and button. Letters and message explanations still arrive all at once.
- **Which source notes the model sees:** on the free model, each chat question sends only the notes that match the last two things the person typed (the topic list is `TOPICS` in `lib/core.js`), roughly a third to a half less text. Anything vague, not in English, or too broad sends all 15 notes, and note [2] (the state hotline) is always included. If a question gets a worse answer than before, the usual cause is a missing keyword in `TOPICS`. The AI is told when it only has some notes, and a source number for a note it was not shown is removed.
- **Use Claude instead of the free model (optional, costs money):** in Cloudflare add a secret named `ANTHROPIC_API_KEY`, and set a spending limit in the Anthropic Console first. The backend then uses it automatically (model name in `ANTHROPIC_MODEL`, default `claude-haiku-5-5`). On this path all notes are sent, and the fixed part of the prompt is marked for Anthropic prompt caching (it is ignored by the API if the prompt is under that model's minimum cacheable length). Remove the secret to go back to free.
- **Use a smaller free model:** add a variable `AI_MODEL` with `@cf/meta/llama-3.1-8b-instruct-fp8-fast`. About 6 times more replies a day, but weaker answers and letters. Compare both on the same questions before choosing.
- **GitHub Pages is not an option** for this version: it can host the page but not the backend, so there would be no live chat or letter rewriting.

## Known limits

- The free AI model can still be wrong. The server removes source numbers that do not exist, but it cannot prove every sentence matches its source. Keep the "not legal advice" wording.
- Source notes were last updated Nov 7, 2026. A few people who help survivors have reviewed the prototype and given feedback. The facts in the source notes have not had a formal expert check yet; see the open fact checks in `docs/FEEDBACK_MAP.md`.
- Phone numbers for help shows real public lines. Next Step has no staff and the page says so. 911 and 988 are shown but are not yet in `sources.json`.
- The letter format and wording have not had legal review (see `docs/DESIGN.md`).
- Mobile homes and condos are not checked.

## Pages

- `/` is the landing page (`public/index.html`, `landing.css`).
- `/app/` is the guide (`public/app/index.html`, `app.css`, `app.js`, `content.js`). Screens are addresses after `#`: `#/start`, `#/what`, `#/ask/low`, `#/notes/low`, `#/letter`, `#/stages`, `#/stage/s2`, `#/claim`, `#/question`, `#/help`, `#/breathe`, `#/words`. `/app/?lang=es` and `?lang=zh` open it in Spanish or Chinese (unreviewed drafts).
- `public/base.css` holds the shared colours and type; `public/theme.js` applies the saved theme before the page paints.
- Fonts are bundled in `public/fonts` (EB Garamond for headings and the letter, Outfit for everything else). No outside requests.
- Letters, the call log, checklist ticks and key dates are saved in the person's browser only, under the key `next-step-v5`. Data saved by the previous version (`next-step-v4`) is carried over on first load.
- Press Ctrl+Shift+L in the guide to show the session log for user testing.

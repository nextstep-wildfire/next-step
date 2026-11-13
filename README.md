# Next Step (v3)

A free guide for California wildfire survivors dealing with a home insurance claim. Student prototype with The After Collective. Not legal or insurance advice.

- `public/` is the website (plain HTML, CSS and JavaScript, no build step).
- `functions/api/chat.js` and `lib/core.js` are the small backend. It answers typed questions, writes letters and explains insurer messages. All prompts live on the server, and every rule, number and phone number must come from `public/sources.json`.
- `dev/dev-server.js` runs everything on your laptop with a pretend AI, so you can test with no account.
- `tests/run.mjs` is the automated browser test (34 checks).
- `docs/FEEDBACK_MAP.md` shows which interview feedback went into this version and what is still open.

## Cost: $0

| Piece | Where it runs | Free allowance |
|---|---|---|
| Website files | Cloudflare Pages | Unlimited requests and bandwidth, 500 builds a month |
| Chat backend | Pages Functions | 100,000 requests a day |
| AI | Workers AI | 10,000 "Neurons" a day, no card needed, resets at midnight UTC (4 PM Pacific in winter) |

The website address is `https://<project-name>.pages.dev`. A custom domain such as `nextstep.org` costs money. Ask The After Collective whether they can give you a subdomain, and ask them before using any branded address.

**What 10,000 Neurons means:** roughly 100 live AI replies a day with the default 70B model, or roughly 600 a day if you switch to the smaller 8B model (see below). These are estimates from Cloudflare's price list. Check the real number in the Cloudflare dashboard under Workers AI after your first day of use.

**When the free allowance runs out**, nothing breaks. The site tells the person live answers are paused, then keeps working with the guided steps, checklist, phone numbers and a standard letter template. It tries the AI again after 30 minutes.

## Deploy in about 15 minutes

You need a free GitHub account and a free Cloudflare account. No credit card.

1. **Put the folder on GitHub.** Create a new repository (private is fine), then upload everything in this folder. The web page "Add file, Upload files" works. Do not upload `node_modules`.
2. **Create the site.** In Cloudflare, open Workers & Pages, then Create, then the Pages tab, then Connect to Git. Pick the repository.
3. **Build settings.** Framework preset: None. Build command: leave empty. Build output directory: `public`. Save and deploy.
4. **Turn on the AI.** Open the new project, go to Settings, then Bindings (or Functions, then Bindings), then Add, then Workers AI. Variable name must be exactly `AI`. Add it for Production (and Preview if you want). Then go to Deployments and Retry the latest deployment so it picks up the binding.
5. **Test it.** Open your `.pages.dev` address. Tap "They went quiet", fill the form, and write the letter. If the page says live answers are unavailable, step 4 was missed.

The `wrangler.toml` file also declares the AI binding. If Cloudflare reads it, step 4 is already done. If the dashboard shows the binding as locked or missing, use step 4.

After that, every change you push to GitHub deploys automatically in about a minute.

## Test it on your laptop first (optional)

Needs Node 20 or newer.

```
cd next-step
node dev/dev-server.js 8788      # open http://localhost:8788
```

The AI here is a pretend one, so replies are fixed text. Set `MOCK=quota` or `MOCK=off` before the command to see what people see when the free limit is reached or the AI is off.

The automated test needs Playwright installed: `npm i -D playwright`, then `npx playwright install chromium`, then `node tests/run.mjs`.

## Protecting the free allowance and survivor privacy

- Only pages on the same address can call the backend, messages are capped in size, and the server prompt keeps the AI on wildfire claims. This is basic protection, not a guarantee. If you see strange traffic, turn on Cloudflare's free rate limiting rule for `/api/chat`.
- Nothing a person types is stored by us. The server writes only a short error label to its logs, never message text. Checklists, letters and the contact log are saved in the person's own browser.
- Workers AI runs Meta's Llama models on Cloudflare. Read Cloudflare's current Workers AI data terms before sharing the link widely, since this is survivor data. I have not verified how they treat prompts.
- The page tells people not to type Social Security or bank numbers. Nothing blocks them from doing it, so keep that warning.
- `robots.txt` and a header ask search engines not to list the site while it is a prototype.

## Changing things

- **Facts and source links:** `public/sources.json` (the server reads the same file, so the website and the AI never disagree). Rebuild the front end only if you change stages or text in `app.js`.
- **Use Claude instead of the free model (optional, costs money):** in Cloudflare add a secret named `ANTHROPIC_API_KEY`, and set a spending limit in the Anthropic Console first. The backend then uses it automatically (model name in `ANTHROPIC_MODEL`, default `claude-haiku-5-5`). Remove the secret to go back to free.
- **Use a smaller free model:** add a variable `AI_MODEL` with `@cf/meta/llama-3.1-8b-instruct-fp8-fast`. About 6 times more replies a day, but weaker answers and letters. Compare both on the same questions before choosing.
- **GitHub Pages is not an option** for this version: it can host the page but not the backend, so there would be no live chat or letter rewriting.

## Known limits

- The free AI model can still be wrong. The server removes source numbers that do not exist, but it cannot prove every sentence matches its source. Keep the "not legal advice" wording.
- Source notes were last updated Nov 7, 2026 and have not been reviewed by an insurance professional.
- Talk to a person shows real public phone numbers. A helper who follows up with the person is not built, and the page says so.
- Mobile homes and condos are not checked.

# Real model output on the desk/phase-2 and desk/phase-3 previews

Preview: https://desk-phase-2.next-step-2fg.pages.dev (Cloudflare Workers AI, Llama 3.3 70B, the same free model the live site uses).
Each run is 24 fixed situations from `dev/real-run.mjs`: 8 letters (including Phillipa's $96,000 estimate and $42,300 offer, a renter, a smoke denial, no notes, a worry that must not become a fact, and two follow-up emails from call and visit logs), 4 chat edits, 3 pasted insurer messages with their reply letters, 5 call and visit sheets, and 4 chat messages. Every output was read by a person (Claude), not only by the script.

Runs 6 and 7 are on https://desk-phase-3.next-step-2fg.pages.dev and add 21 Spanish situations (a Spanish speaker's notes, edits, messages, sheets and chats), 45 in all. In Spanish the letter is English with a checked Spanish copy; see docs/DESIGN.md.

## What was wrong, and what fixed it
| Found in | Problem | Fix (lib/core.js unless noted) | Held in |
|---|---|---|---|
| run 1 | Subjects vague ("Rebuilding Offer for Claim") | Subject set from the ask the person picked, plus their claim number | runs 2 to 5 |
| run 1 | "Make it shorter" reworded the ask, dropping "line by line" and "in writing" | Edit prompt gets the exact ask; retry; then the ask is put back word for word | runs 2 to 5 |
| run 1 | Explanations said "the person" | Prompt speaks to "you"; code rewrites any "the person is" to "you are" | runs 2 to 5 |
| run 1 | A message that already listed the documents got a reply asking them to list documents | New ask "confirm nothing else is needed", chosen when the message lists what they need | runs 3 to 5 |
| runs 1, 2 | Added words: "recently", "which seems lower", "significantly different", "I am concerned", a second request in the facts | Removed after the fact; facts in the same sentence kept | runs 3 to 5 |
| runs 1, 2 | Sheets: comma splices, "around $96,000", invented follow-up questions | Sheet prompt rules, plus the same clean-up, plus points that only echo the ask are dropped | runs 3 to 5 |
| run 3 | Explanation did its own arithmetic ($42,300 minus $2,500 = $39,800) | Any sentence with a number the message did not give is dropped | runs 4, 5 |
| run 3 | My clean-up removed an ask the model wrote as "I would like you to confirm…" | The ask is checked after clean-up and put back if missing | runs 4, 5 |
| run 3 | An edit that only added a photo date also dropped the denial date and reason | Edits must keep every number; one strict retry; otherwise the letter is left as it was and the Desk says so | run 4 (refused honestly) |
| run 3 | An edit giving a claim number left it out | The claim number goes on the subject | runs 4, 5 |
| preview check | Model picked "other" for a plain offer message | Offer plus an amount means "offered less"; denied or excluded means "said no" | run 5 |

## What still is not perfect
- "What to say first" on call sheets is sometimes stiff and does not always repeat the ask; the ask is still shown in bold right under it.
- The model sometimes leaves out one note (for example asthma on a visit sheet); the sourced checklist line covers that case.
- Run 5, L1: "Your offer of $42,300 is lower than the estimated cost": true from her own numbers, but a comparison she did not write. Not caught by the clean-up.
- Run 5, R3: an edit adding a photo date kept every date and amount but dropped the denial reason ("no direct physical loss") and the smoke smell. The fact check covers numbers only; words-level facts are the next thing to guard, or a stronger model.
- An edit that adds a fact to a long letter can still be refused as "would lose details". That is the honest outcome, not a wrong letter.
| run 6 | "However," added to letters (English and Spanish notes) | Contrast words the notes did not give are dropped, the fact kept | run 7 |
| run 6 | Ask said twice: "You should explain your decision…" | A sentence that restates the ask or tells the insurer what it should do is dropped | run 7 |
| run 6 | A question in the notes kept as a second request ("I was wondering if my policy covers a hotel") | Questions in the facts are dropped | run 7 |
| run 6 | "I have some concerns about the amount" added to what to say on a call | "concerns" (and "preocupaciones") count as an added worry | run 7 |
| run 6 | The script counted the source number [10] as a number | The script ignores source numbers | run 7 |
| run 7 | An edit turned "three times" into "multiple" | Number words are facts an edit must keep; otherwise refused honestly | tests (next run) |


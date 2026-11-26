# Feedback to change map (Next Step)

Source: the interview notes through Nov 12, 2026, the teammate's Bet 3 prototype feedback doc, and the four held Bet 3 sessions (closed Nov 25). "Built" means built and covered by an automated test in `tests/run.mjs`. Interviewee statements are their own accounts and are not verified. Names are left out. Quote permissions and participant restrictions are tracked in the team's private interview notes, not here.

## Built in Desk phase 3 (Nov 26)

| What people said | Who | Change |
|---|---|---|
| Spanish for the Eaton Fire area | Recovery group director | Every screen, the chat, explanations, sheets and the landing page in Spanish (browser language, `?lang=es`, or the "Español" link). Letters to the insurer stay in English with a checked Spanish copy under them, so the person knows what they send. Marked as an unreviewed draft. |
| Letter format may matter legally | Attorney tester | Still one English format for every letter, Spanish speakers included, so legal review covers one format. Not settled; flagged. |
| AI letters need human proofreading; check dates and names | Trial lawyer and GIS professor testers | The Spanish copy lets a Spanish speaker check the facts of the English letter; any line that could not be translated safely is shown in English and says so. The "check every date, number and name" line stays, in both languages. |
| Phone-friendly layout | Survivor (2017 fire) | Phone polish from five timed stranger passes (one at 375 px in Spanish): long questions with choices scroll to their first line, buttons never wrap, shorter Spanish footer. |
| Calming, not clinical stress support | Teammate review | The one-time care card also opens on Spanish words for being overwhelmed. |
| (Vision) Copy and Download PDF on every paper | Project direction | A real PDF made on the device for the letter, the reply, the call sheet and the visit sheet (sheets with log and sources). |
| (Vision) Dark mode behind a toggle, light first | Project direction | Toggle in the Desk sidebar and the landing header; every text pair measured AA in both themes. |

## Built in the Nov 25 redesign (Bet 3 feedback)

| What people said | Who | Change |
|---|---|---|
| Bigger disclaimer, say the information comes from public sources and is only there to help (top priority) | Teammate review | Landing page shows a full-size bordered notice in the first screen: general information, not legal or insurance advice, drawn from public sources such as CDI, can be wrong, your policy counts. The letter screen repeats it as "a draft, not legal advice". The guide's footer carries it on every screen. |
| Make it obvious this is for insurance claims; stronger hook | Teammate review | Landing opens with "For California wildfire insurance claims" and "When your insurer says no, offers less, or goes quiet." Text and Start show on first paint, no fade-in. |
| Demo video had rough corners and native controls | Teammate review | Video removed. No video on the landing page. |
| Ask homeowner, renter or not sure before what the insurer did | Teammate review | Step 1 of 4. Nothing pre-selected; tapping a choice moves on. |
| Pushed back on picking only one ask; wanted to see all options; unsure what the buttons meant | Three Bet 3 testers (attorney, trial lawyer, NZ claimant) | Still one ask per letter (the core verb), but every option now shows a "Pick this if…" note, the screen says you can write another letter for a different ask, and "Write another letter" keeps your notes. "Something else" takes your own words. |
| Move the ask up, notes box second | Teammate review | Ask is step 3, notes step 4. |
| A box for extra information; add the second estimate's amount | GIS professor tester, NZ claimant tester | Visible "Numbers, dates or names to include" box on the notes step, sent to the letter writer as details. |
| Copy box so it is easy to paste into email | Teammate review | Large Copy letter button with an on-screen "Copied. Paste it into an email…" confirmation. |
| After "log my letter", show where it went | Teammate review | "I sent it. Add it to my record" shows "Added to your record" and an "Open My claim" link. Header shows My claim with a count. |
| Felt "through, and waiting" with no next step; reminders to log calls and keep receipts | Trial lawyer tester | "What happens next" on the letter screen: four numbered steps (send by email, log every call, the 15 days is your request not a legal deadline, then CDI hotline or complaint). |
| Stages as a numbered column in order | Teammate review | Stages page is one numbered column (1 to 7 for owners, 1 to 5 for renters), with "Also" for smoke and the three trouble cases. |
| Make the checklist obviously a checklist and say it saves | Teammate review | "Your checklist" box with "n of m done" and "Saved on this device"; progress shows on the stage list and in My claim. |
| Breathing exercise: calming colour, an aura | Teammate review, student tester B (dot bug) | One-minute breathing page: a soft green glow that grows and settles. No moving dot. |
| Expected "Talk to a Person" to be a live human | Trial lawyer and GIS professor testers | Removed. "Phone numbers for help" says Next Step is a guide, no one here will call back, these are public lines. Typing "talk to a person" gets the same honest answer and the CDI number. |
| Generic chatbot feel | Project direction | Chat thread, chat sidebar, chips and message box removed. Live sourced answers stay on an "Ask a question" page (one question, one answer). |

## Held from Bet 3 (deferred on purpose)

| Feedback | Who | Why held |
|---|---|---|
| Short intro or expert videos | Attorney and GIS professor testers | Deferred for the final. Needs recording and a reason to exist that the text does not cover. |
| Step-by-step guide for every state; ask location and insurer first | Attorney and GIS professor testers | Content is California only and checked against CDI sources. Other states need their own sources. |
| Work offline for evacuees | GIS professor tester | Deferred. Would need a service worker and a decision on what may be cached. |
| Policy-reading step, contractor engagement template, claim deadline warnings | NZ claimant tester | Needs source-backed content; her claims were in New Zealand. |
| Letter format may matter legally (notice formats) | Attorney tester | Not settled. Flagged in `docs/DESIGN.md` for legal review. |
| AI letters need human proofreading; check dates and names | Trial lawyer and GIS professor testers | The letter screen says to check every date, number and name. No human review step exists. |

## Removed in the redesign
- Separate chats per person and the chat list (letters now live in one My claim list; "Writing for someone else?" on step 1 covers helpers).
- The scripted chat replies, stress and frustration detection inside a chat, and "Report a problem". The breathing page and help numbers are one tap away in the menu.
- The demo video and its recording script.

## Built in v3 (some since reworked, see above)

| What people said | Who | Change |
|---|---|---|
| More freedom to talk to the product, make it interactive, keep questions simple | Student tester A, Student tester B, project direction | Typing anywhere gets a live answer grounded in the source notes, with citation numbers. The reply may add one button (write a letter, show steps, official help). Scripted replies take over if the AI is unavailable. |
| Add "I am having trouble with my claim" and cover the denied, underpaid and silent-adjuster cases up front | Recovery group director, Insurance agent, Student tester A | Home screen opens with three plain choices: they said no, they offered less, they went quiet. |
| The reply helper was not found without a hint | Survivor (2017 fire), Student tester A, Student tester B | The letter helper is now a main path from the home screen, the menu, and the AI's suggestions. |
| Have the tool reword my notes in professional language | Survivor (2017 fire) | The letter is written in professional wording from the person's notes, not pasted in quotation marks. Editable, with "Make it shorter". Falls back to a template that uses their words when the AI is off, and says so. |
| One clear ask | Student tester A, Survivor (2017 fire) | The person picks exactly one ask for each situation, or writes their own. |
| Upload the insurer's latest response and get help replying | Recovery group director | Paste the insurer's message (optional). It is used in the letter, and "Explain their message in plain words" lists questions to ask in writing. File upload is not built. |
| Insurer-specific forms and questionnaires | Student tester A | Not verified, so the tool says so plainly and offers a letter asking that insurer for its required documents and forms. No insurer-specific content was invented. |
| Cut "talk to a person" down to short yes or no choices | Student tester A | Yes or not now, then three kinds of help, then real numbers: California Department of Insurance, FEMA, 911 and 988, with tap-to-call. "Request a call" was removed because it did nothing. |
| Offer a person at the right time, say it is happy to keep going | Recovery group director | Kept from v2 (frustration and stress detection) and added to the AI rules. |
| Where to go for government help, FEMA, tip lines | Student tester A | "Government help" and "I need a place to stay" cards, with sources. |
| Flag displacement, ask whether they have somewhere to stay | Claim adjuster | "I need a place to stay" is on the home screen. It does not yet ask proactively. |
| Section on the adjuster's in-person visit | Survivor (2017 fire) | New stage "An adjuster is coming to see my home". General guidance, marked as not checked against official sources. |
| Plain words for deductible, actual cash value versus replacement cost | Claim adjuster, Insurance agent | "Explain insurance words" card. |
| Shareable claim summary, files per stage | Survivor (2017 fire) | "My claim" drawer holds letters, the contact log and key dates, with a copy-summary button. Stored on the device only. Per-stage notes are not built. |
| Phone-friendly layout | Survivor (2017 fire) | Checked at 375 px wide: no sideways scroll, form usable. |
| Say who it is for, include renters | Recovery group director | Home screen asks owner, renter or not sure. Renter steps already existed. |
| Hosted on a real website | Project direction | Standalone site, free hosting, see README. |

## Not built yet (decide next)

| Feedback | Who | Why held |
|---|---|---|
| Upload the policy or declarations page for a plain-language summary | Insurance professional, Insurance agent | Both warn about legal risk and privacy. Needs a design decision first. |
| More detail for standing homes: separate approvals for testing, remediation and belongings, examples of living-expense items (mileage, utilities), conditional transitions between stages | Survivor (standing home) | Needs source-backed content. Her accounts are not verified. |
| Photo-based inventory | Survivor (standing home), Student tester B | Large feature. |
| Multiple chats, pinning, photo upload to check if damage is worth claiming | Student tester B | Not requested by others. |
| Warmer tone and "what support can you provide" | Student tester B | Not tested. |
| Insurer-verified checklist | Student tester A | Conflicts with the Nov 9 decision not to ask insurers to try the prototype. Needs a team decision. |
| Contractor quote check, do not pay everything up front, get repairs approved first, preferred-vendor warnings | Claim adjuster, Public adjuster | Needs source-backed content. |
| Warnings about helpers who claim to be from the city or state | Insurance agent | Needs source-backed content. |
| Better sources for standing homes (standinghomes.org, NIST) | Survivor (open claim) | Not reviewed. Interview notes restrict direct quotes. |
| Student tester B bugs: breathing dot, "restart" misread, "last stage" message | Student tester B | Not reproduced or fixed. |

## Open fact checks

- "Living expenses last at least 24 months" (source note 1): An insurance agent was sure of one renewal period, not two. The note says at least 24 months after a state of emergency, plus extensions. Check against the Department of Insurance before launch.
- A few people who help survivors have given informal feedback on the prototype, but the stages, dates and letters have not had a formal expert check.

# Feedback to change map (Next Step v3)

Source: the interview notes through Nov 12, 2026. "In v3" means built and covered by an automated test. Interviewee statements are their own accounts and are not verified. Names are left out. Quote permissions and participant restrictions are tracked in the team's private interview notes, not here.

## Built in v3

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
| Spanish for the Eaton Fire area | Recovery group director | Spanish already exists in the tool. No other languages were requested. |

## Open fact checks

- "Living expenses last at least 24 months" (source note 1): An insurance agent was sure of one renewal period, not two. The note says at least 24 months after a state of emergency, plus extensions. Check against the Department of Insurance before launch.
- A few people who help survivors have given informal feedback on the prototype, but the stages, dates and letters have not had a formal expert check.

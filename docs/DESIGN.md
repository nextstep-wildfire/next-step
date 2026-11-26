# Design decisions (Nov 26, 2026: the Desk, phases 1 and 2)

Source of every choice: `.claude/skills/website-implementation/references/vision.md` in the workspace. This file records how the vision was built and the numbers behind it.

## The shape: the Desk
- **Chat on the left, the person's paper on the right.** The paper is hidden until there is one; until then the chat sits centered with one question: "What's happening with your insurer?"
- **The live chat is the product.** It is never cut to one question and one answer. Every step can be tapped (choices are outlined, the chosen answer becomes the person's message and the choices fold away), and the box to type or paste is always there.
- **One paper per exchange.** Letter, or their message explained plus the reply. Serif on the paper only, so the serif means "this is your document".
- **Two ways to edit.** Type on the sheet, or tell the chat ("make it shorter", "my claim number is 12345"). Clear edit requests go straight to a rewrite; anything else goes to the chat, which can also ask for an edit. Changed lines are tinted with the highlight and fade back.
- **Phone.** The chat fills the screen. The paper is a pinned card at the top that opens full screen with Close, Copy and Save as PDF.
- **The honest pause.** If the AI is down or out of quota, the chat says so in one plain message, shows the public phone lines and suggests trying again in about 30 minutes. No made-up reply. In the letter flow it also offers a basic letter built from the person's choices, labelled as not written by the assistant.
- **Room for later phases.** Spanish, dark mode and a real PDF slot into the same paper (`renderPaper`), the sidebar list, and the `T` string table in `public/desk.js`.

## Phase 2: the other exchanges and the front door
- **Call and visit sheets are the same paper as the letter**, set as a checklist: serif text, section labels as a dot and a word, small hollow squares as list marks so it reads as something to tick off. "A call or visit is coming up" asks which one, then the call path asks what it is about, own or rent, one ask (the same checked asks as letters, with "Pick this if"), and a few words. The visit path asks whether the home is standing or destroyed instead of an ask. Each step can be tapped; typing works throughout.
- **What the model writes, and what it does not.** The checklists are fixed text in `public/content.js` (`SHEETS`), each line tied to a source in `public/sources.json` or marked general guidance. The model only writes "what to say first" and turns the person's own notes into points, labelled "from your notes". So the guidance can never drift, and the person's details still land on the sheet.
- **Sources on the sheet** are small numbers after each line, listed with links at the end of the sheet (the printed sheet keeps them). Unsourced lines say "general guidance" in place of a number.
- **The log** is part of the sheet: date, time, who, phone, what they said, what happens next (and for a visit, what they looked at). It saves as you type, on the device. "Save to Record" is the one solid button on a sheet, so Copy becomes a ghost there.
- **Follow-up email.** United Policyholders and CDI both say to confirm a call or visit in writing. "Write the follow-up email" turns the log into a letter whose one ask is to confirm the summary, using the same letter path and rules.
- **Record** (sidebar, first link): every letter copied or saved as PDF, every saved call or visit log, and anything added by hand, newest first, with date, who and a summary. "Copy as a summary" gives plain text. Device only, said plainly.
- **The care card** appears once per device when someone says it is too much, whether or not the model notices: one plain line, a minute of breathing right in the card, and the CDI and 988 lines (988 is now sourced). The next step waits for "Keep going". It is the one boxed thing in the chat, because it is the one thing that should stand apart.
- **United Policyholders** is a handoff on the Phone lines page (its Ask an Expert board; it lists no helpline number, so none is shown). **The After Collective** is in `sources.json` as `pending` and is never sent to the model or shown until TAC approves the link and wording and the url is filled in.
- **Landing page.** Headline: "Every word to your insurer counts. Get each one right." One solid button (Start) and one ghost (Watch it work). The demo is the Desk in real HTML and CSS playing one scripted letter exchange (Phillipa's numbers) once when it scrolls into view, then resting; reduced motion shows the finished state. The chat stays centered until the letter arrives, as in the app. The four exchanges are plain rows on hairlines, each linking straight into that exchange (`/app/#/start/letter|msg|call|visit`). One deep ink band holds the public lines set large and light and the honesty line. No feature cards, no photos.
- **The illustration.** Three ideas were drawn (docs/illustration/three-ideas.png): A, a new house frame going up with a mailbox, flag raised, a staked young tree and a path to the door; B, stepping stones to a small house on the horizon; C, a sheet, a pen and a phone. A was picked: it holds both halves of the product (a letter went out; the house is coming back) without any fire, and it is specific where B is generic and C only restates the UI. Single 1.5px ink line, no fill, drawn in `public/index.html`.
- **The illustration plays once (Nov 26, later).** It is now a short drawing of someone rebuilding, about 7 seconds, played once when it scrolls into view, then resting on the finished drawing. The order: the frame draws itself in with its left corner post missing; a person walks up with a letter, posts it and lifts the mailbox flag; walks behind the mailbox to the left side of the house (clear of the studs) and knocks the leaning corner post plumb in three strikes; two front steps set at the door (their outline is the stair line of the logo); the staked young tree grows in. No fire, no bird. Under reduced motion, and in the test, the page shows the final frame at once.
  - **How it is built.** `public/rebuild.js`, plain JavaScript, no library. The drawing's lines are the SVG paths in `public/index.html`, each with its own draw-in time (`pathLength` and a dash), so the static file is already the finished drawing. The person is a small rig drawn in the same 1.5px ink line: a round head, a plain coat-shaped body, single soft strokes for arms and legs, short feet. Nothing on the figure says age, gender or race, and there is no face.
  - **Why it moves well.** Feet are planted at fixed places on the ground and the legs are solved from hip to ankle, so the feet never slide; the hip rides between them with a small bob, arms swing against the legs, and the body leans a little into the walk and slows into each stop (the contact, down, passing, up rhythm of a classic walk). Each strike has a raise with the weight going back, a fast accelerating swing in about a tenth of a second, a dip on contact where the head rides the post over, a small recoil, then the next raise; the post moves only on the hit. The flag is lifted by hand and settles with one small wobble.
  - **Depth, so it never looks cluttered.** The head and body are filled with the paper colour, so lines behind them disappear the way they would in an ink drawing. The person walks behind the mailbox (head above it, legs below), the flag is on the far side of the box, the letter vanishes into the slot, and the near arm is drawn over the body and the far arm behind it.
  - **Changes to the still drawing that came with it.** The mailbox is smaller and lower (it was taller than a person), its flag moved to the front of the box on the far side, the drawing is cropped tighter (`viewBox="16 88 448 214"`) so the person reads at 375px, and the path to the door now starts at the steps. The person stays in the final frame, hammer in hand, as the one human detail.
  - **Reviewed** at 1440 and 375 by recording the real playback and reading it frame by frame three times; fixed on the way: a hammer that read as a crossbar at the knee, the letter crossing the face, a figure that merged with the mailbox, a flag that looked like a square on the box, strikes that stopped short of the post, and a cluttered resting pose.
  - **With no script**, the page shows the finished drawing without the person.

## Grounding the real model (phase 2)
Real output on the preview showed the free model (Llama 3.3 70B on Workers AI) ignores some prompt rules, so the rules that matter are also enforced in code (`lib/core.js`):
- **Subjects** come from the ask the person picked (`ASK_SUBJECT`), plus a claim number they gave.
- **Invented numbers**: any amount, date or count not in what the person gave becomes "[check this number]" in letters; on sheets the point is dropped.
- **Added words**: "recently", opinions about the amount ("which seems lower", "significantly different"), worries ("I am concerned") and second requests in the facts are removed; facts in the same sentence are kept.
- **Edits keep the ask word for word**: the edit prompt is given the exact sentence; if the model still rewords it, one retry, then the sentence is put back.
- **Explanations speak to you** ("you are asked to sign"), never "the person".
- A message that already lists what they need gets the "confirm nothing else is needed" ask, not "list what you need".

## Materials
One ink, one paper, one highlight. Every other colour is the ink at a fixed strength, stored as a solid value so contrast is exact. Tokens live once in `public/base.css`.

| Token | Value | Use |
|---|---|---|
| ink | #1F1B17 | text, the one solid button, the sidebar |
| paper | #F4F1EA | the page |
| desk | #EBE7DE | the surface the sheet rests on |
| sheet | #FFFFFF | the person's document |
| highlight | #FCEFC2 | a line that just changed, blanks to fill in |
| ink-2 | #5A534B | secondary text |
| ink-3 | #6E665D | quiet labels, source lines |
| edge | #8C8478 | outlines of fields and ghost buttons |

Measured contrast (WCAG ratio; AA needs 4.5 for text, 3 for outlines). The test suite also scans every visible piece of text on the opening and letter screens against what is behind it.

| Pair | Ratio |
|---|---|
| ink on paper | 15.2 |
| ink on sheet | 17.1 |
| ink on the person's bubble | 13.5 |
| ink on highlight | 14.9 |
| ink-2 on paper | 6.7 |
| ink-3 on paper | 5.0 |
| ink-3 on desk | 4.6 |
| paper on ink (button, sidebar) | 15.2 |
| quiet sidebar text on ink | 8.1 |
| outline on paper | 3.3 |
| outline on sheet | 3.7 |

Dark tokens exist behind `data-theme="dark"` (same system flipped: ink on paper 14.8, ink-2 8.8, ink-3 6.5) but light always loads first and there is no toggle in the Desk yet (phase 3).

## Type
- **Instrument Sans** (variable, bundled) for everything you read and tap. Headlines at 400 with -3.5% tracking. Hierarchy comes from size.
- **Source Serif 4** (variable, bundled, with italic) only on the paper.
- EB Garamond and Outfit are removed. Body is 17px on desktop and 18px on phones; nothing is under 15px (checked by the tests).
- Both fonts come from the Fontsource packages (SIL Open Font License), Latin subset, served from `/fonts`.

## Shape and motion
- Corners 4px everywhere, 2px on the sheet. Buttons and choices are near-square.
- One solid button per screen (the send arrow, or Start on the breathing page). Everything else is a thin-outline ghost.
- Section labels are a 5px dot and a word.
- The letter's lines ease in one after another as it arrives; a chat edit tints the changed lines and fades. A thin caret shows while a reply streams. All motion stops under reduced motion.

## Grounding
- Prompts live on the server (`lib/core.js`). Chat replies stream; only the source notes that match the question are sent on the free model.
- Source numbers become one quiet "Source:" line naming the source, linked to it.
- Phone numbers: the Phone lines page and the pause list only show a number if it appears in that source's notes. Any phone number the model writes that is not in `public/sources.json` is removed on the server before the person sees it.
- Pasted insurer messages are sent to the AI to read and never saved on the device; after a reload they show as "not saved on this device".

## Flagged, not settled
- **Letter format and legal wording** (15 calendar days, one-ask structure). Legal review before real use.
- **988** is now sourced (SAMHSA, source 25) and shown on the care card, the Phone lines page and the landing band. **911** is still not in `sources.json`; it appears only as one plain line on the Phone lines page ("If someone is in danger right now, call 911") and in the chat rules.
- **"Pick this if" notes** are general guidance, not sourced rules.
- **The After Collective's recovery coach**: entry 24 in `sources.json`, marked pending. Needs TAC's OK, the link and the wording.
- **General guidance on the sheets, no source found** (for review): "Have your claim number and something to write with" (call); "A list of the damage, room by room, so nothing is missed" and "Bills for any emergency repairs you have already paid for" (visit). Also the spoken "What to say first" pattern, which is our wording.
- **Adapted, check the reading**: "If they ask for a recorded statement, you can wait until you understand your rights" (UP general tips says not to give one until you understand your rights); "For a serious loss, one look by their adjuster is rarely enough" (UP partial loss page); the photograph list for a standing home uses UP's list of what a thorough inspection covers.
- **Renter asks** on "They offered less" are still written for homeowners.

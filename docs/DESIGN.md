# Design decisions (Nov 26, 2026: the Desk)

Source of every choice: `.claude/skills/website-implementation/references/vision.md` in the workspace. This file records how the vision was built and the numbers behind it.

## The shape: the Desk
- **Chat on the left, the person's paper on the right.** The paper is hidden until there is one; until then the chat sits centered with one question: "What's happening with your insurer?"
- **The live chat is the product.** It is never cut to one question and one answer. Every step can be tapped (choices are outlined, the chosen answer becomes the person's message and the choices fold away), and the box to type or paste is always there.
- **One paper per exchange.** Letter, or their message explained plus the reply. Serif on the paper only, so the serif means "this is your document".
- **Two ways to edit.** Type on the sheet, or tell the chat ("make it shorter", "my claim number is 12345"). Clear edit requests go straight to a rewrite; anything else goes to the chat, which can also ask for an edit. Changed lines are tinted with the highlight and fade back.
- **Phone.** The chat fills the screen. The paper is a pinned card at the top that opens full screen with Close, Copy and Save as PDF.
- **The honest pause.** If the AI is down or out of quota, the chat says so in one plain message, shows the public phone lines and suggests trying again in about 30 minutes. No made-up reply. In the letter flow it also offers a basic letter built from the person's choices, labelled as not written by the assistant.
- **Room for later phases.** Call and visit sheets, Record, Spanish, dark mode and a real PDF slot into the same paper (`renderPaper`), the sidebar list, and the `T` string table in `public/desk.js`. "A call or visit is coming up" currently goes to the live chat.

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
- **911 and 988** are in the chat rules for someone in crisis but are not in `public/sources.json`, so the UI never shows them. Add a cited entry or confirm they may stay as universal lines.
- **"Pick this if" notes** are general guidance, not sourced rules.
- **United Policyholders and The After Collective's recovery coach** are not in the phone lines yet: they need entries in `sources.json`, and TAC's OK.
- **Renter asks** on "They offered less" are still written for homeowners.

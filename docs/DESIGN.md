# Design decisions (Nov 26, 2026: the Desk, phases 1, 2 and 3)

Source of every choice: `.claude/skills/website-implementation/references/vision.md` in the workspace. This file records how the vision was built and the numbers behind it.

## The shape: the Desk
- **Chat on the left, the person's paper on the right.** The paper is hidden until there is one; until then the chat sits centered with one question: "What's happening with your insurer?"
- **The live chat is the product.** It is never cut to one question and one answer. Every step can be tapped (choices are outlined, the chosen answer becomes the person's message and the choices fold away), and the box to type or paste is always there.
- **One paper per exchange.** Letter, or their message explained plus the reply. Serif on the paper only, so the serif means "this is your document".
- **Two ways to edit.** Type on the sheet, or tell the chat ("make it shorter", "my claim number is 12345"). Clear edit requests go straight to a rewrite; anything else goes to the chat, which can also ask for an edit. Changed lines are tinted with the highlight and fade back.
- **Phone.** The chat fills the screen. The paper is a pinned card at the top that opens full screen with Close, Copy and Download PDF.
- **The honest pause.** If the AI is down or out of quota, the chat says so in one plain message, shows the public phone lines and suggests trying again in about 30 minutes. No made-up reply. In the letter flow it also offers a basic letter built from the person's choices, labelled as not written by the assistant.
- **Room for later phases.** Spanish, dark mode and a real PDF slot into the same paper (`renderPaper`), the sidebar list, and the `T` string table in `public/desk.js`.

## Phase 2: the other exchanges and the front door
- **Call and visit sheets are the same paper as the letter**, set as a checklist: serif text, section headings as small quiet words (no dot), small hollow squares as list marks so it reads as something to tick off. "A call or visit is coming up" asks which one, then the call path asks what it is about, own or rent, one ask (the same checked asks as letters, with "Pick this if"), and a few words. The visit path asks whether the home is standing or destroyed instead of an ask. Each step can be tapped; typing works throughout.
- **What the model writes, and what it does not.** The checklists are fixed text in `public/content.js` (`SHEETS`), each line tied to a source in `public/sources.json` or marked general guidance. The model only writes "what to say first" and turns the person's own notes into points, labelled "from your notes". So the guidance can never drift, and the person's details still land on the sheet.
- **Sources on the sheet** are small numbers after each line, listed with links at the end of the sheet (the printed sheet keeps them). Unsourced lines say "general guidance" in place of a number.
- **The log** is part of the sheet: date, time, who, phone, what they said, what happens next (and for a visit, what they looked at). It saves as you type, on the device. "Save to Record" is the one solid button on a sheet, so Copy becomes a ghost there.
- **Follow-up email.** United Policyholders and CDI both say to confirm a call or visit in writing. "Write the follow-up email" turns the log into a letter whose one ask is to confirm the summary, using the same letter path and rules.
- **Record** (sidebar, first link): every letter copied or saved as PDF, every saved call or visit log, and anything added by hand, newest first, with date, who and a summary. "Copy as a summary" gives plain text. Device only, said plainly.
- **The care card** appears once per device when someone says it is too much, whether or not the model notices: one plain line, a minute of breathing right in the card, and the CDI and 988 lines (988 is now sourced). The next step waits for "Keep going". It is the one boxed thing in the chat, because it is the one thing that should stand apart.
- **United Policyholders** is a handoff on the Phone lines page (its Ask an Expert board; it lists no helpline number, so none is shown). **The After Collective** is in `sources.json` as `pending` and is never sent to the model or shown until TAC approves the link and wording and the url is filled in.
- **Landing page.** Headline: "Every word to your insurer counts. Get each one right." One solid button (Start) and one ghost (Demo; it was "Watch it work" until the intro change below). The demo is the Desk in real HTML and CSS playing one scripted letter exchange (Phillipa's numbers) once when it scrolls into view, then resting; reduced motion shows the finished state. The chat stays centered until the letter arrives, as in the app. The four exchanges are plain rows on hairlines, each linking straight into that exchange (`/app/#/start/letter|msg|call|visit`). One deep ink band holds the public lines set large and light and the honesty line. No feature cards, no photos.
- **The illustration.** Three ideas were drawn (docs/illustration/three-ideas.png): A, a new house frame going up with a mailbox, flag raised, a staked young tree and a path to the door; B, stepping stones to a small house on the horizon; C, a sheet, a pen and a phone. A was picked: it holds both halves of the product (a letter went out; the house is coming back) without any fire, and it is specific where B is generic and C only restates the UI. Single 1.5px ink line, no fill, drawn in `public/index.html`.
- **The illustration plays on a loop (Nov 26, later).** It is now a short drawing of someone rebuilding, about 7 seconds. It starts when it scrolls into view, rests 2 seconds on the finished drawing, fades out in under half a second and draws again. It only loops while it is on screen and the tab is visible; scrolled away it waits on the finished drawing. The order: the frame draws itself in with its left corner post missing; a person walks up with a letter, posts it and lifts the mailbox flag; walks behind the mailbox to the left side of the house (clear of the studs) and knocks the leaning corner post plumb in three strikes; two front steps set at the door (their outline is the stair line of the logo); the staked young tree grows in. No fire, no bird. Under reduced motion, and in the test, the page shows the final frame at once.
  - **How it is built.** `public/rebuild.js`, plain JavaScript, no library. The drawing's lines are the SVG paths in `public/index.html`, each with its own draw-in time (`pathLength` and a dash), so the static file is already the finished drawing. The person is a small rig drawn in the same 1.5px ink line: a round head, a plain coat-shaped body, single soft strokes for arms and legs, short feet. Nothing on the figure says age, gender or race, and there is no face.
  - **Why it moves well.** Feet are planted at fixed places on the ground and the legs are solved from hip to ankle, so the feet never slide; the hip rides between them with a small bob, arms swing against the legs, and the body leans a little into the walk and slows into each stop (the contact, down, passing, up rhythm of a classic walk). Each strike has a raise with the weight going back, a fast accelerating swing in about a tenth of a second, a dip on contact where the head rides the post over, a small recoil, then the next raise; the post moves only on the hit. The flag is lifted by hand and settles with one small wobble.
  - **Depth, so it never looks cluttered.** The head and body are filled with the paper colour, so lines behind them disappear the way they would in an ink drawing. The person walks behind the mailbox (head above it, legs below), the flag is on the far side of the box, the letter vanishes into the slot, and the near arm is drawn over the body and the far arm behind it.
  - **Changes to the still drawing that came with it.** The mailbox is smaller and lower (it was taller than a person), its flag moved to the front of the box on the far side, the drawing is cropped tighter (`viewBox="16 88 448 214"`) so the person reads at 375px, and the path to the door now starts at the steps. The person stays in the final frame, hammer in hand, as the one human detail.
  - **Reviewed** at 1440 and 375 by recording the real playback and reading it frame by frame three times; fixed on the way: a hammer that read as a crossbar at the knee, the letter crossing the face, a figure that merged with the mailbox, a flag that looked like a square on the box, strikes that stopped short of the post, and a cluttered resting pose.
  - **With no script**, the page shows the finished drawing without the person.

## Phase 3: Spanish, dark mode, a real PDF, phone polish

### Which language a Spanish speaker's letters come out in (decided in phase 3)
- **What the insurer reads stays in English**: the letter, the reply to their message, the follow-up email, and what to say first on a call. **Everything that is only for the person is in Spanish**: every screen, the chat, the plain explanation of their message, the call and visit checklists, the Steps, Phone lines and Record pages, and the landing page.
- **Why.** (1) The adjuster and claims team read English, so an English letter is acted on without a translation step that could delay it or change its meaning. (2) Every guard phase 2 put in code (subject from the ask, no invented numbers, no added timing, opinions, worries or second requests, edits keep the ask word for word) is written and tested against English; keeping the sent text in English means all of them still hold, unchanged. (3) The ask sentences are our own checked English; legal review has one format to review, not two.
- **So the person always knows what they send**, a Spanish copy sits under the letter ("Lo que dice su carta, en español"). The subject, greeting, ask, reply-by line and sign-off are our own fixed Spanish (`ASK_ES`, `ASK_SUBJECT_ES` in `public/content.js`, fixed lines in `lib/core.js`); only the person's facts go to the model to translate. Copy and Download PDF give the English letter only.
- **Every Spanish line is checked against its English** (`checkEs` in `lib/core.js`): no number the English does not have (42.300 and 42,300 read as the same), no phone number outside `sources.json`, every [blank] still there (named in Spanish, e.g. [número de reclamo]), no added opinion, timing word or request, and a sane length. A line that fails is not shown wrong: the English paragraph is shown with "no se pudo traducir con seguridad". If the copy cannot be made at all, the letter still arrives and the chat says the copy is not available.
- **Spanish input passes the English guards**: thousands written 42.300, "96 mil", Spanish number words (siete semanas), and claim numbers said in Spanish ("mi número de reclamo es HO-55821") all count as given. Edits can be asked in Spanish ("hágala más corta"); the letter stays English and its copy is redone. Typing on the letter marks the copy out of date with a button to update it.
- **Sheets**: what to say first and the points from their notes are written in English (they are said to the insurer) and each has its Spanish meaning under it, checked the same way. The checklists are our own Spanish. A Spanish-only line suggests asking for an interpreter (general guidance, flagged).
- **Their message, explained in Spanish**: said to "usted" ("la persona" and "el asegurado" become usted in code), no commentary on what it leaves out (caught in both languages), no opinion words, and only numbers the message gives. A message the insurer wrote in Spanish is read too (offer and denial fallbacks know the Spanish words).
- **Care card** triggers in Spanish: agobiado, abrumado, no puedo más, ya no aguanto, es demasiado, agotada, me rindo, sin esperanza, ataque de pánico, among others (`soundsOverwhelmed` in `public/desk.js`), plus the model's own breathe action.
- **How the language is chosen**: Spanish if the browser is set to Spanish, if a link has `?lang=es`, or if the person taps "Español" (landing header, Desk sidebar, and a quiet link under the opening question). Remembered on the device. `public/theme.js` sets it before the page paints, so a Spanish reader never sees English first.
- **Marked as a draft**: the Desk footer line and the landing footer both say the Spanish has not been reviewed by a native speaker. Strings for that review are listed below.

### Dark mode
- A toggle in the Desk sidebar ("Dark mode") and the landing header (a moon line icon). Light always loads first; dark only after the person picks it, remembered on the device. The same system flipped (tokens in `public/base.css`).
- The deep surfaces stay deep: in dark the sidebar and the landing band use a darker ink (#0F0D0B) with the light text tokens, instead of flipping to a bright block. (Before this fix the sidebar text would have turned near-black on near-black.)

### Download PDF
- "Download PDF" replaces the browser's print on every paper. `public/pdf.js` writes the PDF on the device, with no library and no outside request, using the PDF standard fonts (Times for the paper, Helvetica for the small labels) with their real widths, so lines wrap where they print. WinAnsi text covers English and Spanish accents and curly quotes.
- The letter (and the reply) download as the English letter, the one that is sent. A call or visit sheet downloads whole: title, sections, the line marks, what to say (with the Spanish under it in Spanish), the ask, points from their notes, every checklist line with its source number or "general guidance", the filled-in log, and the numbered source list with links. Files are named like `next-step-letter-2026-11-26.pdf` (`next-step-carta-…` in Spanish). A downloaded letter is added to the Record, as Copy already did.

### Phone polish
- On a phone the paper opens over the chat when a letter arrives, so one line at the top of the paper says how to finish it (fill in the [brackets], tap Copy, paste into an email). Desktop does not show it (the chat beside the paper says it), and sheets do not (their own first line already does).
- A question with choices that is taller than the chat (the asks, in Spanish, on a small phone) now scrolls to its first line instead of its bottom, so the question and the first choices are in view.
- Buttons never wrap their label (one Spanish ghost button did); the Spanish landing button read "Ver un ejemplo" (now "Demo" in both languages).
- The Spanish footer line is shortened to fit in three lines at 375 px.

### Measured contrast, both themes
Every text pair is AA (4.5) and every outline is at least 3. The test suite also scans every visible piece of text against what is behind it, in dark on the opening, letter, call sheet, Phone lines, Steps, Record and landing, and in light on the visit sheet, the three pages and the landing, plus the Spanish letter screen.

| Pair | Light | Dark |
|---|---|---|
| ink on paper | 15.2 | 14.8 |
| ink on sheet | 17.1 | 13.4 |
| ink on desk | 13.9 | 15.5 |
| ink on the person's bubble | 13.5 | 12.2 |
| ink on highlight | 14.9 | 8.6 |
| ink-2 on paper | 6.7 | 8.8 |
| ink-2 on sheet | 7.6 | 8.0 |
| ink-3 on paper | 5.0 | 6.5 |
| ink-3 on desk | 4.6 | 6.8 |
| ink-3 on sheet | 5.6 | 5.9 |
| button text on ink | 15.2 | 14.8 |
| sidebar and band text on the deep surface | 15.2 | 16.0 |
| quiet sidebar and band text | 8.1 | 7.5 |
| outline on paper | 3.3 | 3.7 |
| outline on sheet | 3.7 | 3.4 |

### Five strangers, timed (phase 3)
Run by `node dev/strangers.mjs <preview url> docs/strangers` against the preview with the real model, Nov 26. Each starts cold on the landing page with one sentence of context and ends when the finished letter is copied. Waits for the site and the model are measured; reading, deciding, tapping and typing are modelled from the words actually on each screen at each person's pace (older reader 130 words a minute, others 190 to 230). A stand-in for five real people, not a replacement: the bar of five real new users still needs five real people. Screenshots of every step and the timing logs are in `docs/strangers`.

| Person | Device | Path | Time to a finished letter |
|---|---|---|---|
| Renter, insurer quiet for six weeks | 375 px phone | taps, then a sentence | 3 min 25 s |
| Older reader, offer too low, watches the demo first | laptop, 125% text | taps, then a sentence | 4 min 44 s |
| Spanish speaker, smoke claim denied | 375 px phone, browser in Spanish | taps, Spanish notes, reads the Spanish copy | 4 min 56 s |
| Has the insurer's email open | laptop | pastes their message, takes the suggested ask | 2 min 15 s |
| Types instead of tapping, then asks for a change | 768 px tablet | types the situation, asks "make it shorter" | 3 min 8 s |

- All five under 5 minutes, against the 10 minute bar. The model was quick (2 to 4 seconds a step); most of the time is reading.
- The landing demo (about 18 seconds) cost the one person who chose to watch it about 27 seconds including its footer. Start is above it, so no one else waited on it. Not shortened.
- Pauses found and fixed on the way: on a phone the asks could sit under the message box (a tall question now shows from its first line); "Ver cómo funciona" broke over two lines in its button; "Soy dueño" was gendered (now "Es mía"); the Spanish footer took four lines on a phone; "Get a second contractor estimate" read as if the site would get one (now "Review my own contractor’s estimate").
- Fixed after the run: the phone paper opens over the chat, so the how-to-finish line now sits on the paper itself. Still worth watching with real people: "Me pusieron trabas con el reclamo" as the first Spanish tap.

### The real model in both languages (runs 6 and 7)
`node dev/real-run.mjs` now runs 45 situations: the 24 English ones and 21 Spanish ones (7 letters from Spanish notes including "42.300", "96 mil" and "siete semanas", 3 edits asked in Spanish, 3 messages explained in Spanish including one the insurer wrote in Spanish, 3 sheets, 5 chats). Every output is in docs/real-ai/run-6.md and run-7.md.
- Run 6: the script flagged one false alarm (a source number [10] read as a number). Reading every output found what the script did not: "However," added to letters in both languages, an ask said a second time ("You should explain your decision..."), a question kept as a second request ("I was wondering if my policy covers a hotel"), and "I have some concerns about the amount" added to what to say on a call. All four are now removed in code, and the script flags each.
- Run 7: no invented number, rule or phone line in either language; every Spanish copy line passed its checks (none had to be shown in English). Two flags, both read: an edit turned "three times" into "multiple" (now refused: number words are facts), and a chat suggested making "a list of questions and concerns" (not a worry put in the person's mouth; that flag no longer applies to chat).
- Read but not changed: the model's Spanish is correct but sometimes literal ("Estoy escribiendo para..."), and one explanation called the release "recibo" (the prompt now names it "documento de liberación (release)").

### The landing intro says what the tool is (Nov 26, after phase 3 review)
- **Why.** A stranger could not tell at a glance what Next Step is: under the very large headline sat one grey paragraph that never named the tool.
- **Now.** Under the headline, one big line in ink (24px, 21px on a phone, line height 1.35): "A free tool that helps you communicate with your insurer after a California wildfire." Then a grey line (18px) that leads with the letter, the MVP: "Start with a letter: answer a few questions and get a finished letter that asks for one clear thing. It also explains their replies and helps you prepare for calls and the adjuster’s visit." 12px between them, 28px above the big line. The word "free" appears once in the hero.
- **"Negotiate" is not used.** It could read as the tool negotiating for the person, which is licensed work in California. "Communicate" says what it does.
- **Buttons.** "Watch it work" became "Demo" (English and Spanish). The line under the buttons dropped "Free, no account." and keeps only "General information from public sources, not legal or insurance advice." (free now lives in the big line).
- **Measured.** Start ends at 551 px on a 375 by 760 phone in English and 650 px in Spanish (Empezar), so it is above the fold in both. No sideways scroll. The big line is the ink (15.2:1 light, 14.8:1 dark); the grey line is ink-2 (6.7:1 light, 8.8:1 dark). Version B was picked from three mockups (docs/screens/intro-version-A/B/C.png).

### The sidebar opens and closes on a computer (Nov 26, after phase 3 review)
- **Like Claude's.** A quiet panel icon at the top right of the sidebar closes it; the chat and the paper widen to fill the room (the letter sheet goes from 573 to its full 640 px at 1440 wide). The same icon at the top left of the Desk opens it again. Nothing else appears in its place, so the Desk stays clean.
- **Remembered** on the device (`ns-side` in local storage). `public/theme.js` sets `data-side="shut"` on the page before it paints, so a closed sidebar never flashes open on load.
- **Accessible.** Both controls are real buttons, 44 px, labelled "Close sidebar" and "Open sidebar" ("Cerrar la barra lateral", "Abrir la barra lateral") with `aria-controls="side"` and `aria-expanded`. Focus moves to the other control when one is used, so keyboard users never lose their place. While closed, the sidebar is `visibility: hidden`, so its links leave the tab order.
- **Motion.** The column eases over 0.24 s; the open icon fades in after it. None under reduced motion. The sidebar's contents keep their width while it moves, so nothing rewraps mid-motion.
- **The chat never runs under the open icon.** While closed, the thread's scroll area starts below the icon (the first line sits where it always did).
- **Phone unchanged.** Under 900 px the sidebar still opens from the menu button in the top bar, over a scrim; the desktop controls do not show there, even if it was closed on a computer.

### Spanish strings for a native speaker (unreviewed draft)
All Spanish is in `T_ES` and `STATIC_ES` (`public/desk.js`), `ES` (`public/landing.js`) and `ASK_ES`, `ASK_SUBJECT_ES`, `SHEET_ES` and the `M(...)` labels (`public/content.js`). Most worth a native speaker's eye:
1. "Me pusieron trabas con el reclamo" for "They pushed back on my claim" (the first tap).
2. The landing headline: "Cada palabra a su aseguradora cuenta. Que cada una sea la correcta."
3. "Historial" for the Record, kept apart from "registro" for the call and visit log.
4. "Les pido que…" as the Spanish copy of each "Please…" ask, and "días calendario" for calendar days.
5. Insurance words: "oferta de liquidación" (settlement offer), "alcance de trabajo" (scope of work), "presupuesto" (estimate; Mexican Spanish may prefer "estimado" or "cotización"), "ajustador", "reclamo" (vs "reclamación"), "documento de liberación (release)".
6. "Escritorio" for the Desk on the landing page.
7. The care card: "Esto es mucho para cargar…" and "Respire un momento".
8. The 988 line's Spanish name ("988 Línea de Prevención del Suicidio y Crisis") and "Departamento de Seguros de California": check against the agencies' own Spanish pages.
9. "Elija esto si…" notes under every ask.
10. The landing intro: "Una herramienta gratuita que le ayuda a comunicarse con su aseguradora después de un incendio en California." and "Empiece con una carta: responda unas preguntas y reciba una carta lista que pide una sola cosa clara. También le explica sus respuestas y le ayuda a prepararse para las llamadas y la visita del ajustador." Also "Cerrar la barra lateral" / "Abrir la barra lateral" for the sidebar controls.
11. The model's own Spanish (copies, explanations, chat) reads correct but sometimes literal ("Estoy escribiendo para…"); see docs/real-ai/run-7.md.

## Grounding the real model (phase 2)
Real output on the preview showed the free model (Llama 3.3 70B on Workers AI) ignores some prompt rules, so the rules that matter are also enforced in code (`lib/core.js`):
- **Subjects** come from the ask the person picked (`ASK_SUBJECT`), plus a claim number they gave.
- **Invented numbers**: any amount, date or count not in what the person gave becomes "[check this number]" in letters; on sheets the point is dropped.
- **Added words**: "recently", opinions about the amount ("which seems lower", "significantly different"), worries ("I am concerned") and second requests in the facts are removed; facts in the same sentence are kept.
- **Edits keep the ask word for word**: the edit prompt is given the exact sentence; if the model still rewords it, one retry, then the sentence is put back.
- **Explanations speak to you** ("you are asked to sign"), never "the person".
- **Added in phase 3, from the first real Spanish run (run 6):** a contrast word the notes did not give ("However, my contractor...") is dropped, keeping the fact; a sentence that says the ask again in other words or tells the insurer what it "should" do is dropped; a question in the facts ("I was wondering if my policy covers a hotel") is dropped, since it is a second request; "concerns" counts as an added worry, in what to say on a call too (and "preocupaciones" in Spanish).
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

Dark tokens are behind `data-theme="dark"`, reached by the toggle (phase 3); both themes are measured in the phase 3 table above.

## Type
- **Instrument Sans** (variable, bundled) for everything you read and tap. Headlines at 400 with -3.5% tracking. Hierarchy comes from size.
- **Source Serif 4** (variable, bundled, with italic) only on the paper.
- EB Garamond and Outfit are removed. Body is 17px on desktop and 18px on phones; nothing is under 15px (checked by the tests).
- Both fonts come from the Fontsource packages (SIL Open Font License), Latin subset, served from `/fonts`.

## Shape and motion
- Corners 4px everywhere, 2px on the sheet. Buttons and choices are near-square.
- One solid button per screen (the send arrow, or Start on the breathing page). Everything else is a thin-outline ghost.
- No section labels or eyebrow lines. The dot-and-a-word labels were removed at the phase 3 review ("For California wildfire insurance claims", "Every exchange", "The Desk, writing a letter", "If you need a person"): they read as decoration. Headings carry the page; small headings inside papers are plain quiet words.
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
- **The whole Spanish version** is an unreviewed draft (list of strings above). The model's Spanish (copies of letters, explanations, chat) is checked for numbers, phone lines and added content, not for style.
- **Interpreter lines** on the Spanish call and visit sheets ("pregunte si pueden darle un intérprete") are general guidance with no source.
- **The ask labels** changed in phase 3: "Get a second contractor estimate" now reads "Review my own contractor’s estimate", to match what the letter asks.

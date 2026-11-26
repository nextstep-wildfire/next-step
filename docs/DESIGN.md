# Design decisions (Nov 25, 2026 redesign)

Each choice is tied to one job: help a stressed person reach a finished letter alone, on a phone, in about ten minutes.

## Mood and colour
**Paper-white with one eucalyptus green.** It reads like a careful letter on a desk, and nothing on screen shares a colour with flame, smoke or an alarm. The previous dark brown and amber was cohesive but evoked fire.

- Theme follows the device (light or dark). The toggle on the landing page and in the guide's menu overrides it and is remembered.
- Tokens live once, in `public/base.css`.

Measured contrast (WCAG ratio, AA needs 4.5 for text, 3 for field borders):

| Pair | Light | Dark |
|---|---|---|
| Body text on background | 13.3 | 14.5 |
| Muted text on background | 6.6 | 8.1 |
| Accent (links) on background | 5.6 | 9.1 |
| Button text on accent | 6.3 | 9.3 |
| Field border on surface | 3.6 | 3.7 |
| Surface on background (neighbours, kept low on purpose) | 1.07 | 1.10 |

## Type
Two families, both bundled (no outside requests): **EB Garamond** for headings and for the letter itself, so the result looks like a real letter; **Outfit** for everything you read and operate. Cinzel (all-caps titles) is removed. Body text is 18px, nothing on screen is below 15px, and the disclaimer is full body size.

## Layout and motion
- One idea per screen. The core path is four steps with a visible "Step n of 4" and a Back link: own or rent, what the insurer did, the one ask, your words. Then the letter.
- No chat thread, chat sidebar, message box or chips. A separate "Ask a question" page keeps the live, sourced answers as one question and one answer.
- Tap targets are at least 44px (most are 48 to 72px). Links inside a sentence are the only exception, as WCAG allows.
- Landing: all text, the Start button and the disclaimer are there on first paint. The only motion is a soft patch of light drifting behind the text over a minute. It stops under reduced motion. No video.
- A quick double tap on a choice does not also pick the card that appears under the finger on the next screen.

## Flagged, not settled
- **Letter format and legal wording.** Unchanged from v4: one ask, "Please reply in writing within 15 calendar days", "I am keeping a record". The letter screen now says 15 days is the person's request, not a legal deadline. A Florida attorney warned that statutory notice formats can matter. This needs legal review before real use.
- **911 and 988** appear on the landing page and the help page but are not in `public/sources.json`. Add a cited entry or confirm they may stay as universal lines.
- **Spanish and Chinese** strings for the new screens are unreviewed drafts, as before. The footer says so in those languages.
- **"Pick this if…" notes** under each ask are new general guidance written for this redesign, not sourced rules. Worth a read by someone who knows claims.
- **Renter asks.** The offered-less asks (second contractor estimate, dwelling limits) were written for homeowners. Renters see them too.

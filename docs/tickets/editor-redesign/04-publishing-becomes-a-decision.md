# 04 — Publishing becomes a decision, not a dropdown

**What to build:** Today the choice that makes a Post visible to the world is a select box in a settings card below the fold, committed by the same button that saves a typo fix. Per direction **1b** of `Vision Editor - Redesign.dc.html`, Publishing becomes its own act, asked in its own place.

Publish opens a slide-over. Inside it are the two things that gate Publishing — the Post's **Category**, and whether the Post is a **Draft** or **Published** — and a checklist stating plainly what is still missing. This is the direction's known weakness answered head-on: a Typewriter layout hides state, so a Creator publishing in a hurry would otherwise meet a gate they could not anticipate. The checklist is what turns the gate into an answer.

> The design document calls this second choice "Visibility". This repo does not have that word, and should not gain one: `CONTEXT.md` already defines **Draft** as a Post not visible to Readers and **Published** as one that is. Use those.

Both settings leave the Post Settings card. What remains of that card is cover image and Excerpt, which ticket 05 moves.

Saving a Draft and Publishing must stay distinguishable actions. A Creator fixing a typo in a Draft is not publishing, and must not be able to do so by pressing the same control twice.

**Draft → Published** is the slowest animation in the product, and deliberately so — it is the only action on this screen with consequences outside it. The confirm presses in, then the Post's status crossfades under a brief accent wash across the top bar. Reduced motion swaps the status and replaces the wash with a static accent rule held briefly beneath the bar.

The sheet itself slides in horizontally over a scrim; reduced motion fades it with no travel.

**Blocked by:** 01 — Publish and its sheet live in the frame.

**Status:** ready-for-agent

- [ ] Publish opens a slide-over holding the Post's Category and its Draft/Published state
- [ ] The sheet lists what is still missing, in the Creator's terms, before it will let them Publish
- [ ] Publishing is impossible while a required answer is missing, and the reason is visible rather than inferred from a disabled control
- [ ] Category and the Draft/Published choice no longer appear in the Post Settings card
- [ ] Saving a Draft and Publishing remain distinct actions — neither can be performed by accident in place of the other
- [ ] An already-Published Post can be edited and re-saved without being re-published
- [ ] The word "Visibility" appears nowhere in the code or the interface
- [ ] The sheet, the confirm press, and the Draft → Published transition each animate as described, each with a defined reduced-motion state
- [ ] Both themes render correctly; tokens only, no literals
- [ ] `bun run verify:fast` passes and the Playwright suite still passes

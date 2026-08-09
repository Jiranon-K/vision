# 05 — The details drawer

**What to build:** Cover image and Excerpt shape how a Post is presented; neither decides whether it can ship. Per direction **1b** of `Vision Editor - Redesign.dc.html` they move out of the writing path into a drawer opened from the top bar — reachable in one gesture, never in peripheral vision while writing.

That empties the Post Settings card entirely: ticket 04 took Category and the Draft/Published choice, and this ticket takes the other two. The card goes with them.

The Excerpt keeps everything it gained recently — the **Excerpt Suggestion** button, the confirmation before replacing text the Creator wrote, the honest warning when a suggestion is a derived fallback rather than a real one, and the hidden state when the deployment has no provider. None of that behaviour changes; it changes address.

Two animations belong to this ticket:

- **A suggestion arrives** — the field's content fades up from a small offset, and the field's border flashes the brand line before settling. The Creator did not type this text, so the change has to be legible. Reduced motion swaps the text instantly and holds the border flash briefly as a static state.
- **The suggestion is a fallback** — the same entry, plus a warning Alert sliding down beneath the field. Reduced motion renders the Alert immediately, without travel.

The drawer slides in horizontally over a scrim; reduced motion fades it with no travel.

**Blocked by:** 04 — both tickets dismantle the same settings card. They are independent on paper and would collide in practice.

**Status:** ready-for-agent

- [ ] Cover image and Excerpt live in a drawer opened from the top bar
- [ ] The Post Settings card no longer exists
- [ ] Asking for an Excerpt Suggestion, confirming before replacing existing text, the fallback warning, and the hidden-when-unavailable state all behave exactly as they did before the move
- [ ] The drawer is usable at mobile width without covering the field being edited
- [ ] Nothing in the drawer is required in order to Publish
- [ ] The suggestion arrival, the fallback Alert, and the drawer entrance each animate as described, each with a defined reduced-motion state
- [ ] Both themes render correctly; tokens only, no literals
- [ ] `bun run verify:fast` passes and the Playwright suite still passes, including the existing Excerpt Suggestion coverage

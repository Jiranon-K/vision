# 01 — The editor takes over its own frame

**What to build:** Opening a Post for writing puts the Creator in the Typewriter frame from direction **1b** of the `Vision Editor - Redesign` design project (`Vision Editor - Redesign.dc.html`): nothing on the screen but the Post, above it a single 64px top bar carrying Back, the autosave slot, the meter slot, the mode switch and Publish.

The dashboard's fixed sidebar and its header do not appear here. They are right for a screen a Creator scans and wrong for a screen a Creator sits inside for two hours, and this is the only route in the product where that is true — so the escape belongs to this route, not to the dashboard shell every other page depends on.

The bar recedes while the Creator types and returns on any pointer movement. It is the same bar at every width; the layout does not fork by breakpoint, which is the direction's central claim and the reason it was chosen.

This ticket lands the frame and the slots, not what fills them. Everything currently inside the editor keeps working exactly as it does today — the Post still saves, the title still types, the split still splits, Post Settings is still there. Later tickets move things into the slots and empty that card out.

**Entering the editor** is this ticket's animation: the title and the writing surface arrive first, together, opacity and a small upward translate; the chrome follows a beat later on opacity alone, without translating. The order is the argument — the Creator came to write, so the writing arrives first. Reduced motion renders both at final opacity with no stagger.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The editor route renders the 64px top bar and no dashboard sidebar or dashboard header
- [ ] Every other dashboard route keeps its sidebar and header, unchanged
- [ ] The bar carries Back and Publish, plus empty, named slots for autosave status, the meter, and the mode switch
- [ ] The bar recedes while typing and returns on pointer movement, without ever moving the text or shifting layout under the caret
- [ ] The frame is the same at desktop, tablet and mobile — no forked layout
- [ ] Entering the editor animates as described, with a defined reduced-motion state
- [ ] Saving, autosaving, the title field, the split editor and Post Settings all behave exactly as before
- [ ] Both themes render correctly; no colour, shadow, or radius is written as a literal — tokens only
- [ ] `bun run verify:fast` passes and the Playwright suite still passes

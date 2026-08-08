# 02 — The writing surface itself

**What to build:** The surface a Creator actually writes on, per direction **1b** of `Vision Editor - Redesign.dc.html`.

Three things change.

**The title stops being a single line.** A Post's title is the one string on this screen that must never be clipped, and a single-line field clips by construction. It becomes a field that wraps and grows with its content, styled as display type rather than as a form input — it is the first line of the Post, not a setting about it.

**The measure is capped and centred.** Today a line of prose is as long as the window happens to be, which on a wide monitor is unreadable. Line length becomes a decision the product makes rather than a side effect of the viewport.

**Preview becomes a mode, not a column.** Today the editor is two fixed halves at every width, so on a phone a Creator gets two columns of roughly 150px and can use neither. It becomes a Write / Split / Preview switch with **Write** as the default — Split is available where there is room for it, and is the exception rather than the starting point.

The switch's motion: the thumb translates, and the arriving pane fades in from a small horizontal offset. Panes never resize during the transition — a pane that resizes mid-transition reflows the Creator's text, which is the one thing this screen may never do. Reduced motion swaps instantly and the thumb jumps.

**Blocked by:** 01 — the mode switch lives in a slot the frame provides.

**Status:** ready-for-agent

- [ ] A long title wraps onto further lines and is never truncated or scrolled horizontally
- [ ] The title field grows and shrinks with its content without the caret jumping
- [ ] Prose is held to a readable measure, centred, at any window width
- [ ] Write / Split / Preview is switchable, with Write as the default for a new Post
- [ ] Preview is reachable and usable at mobile width — a Creator can read their rendered Post on a phone
- [ ] Split is offered only where the measure survives it
- [ ] Switching modes animates as described, with a defined reduced-motion state, and never resizes a pane mid-transition
- [ ] Both themes render correctly; tokens only, no literals
- [ ] `bun run verify:fast` passes and the Playwright suite still passes

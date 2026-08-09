# 06 — The toolbar: one icon language, one rule

**What to build:** The toolbar has ten buttons drawn in three visual languages at once — bare letters (B, I, H1), an ASCII glyph (`<>`), and two emoji. The emoji are the concrete defect: an emoji cannot take `currentColor`, so those two buttons do not respond to the theme and sit at a fixed colour in dark mode while their eight neighbours flip.

Direction **1b** of `Vision Editor - Redesign.dc.html` sets one rule for what earns a slot:

> An action earns a toolbar slot only if its Markdown needs a second value the Creator cannot type in flow — a URL, a path — or if it wraps a selection.

Under that rule ten becomes seven: **Bold, Italic, Link, Image, Code, Quote, List**. Headings are dropped, because a Creator types `#` faster than they can aim at a button; they get a keyboard shortcut instead.

All seven are stroke SVG icons on `currentColor`, one weight, one grid.

**Blocked by:** 02 — the toolbar belongs to the writing surface, and its placement depends on the mode switch.

**Status:** ready-for-agent

- [ ] Seven buttons: Bold, Italic, Link, Image, Code, Quote, List
- [ ] Every icon is a stroke SVG on `currentColor` — no emoji, no bare letters, no ASCII glyphs
- [ ] Every icon reads correctly in both themes
- [ ] Heading levels 1–3 are reachable by keyboard shortcut and by typing `#` at the start of a line
- [ ] Each button has an accessible name and a visible focus state from the global ring
- [ ] Applying a button to a selection wraps that selection and leaves it selected; applying it with no selection inserts a placeholder and selects it
- [ ] The toolbar is usable at mobile width without wrapping into a second row of half-width targets
- [ ] Both themes render correctly; tokens only, no literals
- [ ] `bun run verify:fast` passes and the Playwright suite still passes

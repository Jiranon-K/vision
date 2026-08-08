# 07 — The slash menu

**What to build:** The toolbar rule in ticket 06 deliberately leaves block-level Markdown — headings, lists, quotes, code blocks — off the toolbar, on the grounds that a Creator types them faster than they can aim at a button. That is only true if reaching them from the keyboard is genuinely fast. This ticket is the other half of that argument.

Typing `/` at the start of an empty line opens a filterable menu of block-level insertions. Typing narrows it, the arrow keys move through it, Enter inserts, Escape closes it and leaves the `/` as ordinary text — because a Creator writing about file paths will type `/` and mean it.

The menu never covers the line being written.

This is the one piece of the design that is a feature in its own right rather than a rearrangement of what already exists, which is why it is last: everything before it improves the editor whether or not this ships.

**Blocked by:** 06 — the menu exists to justify what the toolbar dropped, so the toolbar's rule must be in place first.

**Status:** ready-for-agent

- [ ] Typing `/` at the start of an empty line opens the menu
- [ ] Typing after the `/` filters the options
- [ ] Arrow keys move the selection, Enter inserts, Escape closes and leaves the typed `/` in the text
- [ ] The menu does not open mid-line, so a Creator writing a path or a URL is never interrupted
- [ ] Insertion places the caret where the Creator would continue typing
- [ ] The menu is keyboard-operable end to end and announces its options to a screen reader
- [ ] The menu never covers the line being edited, at any viewport width
- [ ] Both themes render correctly; tokens only, no literals
- [ ] `bun run verify:fast` passes and the Playwright suite still passes

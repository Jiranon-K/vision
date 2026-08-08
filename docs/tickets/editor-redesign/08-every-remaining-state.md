# 08 — Every remaining state

**What to build:** The four situations the editor can be in that are not "a Creator writing", brought onto the design system per direction **1b** of `Vision Editor - Redesign.dc.html`. Each is currently hand-rolled markup with hard-coded colour, and each says the wrong thing.

**Read-only** — the Creator does not own this Post. State the fact in one line as an Alert, make every input inert, and **remove Publish rather than disabling it**. A control that can never be used should not occupy the eye.

**Load error** — the Post did not load. This takes over the canvas instead of hiding in a toast, and it leads with the one thing that matters to the person reading it: their local Draft is safe. Retry sits where the cursor already is.

**Restore Draft** — a newer autosaved Draft was found on this device. The dialog quotes how old it is, and offers Restore or Discard. Never a silent merge, and never a choice made on the Creator's behalf.

**Leave with unsaved changes** — the confirm is the destructive variant, the safe option is the outline button, and **the safe option takes focus**. A Creator hitting Enter on reflex must not lose work.

All four are dialogs or panels built from the existing design-system components, not from bespoke markup.

Dialogs animate by scaling up slightly from transparent; reduced motion fades them with no scale.

**Blocked by:** 01 — all four render inside the frame.

**Status:** ready-for-agent

- [ ] Read-only states the fact as an Alert, makes every input inert, and removes Publish rather than disabling it
- [ ] The load error takes the canvas, says the local Draft is safe, and offers Retry and a way back to the Posts list
- [ ] The restore dialog quotes the found Draft's age and offers Restore or Discard, with no silent merge
- [ ] The leave-unsaved confirm uses the destructive variant, and the safe option holds initial focus
- [ ] Every one of the four is built from existing design-system components — no bespoke dialog or alert markup
- [ ] Escape closes both dialogs the same way the safe option does, and focus returns to where it came from
- [ ] Dialogs animate as described, with a defined reduced-motion state
- [ ] Both themes render correctly; tokens only, no literals — the hard-coded colours in the current error and read-only markup are gone
- [ ] `bun run verify:fast` passes and the Playwright suite still passes

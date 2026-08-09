# 03 — Autosave stops being invisible

**What to build:** The editor already autosaves a Creator's work continuously, and tells them nothing about it. So the Save button carries anxiety that belongs to the system, not to the Creator: they press it because they cannot tell whether they need to.

The top bar starts telling the truth, per direction **1b** of `Vision Editor - Redesign.dc.html`. A status chip reports which of four situations the Creator is in:

- **New Post** — nothing has been saved, and the chip says so rather than implying a save that never happened.
- **Writing** — a save has landed and the buffer has moved on since.
- **Saving** — a commit is in flight.
- **Autosaved** — the commit landed, and the chip re-times from zero.

Beside it, a meter: word count and reading time. Reading time is already computed for every Post and shown wherever a Post appears — the Creator writing it is the one person who cannot see it.

And a quiet **Save now**, which appears only while the buffer differs from the last commit and withdraws when there is nothing left to save. It is an escape hatch for a Creator who wants certainty, not a duty.

This is where motion earns its place on this screen, and it is the whole budget:

- **A commit lands** — the status dot pulses once, scaling up and back, brightening and settling. Nothing else on the screen moves. Reduced motion changes the dot's fill and updates the label.
- **Idle** — the same dot breathes on a slow loop at low amplitude: ambient proof of life. Reduced motion holds it static and filled.
- **Saving** — the dot takes the warning tone and the label reads accordingly.

Typing must continue through a save. No spinner over the text, no disabled inputs, no blocked input of any kind.

**Blocked by:** 01 — the chip, the meter and Save now fill slots the frame provides.

**Status:** ready-for-agent

- [ ] The chip distinguishes new, writing, saving and autosaved, and never claims a save that has not happened
- [ ] Time since the last commit is shown and re-times from zero when a commit lands
- [ ] Word count and reading time are shown and update as the Creator writes
- [ ] Save now appears only when the buffer differs from the last commit, and withdraws when it does not
- [ ] Typing is never blocked, disabled, or covered while a save is in flight
- [ ] The commit pulse, the idle loop, and the saving state each animate as described, each with a defined reduced-motion state
- [ ] No animation touches the text being typed or shifts layout under the caret
- [ ] Both themes render correctly; tokens only, no literals
- [ ] `bun run verify:fast` passes and the Playwright suite still passes

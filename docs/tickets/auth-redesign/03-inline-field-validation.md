# 03 — Inline field validation across login and register

**What to build:** When a Creator submits either auth form with something wrong in the fields themselves — a malformed email, a password that misses a rule — the screen tells them which field, not just that something failed. This is the design's "Field validation" state: an amber banner at the top reading "Check the highlighted fields below.", and every offending field drawn with a red border and a short message under it ("Enter a valid email address", "Password must meet all requirements").

Today both pages only have a single catch-all message, so a Creator with two problems fixes one, resubmits, and discovers the other. Field-level errors clear as the Creator corrects each field, and the banner disappears once no field is left in error.

Field messages go through the existing `FieldMessage` slot so the control keeps its `aria-invalid` and `aria-describedby` wiring, and a screen reader announces the error when it appears.

**Blocked by:** 01 — Login page rebuilt on the new auth shell; 02 — Register page on the auth shell, with the new password strength meter.

**Status:** ready-for-agent

- [ ] Submitting `/login` with a malformed email shows the amber banner and a red-bordered email field with its message
- [ ] Submitting `/register` with a password missing a rule shows the amber banner and the red-bordered password field with its message
- [ ] Several fields can be in error at once, each carrying its own message
- [ ] Correcting a field clears its error, and the banner goes once every field is valid
- [ ] Field validation errors and server errors are visually distinct (amber vs red banner) and never stack on top of each other
- [ ] Errored controls expose `aria-invalid` and are described by their message
- [ ] A test covers a submit blocked by field validation on each page

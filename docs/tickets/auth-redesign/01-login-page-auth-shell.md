# 01 — Login page rebuilt on the new auth shell

**What to build:** A Creator opening `/login` lands on the redesigned sign-in screen from the `Register/Login Page Redesign` design project (`Auth Redesign.dc.html`): a single centred card split into a dark brand panel on the left — Vision star mark, the "Refracting ideas into digital reality." line, and a mono row reading Posts / Analytics / Editor — and the sign-in form on the right. On a narrow viewport the brand panel drops away and a small Vision lockup sits above the form instead.

The form itself is Email, Password, Remember me and Forgot password, submitting exactly as it does today. What changes is everything around it: the retired neo-brutalist treatment (dotted lime background, rotated bordered cards, ALL-CAPS italic labels, the `pop-stagger` anime.js entrance, the full-card error illustration) is gone, replaced by the project's design system — Space Grotesk, 12px field radius, one hard shadow on the primary action, lime focus ring.

While the session check runs the card shows the dark "Checking session" panel with the pulsing star instead of the bouncing VISION wordmark. Credential failures, lockouts and unreachable-server failures all surface as an inline banner above the form — red, amber, or neutral grey per the design — rather than swapping the whole card out. On success the form is replaced by the "Signed in" result panel with a Go to dashboard action.

This ticket also lands the pieces the other auth screens will reuse: the shell (brand panel, mobile lockup, card, footer row with the sign-up link and "← Back to home"), the inline banner, and the password field whose Show/Hide control is a Geist Mono text button on the label row rather than an eye icon inside the input.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `/login` renders the split card on desktop and the single-column form with the small Vision lockup on mobile
- [ ] Fields, labels, checkbox and submit button come from `components/ui` primitives, not raw `<input>` with hardcoded colours
- [ ] Submit button is dark with the 4px hard shadow, and on hover goes lime and translates by the shadow offset
- [ ] Password visibility is toggled by a Show/Hide text button on the label row, with an accessible name that reflects state
- [ ] Session check renders the dark pulsing-star panel; no bouncing VISION wordmark remains
- [ ] Credential error, account-locked and service-unreachable each render as the matching inline banner; `/images/login-error.png` is no longer referenced by this page
- [ ] Successful sign-in renders the "Signed in" result panel with a Go to dashboard action
- [ ] No `pop-stagger` / anime.js entrance animation remains on this page
- [ ] The auth shell, inline banner and password field are extracted as shared components the register screen can consume unchanged
- [ ] `e2e/auth.spec.ts` passes against the new markup, including the success panel step

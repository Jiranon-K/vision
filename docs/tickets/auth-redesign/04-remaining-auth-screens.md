# 04 — Forgot password, Reset password and Verify email on the auth shell

**What to build:** The three remaining auth screens stop looking like the retired neo-brutalist system and join the redesigned set, so a Creator moving from sign-in to a password reset never crosses a visual seam.

`/forgot-password` asks for an email under "Reset your password" — "Enter your email and we'll send a link that expires in one hour." — and on submit becomes the "Check your email" result panel confirming a link is on its way to that address, with a way back to sign in.

`/reset-password` shows "Choose a new password" with a New password field and a Confirm new password field — this is the one screen the design keeps confirmation on — both driven by the strength meter from ticket 02, and resolves to a "Password updated" panel that leads to sign in.

`/verify-email` shows "Verify your email" while confirmation runs, and settles into "Email verified" on success, with a Resend verification email action available while it has not yet succeeded.

All three sit in the shared shell from ticket 01, use its inline banner for failures, and pick up the field-level validation from ticket 03.

**Blocked by:** 01 — Login page rebuilt on the new auth shell; 02 — Register page on the auth shell, with the new password strength meter; 03 — Inline field validation across login and register.

**Status:** ready-for-agent

- [ ] All three screens render inside the shared auth shell on desktop and mobile, with the design's headings and sub-copy
- [ ] `/forgot-password` submits and lands on the "Check your email" panel naming the address the link went to
- [ ] `/reset-password` has New password plus Confirm new password, shows the strength meter, blocks a mismatch with a field-level message, and lands on "Password updated"
- [ ] `/verify-email` shows the in-progress state, the "Email verified" success panel, and a Resend verification email action before success
- [ ] Failures on each screen surface through the shared inline banner
- [ ] No neo-brutalist styling, `pop-stagger` animation, or `/images/login-error.png` reference remains anywhere under the auth screens

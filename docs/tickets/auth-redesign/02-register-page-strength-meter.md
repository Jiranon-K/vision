# 02 — Register page on the auth shell, with the new password strength meter

**What to build:** A Creator opening `/register` gets the same redesigned card as `/login` — dark brand panel, single-column on mobile — with the sign-up copy from the design: "Create your account" over "One account for the editor, the blog and your analytics.", a Create account button, and a footer offering "Already have an account? Sign in".

The form collects Full name, Email and Password. **Confirm password is removed** — the design keeps that pattern for the reset-password screen only, so the strength meter is what guards a mistyped password here.

The password strength display is rebuilt: five thin bars that fill as rules are met (amber up to two, mid-lime up to four, brand lime at five) with a wrapped row of rule chips — 8+ characters, Uppercase, Lowercase, Number, Symbol — each a small dot plus label that goes from grey to dark lime once satisfied. The rotated dark checklist box is gone.

The session check, inline banner and Show/Hide password control are the shared ones from ticket 01, used unchanged. On success the form is replaced by the "Account created" result panel — "Welcome to Vision. Your dashboard is ready." — with a Go to dashboard action.

**Blocked by:** 01 — Login page rebuilt on the new auth shell.

**Status:** ready-for-agent

- [ ] `/register` renders inside the shared auth shell with the design's register copy, on desktop and mobile
- [ ] The form has Full name, Email and Password only; the Repeat password field and its mismatch check are gone
- [ ] Password strength renders as five bars plus rule chips, with the bar colour stepping by how many rules are met
- [ ] Submit stays disabled until every password rule is met
- [ ] Registration failures render as the shared inline banner; `/images/login-error.png` is no longer referenced by this page
- [ ] Successful registration renders the "Account created" result panel with a Go to dashboard action
- [ ] No `pop-stagger` / anime.js entrance animation remains on this page
- [ ] The shell, banner and password field are reused from ticket 01 without forking them
- [ ] `e2e/auth.spec.ts` registers a fresh Creator through the new form and reaches the dashboard

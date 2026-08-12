# 05 — Signing out actually ends the session

**Status:** ready-for-agent

## Problem Statement

A Creator who signs out is not signed out. Signing out clears the cookies in
that browser and nothing else. The refresh token that was in those cookies stays
valid until it expires on its own — up to thirty days when the Creator chose to
be remembered.

So a token captured from a shared machine, a browser left open, a proxy log or a
backup keeps working for a month, and there is nothing the Creator or the
platform can do about it. Changing the password does not help. Signing out on
every device does not help, because there is no such action and it would not
work if there were.

Two further weaknesses compound it. Access tokens and refresh tokens are signed
with the same secret, so the only thing separating them is a field inside the
payload. And rotating the secret is the sole available revocation mechanism,
which signs out every Creator on the platform at once.

## Solution

A refresh token can be invalidated, and the events that ought to invalidate one
do.

- Signing out invalidates the refresh token that was used, on that device.
- Signing out everywhere invalidates every refresh token the Creator holds.
- Changing a password invalidates every refresh token the Creator holds, on
  every device except the one making the change.
- Completing a password reset does the same, because a reset is the flow a
  Creator uses when they believe someone else has their account.
- Access tokens keep their short life and stay stateless. They are the fast path;
  the fifteen-minute window is the accepted cost of not touching the database on
  every request.
- Refresh tokens are signed with their own secret, so an access token can never
  be presented as a refresh token even if the type field is manipulated.

## User Stories

1. As a Creator, I want signing out to end the session on that device permanently, so that closing a browser on a shared machine is safe.
2. As a Creator, I want a "sign out everywhere" action, so that I can recover when I have left myself signed in somewhere I no longer control.
3. As a Creator, I want changing my password to sign out my other devices, so that a password change is a meaningful response to a suspected compromise.
4. As a Creator, I want changing my password not to sign me out of the device I am using, so that the safe action does not punish me.
5. As a Creator, I want completing a password reset to sign out every device, so that regaining access removes whoever else had it.
6. As a Creator, I want a refresh token that was captured before I signed out to stop working, so that the capture has a short useful life rather than a month.
7. As a Creator, I want to stay signed in across a normal browser restart, so that the security change does not make daily use worse.
8. As a Creator who chose to be remembered, I want that choice still honoured, so that the feature keeps its meaning.
9. As a Creator, I want an invalidated session to return me to the sign-in screen rather than to a broken page, so that the experience of being signed out is coherent.
10. As a maintainer, I want an access token to be unusable as a refresh token, so that the separation between the two is cryptographic rather than a field in a payload.
11. As a maintainer, I want revocation to cost one indexed lookup on refresh only, so that ordinary requests stay stateless and fast.
12. As a maintainer, I want revoking one Creator's sessions never to affect another Creator, so that the response to one incident is proportionate.
13. As an operator, I want the secrets to be separately configurable, so that either can be rotated without invalidating the other.
14. As a security reviewer, I want a test that a signed-out refresh token is refused, so that the revocation cannot quietly stop working.

## Implementation Decisions

- **Revocation is a generation counter on the Creator, not a token allowlist.**
  The Creator record carries a session generation; a refresh token carries the
  generation it was issued under; refresh compares the two and refuses a stale
  one. This buys device-wide and account-wide revocation for one integer and one
  comparison, with no store to expire or garbage-collect.
- **Per-device sign-out needs a device identity**, so a refresh token also
  carries an opaque session identifier, and the Creator record holds the set of
  identifiers that have been revoked ahead of the generation. Signing out on one
  device revokes that identifier; signing out everywhere increments the
  generation and clears the set.
- **Access tokens are unchanged and stay stateless.** Checking revocation on
  every request would put the database in the path of every page load to buy back
  at most fifteen minutes. Refresh is the chokepoint, and it is enough.
- **A separate secret signs refresh tokens.** Where the separate secret is not
  configured, the server refuses to start rather than falling back to the shared
  one — a silent fallback is how this weakness would survive the ticket.
- **Password change and password reset both advance the generation.** The change
  flow re-issues tokens for the device that made the change, so the Creator
  making the change stays signed in and everyone else does not.
- **A refused refresh clears the cookies** so the browser is not left holding a
  token it will keep retrying with.
- **The frontend's existing single-flight refresh behaviour is preserved.** When
  a refresh is refused, the pending request receives the refusal and the Creator
  is returned to the sign-in screen; concurrent requests must not each trigger a
  separate refresh attempt or a separate redirect.
- **Existing sessions are invalidated by this deployment.** Creators are signed
  in again once. This is stated plainly rather than engineered around.

## Testing Decisions

A good test asserts what a token can still do after an event. It does not assert
the shape of the token payload — that is the implementation, and asserting it
would lock in the very design this ticket is free to change later.

- **Seam:** the HTTP API against the running Express app, using cookie jars per
  simulated device. Existing seam.
- **Prior art:** the authentication and email flow integration suite, which
  already drives registration, sign-in and token-bearing requests end to end and
  manipulates cookies directly.
- **Cases:**
  - Refresh succeeds before sign-out and is refused with the same token after.
  - Signing out on device one leaves device two working.
  - Signing out everywhere refuses both devices.
  - Changing the password refuses the other device and keeps the changing device
    signed in.
  - Completing a password reset refuses every device.
  - An access token presented to the refresh endpoint is refused.
  - A refresh token forged with the access secret is refused.
  - A refused refresh clears the cookies.
  - One Creator's sign-out-everywhere leaves another Creator's sessions intact.
  - The server refuses to start without a distinct refresh secret configured.

## Out of Scope

- Listing a Creator's active sessions with device and location detail.
- Multi-factor authentication.
- Detecting refresh-token reuse as a compromise signal and reacting to it.
- Any change to how long tokens live.
- Migrating the access token to a different mechanism.

## Further Notes

The account already hashes its email-verification and password-reset tokens
before storing them, which is the same instinct applied correctly elsewhere. The
gap is specifically the refresh token, which is the longest-lived credential in
the system and the only one with no way to take it back.

The sign-out-everywhere action needs a place in the Hub's settings. Where to put
it is a small design decision, not a blocker: the capability is the ticket, and
an unadorned entry in account settings satisfies it.

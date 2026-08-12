# 07 — Rate limits survive more than one instance

**Status:** ready-for-agent

## Problem Statement

Every rate limit in the server counts in the memory of the process that happened
to receive the request. There are six of them, and they guard the things worth
guarding: sign-in attempts, registrations, password reset requests, verification
emails, excerpt suggestions, and the general request budget.

With one server process, they work. With two, each limit is silently doubled,
because a caller refused by one process simply lands on the other. With
autoscaling, the limit becomes whatever the current instance count says it is. A
restart resets every counter to zero, so an attacker who can provoke or wait for
a deploy gets a fresh allowance.

The code already knows this. The store factory checks whether it is running in
production and prints a warning suggesting a shared store — then returns nothing,
and the in-memory default is used anyway. A warning that changes no behaviour is
a note to nobody.

For sign-in this is the difference between five attempts per fifteen minutes and
five per instance per fifteen minutes with a reset available on demand. For
excerpt suggestions it is an unbounded bill.

## Solution

The rate-limit store becomes a real seam with two adapters, chosen by
configuration.

- A shared store backed by Redis, used wherever it is configured.
- The in-memory store, used for local development and tests.
- Which one is in use is decided in one place and reported at startup, so nobody
  has to infer it.
- In production the shared store is required. A production server configured
  without one refuses to start rather than warning and continuing.
- If the shared store becomes unreachable while running, the server keeps
  serving and the limiter fails closed for the endpoints that protect
  credentials and spend money, and open for the general budget.

## User Stories

1. As an operator, I want rate limits enforced across every instance, so that the configured limit is the actual limit.
2. As an operator, I want limits to survive a restart or a deploy, so that a redeploy is not a way to reset an attacker's allowance.
3. As an operator, I want the choice of store reported at startup, so that I never have to guess which one is running.
4. As an operator, I want a production server with no shared store configured to refuse to start, so that the mistake is loud at deploy time instead of silent until an incident.
5. As a security reviewer, I want sign-in attempts counted globally per account, so that spreading attempts across instances gains an attacker nothing.
6. As a security reviewer, I want the sign-in limiter to refuse requests when the shared store is unreachable, so that an outage of the store is not an opening.
7. As an operator, I want the general request budget to keep serving when the store is unreachable, so that a store outage degrades protection rather than taking the platform down.
8. As a Creator, I want the excerpt suggestion limit to be per Creator and consistent across instances, so that my allowance is my own and predictable.
9. As the platform owner, I want the provider spend bounded regardless of instance count, so that scaling out does not multiply the bill.
10. As a Creator, I want to be told how long to wait when I am limited, so that a refusal is actionable rather than mysterious.
11. As a developer, I want local development to work with no Redis installed, so that the change does not add a prerequisite to getting started.
12. As a developer, I want tests to run without a shared store, so that the suite stays fast and hermetic.
13. As a maintainer, I want one place that decides which store backs the limiters, so that adding a limiter does not mean repeating the decision.
14. As an operator, I want limits keyed so that Creators behind one shared address do not consume each other's allowance, so that an office network is not collectively punished.

## Implementation Decisions

- **The existing store factory becomes the seam.** It is already the single
  place every limiter asks for a store; today it has one adapter and a warning.
  Giving it a second adapter is what turns a hypothetical seam into a real one,
  and it is the same shape as the excerpt suggestion provider seam: one function,
  chosen by configuration, with the only knowledge of the backing technology
  behind it.
- **Configuration selects the adapter.** A configured shared-store connection
  means the shared adapter; its absence means in-memory. There is no separate
  flag to get out of sync with the connection string.
- **Production without a shared store is a startup failure**, not a warning. The
  current warning is proof that a message alone does not change what gets
  deployed.
- **The chosen adapter is reported once at startup** through the logger, at a
  level that is visible in production.
- **Failure policy differs by limiter, and the difference is deliberate.**
  Credential and spend limiters — sign-in, registration, password reset,
  verification email, excerpt suggestion — refuse when the store cannot answer.
  The general budget serves. Failing the whole platform closed because a
  rate-limit store blinked would trade a small risk for a large outage; failing
  sign-in open would trade a large risk for a small inconvenience.
- **Keying is unchanged.** Sign-in stays keyed per address and account,
  per-Creator limiters stay keyed per address and Creator. This ticket changes
  where counts live, not what is counted.
- **Refusals carry the standard rate-limit headers** so a client can tell how
  long to wait, and the message the Creator sees is preserved.
- **Tests keep skipping the limiters** as they do today, so integration cases do
  not share counters. The store selection itself is tested directly.
- **Local development needs no new prerequisite.** With nothing configured, the
  in-memory adapter is selected and behaviour is exactly what it is today.

## Testing Decisions

A good test asserts which adapter is selected for a given configuration, and
what a caller experiences when the store cannot answer. It does not assert that
a particular client library was constructed.

- **Seam:** the store factory, exercised directly with configuration set — a
  narrow internal seam, private to the module and its tests. The failure-policy
  cases run at the HTTP seam with a store adapter substituted for one that
  always fails.
- **Prior art:** the excerpt suggestion provider tests, which cover selection by
  configuration and injected-failure behaviour at exactly this shape; the
  resilience suite for driving a dependency failure through the HTTP seam.
- **Cases:**
  - No shared store configured, outside production, selects the in-memory
    adapter.
  - A shared store configured selects the shared adapter.
  - Production with no shared store configured fails startup.
  - With a store that always fails, a sign-in request is refused.
  - With a store that always fails, a general request is served.
  - A refusal carries the standard rate-limit headers and the existing message.
  - Selection is reported at startup.

## Out of Scope

- Introducing Redis for anything other than rate limiting.
- Changing any limit's window or maximum.
- Per-Plan rate limits.
- A distributed lock or any other coordination primitive.
- Adaptive or reputation-based limiting.

## Further Notes

Adding Redis is a new piece of infrastructure, which is the real cost of this
ticket. It is worth naming: the alternative is that the sign-in limit means
nothing above one instance, and one instance is not a deployment plan.

The container ticket should provide the shared store alongside the database in
the local composition, so that a developer who wants to exercise the shared path
can, without it becoming a prerequisite for those who do not.

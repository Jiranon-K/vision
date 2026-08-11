# 12 — A View means one Reader read it

**Status:** ready-for-agent

## Problem Statement

A View is recorded by an open endpoint that takes a Post identifier and adds one.
It requires no session, applies no per-Post limit, and remembers nothing about
who asked. The only thing standing between it and unlimited use is the general
request budget, which is shared with every other route and counted per address.

So a View count is not a count of reads. It is a count of requests, and anyone
can make as many as they like. A Creator can inflate their own numbers. A
competitor can inflate someone else's. A crawler inflates them by accident. A
Reader who refreshes a page five times is recorded as five Views.

This is the number Growth Analytics reports, and the product's stated purpose is
that a Creator can make a decision on a number rather than a feeling. A number
that anyone can move is a feeling with a decimal point.

The endpoint also answers a failure as a client error regardless of cause, so a
database problem during recording is indistinguishable from a bad identifier.

## Solution

A View is recorded when a Reader plausibly read a Post, and once per Reader per
Post for a reasonable window.

- Recording requires the Post to exist and to be Published. A Draft accumulates
  no Views.
- A repeated record from the same Reader for the same Post within a window is
  accepted and ignored, so a refresh does not inflate the count.
- Recording is limited per address independently of the general budget, so
  hammering it does not spend a Reader's ordinary allowance and is bounded on its
  own terms.
- The Reader is identified for deduplication purposes only, without a session and
  without storing anything that identifies a person.
- Known crawlers are not counted.
- Recording never blocks or fails the reading experience. A failure to count is
  invisible to the Reader.

## User Stories

1. As a Creator, I want a View to represent one Reader reading my Post, so that the number supports a decision.
2. As a Creator, I want a Reader refreshing the page not to add Views, so that the count is not inflated by ordinary browsing.
3. As a Creator, I want the same Reader returning tomorrow to be counted again, so that repeat readership is visible rather than erased.
4. As a Creator, I want my Drafts to accumulate no Views, so that a preview of my own work does not enter my analytics.
5. As a Creator, I want previewing my own Published Post not to inflate its count noticeably, so that editing is not a way to fool myself.
6. As a Creator, I want crawlers excluded, so that indexing is not mistaken for readership.
7. As a Creator, I want it to be materially harder for someone to inflate or manufacture Views on any Post, so that the numbers are worth comparing.
8. As a Reader, I want View recording to be invisible and never to delay or break the page, so that reading is unaffected.
9. As a Reader, I want no account and no persistent identifier tied to me personally, so that reading a blog does not require being tracked.
10. As a Reader with a privacy-conscious browser configuration, I want the Post to read normally, so that declining to be counted is not punished.
11. As an operator, I want View recording rate-limited on its own terms, so that abuse of it does not consume the general request budget.
12. As an operator, I want a recording failure logged as a server problem and a bad identifier answered as a client problem, so that the two are distinguishable.
13. As an operator, I want the deduplication record to expire automatically, so that it does not grow without limit.
14. As a maintainer, I want the deduplication window stated in one place, so that the meaning of a View is a single reviewable decision.
15. As a Creator, I want deleting a Post to take its Views with it, so that totals describe Posts that exist.

## Implementation Decisions

- **Recording is refused for anything that is not a Published Post.** The
  endpoint currently increments whatever identifier it is given, without checking
  that it exists or that a Reader could have read it.
- **Deduplication is per Reader per Post, over a window measured in hours, not
  minutes.** A window in minutes still counts a Reader who returns after lunch;
  a window in days erases genuine repeat readership. The window is one named
  decision.
- **The Reader is identified by a value derived from request characteristics,
  hashed with a rotating salt, and never stored in a form that identifies a
  person.** The purpose is deduplication, not identity: the derived value is
  useless for tracking a Reader across Posts once the salt rotates, which is the
  property that makes counting Views compatible with a platform that requires no
  account to read.
- **Deduplication records expire on their own** through a time-to-live on the
  collection, so nothing needs pruning and the store's size is bounded by traffic
  in the window.
- **The endpoint gets its own rate limit**, keyed independently of the general
  budget, so that a burst against it is bounded without consuming a Reader's
  allowance for reading.
- **Known crawler user agents are excluded** by a simple, documented check.
  Perfect detection is not the goal; removing the obvious bulk is.
- **Recording remains fire-and-forget from the Reader's perspective.** A
  duplicate is accepted and ignored rather than refused, so the client needs no
  logic to interpret the response, and no failure path is visible while reading.
- **Failures are answered honestly.** A malformed or unknown identifier is a
  client error; a failure to write is a server error and is logged.
- **Deleting a Post removes its Views with it**, consistent with the analytics
  ticket's totals describing Posts that currently exist.
- **What a View means is written into the domain glossary's entry**, since the
  deduplication window is now part of the definition rather than an
  implementation detail.

## Testing Decisions

A good test asserts the count after a sequence of recordings. It does not assert
how a Reader was identified — that is deliberately opaque and expected to change.

- **Seam:** the HTTP API against the running Express app, with request
  characteristics varied per simulated Reader. Existing seam. The clock is
  injected so window expiry is exercised without waiting.
- **Prior art:** the throttle suite for the excerpt suggestion path, which drives
  repeated requests through the HTTP seam and asserts what the caller receives;
  the analytics cases for asserting a resulting number rather than a mechanism.
- **Cases:**
  - One recording increases the Post's Views by one.
  - A second recording from the same Reader within the window does not increase
    it, and is not reported as an error.
  - A recording from a different Reader within the window increases it.
  - A recording from the same Reader after the window increases it.
  - Recording against a Draft does not increase its Views.
  - Recording against an unknown identifier is answered as a client error.
  - Recording against a malformed identifier is answered as a client error.
  - A request from a known crawler user agent does not increase the count.
  - Exceeding the endpoint's own limit is refused, and an ordinary read request
    from the same address still succeeds.
  - Deleting a Post removes its Views from the Creator's analytics totals.
  - At the browser seam: a Reader loading a Post twice in one session results in
    one View.

## Out of Scope

- Unique-Reader counts as a separate reported metric.
- Read-depth, scroll or dwell-time measurement.
- Referrer and traffic-source attribution.
- Any analytics vendor integration.
- Backfilling or correcting Views recorded before this change.
- A cookie banner or consent mechanism — deliberately, since the derivation
  stores nothing that identifies a person.

## Further Notes

This ticket is what makes the analytics ticket worth doing. Scoping the numbers
to the right Creator matters only if the numbers themselves mean something, and
today they mean "requests received".

The privacy position is a deliberate part of the design rather than a
consequence of it. The glossary says a Reader is "never signed in; readership
requires no account", and a deduplication scheme that quietly builds a persistent
Reader identity would contradict that while appearing to serve it.

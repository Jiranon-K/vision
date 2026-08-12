# 02 — Growth Analytics belongs to one Creator

**Status:** ready-for-agent

## Problem Statement

The numbers on the Smart Creator Hub are not the Creator's numbers. Total Views,
Posts, Subscribers and the weekly View trend are read from platform-wide
documents and shown under a heading that says they describe the signed-in
Creator. A Creator with two Posts and forty Views sees the whole platform's
totals and has no way to tell.

This is the opposite of what Growth Analytics is for. The product exists to let
a Creator make a decision on a number rather than a feeling, and the number is
currently about strangers.

The endpoints are also open. They require no session at all, so the platform's
aggregate readership is readable by anyone who knows the path.

## Solution

Growth Analytics reports on the Posts a Creator owns, to that Creator, and to
nobody else.

- The endpoints require a session.
- Total Views is the sum of Views across the Creator's Published Posts.
- Posts is the count of the Creator's Posts.
- The weekly trend is the Creator's Views over the last seven days.
- A Creator with no Posts sees honest zeroes, not the platform's totals and not
  an error.

Where a metric cannot yet be derived per Creator, it is not displayed at all. A
plausible-looking number that describes someone else is worse than an absent one.

## User Stories

1. As a Creator, I want Total Views to count reads of my own Published Posts, so that the headline number describes my Audience.
2. As a Creator, I want the Posts count to count the Posts I own, so that it matches the list in my Hub.
3. As a Creator, I want the weekly View trend to plot my own Views, so that I can see whether last week's publishing worked.
4. As a Creator with no Posts yet, I want to see zeroes and an explanation, so that an empty Hub reads as "not yet" rather than "broken".
5. As a Creator, I want a metric that cannot be attributed to me to be absent rather than filled in with a platform figure, so that I never make a decision on someone else's data.
6. As a Creator, I want my analytics to be unreadable without my session, so that my Audience size is not public information.
7. As a Creator, I want a Draft to contribute nothing to my Views, so that the trend reflects published work only.
8. As a Creator, I want deleting a Post to remove its Views from my totals, so that the figures describe what currently exists.
9. As a Reader, I want no way to read platform or Creator analytics, so that browsing the blog does not expose business metrics.
10. As an admin, I want any cross-Creator reporting to be a separate, deliberate capability, so that the Hub endpoint has exactly one meaning.
11. As a Creator, I want the per-Post View counts in my Hub and the totals in my analytics to agree, so that the two screens do not contradict each other.
12. As a maintainer, I want the analytics response shape to keep serving the existing Hub cards, so that this change does not require a redesign.
13. As a security reviewer, I want a test that fails if an unauthenticated caller can read analytics, so that the endpoint cannot silently reopen.

## Implementation Decisions

- **Analytics is derived from Posts, not from a parallel document.** The Post is
  already the record of Views per Post and the record of ownership. Deriving the
  totals from Posts owned by the Creator makes the numbers correct by
  construction and removes the second source of truth that produced the defect.
- **Every analytics route requires a session.** No optional-session behaviour:
  there is no useful anonymous reading of this data, and an optional session is
  what turned the Posts list into a leak.
- **The response shape is preserved.** The Hub's cards and chart keep consuming
  the same fields, so no frontend redesign is in scope. What changes is the
  values and the fact that a session is required.
- **Metrics without a per-Creator definition are removed from the payload, not
  zeroed.** Subscribers, in the sense of a Creator paying for a Plan, is not the
  Reader-count the card implies; showing zero would still be an answer to a
  question the platform cannot yet answer. Engagement is the same case. The Hub
  shows the metrics it can defend.
- **The trend covers the last seven days and returns a point per day, including
  days with no Views**, so the chart's x-axis is stable and a gap reads as zero
  rather than as a missing day.
- **The empty state is a first-class response**, not an error and not a fallback
  to sample data. A Creator with no Posts receives a well-formed payload of
  zeroes.
- **Aggregation runs in the database, scoped by owner**, using the existing owner
  index rather than loading a Creator's Posts into the process to sum them.

## Testing Decisions

A good test asserts the number a Creator would read on the card, given Posts and
Views that the test itself created. It does not assert the shape of the
aggregation pipeline — that is the implementation, and it will change.

- **Seam:** the HTTP API against the running Express app, the same seam the
  authorization suite uses. No new seam.
- **Prior art:** the ownership authorization suite's fixture pattern — register
  two Creators, create Posts under each, then assert what each can observe.
- **Cases:**
  - Creator A's totals count only A's Posts, with B's Posts and Views present in
    the database and absent from the figures.
  - A Draft's Views contribute nothing to the totals or the trend.
  - A Creator with no Posts receives zeroes and a well-formed trend.
  - Deleting a Post removes its Views from the Creator's total.
  - An unauthenticated request to each analytics route is refused.
  - The trend returns one point per day for seven days, including days with no
    Views.
  - The Posts count in analytics equals the length of the Creator's own Posts
    list, asserted through both endpoints in one test so the two screens cannot
    drift.

## Out of Scope

- Reader-facing subscriber counts, or any notion of a Reader subscribing.
- Traffic sources, referrers, and the popular-Posts panel beyond what already
  ships.
- Per-Post analytics detail pages.
- Historical backfill of Views recorded before ownership existed.
- Cross-Creator admin reporting.

## Further Notes

The domain glossary already settles this: a View is "one recorded read of a
Published Post. Counted per Post and reported to its Creator." The current
behaviour contradicts the definition the codebase is written against, which is
the strongest argument for fixing it rather than relabelling the cards.

Removing Subscribers and Engagement from the Hub is a visible product change.
It is the honest one: both are currently platform figures presented as personal
ones, and neither has a per-Creator definition to fall back on.

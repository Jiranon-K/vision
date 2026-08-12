# 13 — The Smart Creator Hub fetches through one seam

**Status:** ready-for-agent

## Problem Statement

Every screen in the Smart Creator Hub loads its data the same way, which sounds
good until you notice that "the same way" means "each one wrote it again". Each
hook holds its own loading flag, its own error string, its own effect that
fetches on mount, and its own refresh function. The behaviour is similar because
someone copied it carefully, not because anything guarantees it.

The consequences are all the ones this duplication always produces:

- **Nothing is cached.** Navigating from the dashboard to Posts and back refetches
  everything, every time.
- **Nothing is shared.** Two components needing the same data issue two requests.
- **Nothing is deduplicated.** A screen that mounts two consumers of the same
  data fetches it twice, concurrently.
- **Nothing is revalidated.** Data that arrived when the tab was opened is still
  on screen an hour later, with no indication it is stale.
- **Errors are strings and recovery is manual.** No retry, no distinction between
  a network failure and a refusal, and every hook decides for itself what to do
  when the session has expired.
- **Mutations do not update reads.** Deleting a Post triggers a manual refetch of
  one list; anything else showing that Post keeps showing it.

Each hook is individually reasonable and small. That is what makes this the
easiest problem in the folder to keep not fixing, and it is why the review
placed it last: nothing is broken, everything is slightly worse than it should
be, and every new screen makes it worse again.

## Solution

The Hub's data fetching moves behind one seam: a query layer that owns caching,
deduplication, revalidation, retry and the session-expiry response.

- One place decides what a cache key is, how long data stays fresh, and when it
  is revalidated.
- Concurrent requests for the same data are deduplicated into one.
- Navigating back to a screen shows cached data immediately and revalidates
  behind it.
- A mutation invalidates the reads it affects, so the Hub cannot show a Post that
  was just deleted.
- Session expiry is handled once, not per hook, preserving the existing
  single-flight refresh and returning the Creator to sign-in exactly once when
  the refresh is refused.
- The hooks the screens use keep their names and their shapes. This is a change
  of what is behind them, not of how a screen consumes them.

## User Stories

1. As a Creator, I want returning to a screen I have already visited to show data immediately, so that navigating the Hub does not feel like reloading it.
2. As a Creator, I want fresh data to arrive behind what I am already looking at, so that speed does not cost me accuracy.
3. As a Creator, I want two panels showing the same data to make one request, so that opening a screen is not several times more expensive than it needs to be.
4. As a Creator, I want a transient network failure to be retried automatically, so that a moment of bad connectivity is not a wall of errors.
5. As a Creator, I want a refusal not to be retried, so that a permission problem is reported rather than repeated.
6. As a Creator, I want deleting a Post to remove it everywhere in the Hub at once, so that no screen shows something that no longer exists.
7. As a Creator, I want publishing a Post to update my Posts list and my analytics, so that the Hub agrees with itself.
8. As a Creator, I want the Hub to revalidate when I return to the tab after a while, so that I am not looking at this morning's numbers this afternoon.
9. As a Creator, I want an expired session to return me to sign-in once, cleanly, so that I do not see several failures or several redirects.
10. As a Creator, I want a loading state on first load and a quieter one on revalidation, so that a background refresh does not blank the screen.
11. As a Creator, I want a failed request to offer a retry, so that recovery does not mean reloading the page.
12. As a Creator, I want an empty result to read as empty rather than as an error, so that a new account is not alarming.
13. As a maintainer, I want caching, retry and session-expiry policy expressed once, so that a new screen inherits them instead of reimplementing them.
14. As a maintainer, I want the layering rule that keeps fetching out of pages and components to continue to hold, so that this change tightens the existing structure rather than working around it.
15. As a maintainer, I want cache keys derived from the Post wire contract's shapes, so that a change to what is fetched has one place to change.

## Implementation Decisions

- **One query layer, adopted rather than written.** The behaviours needed here —
  keyed caching, request deduplication, stale-while-revalidate, retry policy,
  invalidation on mutation — are exactly what an established client library
  provides. Writing them is a well-known way to spend a month reproducing known
  bugs.
- **The existing hooks are the seam and they keep their interfaces.** Screens
  keep consuming data, loading and error the way they do now. Reimplementing the
  hooks over the query layer means the screens do not change, and the interface
  that was already the right shape stays the right shape.
- **The credential-carrying fetch and the single-flight refresh stay where they
  are.** They already exist, they already work, and the query layer sits above
  them. Replacing them at the same time would conflate two changes and put the
  session logic back in play for no benefit.
- **Session expiry is handled once, at the query layer's error boundary.** A
  refused refresh returns the Creator to sign-in exactly once regardless of how
  many requests were in flight.
- **Retry policy distinguishes transient from terminal.** Network failures and
  server errors are retried with backoff; refusals and not-found are not.
- **Mutations declare what they invalidate.** Deleting or publishing a Post
  invalidates the Posts list and the analytics that summarise it, so the Hub is
  consistent without any screen coordinating with another.
- **Freshness windows are set per kind of data**, in one place: a Posts list is
  short-lived, analytics tolerate more, capabilities are effectively static.
- **The layering rule holds.** Fetching stays out of pages and components; the
  linter rule that enforces this continues to pass, and the query layer lives
  where fetching is already allowed.
- **Server-rendered marketing pages and the blog are untouched.** They fetch on
  the server and have none of these problems; pulling them into a client query
  layer would be a regression.
- **This is deliberately a refactor with no new screens.** The Hub looks and
  behaves the same, minus the refetching.

## Testing Decisions

A good test here drives the Hub as a Creator would and asserts what appears on
screen and what requests were made. Testing a hook in isolation would assert the
library's behaviour rather than the product's.

- **Seam:** the browser suite against the running application. The Hub's screens
  are the interface; the hooks are implementation behind them.
- **Prior art:** the existing publishing and editor browser suites, which sign in
  as a seeded Creator and drive the Hub end to end; the excerpt suggestion suite
  for asserting a screen's states rather than a module's internals.
- **Cases:**
  - Navigating from the dashboard to Posts and back renders immediately, without
    a blanking loading state.
  - Deleting a Post removes it from the Posts list and from any other screen
    showing it, without a manual reload.
  - Publishing a Draft updates the Posts list and the analytics figures.
  - A screen with two consumers of the same data issues one request — asserted by
    observing network activity.
  - A failed request renders an error with a retry that succeeds once the failure
    clears.
  - An empty account renders empty states, not errors.
  - An expired session returns the Creator to sign-in once, with several requests
    in flight.
  - A revalidation after returning to the tab updates the figures without
    clearing the screen.

## Out of Scope

- Server-rendered marketing pages and the blog.
- Replacing the credential-carrying fetch or the refresh mechanism.
- Optimistic updates and offline support.
- Any visual redesign of the Hub.
- New screens or new data.
- Real-time updates.

## Further Notes

This is last in the folder for a reason: it is the only ticket here that fixes no
defect. It is the one that stops the next twelve screens from each inheriting the
problem, which makes it worth doing and easy to defer forever.

It is best done after the pagination ticket. Pagination changes what the list
hooks fetch, and reimplementing them on a query layer first would mean
reimplementing them again a week later.

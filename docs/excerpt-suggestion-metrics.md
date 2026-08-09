# Excerpt Suggestion usage metrics

Every time a Creator is issued an Excerpt Suggestion, the event is recorded
durably (`ExcerptSuggestion`, `server/src/models/ExcerptSuggestion.ts`) —
which Creator, which Post if one has been saved, the suggested text, and
when. This is queried by hand, roughly monthly, to check two thresholds that
were fixed before the capability was built. There is no dashboard for this on
purpose: building one for a capability that has not yet earned its place is
investment stacked on investment.

## The thresholds

| Question                                                                                      | Threshold                     | If it's not met                                       |
| --------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| **Adoption** — of Posts published in the window, what share had a suggestion issued for them? | Under 25% over 30 days → stop | Stop building further AI capabilities.                |
| **Kept unedited** — of suggestions issued, what share matches the Post's Excerpt exactly?     | Under 40% → fix the prompt    | Fix the prompt before reaching for a different model. |

## Running the report

From the `server/` directory:

```bash
bun run excerpt-suggestion-metrics
# or a different window:
bun run excerpt-suggestion-metrics --days=60
```

This connects to `MONGODB_URI` and prints both numbers, e.g.:

```
Excerpt Suggestion usage — last 30 day(s)

Adoption (threshold: stop building AI capabilities under 25%)
  Posts published:        42
  ...with a suggestion:   9
  Adoption rate:          21.4%
  -> Below threshold: stop building further AI capabilities.

Kept unedited (threshold: fix the prompt under 40%)
  Suggestions issued:     9
  ...kept unedited:       5
  Kept-unedited rate:     55.6%
```

## What each query does

Both queries live in `server/src/reporting/excerptSuggestionMetrics.ts`
(`computeAdoption`, `computeKeptUnedited`) and are exercised directly in
`server/tests/integration/excerpt-suggestion-metrics.test.ts` — read either
for the exact logic. In outline:

- **Adoption**: find Posts with `status: 'Published'` and `createdAt` in the
  window, then check how many distinct `post` ids appear in
  `ExcerptSuggestion` for that set (`ExcerptSuggestion.distinct('post', { post:
{ $in: postIds } })`). A suggestion counts whenever it was issued, not only
  if it was issued within the window — a Creator may draft for a while before
  publishing.
- **Kept unedited**: find `ExcerptSuggestion` documents with a `post` set and
  `createdAt` in the window, then compare each one's `text` against that
  Post's current `excerpt` for an exact match. A suggestion with no `post` —
  asked before the Post was ever saved — cannot be compared and is excluded.

## How a suggestion finds its Post

The editor sends the Post id only when the Post has already been saved. The
common flow does not: a Creator writes a new Post, asks for a suggestion, and
saves afterwards — so the record is written with no `post`. Left there, both
numbers above would read near zero however many Creators used the button, and
the 25% threshold would say "stop" about an artefact of the code rather than
about anyone's behaviour.

So creating a Post claims one suggestion: that Creator's most recent
unattributed one, if it was issued in the last 6 hours. Claiming is kept this
narrow on purpose — every widening buys attribution for a suggestion that was
probably abandoned, at the price of pinning it to a Post it was never about,
which shows up as a guaranteed non-match in kept-unedited.

Three consequences to read the numbers with:

- A Creator who asks about a Post they abandon, then creates a different Post
  within 6 hours, hands that one orphan to the wrong Post — inflating adoption
  by one and adding one certain non-match. Bounded at one record per Post.
- Asking several times before saving records several suggestions; only the
  last is claimed. The earlier ones stay out of kept-unedited, which is the
  right reading — the last is the one the Creator worked from.
- An orphan older than 6 hours is never claimed.

`server/tests/integration/suggest-excerpt.test.ts` covers both the claim and
the case where another Creator's orphan must not be taken.

Both queries return `null` (not `0`) for their rate when there is nothing to
divide by — read that as "not enough data yet," not as a failing number.

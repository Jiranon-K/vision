# 03 — Excerpt Suggestion made safe to put in front of real Creators

**What to build:** The happy path exists; this ticket covers the three ways it can go wrong in front of a real Creator. Each one, left unhandled, costs trust rather than uptime: work silently destroyed, a bad summary passed off as the AI's, or one Creator's enthusiasm spending everyone's budget.

| State     | When                                | What the Creator sees                                                                                              |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| confirm   | the Excerpt field already has text  | asked to confirm before it is replaced                                                                             |
| degraded  | the provider fails or times out     | the derived Excerpt lands in the field, and the Creator is told plainly that suggestions are unavailable right now |
| throttled | too many requests in a short window | told they have asked too often and to try again later; the button returns to idle                                  |

The degraded state is the important one, and the honesty is the point: the Creator gets something usable, and is not misled into believing a truncated string is what the AI produced. The response says which of the two sources the text came from, so the editor can tell them apart without inferring it from a status code.

This ticket also locks down the invariant from the ADR with a test. The invariant is worth nothing as prose — the tempting change is to call the provider while saving so the Excerpt is always good, which makes publishing depend on a third party being up. A test that fails the moment a provider becomes reachable from the save path is what actually prevents that.

**Blocked by:** 02 — the module, route, and button must exist before their failure states can.

**Status:** ready-for-agent

- [ ] Asking for a suggestion when the Excerpt field is non-empty prompts for confirmation; declining leaves the Creator's text untouched
- [ ] When the provider fails or times out the request still succeeds, the derived Excerpt is returned, and the response distinguishes it from a provider-produced suggestion
- [ ] The editor shows a clearly different message for a degraded result than for a successful one
- [ ] Requests are limited per Creator using the rate limiting already in the server; exceeding the limit is reported as such and the editor recovers to idle
- [ ] Content beyond the accepted length is rejected by validation before any provider is called
- [ ] Tests cover: provider throws, provider times out, limit exceeded, oversized content, and confirmation declined
- [ ] A test asserts that creating and updating a Post reach no provider, and fails if that ever changes
- [ ] No test performs a real network call

# ADR 0002: AI must not sit on the save or publish path

Status: Accepted

## Context

The blog's page metadata uses a Post's Excerpt verbatim as its description.
`server/src/utils/postContent.ts` currently derives an Excerpt by truncating the
Post's content when none is provided — a mechanical fallback, not a good
summary. Improving it with an AI-generated Excerpt Suggestion is worth doing.

The tempting implementation is to call an AI provider from `createPost` or
`updatePost` so every Post ends up with a good Excerpt automatically. The
consequence: publishing a Post would depend on a third party's uptime. A
provider outage, rate limit, or slow response would block saving or publishing
work that has nothing to do with AI.

## Decision

Providers are only ever reached from a separate, Creator-initiated request.
The save path (`createPost`, `updatePost`) and the publish path reach no
provider, directly or indirectly. Requesting an Excerpt Suggestion is a
distinct action the Creator triggers; accepting one is a separate write that
updates the Post's Excerpt.

## Consequences

- A Creator can always save a Draft and publish a Post even when no provider is
  reachable.
- This invariant is enforced by a test — the save and publish paths are
  checked to make no provider call.
- Requesting an Excerpt Suggestion can fail on its own, independently of
  saving or publishing, and must be handled as its own error case.

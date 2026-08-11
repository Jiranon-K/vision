# Production readiness

Thirteen specs from an architecture review of the repository. They are ordered by
severity, and the order is also a reasonable implementation order: several later
tickets depend on decisions the earlier ones make.

Every ticket is testable at the seam the repository already uses — the HTTP API
exercised end to end for server work, the browser suite for anything a Creator
sees. Two tickets open a narrow internal seam of their own, and say so.

## Blocking a production launch

| #                                                   | Ticket                                | Why it blocks                                                                          |
| --------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| [01](01-a-creator-sees-only-their-own-posts.md)     | A Creator sees only their own Posts   | Any signed-in Creator can read every other Creator's Drafts in full                    |
| [02](02-growth-analytics-belongs-to-one-creator.md) | Growth Analytics belongs to a Creator | The Hub's figures are platform-wide, shown as personal, and readable without a session |
| [03](03-verification-runs-on-every-change.md)       | Verification runs on every change     | The repository's own checks are excellent and nothing runs them                        |
| [04](04-the-api-edge-answers-for-itself.md)         | The API edge answers for itself       | No error handler, no not-found handler, no security headers; failures are anonymous    |

## Reliability and operations

| #                                                      | Ticket                                     | Why it matters                                                                          |
| ------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| [05](05-signing-out-actually-ends-the-session.md)      | Signing out ends the session               | A refresh token survives sign-out for up to thirty days and cannot be revoked           |
| [06](06-the-server-says-what-it-is-doing.md)           | The server says what it is doing           | Unstructured logs and a health check that reports healthy while the database is down    |
| [07](07-rate-limits-survive-more-than-one-instance.md) | Rate limits survive more than one instance | Every limit is per process; two instances double it and a restart resets it             |
| [08](08-the-whole-platform-ships-as-images.md)         | The whole platform ships as images         | The frontend is containerised and the API is not; no composition brings the platform up |

## Scale and contract

| #                                                   | Ticket                                  | Why it matters                                                                               |
| --------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| [09](09-the-posts-list-stops-sending-everything.md) | The Posts list stops sending everything | Every listing returns every match, with full content, unpaginated                            |
| [10](10-a-published-slug-stops-moving.md)           | A Published Slug stops moving           | Editing a title moves a live URL, breaking every shared link — the glossary says it must not |
| [11](11-search-stops-reading-every-post.md)         | Search stops reading every Post         | Search scans the collection, matches titles only, and does not rank by relevance             |
| [12](12-a-view-means-one-reader-read-it.md)         | A View means one Reader read it         | Views are an open counter anyone can increment, and they are what analytics reports          |
| [13](13-the-hub-fetches-through-one-seam.md)        | The Hub fetches through one seam        | Every Hub hook reimplements loading, error and refetch; nothing is cached or shared          |

## Dependencies between tickets

- **01 before 09 and 11** — pagination and search must obey the ownership rules, and writing their ownership cases before 01 means writing them twice.
- **04 before 06** — an unhandled failure becomes a log line only once something catches it in one place.
- **06 before 08** — the container's health configuration needs a readiness endpoint to point at.
- **07 alongside 08** — the composition provides the shared rate-limit store locally.
- **09 before 11 and 13** — both consume the listing shape that 09 establishes.
- **02 does not wait for 12** — 02 closes an open endpoint and is urgent on its own; 12 then makes the figures it reports trustworthy. Do 02 now, 12 when it comes up.

Nothing else is ordered. 03, 05 and 10 can be picked up at any point.

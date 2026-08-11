# 01 — A Creator sees only their own Posts

**Status:** ready-for-agent

## Problem Statement

A Creator who signs in to the Smart Creator Hub is shown every Post in the
system, not their own. That includes other Creators' Drafts — unpublished
writing, in full, with the owner's identity attached.

Nothing about the interface admits this. The Hub presents the list as "your
Posts", so a Creator discovers it only by recognising a title they never wrote.
Deleting or editing those Posts is correctly refused, but reading them is not,
and reading unpublished work is the part that costs a Creator the platform.

The list endpoint hides Drafts from anonymous callers and stops there. Having a
session at all is treated as sufficient grounds to see everything.

## Solution

The Posts list answers with the Posts the caller owns, and nothing else.

- A signed-in Creator asking for their Posts gets exactly the Posts they own,
  Draft and Published alike.
- A Reader — anyone without a session — gets Published Posts only, and never a
  Creator's identifiers.
- An admin keeps the ability to see across Creators, because moderation depends
  on it, and that ability is asserted by a test rather than implied.

The two audiences stop sharing one endpoint's conditional. Public reading and
Hub listing are different questions with different answers, and the code says so.

## User Stories

1. As a Creator, I want the Smart Creator Hub to list only the Posts I own, so that the count and the contents match what I actually wrote.
2. As a Creator, I want my Drafts to be unreadable by other Creators, so that unfinished writing stays private until I publish it.
3. As a Creator, I want my Published Posts to appear in my own list too, so that the Hub is the complete record of my work.
4. As a Creator, I want filtering by Category to search within my own Posts, so that a filter narrows my work rather than the platform's.
5. As a Creator, I want filtering by status to show my Drafts and my Published Posts, so that I can find work in progress.
6. As a Creator, I want search to match only my Posts, so that a title I search for cannot reveal that another Creator is writing about the same thing.
7. As a Reader, I want the public blog to list Published Posts, so that I can read what Creators have chosen to release.
8. As a Reader, I want no Draft to reach me under any circumstances, so that what I read is what its Creator intended to publish.
9. As a Reader, I want the public blog to expose no Creator identifiers beyond the attributed author, so that browsing does not enumerate the platform's account holders.
10. As an admin, I want to list Posts across Creators, so that I can moderate content and support Creators who report a problem.
11. As an admin, I want my cross-Creator access to be an explicit, tested capability, so that nobody mistakes it for the default behaviour.
12. As a Creator, I want fetching a single Post by id to refuse Posts I do not own, so that guessing an identifier is not a way around the list.
13. As a security reviewer, I want a test that fails the moment one Creator can read another's Post, so that this cannot regress silently.
14. As a maintainer, I want the public reading path and the Hub listing path to be separately named, so that a future change to one cannot accidentally widen the other.

## Implementation Decisions

- **Ownership is a filter, not a check.** The list query is constrained by owner
  before it reaches the database. A post-query filter would still pull other
  Creators' content into the process, and the first refactor that forgets the
  filter leaks it.
- **The public reading path is separated from the Hub listing path.** They are
  two interfaces with two audiences: one answers "what may a Reader read", the
  other "what does this Creator own". Sharing one endpoint and branching on
  whether a session happens to be present is what produced this defect. The
  public path takes no session into account at all.
- **Admin is the only exception and it is explicit.** The admin role widens the
  owner constraint rather than skipping it, and the widening is one named
  decision in one place.
- **Fetch-by-id follows the same rule.** A Post that the caller neither owns nor
  can read publicly answers as missing, not as forbidden — a distinct response
  would confirm the identifier exists.
- **The public representation excludes owner identifiers.** Fields that exist to
  serve the Hub are not part of what a Reader receives.
- **No schema change.** The Post already carries an owner and an index on owner
  with creation order; the work is to use them.
- **The Post wire contract is unchanged.** The frontend continues to consume the
  same single owner of the Post wire shape; the change is which Posts arrive,
  not their shape.

## Testing Decisions

A good test here asserts what a caller can observe: which Posts come back for
which identity. It does not reach into the query that produced them — a test
that asserts the shape of a database filter passes even when the filter is
applied to the wrong collection.

- **Seam:** the HTTP API, exercised end-to-end against the running Express app.
  This is the existing seam for authorization tests; no new seam is introduced.
- **Prior art:** the Post ownership authorization suite already registers two
  Creators, has one create a Post, and asserts the other is refused on edit and
  delete. The new cases extend that file's shape directly.
- **Cases:**
  - Creator A lists Posts and receives only Posts A owns, with B's Draft and B's
    Published Post both absent.
  - Creator A fetches B's Post by id and is told it does not exist.
  - A Reader lists Posts and receives only Published Posts, from every Creator.
  - A Reader receives no owner identifier in any listed Post.
  - An admin lists Posts and receives Posts across Creators.
  - Category, status and search filters each narrow within the owner constraint
    rather than escaping it — asserted with a Post of the same Category owned by
    another Creator, which must not appear.

## Out of Scope

- Pagination and payload size of the list — a separate ticket.
- Sharing a Draft with a named collaborator; ownership stays singular.
- Changing what the admin role is or how it is granted.
- Any change to the editor or to publishing.

## Further Notes

This is the highest-severity finding in the architecture review: it is a
cross-account read of unpublished content, reachable by any Creator with a free
account, through the platform's most-used endpoint.

The existing test suite covers anonymous Draft visibility thoroughly and
cross-Creator visibility not at all, which is why the defect has been green
since the owner field was introduced. The tests added here are the durable part
of the fix.

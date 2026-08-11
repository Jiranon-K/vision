# 09 — The Posts list stops sending everything

**Status:** ready-for-agent

## Problem Statement

Asking for Posts returns every matching Post, in one response, with each Post's
full content. The list view needs a title, a Category, a status, a date, a
Slug, a read time and a View count. It receives all of that plus the entire
Markdown body of every Post.

The only field the endpoint excludes is the cover image, which suggests someone
already noticed the response was too large and treated the symptom.

The cost grows without limit and it grows on both sides of the platform. The
public blog listing sends every Published Post's body to every Reader who loads
the page. A prolific Creator's Hub sends their whole archive on every visit. At
a hundred Posts of ordinary length this is already several megabytes for a screen
that renders titles; there is no point at which it stops growing, and no
parameter a client can pass to ask for less.

This is also why the blog's listing and the Hub's listing cannot be cached
usefully — the payload is different every time anything changes anywhere.

## Solution

Listing a Post and reading a Post become different requests with different
payloads.

- A listing returns the fields a listing displays. Content is not among them.
- A listing is paginated, with a default page size and a maximum the caller
  cannot exceed.
- The response reports whether more Posts exist and how to ask for them.
- Reading a single Post, by identifier for a Creator or by Slug for a Reader,
  returns the full Post including its content, exactly as it does now.
- The public blog and the Smart Creator Hub both page through the list rather
  than assuming it arrived whole.

## User Stories

1. As a Reader, I want the blog listing to load quickly regardless of how many Posts exist, so that browsing does not get slower as the platform grows.
2. As a Reader, I want to page through older Posts, so that the archive is reachable without one enormous response.
3. As a Reader on a metered connection, I want a listing not to download every Post's full text, so that reading one Post does not cost me all of them.
4. As a Creator, I want my Hub to open quickly with a large archive, so that being prolific is not punished.
5. As a Creator, I want to page through my Posts, so that I can reach older work.
6. As a Creator, I want the Excerpt shown in a listing, so that a page of titles is still scannable.
7. As a Creator, I want opening a Post for editing to load its full content, so that pagination does not cost me anything in the editor.
8. As a Creator, I want filters and search to apply before pagination, so that page one of a filtered list is the first matches, not the first Posts that happen to match.
9. As a Creator, I want a stable ordering across pages, so that paging does not show me the same Post twice or skip one.
10. As a client developer, I want the response to say whether more results exist, so that I can render pagination without a second request to find out.
11. As a client developer, I want a page size I request beyond the maximum to be clamped rather than rejected, so that a client bug degrades instead of failing.
12. As a client developer, I want an invalid page parameter refused with a clear message, so that a typo is not silently interpreted.
13. As a maintainer, I want the listing shape declared once and shared by both consumers, so that the two cannot drift.
14. As an operator, I want a listing's cost bounded by page size rather than by the size of the collection, so that response times stay predictable.
15. As a Creator, I want a Post's View count and read time in the listing, so that the Hub's columns keep working.

## Implementation Decisions

- **The listing representation is a distinct, named shape**, not the full Post
  with fields removed. Naming it makes it reviewable and makes accidental
  additions to it visible; subtracting fields from a full record invites the next
  person to add one back.
- **Content is excluded at the database, not after loading.** Projecting in the
  query is what makes the request cheap; loading and discarding only makes the
  response smaller.
- **The Excerpt is part of the listing shape.** It exists precisely to stand in
  for content in listings, and the domain glossary says so.
- **Pagination is cursor-based, on the existing creation-order indexes.** Offset
  paging degrades on later pages and skips or repeats rows when a Post is created
  mid-traversal. The cursor is opaque to clients so its composition can change.
- **The default page size is modest and the maximum is enforced server-side.** A
  requested size above the maximum is clamped, not refused, so a client mistake
  degrades rather than breaks.
- **Ordering is newest first and total**, with the identifier as a tie-break, so
  a cursor is unambiguous even when two Posts share a timestamp.
- **The response carries the items and a next cursor**, present only when more
  exist. No total count: counting the whole collection on every page defeats the
  purpose of paginating it.
- **Filters and search apply before pagination.** This is the natural reading and
  the only one that makes a filtered first page mean anything.
- **Reading a single Post is unchanged.** Both single-Post paths keep returning
  the full record.
- **The Post wire contract absorbs the new shape.** The single owner of the Post
  wire shape gains the listing representation and its mapping, so both consumers
  read it from the same place, per the code-standards decision record.
- **Both clients page.** The blog listing and the Hub's Posts table request
  further pages rather than assuming the first response is the whole list.

## Testing Decisions

A good test asserts what a caller receives for a given request: which Posts, in
which order, with which fields, and whether another page is offered. It does not
assert the composition of the cursor — that is deliberately opaque, and pinning
it would prevent the change it exists to allow.

- **Seam:** the HTTP API against the running Express app. Existing seam. The
  clients' paging behaviour is covered at the existing browser seam.
- **Prior art:** the Posts search integration suite, which seeds several Posts
  and asserts which come back; the browser suites for blog and publishing.
- **Cases:**
  - A listing omits content and includes title, Excerpt, Category, status, date,
    Slug, read time and Views.
  - With more Posts than the page size, the first page returns exactly the page
    size and offers a next cursor.
  - Following the cursor returns the following Posts, with no repeats and no gaps
    across the full traversal.
  - The last page offers no next cursor.
  - A requested page size above the maximum is clamped.
  - An invalid page parameter is refused with a clear message.
  - Filters and search narrow the result before pagination, asserted by filtering
    to a Category with more matches than one page.
  - Ordering is stable when two Posts share a creation timestamp.
  - Reading a single Post by identifier still returns full content.
  - Reading a Published Post by Slug still returns full content.
  - A Reader paging the public listing never receives a Draft — the ownership
    rules hold on every page, not only the first.
  - At the browser seam: the blog listing renders a further page, and the Hub's
    Posts table reaches a Post that is not on the first page.

## Out of Scope

- Caching, revalidation and content delivery configuration.
- Infinite scroll as an interaction; how the client asks for the next page is a
  design decision, not this ticket's.
- Changing sort order, or letting a caller choose one.
- Search relevance ranking — a separate ticket.
- Any change to the single-Post endpoints.

## Further Notes

This ticket should follow the owner-scoping ticket. Paginating a list that
returns the wrong Posts would mean writing the pagination cases twice, and the
cross-Creator cases here are only meaningful once ownership is enforced.

The exclusion of the cover image from the current listing can be revisited once
a proper listing shape exists: a listing that shows a card probably wants a cover
image and definitely does not want the Markdown body. The current selection has
it exactly backwards.

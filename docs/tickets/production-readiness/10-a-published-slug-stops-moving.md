# 10 — A Published Slug stops moving

**Status:** ready-for-agent

## Problem Statement

The domain glossary defines a Slug as "the URL-safe identifier a Published Post
is read at. Stable and unique across Posts." The code honours the uniqueness and
ignores the stability.

Every time a Creator changes a Post's title, the Slug is regenerated from the new
title — including on a Post that has been Published for months. The moment that
edit is saved:

- every link a Reader saved goes to a page that no longer exists,
- every link shared to a social channel breaks, which is the opposite of what
  Multi-Channel Sync exists to do,
- search engines lose the URL they had indexed, and the Search Visibility the
  Creator paid for is spent again from zero,
- and nothing tells the Creator any of this happened.

A Creator fixing a typo in a headline has no reason to expect it to break their
own distribution.

There is a second defect in the same code. Uniqueness is established by querying
for each candidate Slug in a loop until one is free, then saving. Two Posts
created at the same moment with the same title both find the same candidate free
and both try to save it; the unique index refuses the second, and the Creator
receives an unexplained server error rather than a Post.

## Solution

A Slug is assigned once and then belongs to the Post.

- A Draft's Slug follows its title, because a Draft has no Readers and no
  indexed URL.
- Publishing fixes the Slug. From then on the title and the Slug are independent.
- A Creator who genuinely wants a different Slug can set one deliberately, and is
  told plainly that the old address will stop working unless a redirect is kept.
- Where a Creator changes a Published Post's Slug, the old Slug is retained and
  redirects to the new one, so existing links survive.
- Concurrent creation of two Posts with the same title produces two Posts with
  distinct Slugs, not one Post and one error.

## User Stories

1. As a Creator, I want editing the title of a Published Post to leave its address alone, so that fixing a headline does not break every link to it.
2. As a Creator, I want links I have already shared to keep working after I edit a Post, so that Multi-Channel Sync does not distribute addresses that expire.
3. As a Creator, I want search engines to keep the URL they indexed, so that Search Visibility accumulates instead of resetting.
4. As a Creator, I want a Draft's Slug to keep following its title while I am still deciding, so that I am not stuck with the address generated from my first rough headline.
5. As a Creator, I want to see the Slug a Post will be published at before I publish, so that I can change it while changing it is free.
6. As a Creator, I want to edit the Slug deliberately, so that I am not permanently stuck with an address I regret.
7. As a Creator, I want a plain warning when I change a Published Post's Slug, so that I understand I am moving a live address.
8. As a Reader, I want an old address to take me to the Post it used to point at, so that a bookmark or a shared link does not simply fail.
9. As a Reader, I want that redirect to be permanent, so that my browser and search engines learn the new address.
10. As a Creator, I want a Slug I choose to be refused if another Post already holds it, with a clear message, so that I can pick another rather than silently colliding.
11. As a Creator, I want two Posts with the same title to get distinct addresses, so that a duplicated headline is not an error.
12. As a Creator, I want creating a Post to succeed even when someone else creates one with the same title at the same moment, so that a coincidence is not a failure.
13. As a Creator, I want a title made entirely of punctuation or non-Latin script to still produce a usable address, so that the language I write in does not break publishing.
14. As a maintainer, I want the rule about when a Slug may change stated in one place, so that a future editor cannot reintroduce the drift.

## Implementation Decisions

- **Slug mutability is a function of Post status, decided in one place.** A
  Draft's Slug is derived from its title on every save. A Published Post's Slug
  changes only when the Creator sets one explicitly. This single rule is the
  ticket; everything else is consequence.
- **Publishing is the moment the Slug is fixed.** It is the moment the Post
  acquires Readers and an indexed address, and the glossary's definition of Slug
  is scoped to a Published Post.
- **Uniqueness is enforced by the database, not by a lookup loop.** The unique
  index is the authority; the write attempts a candidate, and a duplicate-key
  rejection triggers the next candidate. This removes both the race and the
  repeated queries per creation.
- **A Post retains its previous Slugs.** When a Published Post's Slug changes,
  the old value is kept on the Post, and reading by a retained Slug answers with
  a permanent redirect to the current one. Retained Slugs participate in
  uniqueness, so a released address cannot be claimed by a different Post — an
  address that silently starts pointing at someone else's Post is worse than one
  that fails.
- **A Creator-supplied Slug is normalised and validated** the same way a derived
  one is, and a collision is refused with a message naming the problem rather
  than silently appended to.
- **The editor shows the Slug and allows editing it**, with the warning attached
  to changing a Published Post's Slug. Where the Slug is derived, the field
  reflects what will be generated.
- **Existing Posts are unaffected.** Their current Slugs are already their
  addresses; the change is only that those addresses stop moving.
- **The domain glossary is not amended.** It already says what the behaviour
  should be. The code is what changes.

## Testing Decisions

A good test asserts the address a Post is readable at, before and after an edit,
and what happens to the old one. It does not assert the internal string
transformation — that is covered adequately by asserting the addresses that
result.

- **Seam:** the HTTP API against the running Express app. Existing seam.
- **Prior art:** the ownership authorization suite for the create-then-edit
  fixture shape; the excerpt derivation cases for the "server derives it and
  ignores what the client sent" pattern, which the Slug now follows for Published
  Posts.
- **Cases:**
  - Editing a Draft's title changes its Slug.
  - Publishing fixes the Slug at its current value.
  - Editing a Published Post's title leaves its Slug unchanged, and the Post is
    still readable at the original address.
  - A Creator explicitly setting a Published Post's Slug changes it, and the old
    address answers with a permanent redirect to the new one.
  - A retained Slug cannot be claimed by a different Post.
  - A Creator-supplied Slug that collides with another Post's current or retained
    Slug is refused with a clear message.
  - Two Posts created with the same title receive distinct Slugs.
  - Two Posts created concurrently with the same title both succeed with distinct
    Slugs.
  - A title of punctuation only, and a title in non-Latin script, each produce a
    usable Slug.
  - At the browser seam: a Creator publishes a Post, notes its address, edits the
    title, and the original address still loads the Post.

## Out of Scope

- A Slug history user interface or an audit trail of past addresses.
- Bulk editing of Slugs.
- Localised or per-language Slugs.
- Search-engine submission or sitemap prioritisation beyond what already ships.
- Redirects for Posts that have been deleted.

## Further Notes

This is the clearest case in the review of code contradicting the repository's
own domain glossary. That makes it unusually cheap to argue about: the intended
behaviour is already written down and agreed, and the ticket is to make the code
match it.

The duplicate-key race is folded in here rather than split out because both
defects live in the same derivation and fixing them separately would mean
rewriting it twice.

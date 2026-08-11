# 11 — Search stops reading every Post to answer

**Status:** ready-for-agent

## Problem Statement

Searching in the Smart Creator Hub matches a case-insensitive pattern against
Post titles. The pattern is unanchored, so the database cannot use any index to
answer it: every search reads every Post in the collection and tests the pattern
against each one.

At the current scale nobody notices. The cost is linear in the number of Posts
on the platform and it is paid on every keystroke that triggers a search, so the
point at which it becomes a problem arrives without warning and arrives first for
whoever is typing fastest.

The results are also poor in a way that is not about speed. Search matches titles
only, so a Creator looking for a Post by a phrase they remember from its body
finds nothing. It matches substrings without regard for words, so a search for a
short word matches it inside longer unrelated words. And there is no ordering by
relevance — results come back newest first, so the best match can be anywhere in
the list.

## Solution

Search is answered from an index, over the fields a Creator would expect to
search, ordered by how well each Post matches.

- Titles, Excerpts and content are searchable.
- Matching is word-based, so a search for a word matches that word.
- Results are ordered by relevance, with recency breaking ties.
- The query is answered from an index, so its cost is bounded by the number of
  matches rather than by the size of the collection.
- Ownership and visibility rules are applied to search exactly as they are to
  listing: a Creator searches their own Posts, a Reader searches Published ones.

## User Stories

1. As a Creator, I want search results to arrive quickly regardless of how many Posts exist on the platform, so that the Hub stays usable as it grows.
2. As a Creator, I want to find a Post by a phrase I remember from its body, so that I do not have to remember the title exactly.
3. As a Creator, I want to find a Post by words in its Excerpt, so that a summary I wrote is not invisible to search.
4. As a Creator, I want the best match first, so that the Post I meant is at the top rather than somewhere in a list ordered by date.
5. As a Creator, I want a search for a word to match that word, so that short words do not match inside unrelated longer ones.
6. As a Creator, I want a multi-word search to favour Posts containing all the words, so that adding a word narrows rather than confuses.
7. As a Creator, I want search to cover my Drafts as well as my Published Posts, so that work in progress is findable.
8. As a Creator, I want search to return only my own Posts, so that a search cannot reveal another Creator's writing.
9. As a Reader, I want blog search to return Published Posts only, so that no Draft is reachable through a search box.
10. As a Creator, I want search to combine with the Category and status filters, so that I can narrow twice.
11. As a Creator, I want a search matching nothing to say so plainly, so that an empty result is not mistaken for a failure.
12. As a Creator, I want punctuation and special characters in my search to be treated as text, so that a search for a term containing symbols does not fail or behave strangely.
13. As a Creator, I want search results paginated like any other listing, so that a broad search does not return everything at once.
14. As a Creator writing in a non-Latin script, I want search to work on my Posts, so that the language I write in is not second class.
15. As an operator, I want search cost bounded by matches rather than by collection size, so that response times stay predictable.

## Implementation Decisions

- **Search moves to the database's text index** over title, Excerpt and content,
  with title weighted highest and content lowest. This is the change that makes
  the query indexed rather than a scan, and it brings word-based matching and
  relevance ordering with it.
- **Relevance orders results; recency breaks ties.** Both are needed: relevance
  alone makes two equally good matches arbitrary, recency alone is what the
  current behaviour does wrong.
- **Ownership and visibility are applied as filters alongside the text match**,
  not after it. A search that finds and then discards another Creator's Posts has
  already read them. This is the same rule the listing ticket establishes, and it
  must hold here or search becomes the way around it.
- **The escaping currently applied to the search term is retained where any
  pattern matching remains**, and the reasoning stays recorded — a Creator's own
  text must never be interpreted as syntax. A text index removes most of the
  exposure but not the principle.
- **Text search is a database capability, and the choice of database is already
  made.** No search service is introduced. This is a deliberate ceiling: it buys
  indexed word matching and relevance, and it does not buy typo tolerance,
  stemming across languages, or faceting. Those are a different ticket with a
  different cost.
- **A short or empty search term is treated as no search**, rather than as a
  search that matches everything, so an in-progress query does not return the
  whole collection.
- **Search results are paginated by the same mechanism as any other listing**,
  and the pagination ticket's cursor accommodates a relevance ordering.
- **Language configuration for the index is chosen so that non-Latin script
  content remains searchable**, even where stemming is unavailable for it.

## Testing Decisions

A good test asserts which Posts a search returns and in what order, given Posts
the test created. It does not assert that a particular index was used — that is
the mechanism, and asserting it would break the moment the mechanism improves.

- **Seam:** the HTTP API against the running Express app. Existing seam.
- **Prior art:** the Posts search integration suite, which already seeds Posts
  and asserts search results, including the case where a search term contains
  characters that would otherwise be read as pattern syntax. Those cases are kept
  and extended.
- **Cases:**
  - A word in a Post's title matches that Post.
  - A word only in a Post's body matches that Post.
  - A word only in a Post's Excerpt matches that Post.
  - A Post matching in its title ranks above one matching only in its body.
  - A search for a short word does not match it inside an unrelated longer word.
  - A multi-word search ranks a Post containing all the words above one
    containing some.
  - A search term containing pattern syntax characters is treated as text and
    does not error.
  - A Creator's search returns their own Drafts and Published Posts and no other
    Creator's Posts.
  - A Reader's search returns Published Posts only.
  - Search combined with a Category filter returns only Posts matching both.
  - A search matching nothing returns an empty result, not an error.
  - A search over non-Latin script content returns the expected Post.
  - A search with more matches than one page paginates, with ordering stable
    across pages.

## Out of Scope

- Introducing a dedicated search service.
- Typo tolerance, synonyms, and cross-language stemming.
- Search-as-you-type suggestions and autocomplete.
- Faceted search and result counts per facet.
- Public site-wide search across marketing pages.
- Highlighting matched terms in results.

## Further Notes

This ticket should follow the owner-scoping and pagination tickets. Both
establish rules that search must obey, and writing search first would mean
writing its ownership and paging cases twice.

The ceiling is set deliberately. A text index is a large improvement over a
collection scan and a small fraction of the cost of a search service. Revisit it
when a Creator complains about result quality rather than about speed —
that complaint is the signal that the ceiling has been reached.

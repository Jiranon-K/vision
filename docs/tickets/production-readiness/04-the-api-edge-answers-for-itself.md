# 04 — The API edge answers for itself

**Status:** ready-for-agent

## Problem Statement

The API has no edge. Every handler is responsible for its own catastrophes, and
the result is three separate problems.

**Failures are anonymous.** A handler that throws is caught locally, printed to
standard output as free text, and answered with a bare server-error message.
There is no request identity, no route, no Creator, no stack in any retrievable
form. In several handlers the caught error is not even referenced — the linter
reports it as an unused binding. When something breaks in production, the
available evidence is that something broke.

**Unknown routes are not answered.** A path that matches nothing falls through
to the framework's default, which is an HTML page. A client that parses every
response as JSON gets a parse error instead of a clear "no such route", and a
typo in a path looks like a client bug rather than a wrong URL.

**The responses carry no protective headers.** No content-type sniffing
protection, no framing policy, no referrer policy, and the framework advertises
itself by name and version in every response.

Each handler also repeats the same guard, so the error contract is whatever the
last handler to be written decided it was.

## Solution

The application gets an edge: a small number of things that are true of every
response, expressed once.

- A single error handler catches anything a handler throws, answers with one
  consistent shape, and logs the failure with enough context to find it again.
- A single not-found handler answers unmatched routes in that same shape.
- Security headers are applied to every response, and the framework stops naming
  itself.
- Handlers stop catching what they cannot handle. A handler catches an error only
  when it has something specific to say about it.

The response shape stays the one the frontend already consumes, so no client
changes.

## User Stories

1. As a Creator, I want a failure to answer in the same shape as every other failure, so that the interface can tell me something useful instead of falling over.
2. As a Creator, I want an unexpected failure never to include internal details, so that a bad moment does not become a disclosure.
3. As a maintainer, I want every unhandled failure logged once with its route, method, status and correlation identifier, so that a report of "it broke at about three" is investigable.
4. As a maintainer, I want the same failure not logged twice by a handler and again by the edge, so that the log is a count of failures rather than of catch blocks.
5. As a maintainer, I want validation failures to keep their existing field-level shape, so that the forms that consume it keep working.
6. As a client developer, I want an unknown path to answer as JSON, so that my parser does not fail on an HTML error page.
7. As a client developer, I want an unknown path to be distinguishable from a known path with no matching record, so that I can tell a wrong URL from a missing Post.
8. As a security reviewer, I want content-type sniffing disabled on every response, so that a stored string cannot be reinterpreted as script.
9. As a security reviewer, I want framing refused by default, so that the Smart Creator Hub cannot be embedded and clickjacked.
10. As a security reviewer, I want a referrer policy set, so that Slugs and query strings do not leak to third-party sites a Reader clicks through to.
11. As a security reviewer, I want the framework's name and version absent from responses, so that a scanner learns nothing for free.
12. As a maintainer, I want a malformed request body to answer as a client error rather than a server error, so that the server error rate means what it says.
13. As a maintainer, I want an unexpected failure to answer with a server error and a genuinely unexpected one to be loud in the log, so that the two are not blended into one silent path.
14. As an operator, I want a correlation identifier on every failure response, so that a Creator can quote it and I can find the exact request.

## Implementation Decisions

- **One error handler, registered after all routes**, is the only place that
  turns an unhandled throw into a response. Handlers keep a local catch only when
  they translate an error into a specific, meaningful answer — the excerpt
  suggestion fallback is the model: it catches because it has a better answer,
  not because it is afraid.
- **One error shape, and it is the existing one.** A message field, plus the
  field-level details that validation already returns. This ticket does not
  redesign the contract the frontend consumes; it makes every route obey it.
- **Expected failures are expressed as typed errors carrying a status**, so a
  handler can say "this is a 404" or "this is a 403" without writing a response,
  and the edge decides how it is rendered. Unrecognised errors become a server
  error with a generic message.
- **Internal detail never crosses the boundary.** Messages, stacks and driver
  errors are logged, not returned. Development may include more; production does
  not, and the distinction is made in one place.
- **A not-found handler is registered after the routes and before the error
  handler**, so an unmatched path produces the same JSON shape as any other
  failure.
- **Security headers come from the established middleware for the framework**
  rather than being hand-rolled, with the framework's self-identifying header
  disabled.
- **Content Security Policy is deliberately deferred.** The API serves JSON, and
  a policy that matters belongs on the Next.js responses that render HTML. That
  is a separate ticket rather than a half-applied header here.
- **The correlation identifier is generated at the edge** and attached to both
  the log line and the failure response. Where a request already carries one from
  an upstream proxy, that value is honoured.
- **The linter's unused-binding warnings in the handlers are resolved by removing
  the redundant catches**, not by renaming the bindings.

## Testing Decisions

A good test here asserts what a caller receives: the status, the response shape,
and the headers. It does not assert that a particular middleware is registered —
that is the implementation, and the point is the observable contract.

- **Seam:** the HTTP API against the running Express app. Existing seam, no new
  one.
- **Prior art:** the resilience test for the excerpt suggestion path, which
  forces a downstream failure and asserts the response the Creator receives; the
  same technique drives a handler to throw here.
- **Cases:**
  - An unmatched path answers as JSON with a not-found status, distinguishable
    from a known route reporting a missing record.
  - A handler forced to throw answers with a server error in the standard shape
    and leaks no internal message.
  - The response to a forced failure carries a correlation identifier.
  - A malformed JSON body answers as a client error, not a server error.
  - Validation failures still answer with the field-level details the forms
    consume — asserted against an existing form-backed route so a regression in
    the shape is caught.
  - Every response carries the sniffing, framing and referrer headers, asserted
    on both a success and a failure.
  - No response carries the framework's self-identifying header.

## Out of Scope

- Content Security Policy on the frontend's HTML responses.
- Structured logging and log transport — a separate ticket; this one defines
  what must be logged at the edge, not how logs are shipped.
- Retry, circuit breaking, and timeouts for outbound calls.
- Changing any existing success response.

## Further Notes

This ticket and the structured-logging ticket are complementary and should be
implemented in that order: the edge is where a failure becomes a log line, so
it needs to exist before there is anything worth transporting.

The four unused error bindings the linter currently reports are the visible
symptom of the underlying shape: handlers catching errors they have nothing to
say about. Removing them is part of the fix rather than a cleanup alongside it.

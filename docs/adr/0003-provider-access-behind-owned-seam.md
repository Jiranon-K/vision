# ADR 0003: Provider access sits behind a seam this repo owns

Status: Accepted

## Context

Generating an Excerpt Suggestion means calling an AI provider. The rest of the
server should ask for an Excerpt Suggestion and never learn which provider,
model, or prompt produced it.

Two concrete facts argue for that separation rather than calling a provider's
SDK directly wherever a suggestion is needed:

- Cheap models are retired on a months-long cadence. Gemini 2.5 Flash-Lite is
  scheduled for retirement on 16 October 2026, superseded by Gemini 3.1
  Flash-Lite. Whatever calls the provider today will need to call a different
  model, possibly with a different request shape, well within this project's
  lifetime.
- Two plausible future directions are already visible: letting a Creator
  supply their own API key, or self-hosting an open model instead of calling a
  hosted one. Both are "swap the provider behind the seam," not a rewrite of
  every caller — provided there is a seam to swap it behind.

## Decision

Provider access lives behind a module this repo owns, exposing a domain-level
operation (produce an Excerpt Suggestion for a Post) rather than a provider's
API surface. The actual provider call is injected into that module rather than
imported by it, so the module's own logic can be exercised without reaching a
real provider.

### Rejected alternatives

- **Hand-written HTTP adapters per provider.** Every provider has its own
  request shape, auth scheme, and response format. Writing and maintaining an
  adapter per provider means owning every provider's API surface forever, and
  that cost grows with each provider or model swap this project makes.
- **Routing through an OpenRouter-style gateway.** A gateway would give one
  interface across providers, but it adds another service on the request path
  that can fail on its own, and it takes a margin on every call — when the
  providers in question can be called directly.

## Consequences

- Switching model, provider, or prompt is a change inside the owned module,
  not a change to every caller of an Excerpt Suggestion.
- The module's logic can be tested with the provider call injected as a fake,
  without depending on a real provider being reachable.
- This repo carries the cost of maintaining the seam itself, in exchange for
  not carrying the cost of a third-party gateway or of hand-rolled adapters
  for every provider.

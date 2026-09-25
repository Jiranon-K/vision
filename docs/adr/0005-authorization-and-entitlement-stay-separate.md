# ADR 0005: Authorization and entitlement are separate axes

Status: Accepted

## Context

Vision has two independent questions about a caller. **Authorization**: are you
allowed to do this — is this Post yours, are you an Admin. **Entitlement**: have
you paid for this — does your Plan include Content Boosting. They arrive at the
same call site and are easy to collapse into one list of roles.

Collapsing them produces role names like `pro_creator`, at which point an
upgrade and a permission grant become the same operation, and the product can no
longer tell a Creator apart from what they bought.

## Decision

The two never merge. Authorization is answered by a `can(actor, action,
resource)` module. Entitlement, when it exists, is answered by a separate one.
No role name may refer to a Plan.

Plan is not modelled in this codebase yet, so no entitlement module is being
built now — writing one today would be a function that always returns true. This
ADR is the whole of the agreement until there is something to enforce it against.

## Consequences

The two produce different answers to the caller: refused because it is not
yours is a 403, refused because you have not upgraded is an upsell. A single
combined check could not tell the interface which to show.

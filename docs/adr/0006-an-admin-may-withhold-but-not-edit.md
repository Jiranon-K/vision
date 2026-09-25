# ADR 0006: An Admin may read and Withhold a Post, but not edit or delete it

Status: Accepted

## Context

An Admin is a member of Vision's staff, not a senior Creator. Before this
decision an Admin could edit and delete any Creator's Post, justified in the
code as moderation.

Moderation and editing are different powers. Stopping a Post from reaching
Readers does not require the ability to change what it says. A platform whose
staff can silently rewrite a paying customer's writing has a problem it cannot
explain afterwards.

## Decision

An Admin may read any Post, including Drafts, and may Withhold a Published one.
An Admin may not edit, delete, or publish another Creator's Post. Withholding is
recorded with who did it, when, and why; the Creator is told their Post is
Withheld but not the recorded reason, so that an internal note does not become
customer-facing copy before there is an appeals process to carry it.

Growth Analytics is scoped by ownership alone and ignores role: an Admin sees
their own numbers and no one else's. A platform-wide view, if it is ever
needed, is a new action rather than a widening of this one.

## Consequences

Nothing in the product can delete a Post except its Creator. Content that must
leave the platform entirely is Withheld first and settled with the Creator
after — accepted knowingly, and the reason to revisit this ADR rather than
quietly restore the delete.

This reverses behaviour that integration tests currently assert ("lets an admin
edit any post"). Those assertions encode the old decision and are expected to
change with it.

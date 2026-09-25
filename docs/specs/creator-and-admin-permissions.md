# Vision can say who may do what to a Post

> Produced by `to-spec` from the design session recorded in [CONTEXT.md](../../CONTEXT.md) and ADRs [0004](../adr/0004-server-owns-authorization-rules.md), [0005](../adr/0005-authorization-and-entitlement-stay-separate.md), [0006](../adr/0006-an-admin-may-withhold-but-not-edit.md).
> Status: approved

## Problem

Vision has no trustworthy account of who may do what to a Post. A member of
staff can rewrite or delete a paying Creator's writing without leaving a trace,
yet has no way to stop a rule-breaking Post reaching Readers short of deleting
it. The rules that do exist are written twice — once where they are enforced and
once where buttons are drawn.

No Creator has complained, because Vision has not yet had to withhold anything
and has no staff outside the founder. The evidence is the code, not a ticket. If
we do nothing, the first takedown request is answered by deleting a customer's
work, and the first person hired gains the ability to edit any customer's
writing on their first day.

## Why now

Nothing external forced this. Two internal facts make it the cheapest moment:
the product has no teams, so permissions still belong to a person rather than to
a membership; and the rules are still small enough to state in one table. Both
stop being true the moment a third role, a Plan-gated capability, or a shared
publication arrives.

## Current behaviour

- Staff can edit and delete any Creator's Post. `server/tests/integration/posts-authz.test.ts` asserts this as intended ("lets an admin edit any post").
- The only way to stop a Published Post reaching Readers is to delete it or turn it into a Draft, which its Creator can re-publish immediately.
- The owner-or-staff rule is written four times in `server/src/controllers/posts.controller.ts` and again in `components/dashboard/posts/PostsTable.tsx` and `components/dashboard/editor/PostEditorForm.tsx`.
- `ADMIN_EMAILS` grants staff status and re-applies it on every sign-in, so removing it from the database does not remove it.
- The code calls the customer an `author`; [CONTEXT.md](../../CONTEXT.md) calls them a **Creator** and lists "Author" as a word to avoid. A leftover of the code's word is printed to Readers beneath the writer's name on the public blog.

## Desired behaviour

A Creator owns their Posts outright: only they may edit, publish, or delete
them. Staff may read any Post and may **Withhold** a Published one, stopping
Readers seeing it in a way the Creator cannot undo. The Creator is told their
Post is Withheld. Staff may not change or destroy a Creator's writing.

Every permission decision is made in one place on the server, and the dashboard
renders controls from the answers it is given rather than working them out
again.

## Out of scope

- **Teams or more than one person on a publication.** Permissions stay on the person; this is the decision that would move them onto a membership.
- **Anything Plan-related.** No capability is gated by Plan and no entitlement module is built — Plan is not modelled in this codebase. See ADR 0005.
- **An admin console.** Withholding is an API capability; no cross-Creator screen is built.
- **Telling the Creator _why_ a Post was Withheld.** The reason is recorded and stays internal until there is an appeals process. See ADR 0006.
- **Staff deleting a Post.** Knowingly absent — nothing will delete a Creator's Post except the Creator.
- **Platform-wide analytics for staff.** Growth Analytics stays scoped by ownership.
- **Revoking a session immediately.** Losing staff status takes effect within one access-token lifetime (15 minutes).
- **An audit log of permission decisions.** Only Withholding is recorded.
- **A settings form for the Byline.** The field is added and read; the form comes later, and until then only the Creator's name is shown.
- **Moving staff status onto a second axis.** [CONTEXT.md](../../CONTEXT.md) now says an Admin is not a tier of Creator; storage catches up when something needs it to.

## In scope

- One server module answering "may this actor perform this action on this resource", and a companion that scopes a listing to what an actor may read.
- Signed-in responses carrying each Post's permitted actions; the dashboard rendering from them and prevented from deriving its own.
- **Withheld** as a state a Published Post can be in, applied and lifted only by staff, recorded with who, when, and why.
- Staff narrowed to read-and-withhold.
- The stored word for the customer changed from `author` to `creator`, without signing anyone out.
- `ADMIN_EMAILS` reduced to bootstrapping the first Admin.
- A `Byline` on the Creator's profile, and the stale role string removed from every Post. In scope because ADR 0006 redefines what an Admin is: leaving the word "Admin" printed under a byline on the public blog would be newly wrong, not merely untidy.

## Acceptance criteria

| #    | Given                                         | When                                              | Then                                                                                  |
| ---- | --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| AC1  | An Admin and a Post owned by another Creator  | The Admin edits or deletes it                     | Refused with 403, and the Post is byte-for-byte unchanged                             |
| AC2  | An Admin and another Creator's Published Post | The Admin withholds it                            | The Post is absent from the public listing and its slug URL returns 404               |
| AC3  | A Withheld Post                               | Its Creator edits it and publishes it             | It stays absent from the public listing; the Creator cannot lift the Withheld state   |
| AC4  | A Withheld Post                               | Its Creator opens the Hub                         | The Post is shown as Withheld, and the recorded reason is not present in the response |
| AC5  | A Withheld Post                               | An Admin lifts the Withheld state                 | It is visible to Readers again, and who withheld it and when remains recorded         |
| AC6  | A signed-in Creator                           | The Hub listing is requested                      | Each Post carries the actions that Creator may perform on it                          |
| AC7  | An anonymous Reader                           | The public listing is requested                   | No Post carries a permissions field at all                                            |
| AC8  | Any component under `components/` or `app/`   | It reads `.role` off a user                       | `bun run lint` fails                                                                  |
| AC9  | A Creator whose stored role was `author`      | The role migration has run and they sign in       | They are signed in as a Creator and see their own Posts                               |
| AC10 | An email removed from the database admin set  | It is still listed in `ADMIN_EMAILS` and signs in | They are not an Admin                                                                 |
| AC11 | A Post created before this change             | It is read by a Reader                            | No role word appears beneath the writer's name                                        |

Non-functional:

- No query is added per Post. The Hub listing and the public listing issue the same number of Mongo operations as before, counted in the existing integration tests.
- The public listing is still served by the `{ status, createdAt }` index, verified with `explain()` asserting an index scan.
- The set the listing scope returns and the set the point check admits are identical for every actor kind, proven against a fixture of Posts across owners and states.

## Constraints

- `server/` is a separate package excluded from the frontend's TypeScript project; no module can be imported by both without moving a build boundary. See ADR 0004.
- Access tokens live 15 minutes and carry the role; refresh re-reads the user. A change to the stored role value must be readable by tokens already issued.
- The wire shape for a Post is declared in `lib/post-contract.ts`; new fields go through it.
- **Behaviour that already passes and must not regress** — covered by existing tests, so not restated as acceptance criteria: an Admin can read any Draft by id; a Creator requesting another Creator's Draft gets 404 rather than 403; Growth Analytics returns only the caller's own figures. Tickets 01 and 02 of `docs/tickets/production-readiness/` established the last two.

## Risks

| Risk                                                                      | Impact                                                     | Mitigation or acceptance                                                                                              |
| ------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| A public read path is missed and keeps serving a Withheld Post            | The takedown silently does not work — an invisible failure | Every public path goes through the listing scope, never a hand-written filter; the scope-agreement test covers it     |
| The role rename ships in one deploy and signs everyone out for 15 minutes | Looks like an outage                                       | Two deploys: read both values first, drop the old one after the data is migrated                                      |
| Nothing can delete a Post any more                                        | A legal takedown cannot be completed inside the product    | Accepted knowingly in ADR 0006; Withhold plus contacting the Creator is the path, and the reason to revisit it        |
| The dashboard and the server disagree about a control                     | A hidden button that was allowed, or one that 403s         | The server authors both the enforcement and the advertised permissions, so there is no second implementation to drift |

## Open questions

| #   | Question                                                                                            | Owner     | Blocking?                                                                                          |
| --- | --------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| Q1  | Does a Withheld Post keep accumulating Views, and does it stay in the search index?                 | Jiranon-K | no — default is to exclude it exactly as a Draft is excluded                                       |
| Q2  | Does the slug URL of a Withheld Post return 404, or a page saying the Post was removed?             | Jiranon-K | no — AC2 assumes 404; a page is a later, additive choice                                           |
| Q3  | May any Admin lift a Withheld state, or only the one who applied it?                                | Jiranon-K | no — AC5 assumes any Admin                                                                         |
| Q4  | Should the Hub listing still return every Creator's Posts to an Admin, now that Analytics does not? | Jiranon-K | no — current behaviour is preserved, but it is the last place staff see across Creators by default |

Each has a default that is safe to ship and cheap to change; none is deferred
because answering it is inconvenient.

## Rollout and reversal

Three pieces, deployable in this order and independently revertable:

1. **Permissions.** The module, permissions on the wire, the lint rule, staff narrowed to read-only, the Byline field, `ADMIN_EMAILS` reduced to bootstrap. No data changes shape; reverting is a revert.
2. **Withheld.** Adds fields and a capability. Reverting leaves the fields present and unread.
3. **The role rename.** Two deploys with a migration between them. The first accepts both stored values and can be reverted freely; only after the second drops the old value does reverting require running the migration backwards, which the script supports.

There is no feature flag: each piece is small enough that `git revert` is the
off switch, and the only step touching existing data is step 3, whose data is
one enumerated field with two possible values.

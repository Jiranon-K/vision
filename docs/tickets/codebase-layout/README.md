# Codebase layout

Eighteen tickets that move the repository from folders-by-kind-of-file to
folders-by-feature, as decided in
[ADR 0007](../../adr/0007-feature-based-layout.md). Read the ADR first; the
tickets assume its vocabulary.

Every ticket is its own branch, merged to `main` before the next begins, so no
long-lived branch collects conflicts with feature work. Every ticket leaves
`bun run verify:full` green.

Tickets 01–16 are **moves**: `git mv`, import rewrites, config paths, and no
change in behaviour. A reviewer accepts a move on a green verification run and
a diff that is only renames and import lines. Ticket 18 is the only one that
changes code.

## Scaffold

| #                                       | Ticket                                     |
| --------------------------------------- | ------------------------------------------ |
| [01](01-the-frontend-moves-into-src.md) | The frontend moves into `src/`, rules warn |

## Server — one module at a time

| #                                            | Ticket                                        |
| -------------------------------------------- | --------------------------------------------- |
| [02](02-server-platform.md)                  | What every module shares becomes `platform/`  |
| [03](03-server-posts-module.md)              | Posts becomes a module                        |
| [04](04-server-analytics-module.md)          | Analytics becomes a module, and owns the View |
| [05](05-server-excerpt-suggestion-module.md) | Excerpt Suggestion becomes a module           |
| [06](06-server-auth-module.md)               | Auth becomes a module                         |
| [07](07-server-creators-module.md)           | Settings becomes the Creators module          |

## Frontend — one feature at a time

| #                              | Ticket                                          |
| ------------------------------ | ----------------------------------------------- |
| [08](08-frontend-shared.md)    | What every feature shares becomes `shared/`     |
| [09](09-frontend-auth.md)      | Auth becomes a feature                          |
| [10](10-frontend-posts.md)     | Posts becomes a feature                         |
| [11](11-frontend-editor.md)    | The editor becomes a feature                    |
| [12](12-frontend-hub.md)       | The Smart Creator Hub's frame becomes a feature |
| [13](13-frontend-analytics.md) | Analytics becomes a feature                     |
| [14](14-frontend-creators.md)  | Settings becomes the Creators feature           |
| [15](15-frontend-blog.md)      | The blog becomes a feature with a server entry  |
| [16](16-frontend-marketing.md) | Marketing becomes a feature; `types/` goes      |

## Closing

| #                                            | Ticket                                      |
| -------------------------------------------- | ------------------------------------------- |
| [17](17-rules-become-errors.md)              | The boundary and naming rules become errors |
| [18](18-posts-rules-leave-the-controller.md) | The Posts rules leave the controller        |

## Dependencies between tickets

- **01 before everything.** It sets the alias and the warn-level rules every
  later ticket is measured against.
- **02 before 03–07.** Modules import `platform/`; it must exist first.
- **03 before 04.** The View route stays in Posts and calls into Analytics
  through its entry file, so Posts must already have one.
- **08 before 09–16.** Features import `shared/`.
- **10 before 11, 13 and 15.** The editor, analytics and the blog consume the
  Post wire contract from `@/features/posts`.
- **15 before 16.** Marketing's featured Posts come from `@/features/blog/server`.
- **17 after 01–16.** Rules turn into errors only when nothing violates them.
- **18 after 03 and 17.** The service is extracted inside the module, under
  rules that already hold.

The server tickets (02–07) and the frontend tickets (08–16) do not depend on
each other and may interleave.

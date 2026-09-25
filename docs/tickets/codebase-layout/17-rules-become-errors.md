# 17 — The boundary and naming rules become errors

**Status:** ready-for-agent

## Problem Statement

After tickets 01–16 the layout holds, but only because every move was checked
by a warning someone chose to read. A warning does not stop the next commit
from reaching into a feature's internals.

## Solution

Raise the rules from ticket 01 to `error`, and bring the documentation in line
with the tree.

## Implementation Decisions

- `eslint.config.mjs`: the two `no-restricted-imports` blocks and the file-name
  rule go from `warn` to `error`. Each carries a message naming ADR 0007.
- `docs/architecture.md`: the repository layout block shows the new tree, and
  the paragraph on the Hub's fetch seam names `shared/lib/query/` and the
  feature hooks rather than `lib/query.ts` and `hooks/`.
- `docs/configuration.md`, `docs/deployment.md`, `CONTRIBUTING.md` and
  `README.md`: any path that names a folder that no longer exists is updated.
- `package.json` `lint-staged`: globs name `src/**` and `server/src/**` rather
  than the old folders.
- `harness/` reads committed documents into its prompt; nothing there should
  name an old path. Search it and update any that do.

## Testing Decisions

- `bun run verify:full` is green with the rules at `error`.
- Adding an import of `@/features/posts/hooks/use-posts` to a file in
  `src/app/` fails `bun run lint`, and so does a file named `FooBar.tsx`.
  Confirm both by hand and record the errors in the PR; do not commit them.
- A search of the repository, outside `docs/tickets/` and `docs/adr/`, for
  `components/`, `hooks/`, `lib/`, `server/src/controllers` and
  `server/src/routes` finds no stale paths.

## Out of Scope

- Any code change.

# 17 — The boundary and naming rules become errors

**Status:** done

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

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26 with the rules at
  `error`, run one after another: typecheck (frontend, server, harness); lint
  0 errors (2 pre-existing warnings); server tests 237 passed
  (`--maxWorkers=2`, see ticket 07); harness 37 passed; `next build` compiled;
  Playwright 24 passed.
- Probed by hand, both files deleted before the run: a file in `src/app/`
  importing `@/features/posts/hooks/use-posts` failed `bun run lint` with
  `no-restricted-imports` ("Import a feature through its entry file …
  (ADR 0007)"), and `src/app/FooBar.tsx` failed it with
  `local/file-name-kebab-case`. `bun run lint` exited 1.
- The kebab-case rule now covers `src/`, `server/src/`, `server/scripts/`,
  `server/tests/` and `e2e/`, not only the new folders. That found three
  files, renamed here: `migrations/clearPostAuthorRole.ts`,
  `migrations/renameRole.ts` and `tests/support/testApp.ts`. `harness/` is its
  own package outside ADR 0007 and is not covered.
- Docs: `docs/architecture.md` shows the final tree and states the rules;
  `CONTRIBUTING.md`'s lint-staged table and `harness/README.md`'s E2E trigger
  name `src/`. A repository-wide search outside `docs/tickets/`, `docs/adr/`
  and `docs/specs/` finds no path to a folder that no longer exists.

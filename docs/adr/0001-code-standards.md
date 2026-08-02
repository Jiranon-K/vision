# ADR 0001: Code standards live in ESLint, not in prose

Status: Accepted

## Context

We wanted stricter conventions for three things: comments, code patterns, and how
the codebase is organised. The obvious move is a section in `CONTRIBUTING.md`.

Two measurements argued against that.

**Comment density is already about 1%** — 116 comment lines across roughly 10,700
lines of source. The codebase is not over-commented, and the comments that exist
are mostly "why" comments worth keeping. A rule telling people to comment less
would be solving a problem we do not have.

**The same API contract was declared in three files.** `lib/posts.ts`,
`hooks/usePosts.ts`, and `hooks/useDashboardData.ts` each described the wire shape
of a Post and each mapped `_id` to `id` by hand. Nothing tied the three together,
so a field rename on the server would have broken two of them silently.

The second problem is the expensive one, and no amount of written convention
would have caught it.

There is also a new constraint: an autonomous agent (`harness/`) now reads the
repo's committed documents into its prompt. That sharpens the question of where a
rule belongs.

## Decision

Rules go in one of three places, and the choice is not a matter of taste:

| Kind of rule      | Home                | Survives?                                                      |
| ----------------- | ------------------- | -------------------------------------------------------------- |
| Machine-checkable | `eslint.config.mjs` | Yes — enforced on every commit, for humans and the agent alike |
| Needs judgement   | `docs/adr/`         | Mostly — the harness prompt reads it, and it is reviewable     |
| Anything else     | Nowhere             | It would be decoration                                         |

A rule written in the wrong tier decays within a couple of months. That is why
this ADR adds no prose conventions to `CONTRIBUTING.md`.

### What was added

**Two local ESLint rules**, defined inline in `eslint.config.mjs` rather than
pulled from a plugin — they are a few lines each, and the supply chain for a lint
plugin is not worth two regexes.

- `local/disable-needs-reason` — every `eslint-disable` must carry a reason after
  `--`. A disable without one is a decision nobody can review later. This found
  four undocumented suppressions on the day it was added.
- `local/todo-needs-issue` — a `TODO`/`FIXME`/`HACK`/`XXX` marker must reference
  an issue. A marker with nothing behind it is a note to nobody. The rule matches
  only markers that open a line, so prose containing the word is not flagged;
  flagging prose would teach people to contort sentences rather than open issues.

`reportUnusedDisableDirectives` is set to `error`: a disable that no longer
suppresses anything is stale context.

**One layering rule.** `no-restricted-syntax` forbids calling `fetch` directly
from `app/` and `components/`. Data fetching belongs in `hooks/` and `lib/`, which
own credentials, caching, and the 401 refresh. At the time of writing no file
violated this — the rule exists to stop the drift, not to fix it.

**One structural change.** `lib/post-contract.ts` is now the single owner of the
Post wire shape and its mappings (`toPost`, `toPostRow`, `toDashboardPost`,
`formatPostDate`). The three hand-rolled declarations are gone.

### What was removed

`scripts/remove-comments.mjs`, a regex-based tool that stripped every comment
from the source tree. It deleted precisely the deliberate "why" comments the
comment policy is meant to protect. **A tool that destroys what the rule protects
is more dangerous than having no rule**, and while it sat in `package.json` there
was going to be a day someone ran it.

## Consequences

- Comment discipline is now enforced at the two points where it actually erodes:
  unexplained suppressions and orphaned markers. Density is left alone, because
  the numbers say it is fine.
- A change to the Post API shape now breaks one file loudly instead of two files
  quietly.
- Adding a rule means writing it as code. That friction is deliberate: if a rule
  cannot be expressed mechanically and is not worth an ADR, it was not a rule.

## What was deliberately not adopted

`max-lines`, `max-lines-per-function`, mandatory JSDoc, and comment-count
thresholds. They measure what is easy to measure rather than what matters, and
the first person to hit one will reach for `// eslint-disable` — which, thanks to
`local/disable-needs-reason`, would at least come with an explanation.

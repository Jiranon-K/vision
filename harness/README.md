# Agent loop coding harness

An autonomous coding loop for this repository. It takes a GitHub issue labelled
`ready-for-agent`, plans, writes a failing test, implements, repairs against a
deterministic verification gate until green, reviews the diff with fresh eyes,
and opens a pull request for a human to merge.

It opens pull requests. It never merges.

## Running it

```bash
bun run agent --task "add a category filter to the posts table"
```

Ad-hoc mode runs one task and never touches GitHub. This is how the harness
itself is developed: iterating on the loop should not fill the tracker with
disposable issues and pull requests.

```bash
bun run agent
```

Queue mode drains open issues labelled `ready-for-agent`, one at a time. Add
`--once` to stop after the first.

Requires `gh` authenticated, `ANTHROPIC_API_KEY` set (or an `ant auth login`
profile), and a local `mongod` for the end-to-end tier.

## The loop

```
reset worktree → TRIAGE → PLAN → RED → IMPLEMENT → GATE(fast) ⟲ → GATE(slow) → REVIEW ⟲ → PR
```

One SDK session spans PLAN through the repair loop, so gate failures land back
in a session that still remembers what it changed and why. A fresh session would
have to re-read the code to understand its own diff.

Three things make this different from running a coding agent by hand, and they
are the reason it exists:

- **The gate is a machine, not a self-report.** The loop runs the verification
  commands itself and feeds failures back. It never accepts "I'm done" as
  evidence.
- **The red-test checkpoint.** Before implementation starts, the harness runs the
  new test and requires it to fail _on an assertion_, not on a load error. An
  agent asked to do TDD in a prompt will routinely write the implementation first
  and back-fill a test that could never fail; running the test is the only thing
  that proves otherwise.
- **Budgets and permissions are code.** Four ceilings, and a denylist enforced
  through the SDK's permission callback.

`chore`, `docs`, and `refactor` tasks skip the red-test checkpoint. For a
refactor the correct gate is "every existing test still passes", not "a new test
exists".

## Verification tiers

| Tier | When                   | Commands                                                                                           |
| ---- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| Fast | every repair iteration | `typecheck`, `typecheck:server`, `typecheck:harness`, `lint`, `test:server`, `test:harness`        |
| Slow | once, before the PR    | `build`, plus `test:e2e` when the diff touches `app/`, `components/`, `hooks/`, or `middleware.ts` |

Every command is an npm script, so a human and the agent pass through
byte-identical checks — "green for the agent" means "green for you". `next build`
sits in the slow tier because it catches what `tsc` cannot see in this codebase:
RSC/client boundary violations, broken `generateMetadata`, and the build-time
fetches in `app/sitemap.ts` and `app/opengraph-image.tsx`.

The gate stops at the first failing command, so the agent sees one problem rather
than a pile.

Two locally-defined lint rules carry the comment policy, so it is enforced the
same way for the agent as for a human: an `eslint-disable` must state its reason
after `--`, and a `TODO`/`FIXME` marker must reference an issue. See
`docs/adr/0001-code-standards.md`.

## Budgets

| Ceiling             | Default                                |
| ------------------- | -------------------------------------- |
| Repair iterations   | 5                                      |
| Wall clock per task | 30 min                                 |
| Cost per task       | $12                                    |
| No progress         | 2 identical gate fingerprints in a row |
| Review rounds       | 2                                      |

Whichever is reached first ends the run. The no-progress ceiling is the one that
usually fires and the one most often left out: a stuck agent edits back and forth
and lands on the same failure, which is cheaper to detect by comparison than by
waiting for the iteration ceiling. "Identical" means a normalized fingerprint —
absolute paths, timings, and durations shift between otherwise identical runs, so
a raw byte comparison would mean it never fires.

A run that exhausts its budget pushes its branch, opens a **draft** PR explaining
where it stopped, and relabels the issue `ready-for-human`. Work survives, and
the queue does not pick the issue up again — removing `ready-for-agent` on every
terminal outcome is what stops the loop retrying the same failure forever.

## Review

After the fast tier is green, a **second, read-only session** reviews. It sees
only the diff, the issue, and the repo conventions — not the implementer's
reasoning.

This is the opposite choice from the main loop, where splitting sessions would
lose context. Here the missing context _is_ the value: an agent that just spent
forty minutes writing the code reads its diff and sees what it _meant_ to write.

Findings are graded blocking or non-blocking, and only blocking ones must be
fixed; without that the loop stalls on taste. The reviewer cannot edit — findings
go back to the implementer, so two writers never touch the same file. After two
rounds, anything unresolved goes into the PR body and the PR opens as a draft.

## Boundaries

These are enforced, not merely requested.

**Underspecified issues.** The agent comments the question, relabels
`needs-info`, touches no code, and moves to the next issue. Work built on a wrong
guess does not save time — it turns "write the code" into "read wrong code and
find the wrong part", which costs more. The line: ask about required behaviour in
an edge case, user-visible copy, or a data shape that must match something
existing. Decide alone about file and variable naming, where a component lives,
and whether to extract a helper — CONTEXT.md and the surrounding code answer those
already.

**A moving `main`.** Rebase if it is clean; if it conflicts, abort, push anyway,
and hand it to a human. The agent never resolves a conflict: doing so needs the
intent of both sides and it only has its own. The usual failure is silently
discarding the other side's work, after which the gate goes green because the
code still compiles. **That failure is invisible to verification**, so it is
prevented by rule rather than checked for.

**Deleting a test.** A diff that removes a test file or reduces assertions is an
automatic blocking finding, detected in `worktree.ts` rather than forbidden in the
prompt. Deleting the failing test is the shortest path to a green gate and looks
like complete success from every angle except the one that matters.

**Scope.** New dependencies are allowed when the task needs them, with a
justification in the PR body. Upgrading an existing dependency, touching a
`next`/`react`/`express`/`mongoose` major, refactoring unrelated code, and editing
npm scripts, config, or `harness/` are all forbidden unless the issue says so. The
agent may open at most two `needs-triage` issues per task — a cap turns the
mechanism from a thought-drain into a filter.

## Safety

The permission model is a strict **denylist**, not an allowlist.

An allowlist reads as safer and fails in practice: a working agent runs
unpredictable commands (`bun add`, `bunx playwright install`, `gh issue view`,
`git log -- <path>`), a narrow allowlist stalls the loop on permissions, and it
gets widened until it is a denylist nobody reviewed. Safety comes from the
isolated worktree plus a well-considered list of forbidden actions:

| Forbidden                                              | Why                                             |
| ------------------------------------------------------ | ----------------------------------------------- |
| Any push to `main`, `--force`, `--force-with-lease`    | CONTRIBUTING.md: never push to main             |
| `gh pr merge`, `gh pr review --approve`                | Merging is the human's decision                 |
| `--no-verify` on commit or push                        | Bypassing the gate defeats the harness          |
| Reading or writing `.env`, `.env.local`, `server/.env` | Secrets must not enter model context            |
| `rm -rf` / `git clean` outside the agent worktree      | Protects the developer's files                  |
| Mongo commands against a database not ending in `_e2e` | Extends the E2E setup guard                     |
| Editing `.github/`, `.husky/`, `skills-lock.json`      | The agent must not edit the rules that check it |

The E2E environment is composed explicitly and never inherits the developer's
shell: `server/src/emails/client.ts` builds a Resend client straight from the
environment with no stub path, so a real API key reaching the suite would send a
real email on every registration — all night.

## Prompt assembly

The system prompt is built **only from committed files**: `CONTEXT.md`,
`CONTRIBUTING.md`, `AGENTS.md`, `docs/agents/`, and `docs/adr/` when it exists.

`CLAUDE.md` and `.claude/` are gitignored, so a fresh worktree does not have them
— the harness cannot rely on anything Claude Code would normally load. A prompt
that depends on ignored files makes behaviour a function of one machine's state,
with nothing in git to explain a difference in outcome.

External skills from `skills-lock.json` are deliberately **not** wired in. They
come from thirteen repositories outside this project's control, they consume
context that should hold code, and they reintroduce exactly that variability. If
the agent repeatedly gets a pattern wrong, the fix is an ADR in `docs/adr/` —
committed, reviewable, and ours.

## Layout

| Path                 | Role                                                         |
| -------------------- | ------------------------------------------------------------ |
| `src/index.ts`       | CLI: ad-hoc and queue modes                                  |
| `src/runTask.ts`     | The loop                                                     |
| `src/session.ts`     | One SDK session, driven turn by turn                         |
| `src/gate.ts`        | Verification tiers, fingerprinting, red-test classification  |
| `src/permissions.ts` | The denylist                                                 |
| `src/prompt.ts`      | System prompt assembly                                       |
| `src/worktree.ts`    | Worktree lifecycle, branch, rebase, test-weakening detection |
| `src/github.ts`      | `gh` wrappers                                                |
| `src/review.ts`      | The second, read-only session                                |
| `src/report.ts`      | Terminal output and run artifacts                            |
| `tests/`             | Unit tests for the denylist and gate classification          |

A single persistent worktree at `../vision-agent` is reset between tasks. A
worktree per task would need `bun install` and a Playwright browser download
every run; one long-lived worktree pays that once, at the cost of running tasks
serially.

## Artifacts

Each run writes to `.agents/runs/<timestamp>-issue-<n>/` (gitignored):

| File               | Use                                                                            |
| ------------------ | ------------------------------------------------------------------------------ |
| `transcript.jsonl` | Every raw SDK message — the ground truth when the agent does something strange |
| `gate/*.log`       | Raw output per gate invocation                                                 |
| `summary.md`       | What it did, iterations, cost, outcome, flaky tests                            |
| `state.json`       | Machine-readable run record                                                    |

There is no resume. It would need the SDK session id, worktree state, and branch
to stay consistent with each other, and the draft-PR failure path already
preserves the work.

## Known gaps

- **The loop has not been exercised end to end against a real issue.** Its pure
  logic — the denylist, red-test classification, slow-tier path gating — is unit
  tested, and every command it runs is verified, but the worktree resets to
  `origin/main` before every task, so nothing useful runs until this package is
  on `main`.
- **The $12 ceiling and the cap of four subagents are placeholders**, set without
  measurement. Re-tune them once real runs exist.
- The worktree reinstalls dependencies every task (`bun install
--frozen-lockfile` across three packages). Cheap when the lockfile has not
  moved, and the obvious thing to make conditional if it becomes a drag.
- Runs are serial. Parallelism would mean changing the queue and the worktree
  strategy, not `runTask`, which always takes a single issue.

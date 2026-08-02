# Agent loop coding harness

An autonomous coding loop for this repository. It takes a GitHub issue labelled
`ready-for-agent`, plans, writes a failing test, implements, repairs against a
deterministic verification gate until green, reviews the diff with fresh eyes,
and opens a pull request for a human to merge.

Design and rationale: [`../SPEC.md`](../SPEC.md).

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

## What it does

```
reset worktree → TRIAGE → PLAN → RED → IMPLEMENT → GATE(fast) ⟲ → GATE(slow) → REVIEW ⟲ → PR
```

One SDK session spans PLAN through the repair loop, so gate failures land back
in a session that still remembers what it changed and why.

Three things distinguish this from running a coding agent by hand:

- **The gate is a machine, not a self-report.** The loop runs `verify:fast`
  itself and feeds failures back. It never accepts "I'm done" as evidence.
- **The red-test checkpoint.** Before implementation starts, the harness runs the
  new test and requires it to fail on an assertion. An agent asked to do TDD in a
  prompt will routinely write the implementation first and back-fill a test that
  could never fail.
- **Budgets and permissions are code.** Four ceilings, and a denylist enforced
  through the SDK's permission callback.

## Layout

| Path                 | Role                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `src/index.ts`       | CLI: ad-hoc and queue modes                                             |
| `src/runTask.ts`     | The loop                                                                |
| `src/session.ts`     | One SDK session, driven turn by turn                                    |
| `src/gate.ts`        | Verification tiers, no-progress fingerprinting, red-test classification |
| `src/permissions.ts` | The denylist                                                            |
| `src/prompt.ts`      | System prompt assembled from committed repo files only                  |
| `src/worktree.ts`    | Worktree lifecycle, branch, rebase, test-weakening detection            |
| `src/github.ts`      | `gh` wrappers                                                           |
| `src/review.ts`      | The second, read-only session                                           |
| `src/report.ts`      | Terminal output and run artifacts                                       |

## Budgets

| Ceiling             | Default                           |
| ------------------- | --------------------------------- |
| Repair iterations   | 5                                 |
| Wall clock per task | 30 min                            |
| Cost per task       | $12                               |
| No progress         | 2 identical gate outputs in a row |
| Review rounds       | 2                                 |

Whichever is reached first ends the run. A failed run pushes its branch, opens a
**draft** PR explaining where it stopped, and relabels the issue
`ready-for-human` — work is preserved, and the queue does not pick the issue up
again.

## Artifacts

Each run writes to `.agents/runs/<timestamp>-issue-<n>/` (gitignored):

| File               | Use                                                                            |
| ------------------ | ------------------------------------------------------------------------------ |
| `transcript.jsonl` | Every raw SDK message — the ground truth when the agent does something strange |
| `gate/*.log`       | Raw output per gate invocation                                                 |
| `summary.md`       | What it did, iterations, cost, outcome, flaky tests                            |
| `state.json`       | Machine-readable run record                                                    |

## Prerequisites

The harness resets its worktree to `origin/main` before every task, so
everything it depends on — the `verify:*` scripts, the E2E suite, and this
package — must be on `main` before queue mode can do useful work.

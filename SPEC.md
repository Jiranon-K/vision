# SPEC: Agent Loop Coding Harness

Status: Built — see section 13 for what shipped and section 14 for what is untested
Scope: v1 = Phases 0–4

## 1. Summary

An autonomous coding loop for this repository. It picks up a GitHub issue labelled
`ready-for-agent`, plans, writes a failing test, implements, repairs against a
deterministic verification gate until green, reviews the diff with fresh eyes, and opens
a pull request for a human to merge.

The harness is developer tooling, not a product feature. Nothing in this spec touches the
Vision application except the npm scripts and end-to-end tests introduced in Phase 0.

### What makes this different from running Claude Code by hand

Three things, and they are the reason the harness exists at all:

1. **A machine gate, not a self-report.** The loop never accepts "I'm done" as evidence.
   It runs the checks itself and feeds failures back into the same session.
2. **A red-test checkpoint.** Before implementation is allowed to start, the harness runs
   the new test and confirms it fails. An agent told to do TDD in a prompt will routinely
   write the implementation first and back-fill a test that could never fail; running the
   test is the only thing that proves otherwise.
3. **Programmatic stop conditions and permissions.** Budgets, no-progress detection, and
   the forbidden-action list are code, not prose.

## 2. Goals

- Land small, fully-specified issues end to end without supervision.
- Never merge. The harness opens PRs; a human merges.
- Fail loudly and preserve work: a failed run leaves a draft PR and an explanation, never
  a silent rollback.
- Share one verification path with humans, so "green for the agent" means "green for you".

## 3. Non-goals

- Parallel execution (v1 runs one task at a time).
- Resuming an interrupted run.
- Resolving merge conflicts.
- Being reusable outside this repository. The harness encodes Vision's gate, labels,
  ports, and conventions on purpose.

## 4. Architecture

### 4.1 Engine

Claude Agent SDK, TypeScript, run with bun. Chosen over shelling out to the Claude Code
CLI because the loop needs a per-tool-call permission callback and stop conditions
expressed in code rather than in a prompt.

### 4.2 Layout

```
harness/            committed. Own package.json, so SDK deps stay out of the web app.
  src/
    index.ts        CLI: ad-hoc mode and the GitHub issue queue
    runTask.ts      the unit of work: one issue in, one outcome out
    session.ts      one SDK session, driven turn by turn
    gate.ts         verification tiers, fingerprinting, red-test classification
    worktree.ts     reset, branch, commit, push, rebase, test-weakening detection
    permissions.ts  the forbidden-action list
    prompt.ts       system prompt assembly from committed repo files
    review.ts       the second, read-only session
    report.ts       terminal renderer + run artifacts
  tests/            unit tests for the denylist and gate classification
.agents/            gitignored. Run artifacts.
  runs/<ts>-issue-<n>/
../vision-agent      the agent's git worktree, outside the repo
```

`harness/` is committed for three reasons: it must evolve with the gate and label
vocabulary it depends on, an uncommitted harness cannot be modified by the agent itself,
and a separate `package.json` keeps SDK dependencies out of the deployed application and
its Dockerfile.

### 4.3 Models

| Role        | Model           | Effort  |
| ----------- | --------------- | ------- |
| Implementer | `claude-opus-5` | `xhigh` |
| Reviewer    | `claude-opus-5` | `high`  |

Cost is tuned with `effort`, not by downgrading the reviewer. Finding a real bug in code
that compiles and passes tests is the most intelligence-sensitive step in the loop; a
cheaper reviewer produces style commentary, which section 8 already filters out.

### 4.4 Concurrency

One task at a time. `runTask(issue)` always takes a single issue; the queue is the only
component that iterates. Making the loop parallel later means changing the queue and the
worktree strategy, not the runner.

## 5. Work intake

### 5.1 Queue mode (primary)

Poll `gh issue list --label ready-for-agent`. Take one issue. The issue is the spec, the
log, and the reply channel: plans, questions, and outcomes are posted as comments.

Label transitions the harness performs:

| Outcome                       | Label change                          |
| ----------------------------- | ------------------------------------- |
| PR opened (success)           | remove `ready-for-agent`              |
| Failed after budget exhausted | `ready-for-agent` → `ready-for-human` |
| Underspecified                | `ready-for-agent` → `needs-info`      |

Removing `ready-for-agent` on every terminal outcome is what stops the queue from picking
up the same issue and failing the same way forever.

The harness must tolerate `gh` failures and GitHub rate limits: retry with backoff, and
if the queue cannot be read, exit cleanly rather than proceeding with stale state.

### 5.2 Ad-hoc mode

`bun harness --task "<description>"` runs the full loop without touching GitHub. This is
how the harness itself is developed and debugged, and it is why Phase 3 comes after
Phase 1 — early iteration should not litter the tracker with throwaway issues and PRs.

## 6. The loop

```
reset worktree → PLAN → RED → IMPLEMENT → GATE(fast) ⟲ → GATE(slow) → REVIEW ⟲ → PR
```

One SDK session spans PLAN through the repair loop. Gate failures are fed back into that
same session, so the agent still remembers what it changed and why; a fresh session would
have to re-read the code to understand its own diff.

### 6.1 PLAN

The agent posts a short plan as an issue comment before touching code. This is not a
separate session and not an approval gate — it exists so a failed run can be diagnosed by
reading what the agent intended.

### 6.2 RED (skipped for `chore` / `docs` / `refactor`)

1. The agent writes a test at the highest seam that fits: Playwright for user-visible
   behaviour, `vitest` for server-only behaviour.
2. **The harness runs that test and requires it to fail.**
3. A test that passes immediately is rejected and must be rewritten — it demonstrates
   nothing.
4. The failure must be an assertion failure, not a collection or import error. A test that
   fails because the file does not parse is not evidence of missing behaviour.

For `refactor`, the correct gate is "all existing tests still pass", not "a new test
exists". Deleting or weakening an existing test is never an acceptable way to get there
(see section 9.3).

### 6.3 IMPLEMENT

The agent writes the implementation. Scope rules in section 9 apply.

### 6.4 GATE

Two tiers. Every command is an npm script so humans and the agent run byte-identical
checks.

| Tier | When                        | Commands                                                                                           |
| ---- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| Fast | every repair iteration      | `typecheck`, `typecheck:server`, `typecheck:harness`, `lint`, `test:server`, `test:harness`        |
| Slow | once, before opening the PR | `build`, `test:e2e` (only if the diff touches `app/`, `components/`, `hooks/`, or `middleware.ts`) |

The gate stops at the first failing command. Later commands add noise the agent
would have to wade through, and the no-progress fingerprint should describe one
problem, not a pile.

`next build` is in the slow tier because it catches failures `tsc` cannot see in this
codebase: RSC/client boundary violations, broken `generateMetadata`, and build-time
fetches in `app/sitemap.ts` and `app/opengraph-image.tsx`.

If the slow tier fails, the loop re-opens with the failing slow-tier command temporarily
promoted into the fast tier, so the agent is not iterating blind against a check it only
sees once.

`scripts/remove-comments.mjs` is **never** part of the gate. It is a regex-based stripper
that removes every comment indiscriminately, including the deliberate "why" comments this
codebase relies on.

### 6.5 Budgets and stopping

Four independent ceilings; whichever is reached first ends the run.

| Ceiling             | Default                                                 | Guards against                      |
| ------------------- | ------------------------------------------------------- | ----------------------------------- |
| Repair iterations   | 5                                                       | chasing the same error indefinitely |
| Wall clock per task | 30 min                                                  | a tool call that never returns      |
| Cost per task       | $12                                                     | runaway spend                       |
| No progress         | 2 consecutive iterations with the same gate fingerprint | a stuck agent, caught early         |

"Same output" is a normalized fingerprint, not a byte comparison: absolute
paths, timings, and durations shift between otherwise identical runs, and a raw
comparison would mean no-progress never fires.

The no-progress ceiling matters most and is the one usually omitted: an agent that has
lost the thread edits back and forth and lands on the same failure. Comparing gate output
across iterations detects that directly and cheaply.

### 6.6 Failure outcome

Push the branch, open a **draft** PR describing where it got stuck and what the last gate
output was, comment on the issue, and relabel `ready-for-human`. Work is preserved: a run
that got 80% of the way there is worth more as a draft PR than as a discarded worktree.

## 7. Verification infrastructure (Phase 0)

### 7.1 npm scripts

Added to the root `package.json`:

| Script              | Runs                                           |
| ------------------- | ---------------------------------------------- |
| `typecheck`         | `tsc --noEmit`                                 |
| `typecheck:server`  | `cd server && bunx tsc --noEmit`               |
| `typecheck:harness` | `cd harness && bunx tsc --noEmit`              |
| `test:server`       | `cd server && bun run test`                    |
| `test:harness`      | `cd harness && bun run test`                   |
| `test:e2e`          | `playwright test`                              |
| `agent`             | `bun run harness/src/index.ts`                 |
| `verify:fast`       | the four typechecks/lint plus both unit suites |
| `verify:full`       | `verify:fast` + build + test:e2e               |

Each sub-package is invoked through its own package manager (`cd server && bun
run test`) rather than by binary name: the root shell's `PATH` only carries the
root `node_modules/.bin`, so `vitest` is not resolvable from there.

`CONTRIBUTING.md` gains a line pointing at `verify:full` as the pre-PR check.

### 7.2 Playwright setup

Playwright is not currently installed — it appears in `bun.lock` only as an optional peer
of Next. This is greenfield.

- Config at the repo root, tests in `e2e/`.
- Root `tsconfig.json` includes `**/*.ts`, so `@playwright/test` types must resolve or the
  root typecheck breaks for everyone. Verify this on setup.
- Two `webServer` entries: Next on **3100**, Express on **3101**. Dedicated ports, because
  the developer may have `bun run dev:all` running on 3000/3001; a port collision would
  silently run the suite against the server being edited.
- A dedicated build directory, `NEXT_DIST_DIR=.next-e2e`, wired through
  `next.config.ts`. Separating ports is not sufficient: `next dev` takes an
  exclusive lock on the build directory, so the second process dies on the lock
  rather than on the port. `.next-e2e/**` must also be added to the ESLint
  ignore list, or generated output floods `bun run lint`.
- `retries: 1`. A test that passes on retry does not block the PR but must be reported in
  `summary.md` and the PR body. A flaky test that blocks kills unattended runs for reasons
  that are not the agent's fault; a flaky test that is silent accumulates rot.

### 7.3 Database isolation

E2E writes to a real Mongo. It uses `mongodb://localhost:27017/vision_e2e` on the mongod
already running on the machine, wiped in `globalSetup`.

**Guard (required):** `globalSetup` parses the database name from the URI and **refuses to
run** if it does not end in `_e2e`, before issuing any destructive command. A misconfigured
env must fail loudly, not quietly wipe development data.

### 7.4 Email must be stubbed

`server/src/emails/client.ts` constructs a Resend client straight from the environment
with no stub path. If a real `RESEND_API_KEY` reaches the E2E environment, every test
registration sends a real email — and the loop would do that all night.

Therefore: the harness composes the E2E environment explicitly and **never inherits the
developer's shell environment**. `RESEND_API_KEY` is always a fake value.

Registration itself survives a failed send — `auth.controller.ts:111` wraps
`sendVerificationEmail` in try/catch — so E2E signup works without a key. `resend-verification`
does not, and is out of scope for the smoke suite.

### 7.5 Smoke suite

| #   | Flow                                                                              | Protects                                                                    |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | `/`, `/pricing`, `/services` render with no console errors                        | RSC/hydration and metadata regressions                                      |
| 2   | `/blog` lists posts; a post detail page renders                                   | the `lib/posts.ts` ↔ API contract                                           |
| 3   | register → login → `/dashboard`; anonymous user is redirected to `/login`         | auth cookies, refresh, `middleware.ts`                                      |
| 4   | create Draft → publish → appears on `/blog`; Draft is **not** visible anonymously | the core product loop, and the Draft-leak guard at `posts.controller.ts:53` |

Flow 4 earns its cost: it crosses dashboard → Express → Mongo → public blog, a path no
unit test observes, and it watches a requirement `CONTEXT.md` states directly — a Draft is
not visible to Readers.

Flow 3 logs in through the UI once. Flow 4 uses a `storageState` seeded by an API login in
`globalSetup`, so it does not re-test the login form on every run.

Out of scope for v1: email verification and password reset flows. Testing them end to end
requires reading a token out of Mongo, which couples the test to the database schema — too
low a seam. `server/tests/integration/auth-email-flow.test.ts` already covers them.

## 8. Review

After the fast gate is green, a **second session** reviews. It sees only the diff, the
issue, and the repo conventions — not the implementer's reasoning.

This is deliberately the opposite choice from section 6, where splitting sessions would
lose context. Here the missing context _is_ the value: an agent that just spent forty
minutes writing the code reads its diff and sees what it meant to write. A reviewer with
no such memory asks the questions the author cannot ask themselves.

Rules:

- **Read-only.** Findings go back to the implementer session; two writers on one file is
  a recipe for lost edits.
- **Two rounds maximum.** Unresolved findings after round two go into the PR body and the
  PR opens as a draft for human judgement.
- **Findings are graded blocking / non-blocking; only blocking findings must be fixed.**
  Without this the loop stalls on taste.
- Fixes must re-pass the full fast tier before the PR opens.

## 9. Boundaries

### 9.1 Ambiguous issues

`ready-for-agent` is supposed to mean fully specified. In practice it will sometimes be
applied in a hurry. When something genuinely cannot be decided, the agent comments the
question, relabels `needs-info`, touches no code, and moves to the next issue.

Work built on a wrong guess does not save time — it converts "write the code" into "read
wrong code and find the wrong part", which is more expensive. Skipping to the next issue
rather than halting means one ambiguous ticket does not block the night.

The line, stated explicitly because "ambiguous" otherwise expands until nothing gets done:

| Ask                                             | Decide and continue         |
| ----------------------------------------------- | --------------------------- |
| Required behaviour in an edge case              | File and directory naming   |
| User-visible copy                               | Variable naming             |
| A data shape that must match something existing | Where a component lives     |
| Any question whose answers imply different code | Whether to extract a helper |

The right column is answered by `CONTEXT.md` and the surrounding code. Asking about it is
a failure mode of its own.

### 9.2 A moving `main`

Before each task: `git fetch && git reset --hard origin/main && git clean -fd` in the
agent worktree.

Before pushing: if `main` has advanced, rebase. If the rebase is clean, continue. If it
conflicts, abort the rebase, push the un-rebased branch, open a draft PR naming the
conflict, and relabel `ready-for-human`.

The agent never resolves conflicts. Resolving one requires understanding the intent of
both sides, and it only sees its own. The characteristic failure is silently discarding
the other side's work — after which the gate goes green, because the code still compiles.
**That failure is invisible to verification**, so it has to be prevented by rule.

### 9.3 Change scope

| Area                                             | Rule                                                 |
| ------------------------------------------------ | ---------------------------------------------------- |
| New dependency                                   | Allowed if the task needs it; justify in the PR body |
| Upgrading an existing dependency                 | Forbidden unless the issue is about dependencies     |
| `next` / `react` / `express` / `mongoose` majors | Forbidden; separate issue                            |
| Refactoring unrelated code                       | Forbidden; open an issue instead                     |
| npm scripts, config, `harness/`                  | Forbidden unless the issue says so                   |
| Deleting a test or weakening an assertion        | Forbidden                                            |

**Deleting a test is enforced mechanically, not by prompt:** a diff that removes a test
file or reduces assertions is an automatic blocking finding. Deleting the failing test is
the shortest path to a green gate, and it looks like complete success from every angle
except the one that matters.

The agent may open at most **2** new issues per task, always labelled `needs-triage`. The
cap turns the mechanism from a thought-drain into a filter for things that actually matter.

## 10. Safety

Permission model: **deny by default is rejected in favour of a strict denylist.**

An allowlist reads as safer but fails in practice: a working agent runs unpredictable
commands (`bun add`, `bunx playwright install`, `gh issue view`, `git log -- <path>`), a
narrow allowlist stalls the loop on permissions, and the list gets widened until it is a
denylist that nobody reviewed. Safety here comes from the isolated worktree plus a
well-considered list of forbidden actions.

| Forbidden                                                                  | Why                                             |
| -------------------------------------------------------------------------- | ----------------------------------------------- |
| Any push to `main`; `--force`; `--force-with-lease`                        | `CONTRIBUTING.md`: never push to main           |
| `gh pr merge`, `gh pr review --approve`                                    | Merging is the human's decision                 |
| `git commit --no-verify`, `git push --no-verify`                           | Bypassing the gate defeats the harness          |
| Reading or writing `.env`, `.env.local`, `server/.env`                     | Secrets must not enter model context            |
| `rm -rf` or `git clean` outside the agent worktree                         | Protects the developer's files                  |
| Mongo commands against a database not ending in `_e2e`                     | Extends the Phase 0 guard                       |
| Editing `.github/`, `.husky/`, `skills-lock.json` unless the issue says so | The agent must not edit the rules that check it |

Environment composition is explicit. The developer's shell environment is never inherited
(see 7.4).

## 11. Prompt assembly

The system prompt is built **only from committed files**. `CLAUDE.md` and `.claude/` are
gitignored, so a fresh worktree does not have them — the harness cannot rely on anything
Claude Code would normally load.

| Source                       | Provides                                                          |
| ---------------------------- | ----------------------------------------------------------------- |
| `CONTEXT.md`                 | Ubiquitous language: Post, Draft, Creator, View, Capability names |
| `CONTRIBUTING.md`            | Branch naming, Conventional Commits, never push to main           |
| `AGENTS.md`, `docs/agents/*` | Labels, tracker conventions                                       |
| `docs/adr/*`                 | Architecture decisions (directory does not exist yet)             |
| Harness-owned block          | Gate commands, denylist, TDD protocol, budgets, scope rules       |

A prompt that depends on ignored files makes agent behaviour a function of one machine's
state, with nothing in git to explain a difference in outcome.

External skills from `skills-lock.json` are **not** wired in. They come from thirteen
repositories outside this project's control, they consume context that should hold code,
and they reintroduce exactly the out-of-repo variability this section exists to prevent.
If the agent repeatedly gets a Next.js pattern wrong, the fix is an ADR in `docs/adr/` —
committed, reviewable, and ours.

### 11.1 Opus 5 specifics

These are model behaviours that interact directly with the design above.

| Behaviour                                                                                | Required response                                                                                      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Thinking is on by default, and `max_tokens` caps thinking **plus** response              | Set `max_tokens` ≥ 64K at `xhigh` effort, or responses truncate mid-answer                             |
| It verifies its own work unprompted; "double-check your answer" causes over-verification | **No self-verification instructions in the prompt.** The machine gate stays — the prompt language goes |
| It expands task scope                                                                    | The section 9.3 rules are load-bearing, not decorative                                                 |
| It delegates to subagents readily                                                        | Set an explicit cap; uncapped delegation multiplies cost without improving outcomes                    |
| Written deliverables run long                                                            | Constrain the length of PR bodies and issue comments explicitly                                        |
| It narrates self-corrections at length                                                   | Constrain corrections to those that change the reader's decisions                                      |

## 12. Observability

**During a run:** a readable terminal stream — phase banners (`PLAN → RED → IMPLEMENT →
GATE(1/5)`), one line per tool call, coloured gate results. Not raw JSON.

**After a run**, in `.agents/runs/<ts>-issue-<n>/`:

| File               | Purpose                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| `transcript.jsonl` | Every raw SDK message — the ground truth when the agent does something strange |
| `gate/*.log`       | Raw output per iteration; also the input to no-progress detection              |
| `summary.md`       | What it did, iterations used, tokens spent, how it ended, any flaky tests      |
| `state.json`       | Issue, branch, counts, timing, final outcome                                   |

No resume in v1: it would require keeping the SDK session id, worktree state, and branch
consistent with each other, and the draft-PR failure outcome already preserves the work.

No separate notification channel. An opened PR and an issue comment already reach the
developer by email and on mobile.

## 13. Phases

Each phase is independently useful.

| Phase | Deliverable                                                              | Status                 |
| ----- | ------------------------------------------------------------------------ | ---------------------- |
| **0** | npm scripts, Playwright, the four smoke flows, the `_e2e` guard          | Built                  |
| **1** | `harness/`, ad-hoc mode, single session, repair loop, budgets, artifacts | Built                  |
| **2** | Worktree lifecycle, branch, commit, push, PR, rebase handling            | Built                  |
| **3** | GitHub issue queue, labels, comments, the `needs-info` boundary          | Built                  |
| **4** | Red-test checkpoint and the second-session reviewer                      | Built (pulled forward) |

Phase 4 was originally deferred to v1.1 and was built alongside the rest: both
pieces turned out to be small once the loop existed, and the red-test checkpoint
is the part of the design that most needed exercising.

**The worktree resets to `origin/main` before every task**, so queue mode cannot
do useful work until Phases 0–3 are merged. Ad-hoc mode has the same constraint.

Phase 0 is first because the repair loop has nothing to iterate against without a gate,
and because the scripts and E2E suite are worth having even if the harness is never built.
Phase 3 is deliberately late: debugging the loop means running it repeatedly, and that
should not fill the tracker with disposable issues and PRs. Phase 4 is last because TDD
enforcement and review are layers on top of a loop that must already be stable — stacked
earlier, a failure is impossible to attribute.

## 14. Open items

- **Cost ceiling ($12) and subagent cap (4) are placeholders.** Both were set
  without measurement and should be re-tuned once real runs exist.
- **The loop has not been exercised end to end against a real issue.** Its pure
  logic — the denylist, red-test classification, slow-tier path gating — is unit
  tested, and every command it runs is verified, but the full path needs Phases
  0–3 on `main` first (see section 13).
- `docs/adr/` does not exist yet. Create it when the first architecture decision is worth
  recording; prompt assembly already tolerates its absence.
- The worktree reinstalls dependencies on every task (`bun install
--frozen-lockfile` in three packages). Cheap when the lockfile has not moved,
  but it is the obvious thing to make conditional if it becomes a drag.

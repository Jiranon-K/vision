# 03 — Verification runs on every change, not on every good intention

**Status:** ready-for-agent

## Problem Statement

The repository knows exactly how to verify itself. There is a fast check that
typechecks three packages, lints, and runs the unit and integration suites, and
a full check that adds the production build and the Playwright suite. Both are
documented in the README and CONTRIBUTING.

Nothing runs them. The only automation is a local pre-commit hook, which:

- exists only on machines where someone remembered to install it,
- deliberately skips itself during a merge, rebase or cherry-pick — the exact
  moments when code most often breaks,
- is bypassed entirely by a single flag on the commit command,
- and runs a subset, not the suite.

So the state of the main branch is a matter of trust. A pull request can be
merged with a failing test suite and nobody would learn that until the next
person runs the check locally, by which point the breakage is someone else's
problem.

## Solution

Continuous integration runs the repository's own verification on every pull
request and on every push to the main branch, and the result gates the merge.

- Every pull request runs the fast check.
- The main branch additionally runs the full check.
- A failing check blocks the merge rather than warning about it.
- The checks are the ones already in the repository. CI does not grow its own
  private notion of what "verified" means.

## User Stories

1. As a maintainer, I want every pull request to be typechecked, linted and tested automatically, so that review is about design rather than about whether it runs.
2. As a maintainer, I want a failing check to block the merge, so that the main branch is verified by construction rather than by discipline.
3. As a contributor, I want to see the check result on my pull request, so that I can fix a failure before asking anyone to look at it.
4. As a contributor, I want CI to run the same commands the README tells me to run locally, so that a green machine means a green pipeline.
5. As a contributor, I want the failing step and its output visible in the run, so that I can diagnose without re-running everything locally.
6. As a maintainer, I want the frontend, the server and the harness all covered, so that a change in one package cannot break another unnoticed.
7. As a maintainer, I want the production build to be exercised before code reaches the main branch, so that a build-only failure is not discovered at deploy time.
8. As a maintainer, I want the end-to-end suite to run against the main branch, so that a regression in a user-visible flow is caught by the pipeline.
9. As a maintainer, I want the committed README screenshots left untouched by CI, so that the pipeline never produces a diff of its own.
10. As a maintainer, I want the pipeline to run without production secrets, so that a fork's pull request can be verified safely.
11. As a maintainer, I want dependency installation to use the repository's lockfiles unchanged, so that CI verifies the versions the repository actually declares.
12. As a contributor, I want a merge or rebase to be verified by CI even though the local hook skips itself, so that the hook's necessary exemption is not a hole in the process.
13. As a maintainer, I want a failing end-to-end run to keep its traces and screenshots, so that a flake can be told apart from a defect.
14. As a maintainer, I want the pipeline defined in the repository, so that a change to how the project is verified is reviewed like any other change.

## Implementation Decisions

- **CI calls the repository's existing verification entry points.** It does not
  enumerate individual commands. When a package or a check is added, the entry
  point changes in one place and the pipeline follows.
- **Two tiers, matching the two entry points that already exist.** Pull requests
  run the fast check, because it is the one that has to be fast enough for
  people to wait on. The main branch runs the full check, which adds the
  production build and the browser suite.
- **The pipeline installs from the committed lockfiles with no resolution
  allowed.** A pipeline that silently resolves a newer dependency is verifying a
  different project from the one in the repository.
- **The screenshot project stays out of CI.** Generating the README images
  produces new binaries on every run, and the architecture documentation is
  explicit that they are regenerated deliberately. CI runs the end-to-end
  project only.
- **The end-to-end run gets a disposable database of its own**, provisioned by
  the pipeline, so no external service is required and nothing persists between
  runs.
- **The excerpt suggestion provider is not reachable from CI.** The suite selects
  the deterministic stub the provider seam already offers, so no AI credential
  exists in the pipeline and no test makes a real network call.
- **Failures upload their artifacts.** The browser suite's traces, screenshots
  and reports are retained on failure and discarded on success.
- **Merge protection is configured on the main branch** so that the check is a
  gate rather than a report. This is repository configuration, not code, and is
  recorded here so it is not forgotten.
- **The pre-commit hook stays as it is.** It is a fast local courtesy, and its
  merge exemption is correct. CI is what makes that exemption safe.

## Testing Decisions

The pipeline is verified by running, not by unit tests. What needs asserting is
that it fails when it should.

- **Seam:** the pipeline definition itself, exercised by a pull request.
- **Prior art:** the verification entry points and the Playwright project split
  already in the repository; the pipeline reuses both rather than restating them.
- **Cases, demonstrated once during implementation:**
  - A pull request with a type error fails the check.
  - A pull request with a lint error fails the check.
  - A pull request with a failing server test fails the check.
  - A clean pull request passes.
  - A run leaves the committed README screenshots unmodified.
  - A run completes with no AI provider credential present.

## Out of Scope

- Deployment, release tagging, and publishing artifacts.
- Caching strategy tuning beyond what is needed for a reasonable run time.
- Coverage thresholds and reporting.
- Automated dependency updates.
- Any change to what the verification entry points actually check.

## Further Notes

This ticket adds no new quality bar. The bar already exists, is documented, and
is good. The only thing missing is something that insists on it — which is why
this is a small change with an outsized effect on every other ticket in this
folder: each of them lands a test, and those tests are worth having only if
something runs them.

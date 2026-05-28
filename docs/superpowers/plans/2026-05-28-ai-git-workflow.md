# AI-Assisted Git Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install husky + lint-staged + prettier pre-commit safety net, add Conventional Commits + branch-name conventions, PR template, and AI-led review docs for trunk-based solo-dev workflow.

**Architecture:** Lean configuration-only change. No runtime code modified. Single `lint-staged` config at root handles both frontend (`app/`, `components/`, etc.) and `server/` directories via globs. Husky `pre-commit` hook runs `lint-staged`. All AI tasks (commit messages, PR review) use existing slash commands — no new tooling.

**Tech Stack:** husky 9, lint-staged 15, prettier 3, existing eslint 9 + typescript 5, bun package manager.

**Spec:** [`docs/superpowers/specs/2026-05-28-ai-git-workflow-design.md`](../specs/2026-05-28-ai-git-workflow-design.md)

**Deviation from spec:** Spec section 5 lists `server/package.json` with separate `lint-staged` config. Plan consolidates into a single root config with directory-scoped globs (`server/src/**/*.ts`). One husky hook at repo root fires once per commit — second config would require a second hook. Simpler + matches lint-staged best practice. Frontend tsconfig and backend tsconfig stay separate as before.

---

## File Structure

**Create:**
- `.prettierrc` — Prettier config (minimal, project-standard)
- `.prettierignore` — exclude node_modules, .next, dist, lock files, generated
- `.husky/pre-commit` — pre-commit hook script
- `.github/pull_request_template.md` — GitHub PR template
- `CONTRIBUTING.md` — full convention reference

**Modify:**
- `package.json` (root) — add `prepare` script, `lint-staged` config, devDependencies
- `CLAUDE.md` — append `## Git Workflow` section

**Not modified:**
- `server/package.json` — handled by root lint-staged config (see deviation note)
- `tsconfig.json` files — unchanged
- ESLint configs — unchanged

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install husky, lint-staged, prettier as devDependencies**

Run from project root:
```bash
bun add -d husky@^9 lint-staged@^15 prettier@^3
```

Expected: `package.json` `devDependencies` gains three entries, `bun.lock` updates.

- [ ] **Step 2: Verify installation**

Run:
```bash
bunx husky --version
bunx lint-staged --version
bunx prettier --version
```

Expected: three version numbers print without error. Husky ≥9, lint-staged ≥15, prettier ≥3.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add husky, lint-staged, prettier dev deps"
```

---

## Task 2: Add Prettier config

**Files:**
- Create: `.prettierrc`
- Create: `.prettierignore`

- [ ] **Step 1: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf"
}
```

Rationale: matches Next.js + ESLint default style. `endOfLine: "lf"` avoids Windows CRLF churn in git.

- [ ] **Step 2: Create `.prettierignore`**

```
node_modules
.next
out
dist
build
coverage
.claude/worktrees
bun.lock
package-lock.json
yarn.lock
*.min.js
*.min.css
public
server/dist
server/node_modules
docs/superpowers
```

Rationale: skip generated, vendored, and large or already-formatted files. `docs/superpowers/` excluded so brainstorming/plan docs aren't reformatted.

- [ ] **Step 3: Verify Prettier runs without error**

Run:
```bash
bunx prettier --check "components/**/*.tsx" 2>&1 | head -20
```

Expected: prints either "All matched files use Prettier code style!" or a list of files that would change. No crash, no config error.

- [ ] **Step 4: Commit**

```bash
git add .prettierrc .prettierignore
git commit -m "chore: add prettier config"
```

---

## Task 3: Configure lint-staged in root package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `prepare` script and `lint-staged` config**

Edit `package.json`. Inside `"scripts"` object add `"prepare": "husky"`. After the `"scripts"` object (but before `"dependencies"`), add the `"lint-staged"` object.

Resulting `package.json` excerpt:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "cleanup": "node scripts/remove-comments.mjs",
    "prepare": "husky"
  },
  "lint-staged": {
    "{app,components,lib,types,scripts}/**/*.{ts,tsx}": [
      "eslint --fix",
      "bash -c 'tsc --noEmit'"
    ],
    "{app,components,lib,types,scripts}/**/*.{js,jsx}": [
      "eslint --fix"
    ],
    "server/src/**/*.ts": [
      "bash -c 'cd server && tsc --noEmit'"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

Notes:
- `bash -c 'tsc --noEmit'` ignores lint-staged's positional file args — tsc runs project-wide using the closest `tsconfig.json`. Required because `tsc` needs whole-project context to resolve types.
- Frontend glob excludes `server/**` so server files don't run frontend tsconfig.
- Backend glob runs `tsc --noEmit -p server/tsconfig.json` equivalent via `cd server &&`.
- `*.{json,md,yml,yaml}` matches at any depth; respects `.prettierignore`.

- [ ] **Step 2: Validate JSON syntax**

Run:
```bash
bun --print "JSON.parse(require('fs').readFileSync('package.json','utf8')).scripts.prepare"
```

Expected: `husky`

Run:
```bash
bun --print "Object.keys(JSON.parse(require('fs').readFileSync('package.json','utf8'))['lint-staged']).length"
```

Expected: `4`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: configure lint-staged for pre-commit"
```

---

## Task 4: Initialize husky + write pre-commit hook

**Files:**
- Create: `.husky/pre-commit`
- Modify: `.gitignore` (if `.husky/_` missing)

- [ ] **Step 1: Run husky init**

Run:
```bash
bunx husky init
```

Expected: creates `.husky/pre-commit` with default `bun test` content, creates `.husky/_/` (internal), modifies `package.json` `prepare` script (already set in Task 3 — verify unchanged).

- [ ] **Step 2: Overwrite `.husky/pre-commit` with lint-staged invocation**

Replace contents of `.husky/pre-commit` with:
```sh
bunx lint-staged
```

No shebang line needed for husky v9. File should contain exactly one line: `bunx lint-staged`.

- [ ] **Step 3: Verify hook is executable and content correct**

Run:
```bash
cat .husky/pre-commit
```

Expected output:
```
bunx lint-staged
```

- [ ] **Step 4: Commit**

```bash
git add .husky/pre-commit
git commit -m "chore: add husky pre-commit hook"
```

Expected: commit succeeds. The hook fires on this commit — it runs lint-staged against staged files. Since only `.husky/pre-commit` is staged and matches no lint-staged pattern, lint-staged reports "No staged files match any configured task" and exits 0.

---

## Task 5: Verify pre-commit hook catches frontend errors

**Files:**
- Modify (temporarily): any frontend `.tsx` file

- [ ] **Step 1: Create a deliberately broken test file**

Create `components/__hook_test__.tsx`:
```tsx
export const BrokenComponent = () => {
  const x: number = "not a number";
  return <div>{x}</div>;
};
```

- [ ] **Step 2: Stage and attempt commit**

Run:
```bash
git add components/__hook_test__.tsx
git commit -m "test: verify pre-commit blocks type errors"
```

Expected: commit FAILS. lint-staged output shows `tsc --noEmit` error like:
```
components/__hook_test__.tsx:2:9 - error TS2322: Type 'string' is not assignable to type 'number'.
```

If commit succeeds: hook not wired correctly — revisit Task 4.

- [ ] **Step 3: Clean up**

Run:
```bash
git restore --staged components/__hook_test__.tsx
rm components/__hook_test__.tsx
```

Expected: file removed, nothing staged.

- [ ] **Step 4: Verify clean state**

Run:
```bash
git status
```

Expected: clean working tree (or only Task 5 outputs cleared).

No commit for this task — verification only.

---

## Task 6: Create PR template

**Files:**
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: Create directory and template file**

Create `.github/pull_request_template.md`:
```markdown
## Summary

<!-- 1-3 sentences: what changed and why -->

## Type

- [ ] feat
- [ ] fix
- [ ] docs
- [ ] refactor
- [ ] chore
- [ ] perf

## Changes

<!-- Bullet list of key changes -->

-

## Test Plan

<!-- How to verify this works -->

- [ ]

## Screenshots

<!-- UI changes only — before/after -->

## Checklist

- [ ] `bun lint` passes
- [ ] `bun build` passes
- [ ] Self-reviewed via `/code-review`
- [ ] Conventional Commits format used
- [ ] Branch follows naming convention (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`)
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
bun --print "require('fs').existsSync('.github/pull_request_template.md')"
```

Expected: `true`

- [ ] **Step 3: Commit**

```bash
git add .github/pull_request_template.md
git commit -m "docs: add PR template"
```

---

## Task 7: Create CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Create CONTRIBUTING.md**

```markdown
# Contributing to Vision

This project uses a **trunk-based workflow** with AI-assisted commits and reviews via Claude Code.

## Quick Start

```bash
git checkout main
git pull
git checkout -b feat/<your-topic>
# make changes
/commit            # AI generates Conventional Commit message
git push -u origin feat/<your-topic>
gh pr create        # PR template auto-loads
/code-review        # AI self-review of diff
# merge via GitHub (squash)
```

## Branching

| Pattern | Use |
|---------|-----|
| `feat/<topic>` | New feature |
| `fix/<bug>` | Bug fix |
| `chore/<task>` | Tooling, config, deps |
| `docs/<topic>` | Docs only |
| `refactor/<area>` | Refactor (no behavior change) |
| `hotfix/<issue>` | Emergency fix (rare) |

Rules: kebab-case, short-lived (target <3 days), delete after merge.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types**: `feat | fix | docs | style | refactor | perf | test | chore | ci`

**Rules**:
- Subject: imperative, lowercase, no period, max 72 chars
- Scope: optional, lowercase (`dashboard`, `blog`, `auth`, `api`, `server`)
- Body: explain *why* if non-obvious, wrap at 100 chars
- Footer: `BREAKING CHANGE: <desc>` or `Refs: #123`

**Examples**:
```
feat(dashboard): add post filter bar
fix(auth): token expiry check uses < not <=
chore(deps): bump next to 16.1.6
refactor(server): extract analytics aggregation into service
```

**Tip**: use the `/commit` slash command in Claude Code — it generates Conventional Commit messages from the staged diff.

## Pull Requests

1. Push branch: `git push -u origin <branch>`
2. Open PR: `gh pr create` (template auto-loads from `.github/pull_request_template.md`)
3. Self-review: `/code-review` in Claude Code
4. Optional deep review: `/ultrareview` (user-triggered, multi-agent, billed)
5. Squash merge to `main`
6. Delete branch on remote + local

**Never** push to `main` directly.

## Pre-commit Hook

`husky` runs `lint-staged` on every commit:

| Files | Checks |
|-------|--------|
| `{app,components,lib,types,scripts}/**/*.{ts,tsx}` | `eslint --fix`, `tsc --noEmit` |
| `{app,components,lib,types,scripts}/**/*.{js,jsx}` | `eslint --fix` |
| `server/src/**/*.ts` | `tsc --noEmit` (backend tsconfig) |
| `*.{json,md,yml,yaml}` | `prettier --write` |

**Bypass**: `--no-verify` only for emergencies. Document the reason in the commit body.

## Claude Code Slash Commands

| Command | What it does |
|---------|--------------|
| `/commit` | Generate Conventional Commit from staged diff |
| `/commit-push-pr` | Commit + push + open PR in one flow |
| `/code-review` | Review current diff for bugs |
| `/security-review` | Security-focused review |
| `/review` | Review a specific PR |
| `/ultrareview` | Multi-agent cloud review (billed) |
| `/clean_gone` | Delete local branches whose remotes are gone |
```

- [ ] **Step 2: Verify file**

Run:
```bash
bun --print "require('fs').readFileSync('CONTRIBUTING.md','utf8').split('\n').length"
```

Expected: number ≥ 80 (rough length sanity check).

- [ ] **Step 3: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md with workflow conventions"
```

---

## Task 8: Update CLAUDE.md with Git Workflow section

**Files:**
- Modify: `CLAUDE.md` (append at end)

- [ ] **Step 1: Append `## Git Workflow` section**

Append the following to the end of `D:\Work\vision\CLAUDE.md` (preserve existing content):

```markdown

## Git Workflow

Trunk-based development. `main` = source of truth. All changes via short-lived feature branches + PR. See [CONTRIBUTING.md](./CONTRIBUTING.md) for full reference.

### Branching
- `feat/<topic>` — new feature
- `fix/<bug>` — bug fix
- `chore/<task>` — tooling/config
- `docs/<topic>` — docs only
- `refactor/<area>` — refactor
- kebab-case, target merge within 3 days, delete after merge

### Commits
- Conventional Commits format: `<type>(<scope>): <subject>`
- Use `/commit` slash command to generate message from staged diff
- Subject imperative, lowercase, no period, max 72 chars

### Pull Requests
- Use `.github/pull_request_template.md`
- Self-review with `/code-review` before requesting merge
- Squash merge to `main` (linear history)
- Never push to `main` directly

### Pre-commit Hook
- `husky` runs `lint-staged`: `eslint --fix` + `tsc --noEmit` on staged TS/TSX files
- `prettier --write` on JSON/MD/YAML
- Never use `--no-verify` to skip unless emergency (document reason in commit body)

### Useful Commands
- `/commit` — AI-generated Conventional Commit
- `/commit-push-pr` — full flow in one shot
- `/code-review` — review current diff
- `/clean_gone` — cleanup stale local branches
```

- [ ] **Step 2: Verify section appended**

Run:
```bash
bun --print "require('fs').readFileSync('CLAUDE.md','utf8').includes('## Git Workflow')"
```

Expected: `true`

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Git Workflow section to CLAUDE.md"
```

---

## Task 9: End-to-end smoke test

**Files:** none modified — verification only.

- [ ] **Step 1: Verify hooks fire on clean change**

Make a trivial doc edit to verify the full pipeline:
```bash
echo "" >> README.md
git add README.md
git commit -m "chore: smoke test pre-commit hook"
```

Expected: pre-commit runs `prettier --write` on README.md (since `*.md` matches the lint-staged glob). Commit succeeds.

- [ ] **Step 2: Verify git log shows all workflow setup commits**

Run:
```bash
git log --oneline -15
```

Expected: see the commits from Tasks 1, 2, 3, 4, 6, 7, 8, 9. Plus the spec commit `8569e3e`.

- [ ] **Step 3: Verify `gh pr create` would use the template**

Run (does not actually create a PR — just dry-run inspection):
```bash
bun --print "require('fs').readFileSync('.github/pull_request_template.md','utf8').slice(0,100)"
```

Expected: shows `## Summary` heading at start.

- [ ] **Step 4: Verify no broken state**

Run:
```bash
git status
bun lint
bun run build
```

Expected:
- `git status`: clean working tree.
- `bun lint`: exit 0 (or pre-existing warnings only — no new errors introduced by this work).
- `bun run build`: exit 0, Next.js production build succeeds.

If `bun run build` fails due to changes from this plan: investigate root cause; this plan should not change any runtime code paths.

No commit for this task — verification only.

---

## Self-Review Notes

**Spec coverage check** (against `2026-05-28-ai-git-workflow-design.md`):
- Section 1 Conventions → CONTRIBUTING.md (Task 7) + CLAUDE.md (Task 8) ✓
- Section 2 Pre-commit hook → Tasks 1-5 ✓
- Section 3 PR workflow → PR template (Task 6) + CONTRIBUTING.md (Task 7) ✓
- Section 4 CLAUDE.md additions → Task 8 ✓
- Section 5 Deliverables: `server/package.json` modification dropped (see deviation note at top). All other deliverables covered.

**Slash command reuse**: no new slash commands created. All AI flows use existing `/commit`, `/code-review`, `/commit-push-pr`, etc.

**No CI/CD work**: matches spec "Future Work" exclusion.

**Bypass behaviour**: `--no-verify` policy documented in CONTRIBUTING.md + CLAUDE.md but not enforced via tooling (matches "lean" approach).

# AI-Assisted Git Workflow — Design

**Date**: 2026-05-28
**Status**: Approved
**Project**: Vision (Next.js 16 + Express backend)
**Approach**: Lean + AI-led (manual slash commands, trunk-based)

---

## Goal

Establish an AI-assisted Git workflow for a solo developer using Claude Code. Optimize for:
- Predictable commit/branch conventions (machine-parseable)
- Pre-commit safety net (lint + types) without slowing flow
- AI-generated commits, PR descriptions, and reviews on demand
- Low overhead, no enforcement tooling beyond what catches real bugs

## Non-Goals

- Multi-developer governance (no commitlint, no protected-branch enforcement scripts)
- Automated CI/CD (separate future spec)
- CHANGELOG generation / semantic release (separate future spec)
- Git Flow or release-branch model

---

## 1. Conventions

### Commit Format — Conventional Commits

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types**:
| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no code change) |
| `refactor` | Code change, no behavior change |
| `perf` | Performance improvement |
| `test` | Tests only |
| `chore` | Tooling, config, deps |
| `ci` | CI/CD config |

**Rules**:
- Subject: imperative, lowercase, no period, max 72 chars
- Scope: optional, lowercase, matches feature area (`dashboard`, `blog`, `auth`, `api`, `server`)
- Body: explain *why* if non-obvious. Wrap at 100 chars.
- Footer: `BREAKING CHANGE: <desc>` or `Refs: #123`

**Examples**:
```
feat(dashboard): add post filter bar
fix(auth): token expiry check uses < not <=
chore(deps): bump next to 16.1.6
refactor(server): extract analytics aggregation into service
```

### Branch Naming

```
<type>/<short-kebab-topic>
```

**Patterns**:
- `feat/<topic>` — new feature
- `fix/<bug-or-issue>` — bug fix
- `chore/<task>` — tooling/config
- `docs/<topic>` — docs only
- `refactor/<area>` — refactor
- `hotfix/<issue>` — emergency fix to main (rare)

**Rules**:
- kebab-case
- Short-lived: target merge within 3 days
- Delete after merge (`/clean_gone` skill cleans local stale branches)
- One branch per logical change

**Examples**: `feat/post-filter-bar`, `fix/auth-token-expiry`, `chore/husky-setup`

---

## 2. Pre-commit Hook

### Stack

- `husky` — git hooks manager
- `lint-staged` — run linters on staged files only
- `prettier` — formatter (markdown, json, configs)
- Existing: `eslint` (Next.js config), `typescript`

### Frontend Config

`package.json` (project root):
```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "bash -c 'tsc --noEmit'"
    ],
    "*.{js,jsx}": ["eslint --fix"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

`.husky/pre-commit`:
```bash
bunx lint-staged
```

### Backend Config

`server/package.json`:
```json
{
  "lint-staged": {
    "*.ts": [
      "bash -c 'tsc --noEmit -p server/tsconfig.json'"
    ]
  }
}
```

Backend has no ESLint config currently. Add later if needed.

### What's Skipped

- **Tests**: too slow for pre-commit. Run in PR via CI (future) or manually.
- **Full project lint**: only staged files lint, not whole repo.
- **Build**: too slow. Manual `bun build` before PR.

### Bypass Policy

`--no-verify` only for emergencies. Reasoning required in commit body.

---

## 3. PR Workflow + AI Review

### PR Template

`.github/pull_request_template.md`:
```markdown
## Summary
<1-3 sentences: what changed and why>

## Type
- [ ] feat
- [ ] fix
- [ ] docs
- [ ] refactor
- [ ] chore
- [ ] perf

## Changes
- <bullet list of key changes>

## Test Plan
- [ ] <how to verify>

## Screenshots
<UI changes only — before/after>

## Checklist
- [ ] `bun lint` passes
- [ ] `bun build` passes
- [ ] Self-reviewed via `/code-review`
- [ ] Conventional Commits format
- [ ] Branch follows naming convention
```

### Standard Flow

1. **Branch**: `git checkout -b feat/<topic>` from latest `main`
2. **Code**: implement change
3. **Commit**: invoke `/commit` — AI composes Conventional Commit from staged diff
4. **Push**: `git push -u origin feat/<topic>`
5. **PR**: `gh pr create` — template auto-fills
6. **Self-review**: invoke `/code-review` on diff (catches bugs, style issues)
7. **Optional deep review**: user triggers `/ultrareview` (billed, multi-agent)
8. **Merge**: squash merge to `main` (keeps history linear)
9. **Cleanup**: delete branch on remote + local

### Shortcut Flow

For small atomic changes: `/commit-push-pr` runs steps 3-5 in one shot.

### AI Tools Already Available

| Skill | Use |
|-------|-----|
| `/commit` | Generate Conventional Commit message from staged diff |
| `/commit-push-pr` | Commit + push + open PR in one flow |
| `/code-review` | Review current diff for bugs |
| `/security-review` | Security-focused review |
| `/review` | Review a specific PR |
| `/ultrareview` | Multi-agent cloud review (user-triggered, billed) |
| `/clean_gone` | Cleanup stale local branches after remote delete |
| `/caveman-commit` | Compressed commit message variant |
| `/caveman-review` | Compressed PR review variant |

No new skills needed — reuse existing.

---

## 4. CLAUDE.md Additions

Append to `D:\Work\vision\CLAUDE.md` under new `## Git Workflow` section:

```markdown
## Git Workflow

Trunk-based development. `main` = source of truth. All changes via short-lived feature branches + PR.

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

---

## 5. Deliverables

| File | Purpose |
|------|---------|
| `CONTRIBUTING.md` | Full convention reference (commits, branches, PR flow) |
| `.github/pull_request_template.md` | PR template auto-loaded by GitHub |
| `.husky/pre-commit` | Pre-commit hook script |
| `package.json` (root) | Add `husky`, `lint-staged` deps + config + `prepare` script |
| `server/package.json` | Add `lint-staged` config for backend TS |
| `CLAUDE.md` | Append `## Git Workflow` section |
| `.prettierrc` | Prettier config (minimal: respect editor defaults) |
| `.prettierignore` | Ignore `node_modules`, `.next`, `dist`, lock files |

### Install Commands

```bash
# From project root
bun add -d husky lint-staged prettier
bunx husky init
# Edit .husky/pre-commit to call `bunx lint-staged`
```

---

## Open Questions

None. All decisions captured above.

## Future Work (Out of Scope)

- CI/CD via GitHub Actions (lint + test + build on PR, deploy on merge main)
- CHANGELOG.md generation from Conventional Commits
- Semantic versioning + release tags
- `commitlint` enforcement if team grows
- Branch protection rules on `main` (GitHub settings, not code)

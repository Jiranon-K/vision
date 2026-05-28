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

| Pattern           | Use                           |
| ----------------- | ----------------------------- |
| `feat/<topic>`    | New feature                   |
| `fix/<bug>`       | Bug fix                       |
| `chore/<task>`    | Tooling, config, deps         |
| `docs/<topic>`    | Docs only                     |
| `refactor/<area>` | Refactor (no behavior change) |
| `hotfix/<issue>`  | Emergency fix (rare)          |

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
- Body: explain _why_ if non-obvious, wrap at 100 chars
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

| Files                                                    | Checks                            |
| -------------------------------------------------------- | --------------------------------- |
| `{app,components,hooks,lib,types,scripts}/**/*.{ts,tsx}` | `eslint --fix`, `tsc --noEmit`    |
| `{app,components,hooks,lib,types,scripts}/**/*.{js,jsx}` | `eslint --fix`                    |
| `server/src/**/*.ts`                                     | `tsc --noEmit` (backend tsconfig) |
| `*.{json,md,yml,yaml}`                                   | `prettier --write`                |

**Bypass**: `--no-verify` only for emergencies. Document the reason in the commit body.

## Claude Code Slash Commands

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `/commit`          | Generate Conventional Commit from staged diff |
| `/commit-push-pr`  | Commit + push + open PR in one flow           |
| `/code-review`     | Review current diff for bugs                  |
| `/security-review` | Security-focused review                       |
| `/review`          | Review a specific PR                          |
| `/ultrareview`     | Multi-agent cloud review (billed)             |
| `/clean_gone`      | Delete local branches whose remotes are gone  |

import { join } from 'node:path';
import { REPO_ROOT, WORKTREE } from './config';
import { exec, execOrThrow } from './exec';
import type { BranchPrefix } from './config';

const AGENT_BRANCH_PLACEHOLDER = 'agent/idle';

async function worktreeExists(): Promise<boolean> {
  const list = await execOrThrow(['git', 'worktree', 'list', '--porcelain'], {
    cwd: REPO_ROOT,
  });
  return list.split('\n').some((line) => {
    if (!line.startsWith('worktree ')) return false;
    const path = line.slice('worktree '.length).replace(/\\/g, '/');
    return path.toLowerCase() === WORKTREE.replace(/\\/g, '/').toLowerCase();
  });
}

/**
 * Brings the agent worktree to a clean copy of origin/main. This runs before
 * every task rather than once at creation: starting from yesterday's main is
 * how an agent produces a diff that conflicts for no reason.
 */
export async function prepareWorktree(): Promise<void> {
  await execOrThrow(['git', 'fetch', 'origin', '--prune'], { cwd: REPO_ROOT });

  if (!(await worktreeExists())) {
    await exec(['git', 'branch', '-f', AGENT_BRANCH_PLACEHOLDER, 'origin/main'], {
      cwd: REPO_ROOT,
    });
    await execOrThrow(
      ['git', 'worktree', 'add', WORKTREE, AGENT_BRANCH_PLACEHOLDER],
      { cwd: REPO_ROOT }
    );
  }

  await execOrThrow(['git', 'fetch', 'origin', '--prune'], { cwd: WORKTREE });
  await execOrThrow(['git', 'checkout', '--detach', 'origin/main'], { cwd: WORKTREE });
  await execOrThrow(['git', 'reset', '--hard', 'origin/main'], { cwd: WORKTREE });
  // Keep node_modules — `git clean -fdx` would delete it and force a full
  // reinstall (and a Playwright browser download) on every task.
  await execOrThrow(['git', 'clean', '-fd'], { cwd: WORKTREE });

  // Dependencies are not shared across worktrees. Installing every time is
  // cheap when the lockfile has not moved, and it is the only thing that keeps
  // the gate honest when a task changes dependencies.
  await execOrThrow(['bun', 'install', '--frozen-lockfile'], { cwd: WORKTREE });
  await execOrThrow(['bun', 'install', '--frozen-lockfile'], {
    cwd: join(WORKTREE, 'server'),
  });
  await execOrThrow(['bun', 'install', '--frozen-lockfile'], {
    cwd: join(WORKTREE, 'harness'),
  });
}

export function branchName(type: BranchPrefix, title: string, issue: number | null): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48)
    .replace(/-$/, '');
  return issue === null ? `${type}/${slug}` : `${type}/${issue}-${slug}`;
}

export async function createBranch(name: string): Promise<void> {
  await execOrThrow(['git', 'checkout', '-B', name], { cwd: WORKTREE });
}

export async function changedFiles(): Promise<string[]> {
  const tracked = await execOrThrow(['git', 'diff', '--name-only', 'origin/main'], {
    cwd: WORKTREE,
  });
  const untracked = await execOrThrow(
    ['git', 'ls-files', '--others', '--exclude-standard'],
    { cwd: WORKTREE }
  );
  return [...tracked.split('\n'), ...untracked.split('\n')]
    .map((f) => f.trim().replace(/\\/g, '/'))
    .filter(Boolean);
}

export async function hasChanges(): Promise<boolean> {
  return (await changedFiles()).length > 0;
}

export async function diff(): Promise<string> {
  await execOrThrow(['git', 'add', '-A'], { cwd: WORKTREE });
  return execOrThrow(['git', 'diff', '--cached', 'origin/main'], { cwd: WORKTREE });
}

/**
 * A diff that removes a test file or reduces assertions is the shortest path to
 * a green gate, and it looks like success from every angle except the one that
 * matters. Detected here rather than trusted to the prompt.
 */
export async function detectTestWeakening(): Promise<string[]> {
  const findings: string[] = [];

  const deleted = await execOrThrow(
    ['git', 'diff', '--cached', '--diff-filter=D', '--name-only', 'origin/main'],
    { cwd: WORKTREE }
  );
  for (const file of deleted.split('\n').map((f) => f.trim()).filter(Boolean)) {
    if (/\.(test|spec)\.[tj]sx?$/.test(file) || file.startsWith('e2e/')) {
      findings.push(`Deleted test file: ${file}`);
    }
  }

  const numstat = await execOrThrow(
    ['git', 'diff', '--cached', '--numstat', 'origin/main'],
    { cwd: WORKTREE }
  );
  for (const line of numstat.split('\n')) {
    const [added, removed, file] = line.split('\t');
    if (!file) continue;
    if (!/\.(test|spec)\.[tj]sx?$/.test(file) && !file.startsWith('e2e/')) continue;
    const addedCount = Number(added);
    const removedCount = Number(removed);
    if (Number.isFinite(addedCount) && Number.isFinite(removedCount) && removedCount > addedCount) {
      findings.push(
        `${file}: removes ${removedCount} lines and adds ${addedCount} — existing coverage may have been weakened.`
      );
    }
  }

  return findings;
}

export async function commit(message: string): Promise<void> {
  await execOrThrow(['git', 'add', '-A'], { cwd: WORKTREE });
  await execOrThrow(['git', 'commit', '-m', message], { cwd: WORKTREE });
}

export type RebaseOutcome = 'clean' | 'not-needed' | 'conflicted';

/**
 * Rebasing without conflicts is a mechanical operation. Resolving a conflict is
 * not: it needs the intent of both sides, and the agent only has its own. The
 * usual failure is silently discarding the other side's work — after which the
 * gate goes green because the code still compiles. That is invisible to
 * verification, so it is prevented by rule rather than checked for.
 */
export async function rebaseOnMain(): Promise<RebaseOutcome> {
  await execOrThrow(['git', 'fetch', 'origin', '--prune'], { cwd: WORKTREE });

  const behind = await execOrThrow(
    ['git', 'rev-list', '--count', 'HEAD..origin/main'],
    { cwd: WORKTREE }
  );
  if (behind.trim() === '0') return 'not-needed';

  const result = await exec(['git', 'rebase', 'origin/main'], { cwd: WORKTREE });
  if (result.code === 0) return 'clean';

  await exec(['git', 'rebase', '--abort'], { cwd: WORKTREE });
  return 'conflicted';
}

export async function push(branch: string): Promise<void> {
  await execOrThrow(['git', 'push', '-u', 'origin', branch], { cwd: WORKTREE });
}

export const worktreePath = WORKTREE;

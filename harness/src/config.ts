import { resolve } from 'node:path';
import type { EffortLevel } from '@anthropic-ai/claude-agent-sdk';

/** The checkout the harness itself lives in. */
export const REPO_ROOT = resolve(import.meta.dir, '..', '..');

/**
 * A single persistent worktree, reset between tasks. Per-task worktrees would
 * need `bun install` and a Playwright browser download every run; one long-lived
 * worktree pays that once, at the cost of running tasks serially.
 */
export const WORKTREE = resolve(REPO_ROOT, '..', 'vision-agent');

export const ARTIFACTS_DIR = resolve(REPO_ROOT, '.agents', 'runs');

export const MODELS = {
  implementer: { model: 'claude-opus-5', effort: 'xhigh' as EffortLevel },
  // Read-only, so it cannot fix what it finds — findings go back to the
  // implementer session rather than a second writer touching the same files.
  reviewer: { model: 'claude-opus-5', effort: 'high' as EffortLevel },
};

/**
 * Four independent ceilings; whichever is reached first ends the run. The
 * no-progress ceiling is the one that usually fires: a stuck agent edits back
 * and forth and lands on the same gate output.
 */
export const BUDGETS = {
  maxRepairIterations: 5,
  maxWallClockMs: 30 * 60_000,
  maxCostUsd: 12,
  noProgressIterations: 2,
  maxReviewRounds: 2,
  maxNewIssuesPerTask: 2,
};

export const LABELS = {
  readyForAgent: 'ready-for-agent',
  readyForHuman: 'ready-for-human',
  needsInfo: 'needs-info',
  needsTriage: 'needs-triage',
};

/** Paths whose modification means the slow gate tier must run. */
export const UI_PATHS = ['app/', 'components/', 'hooks/', 'middleware.ts'];

export const BRANCH_PREFIXES = ['feat', 'fix', 'chore', 'docs', 'refactor'] as const;
export type BranchPrefix = (typeof BRANCH_PREFIXES)[number];

/** Task types exempt from the red-test checkpoint. */
export const TDD_EXEMPT: BranchPrefix[] = ['chore', 'docs', 'refactor'];

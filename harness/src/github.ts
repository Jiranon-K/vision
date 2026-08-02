import { LABELS } from './config';
import { exec, execOrThrow } from './exec';
import { REPO_ROOT, WORKTREE } from './config';
import type { BranchPrefix } from './config';
import type { Task } from './types';

interface RawIssue {
  number: number;
  title: string;
  body: string | null;
  labels: { name: string }[];
}

function inferType(issue: RawIssue): BranchPrefix {
  const names = issue.labels.map((l) => l.name.toLowerCase());
  const haystack = `${issue.title} ${names.join(' ')}`.toLowerCase();
  if (names.includes('bug') || /\bfix\b/.test(haystack)) return 'fix';
  if (names.includes('documentation') || /\bdocs?\b/.test(haystack)) return 'docs';
  if (/\brefactor\b/.test(haystack)) return 'refactor';
  if (/\bchore\b|\bdeps\b/.test(haystack)) return 'chore';
  return 'feat';
}

/**
 * Returns null when the queue is empty. A `gh` failure throws — proceeding on
 * stale state is worse than stopping.
 */
export async function nextTask(): Promise<Task | null> {
  const json = await execOrThrow(
    [
      'gh',
      'issue',
      'list',
      '--state',
      'open',
      '--label',
      LABELS.readyForAgent,
      '--limit',
      '20',
      '--json',
      'number,title,body,labels',
    ],
    { cwd: REPO_ROOT }
  );

  const issues = JSON.parse(json || '[]') as RawIssue[];
  const issue = issues[0];
  if (!issue) return null;

  return {
    issue: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    type: inferType(issue),
  };
}

export async function comment(issue: number, body: string): Promise<void> {
  await execOrThrow(['gh', 'issue', 'comment', String(issue), '--body', body], {
    cwd: REPO_ROOT,
  });
}

/**
 * Every terminal outcome removes `ready-for-agent`. Without that the queue
 * picks up the same issue on the next pass and fails the same way forever.
 */
export async function relabel(
  issue: number,
  add: string | null
): Promise<void> {
  const args = ['gh', 'issue', 'edit', String(issue), '--remove-label', LABELS.readyForAgent];
  if (add) args.push('--add-label', add);
  await exec(args, { cwd: REPO_ROOT });
}

export async function openPullRequest(options: {
  branch: string;
  title: string;
  body: string;
  draft: boolean;
}): Promise<string> {
  const args = [
    'gh',
    'pr',
    'create',
    '--head',
    options.branch,
    '--base',
    'main',
    '--title',
    options.title,
    '--body',
    options.body,
  ];
  if (options.draft) args.push('--draft');
  return execOrThrow(args, { cwd: WORKTREE });
}

export async function commentOnPr(url: string, body: string): Promise<void> {
  await exec(['gh', 'pr', 'comment', url, '--body', body], { cwd: WORKTREE });
}

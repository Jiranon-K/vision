import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { BUDGETS, TDD_EXEMPT } from './config';
import type { Task } from './types';

/**
 * Only committed files feed the prompt. CLAUDE.md and .claude/ are gitignored,
 * so a fresh worktree does not have them — a prompt that depended on them would
 * make behaviour a function of one machine's state, with nothing in git to
 * explain a difference in outcome.
 */
const CONTEXT_FILES = ['CONTEXT.md', 'CONTRIBUTING.md', 'AGENTS.md'];
const CONTEXT_DIRS = ['docs/agents', 'docs/adr'];

async function readIfPresent(path: string): Promise<string | null> {
  const file = Bun.file(path);
  return (await file.exists()) ? file.text() : null;
}

async function readDirIfPresent(worktree: string, dir: string): Promise<string[]> {
  try {
    const entries = await readdir(join(worktree, dir));
    const contents: string[] = [];
    for (const entry of entries.filter((e) => e.endsWith('.md')).sort()) {
      const body = await readIfPresent(join(worktree, dir, entry));
      if (body) contents.push(`### ${dir}/${entry}\n\n${body}`);
    }
    return contents;
  } catch {
    return [];
  }
}

const OPERATING_RULES = `
# How you work here

You are running unattended inside an automated loop. Nobody is watching, and
nobody can answer a question mid-task.

## Verification

A machine gate runs after you finish, outside your control:

- Fast tier, every iteration: \`bun run typecheck\`, \`bun run typecheck:server\`,
  \`bun run lint\`, \`bun run test:server\`
- Slow tier, once before the PR: \`bun run build\`, and \`bun run test:e2e\` when
  the diff touches app/, components/, hooks/, or middleware.ts

Failures come back to you as a message. Do not run the gate yourself and do not
add your own checking passes; the loop handles that.

## Scope

Deliver what the issue asked for, at the scope it intended. Make routine
judgement calls yourself; the repo's conventions and CONTEXT.md answer most of
them. Do not quietly widen, narrow, or transform the request. Finish the whole
task — report completion only when it is actually done, and if part of it is
genuinely blocked, do the rest and say plainly what is missing and why.

Forbidden without the issue explicitly asking:

- Upgrading an existing dependency, and any major version of next, react,
  express, or mongoose
- Refactoring code unrelated to the task
- Editing npm scripts, config files, or harness/
- Deleting a test file or weakening an existing assertion — this is checked
  mechanically and is an automatic blocking finding

Adding a new dependency is allowed when the task needs it; justify it in the PR
body. If you notice unrelated problems worth fixing, open at most
${BUDGETS.maxNewIssuesPerTask} issues with \`gh issue create --label needs-triage\`
and move on.

## Git

Branch names follow CONTRIBUTING.md. Commits use Conventional Commits. Never
push to main, never force push, never use --no-verify, and never merge or
approve a pull request.

## Delegating to subagents

Subagents multiply cost and time: each one re-establishes context, re-explores,
and reports back, and you then re-read its report. Delegate only when the payoff
clearly exceeds that overhead — a genuinely independent, sizeable track such as
a wide multi-file investigation. Do not use subagents for work you could finish
in a handful of tool calls, and never to check your own work. Keep spawn counts
low; never more than four.

## Writing

Keep the plan, PR body, and issue comments short and concrete. Say what changed
and why; skip restating the issue back. Match the surrounding code's comment
density — write a comment only for a constraint the code cannot express.

Avoid unnecessary self-correction. Correct an earlier statement only when the
error changes what the reader would do; otherwise just fix it and continue.
`.trim();

function tddSection(task: Task): string {
  if (TDD_EXEMPT.includes(task.type)) {
    return `
## Tests

This is a \`${task.type}\` task, so no new test is required. Existing tests must
still pass — if one fails, fix the code, not the test.
`.trim();
  }

  return `
## Tests come first

Before writing any implementation:

1. Write one test at the highest seam that fits — a Playwright spec in \`e2e/\`
   for user-visible behaviour, a vitest integration test in \`server/tests/\` for
   server-only behaviour.
2. Reply with exactly one line, and nothing else:
   \`TEST_READY: <path to the test file>\`
3. The loop runs that test and requires it to fail for the right reason. A test
   that passes immediately, or fails because the file will not load, comes back
   to you to rewrite.
4. Only once the loop confirms a real failure do you write the implementation.

Test what the behaviour is, through the public interface. A test that asserts
something already true proves nothing.
`.trim();
}

export async function buildSystemPrompt(
  worktree: string,
  task: Task
): Promise<string> {
  const sections: string[] = [
    'You are an autonomous contributor to Vision, a publishing platform for content creators.',
  ];

  for (const file of CONTEXT_FILES) {
    const body = await readIfPresent(join(worktree, file));
    if (body) sections.push(`# ${file}\n\n${body}`);
  }

  for (const dir of CONTEXT_DIRS) {
    const contents = await readDirIfPresent(worktree, dir);
    if (contents.length > 0) sections.push(`# ${dir}\n\n${contents.join('\n\n')}`);
  }

  sections.push(OPERATING_RULES);
  sections.push(tddSection(task));

  return sections.join('\n\n---\n\n');
}

export function buildTaskPrompt(task: Task): string {
  const heading = task.issue
    ? `Issue #${task.issue}: ${task.title}`
    : `Task: ${task.title}`;

  return [
    heading,
    '',
    task.body,
    '',
    '---',
    '',
    'Start by posting a short plan: what you will change and why, in a few lines.',
    'Then do the work.',
  ].join('\n');
}

export function buildRepairPrompt(fingerprint: string, iteration: number, max: number): string {
  return [
    `The verification gate failed (repair iteration ${iteration} of ${max}).`,
    '',
    '```',
    fingerprint.slice(0, 12_000),
    '```',
    '',
    'Fix the cause. Do not re-run the gate yourself.',
  ].join('\n');
}

export function buildAmbiguityPrompt(): string {
  return [
    'Before starting: is anything here underspecified in a way you cannot decide?',
    '',
    'Ask only about things a careful colleague could not settle alone — required',
    'behaviour in an edge case, user-visible copy, a data shape that must match',
    'something existing, or a question whose answers imply different code.',
    '',
    'Do not ask about file naming, variable naming, where a component lives, or',
    'whether to extract a helper. The repo conventions and CONTEXT.md answer those.',
    '',
    'Reply with exactly one line and nothing else:',
    '  NEEDS_INFO: <the question>',
    'or',
    '  PROCEED',
  ].join('\n');
}

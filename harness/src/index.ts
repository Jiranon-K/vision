#!/usr/bin/env bun
import { BRANCH_PREFIXES, LABELS, type BranchPrefix } from './config';
import * as gh from './github';
import { runTask } from './runTask';
import type { Task } from './types';

function parseArgs(argv: string[]): {
  mode: 'queue' | 'adhoc';
  task?: string;
  type: BranchPrefix;
  once: boolean;
} {
  let task: string | undefined;
  let type: BranchPrefix = 'feat';
  let once = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--task' || arg === '-t') {
      task = argv[i + 1];
      i += 1;
    } else if (arg === '--type') {
      const value = argv[i + 1];
      if (value && (BRANCH_PREFIXES as readonly string[]).includes(value)) {
        type = value as BranchPrefix;
      }
      i += 1;
    } else if (arg === '--once') {
      once = true;
    }
  }

  return { mode: task ? 'adhoc' : 'queue', task, type, once };
}

function usage(): void {
  console.log(
    [
      'Usage:',
      '  bun run harness/src/index.ts --task "<description>" [--type feat|fix|chore|docs|refactor]',
      '  bun run harness/src/index.ts [--once]',
      '',
      'With --task the harness runs one ad-hoc task and never touches GitHub.',
      `Without it, it drains open issues labelled "${LABELS.readyForAgent}", one at a time.`,
    ].join('\n')
  );
}

async function runQueue(once: boolean): Promise<void> {
  for (;;) {
    let task: Task | null;
    try {
      task = await gh.nextTask();
    } catch (error) {
      // Proceeding on stale state is worse than stopping.
      console.error(`Could not read the queue: ${String(error)}`);
      process.exitCode = 1;
      return;
    }

    if (!task) {
      console.log(`No open issues labelled "${LABELS.readyForAgent}".`);
      return;
    }

    console.log(`\n=== #${task.issue} ${task.title}`);
    const outcome = await runTask(task);

    if (task.issue !== null) {
      if (outcome.kind === 'success') {
        await gh.comment(task.issue, `Opened ${outcome.prUrl}`);
        await gh.relabel(task.issue, null);
      } else if (outcome.kind === 'needs-info') {
        await gh.comment(task.issue, outcome.question);
        await gh.relabel(task.issue, LABELS.needsInfo);
      } else {
        const body = outcome.prUrl
          ? `Stopped: ${outcome.reason}. Work preserved in ${outcome.prUrl}.`
          : `Stopped: ${outcome.reason}.`;
        await gh.comment(task.issue, body);
        await gh.relabel(task.issue, LABELS.readyForHuman);
      }
    }

    if (once) return;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    return;
  }

  if (args.mode === 'adhoc' && args.task) {
    const outcome = await runTask({
      issue: null,
      title: args.task.slice(0, 72),
      body: args.task,
      type: args.type,
    });
    if (outcome.kind !== 'success') process.exitCode = 1;
    return;
  }

  await runQueue(args.once);
}

await main();

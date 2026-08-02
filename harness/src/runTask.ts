import { BUDGETS, MODELS, TDD_EXEMPT } from './config';
import {
  extractFlakyTests,
  isAssertionFailure,
  runFastGate,
  runSingleTest,
  runSlowGate,
} from './gate';
import * as gh from './github';
import {
  buildAmbiguityPrompt,
  buildRepairPrompt,
  buildSystemPrompt,
  buildTaskPrompt,
} from './prompt';
import { Reporter } from './report';
import { review, type Finding } from './review';
import { Session } from './session';
import * as wt from './worktree';
import type { Outcome, RunState, Task } from './types';

class BudgetExhausted extends Error {}

export async function runTask(task: Task): Promise<Outcome> {
  const startedAt = new Date();
  const reporter = await Reporter.create(task.issue, startedAt);
  const abortController = new AbortController();

  const state: RunState = {
    startedAt: startedAt.toISOString(),
    issue: task.issue,
    title: task.title,
    branch: null,
    iterations: 0,
    reviewRounds: 0,
    costUsd: 0,
    flakyTests: [],
    outcome: null,
  };

  const deadline = startedAt.getTime() + BUDGETS.maxWallClockMs;
  const checkBudget = () => {
    if (Date.now() > deadline) {
      throw new BudgetExhausted(
        `wall clock budget of ${BUDGETS.maxWallClockMs / 60_000} minutes exhausted`
      );
    }
    if (state.costUsd > BUDGETS.maxCostUsd) {
      throw new BudgetExhausted(`token budget of $${BUDGETS.maxCostUsd} exhausted`);
    }
  };

  let session: Session | null = null;

  try {
    reporter.phase('PREPARE', wt.worktreePath);
    await wt.prepareWorktree();

    const systemPrompt = await buildSystemPrompt(wt.worktreePath, task);
    session = new Session({
      cwd: wt.worktreePath,
      model: MODELS.implementer.model,
      effort: MODELS.implementer.effort,
      systemPrompt,
      reporter,
      abortController,
    });

    // --- Ambiguity check -----------------------------------------------------
    reporter.phase('TRIAGE');
    const triage = await session.send(
      `${buildTaskPrompt(task)}\n\n---\n\n${buildAmbiguityPrompt()}`
    );
    state.costUsd = triage.costUsd;

    const needsInfo = triage.text.match(/NEEDS_INFO:\s*(.+)/);
    if (needsInfo?.[1]) {
      const question = needsInfo[1].trim();
      reporter.warn(`Underspecified: ${question}`);
      state.outcome = { kind: 'needs-info', question };
      return state.outcome;
    }

    const branch = wt.branchName(task.type, task.title, task.issue);
    state.branch = branch;
    await wt.createBranch(branch);
    reporter.info(`branch ${branch}`);

    // --- Plan + first pass ---------------------------------------------------
    reporter.phase('PLAN');
    const plan = await session.send(
      TDD_EXEMPT.includes(task.type)
        ? 'Post your plan, then do the work.'
        : 'Post your plan, then write the failing test as described.'
    );
    state.costUsd = plan.costUsd;
    checkBudget();

    if (task.issue !== null && plan.text.trim()) {
      await gh.comment(task.issue, `**Agent plan**\n\n${plan.text.trim()}`);
    }

    // --- Red-test checkpoint -------------------------------------------------
    if (!TDD_EXEMPT.includes(task.type)) {
      await requireFailingTest(session, reporter, checkBudget, state);
      reporter.phase('IMPLEMENT');
      const implemented = await session.send(
        'The test fails for the right reason. Write the implementation that makes it pass.'
      );
      state.costUsd = implemented.costUsd;
      checkBudget();
    }

    // --- Repair loop against the fast tier -----------------------------------
    await repairLoop(session, reporter, checkBudget, state, 'fast');

    // --- Slow tier -----------------------------------------------------------
    reporter.phase('GATE', 'slow');
    const files = await wt.changedFiles();
    if (files.length === 0) {
      throw new BudgetExhausted('the agent produced no changes');
    }
    let slow = await runSlowGate(wt.worktreePath, files, (r) => reporter.command(r));
    await reporter.writeGateLog('slow', slow.results);
    state.flakyTests.push(...extractFlakyTests(slow.results));

    if (!slow.passed) {
      // Promote the failing slow-tier command into the loop rather than leaving
      // the agent to iterate blind against a check it only sees once.
      await repairLoop(session, reporter, checkBudget, state, 'slow', slow.fingerprint);
      slow = await runSlowGate(wt.worktreePath, await wt.changedFiles(), (r) =>
        reporter.command(r)
      );
      await reporter.writeGateLog('slow', slow.results);
      state.flakyTests.push(...extractFlakyTests(slow.results));
      if (!slow.passed) throw new BudgetExhausted('slow gate still failing');
    }

    // --- Review --------------------------------------------------------------
    const leftover = await reviewRounds(session, reporter, checkBudget, state, task);

    // --- Land ----------------------------------------------------------------
    reporter.phase('LAND');
    await wt.commit(commitMessage(task));

    const rebase = await wt.rebaseOnMain();
    reporter.info(`rebase: ${rebase}`);
    if (rebase === 'conflicted') {
      await wt.push(branch);
      const url = await gh.openPullRequest({
        branch,
        title: commitMessage(task),
        body: prBody(task, state, leftover, 'Rebase onto main conflicts. A human needs to resolve it.'),
        draft: true,
      });
      state.outcome = {
        kind: 'failed',
        reason: 'rebase conflicted with main',
        prUrl: url,
      };
      return state.outcome;
    }

    await wt.push(branch);
    const draft = leftover.length > 0;
    const url = await gh.openPullRequest({
      branch,
      title: commitMessage(task),
      body: prBody(task, state, leftover),
      draft,
    });

    state.outcome = draft
      ? { kind: 'failed', reason: 'unresolved blocking review findings', prUrl: url }
      : { kind: 'success', prUrl: url };
    return state.outcome;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    reporter.warn(reason);
    state.outcome = await salvage(task, state, reason, reporter);
    return state.outcome;
  } finally {
    abortController.abort();
    await session?.close();
    await reporter.finish(state);
  }
}

/**
 * An agent told to do TDD in a prompt routinely writes the implementation first
 * and back-fills a test that could never fail. Running the test is the only
 * thing that proves otherwise.
 */
async function requireFailingTest(
  session: Session,
  reporter: Reporter,
  checkBudget: () => void,
  state: RunState
): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    checkBudget();
    reporter.phase('RED', `attempt ${attempt}`);

    const marker = await session.send(
      attempt === 1
        ? 'Reply with the TEST_READY line for the test you just wrote.'
        : 'Reply with the TEST_READY line for the rewritten test.'
    );
    state.costUsd = marker.costUsd;

    const match = marker.text.match(/TEST_READY:\s*(\S+)/);
    if (!match?.[1]) {
      await session.send(
        'I could not find a TEST_READY line. Reply with exactly `TEST_READY: <path>` and nothing else.'
      );
      continue;
    }

    const testPath = match[1].replace(/^["'`]|["'`]$/g, '');
    const result = await runSingleTest(wt.worktreePath, testPath);
    reporter.command(result);
    await reporter.writeGateLog('red', [result]);

    if (result.code === 0) {
      await session.send(
        `\`${testPath}\` passes without any implementation, so it does not test the new behaviour. ` +
          'Rewrite it to assert the behaviour the issue asks for, then reply with a new TEST_READY line.'
      );
      continue;
    }

    if (!isAssertionFailure(result)) {
      await session.send(
        `\`${testPath}\` fails, but not on an assertion — it looks like the file does not load or collect. ` +
          `Fix that so the failure is the missing behaviour, then reply with a new TEST_READY line.\n\n` +
          '```\n' +
          `${result.stdout}\n${result.stderr}`.slice(0, 4_000) +
          '\n```'
      );
      continue;
    }

    reporter.info(`red confirmed: ${testPath}`);
    return;
  }

  throw new BudgetExhausted('could not produce a test that fails for the right reason');
}

async function repairLoop(
  session: Session,
  reporter: Reporter,
  checkBudget: () => void,
  state: RunState,
  tier: 'fast' | 'slow',
  seedFingerprint?: string
): Promise<void> {
  const previousFingerprints: string[] = [];
  let fingerprint = seedFingerprint;

  for (let i = 0; i < BUDGETS.maxRepairIterations; i += 1) {
    checkBudget();

    if (fingerprint === undefined) {
      reporter.phase('GATE', `${tier} ${i + 1}/${BUDGETS.maxRepairIterations}`);
      const gate = await runFastGate(wt.worktreePath, (r) => reporter.command(r));
      await reporter.writeGateLog(tier, gate.results);
      if (gate.passed) return;
      fingerprint = gate.fingerprint;
    }

    previousFingerprints.push(fingerprint);
    // A stuck agent edits back and forth and lands on the same failure. Two
    // identical gate outputs in a row is cheaper evidence of that than waiting
    // for the iteration ceiling.
    const recent = previousFingerprints.slice(-BUDGETS.noProgressIterations);
    if (
      recent.length === BUDGETS.noProgressIterations &&
      recent.every((f) => f === recent[0])
    ) {
      throw new BudgetExhausted('no progress: the gate produced identical output twice');
    }

    state.iterations += 1;
    reporter.phase('REPAIR', `${state.iterations}`);
    const turn = await session.send(
      buildRepairPrompt(fingerprint, state.iterations, BUDGETS.maxRepairIterations)
    );
    state.costUsd = turn.costUsd;
    fingerprint = undefined;
  }

  reporter.phase('GATE', 'final');
  const final = await runFastGate(wt.worktreePath, (r) => reporter.command(r));
  await reporter.writeGateLog(tier, final.results);
  if (!final.passed) {
    throw new BudgetExhausted(
      `gate still failing after ${BUDGETS.maxRepairIterations} repair iterations`
    );
  }
}

async function reviewRounds(
  session: Session,
  reporter: Reporter,
  checkBudget: () => void,
  state: RunState,
  task: Task
): Promise<Finding[]> {
  let blocking: Finding[] = [];

  for (let round = 1; round <= BUDGETS.maxReviewRounds; round += 1) {
    checkBudget();
    reporter.phase('REVIEW', `round ${round}`);
    state.reviewRounds = round;

    const diff = await wt.diff();
    const mechanical = (await wt.detectTestWeakening()).map(
      (summary): Finding => ({ severity: 'blocking', file: 'tests', summary })
    );

    const { findings, costUsd } = await review({
      cwd: wt.worktreePath,
      reporter,
      issueTitle: task.title,
      issueBody: task.body,
      diff,
      abortController: new AbortController(),
    });
    state.costUsd += costUsd;

    const all = [...mechanical, ...findings];
    for (const finding of all) {
      const line = `${finding.severity === 'blocking' ? '!' : '·'} ${finding.file}: ${finding.summary}`;
      if (finding.severity === 'blocking') reporter.warn(line);
      else reporter.info(line);
    }

    blocking = all.filter((f) => f.severity === 'blocking');
    if (blocking.length === 0) return [];

    const turn = await session.send(
      [
        'A reviewer looked at your diff and raised these blocking findings:',
        '',
        ...blocking.map((f) => `- ${f.file}: ${f.summary}`),
        '',
        'Fix them. Ignore anything not listed here.',
      ].join('\n')
    );
    state.costUsd = Math.max(state.costUsd, turn.costUsd);

    // Fixes must clear the fast tier again before the PR opens.
    await repairLoop(session, reporter, checkBudget, state, 'fast');
  }

  return blocking;
}

function commitMessage(task: Task): string {
  const subject = task.title.charAt(0).toLowerCase() + task.title.slice(1);
  return `${task.type}: ${subject}`.slice(0, 72);
}

function prBody(
  task: Task,
  state: RunState,
  leftover: Finding[],
  note?: string
): string {
  const lines = [
    '## Summary',
    '',
    task.issue ? `Closes #${task.issue}.` : task.title,
    '',
    '## Test Plan',
    '',
    '- [x] `bun run verify:full`',
  ];

  if (note) lines.push('', '> [!WARNING]', `> ${note}`);

  if (leftover.length > 0) {
    lines.push('', '## Unresolved review findings', '');
    for (const finding of leftover) lines.push(`- ${finding.file}: ${finding.summary}`);
  }

  if (state.flakyTests.length > 0) {
    lines.push('', '## Flaky tests observed', '');
    for (const flaky of state.flakyTests) lines.push(`- ${flaky}`);
  }

  lines.push(
    '',
    '---',
    '',
    `Opened by the agent harness — ${state.iterations} repair iteration(s), $${state.costUsd.toFixed(2)}.`
  );

  return lines.join('\n');
}

/**
 * A run that got most of the way there is worth more as a draft PR than as a
 * discarded worktree.
 */
async function salvage(
  task: Task,
  state: RunState,
  reason: string,
  reporter: Reporter
): Promise<Outcome> {
  if (!state.branch || !(await wt.hasChanges().catch(() => false))) {
    return { kind: 'failed', reason };
  }

  try {
    await wt.commit(`${commitMessage(task)} [wip]`);
    await wt.push(state.branch);
    const url = await gh.openPullRequest({
      branch: state.branch,
      title: `${commitMessage(task)} [wip]`,
      body: prBody(task, state, [], `The harness stopped early: ${reason}`),
      draft: true,
    });
    reporter.info(`draft PR: ${url}`);
    return { kind: 'failed', reason, prUrl: url };
  } catch (error) {
    reporter.warn(`could not open a draft PR: ${String(error)}`);
    return { kind: 'failed', reason };
  }
}

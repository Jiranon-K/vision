import { exec } from './exec';
import { UI_PATHS } from './config';
import type { CommandResult, GateResult } from './types';

const FAST_TIER = [
  ['bun', 'run', 'typecheck'],
  ['bun', 'run', 'typecheck:server'],
  ['bun', 'run', 'typecheck:harness'],
  ['bun', 'run', 'lint'],
  ['bun', 'run', 'test:server'],
  ['bun', 'run', 'test:harness'],
];

const SLOW_TIER_ALWAYS = [['bun', 'run', 'build']];
const SLOW_TIER_UI = [['bun', 'run', 'test:e2e']];

/**
 * The gate's identity across iterations. Absolute paths, timings, and line
 * numbers inside stack traces move around between otherwise identical runs, so
 * they are stripped — otherwise "no progress" never fires.
 */
function fingerprint(results: CommandResult[]): string {
  return results
    .filter((r) => r.code !== 0)
    .map((r) => {
      const output = `${r.stdout}\n${r.stderr}`
        .replace(/[A-Za-z]:[\\/][^\s:]+/g, '<path>')
        .replace(/\/[\w./-]+\//g, '<path>')
        .replace(/\d+(\.\d+)?\s?m?s\b/g, '<time>')
        .replace(/\s+/g, ' ')
        .trim();
      return `${r.command} => ${r.code}: ${output}`;
    })
    .join('\n');
}

export function touchesUi(changedFiles: string[]): boolean {
  return changedFiles.some((file) =>
    UI_PATHS.some((prefix) =>
      prefix.endsWith('/') ? file.startsWith(prefix) : file === prefix
    )
  );
}

async function runTier(
  tier: 'fast' | 'slow',
  commands: string[][],
  cwd: string,
  onCommand?: (result: CommandResult) => void
): Promise<GateResult> {
  const results: CommandResult[] = [];

  for (const argv of commands) {
    const result = await exec(argv, { cwd, timeoutMs: 15 * 60_000 });
    results.push(result);
    onCommand?.(result);
    // Stop at the first failure: later commands add noise the agent would have
    // to wade through, and the fingerprint should describe one problem.
    if (result.code !== 0) break;
  }

  return {
    tier,
    passed: results.every((r) => r.code === 0),
    results,
    fingerprint: fingerprint(results),
  };
}

export function runFastGate(
  cwd: string,
  onCommand?: (result: CommandResult) => void
): Promise<GateResult> {
  return runTier('fast', FAST_TIER, cwd, onCommand);
}

export function runSlowGate(
  cwd: string,
  changedFiles: string[],
  onCommand?: (result: CommandResult) => void
): Promise<GateResult> {
  const commands = [
    ...SLOW_TIER_ALWAYS,
    ...(touchesUi(changedFiles) ? SLOW_TIER_UI : []),
  ];
  return runTier('slow', commands, cwd, onCommand);
}

/** Runs a single test file and reports whether it failed. */
export async function runSingleTest(
  cwd: string,
  testPath: string
): Promise<CommandResult> {
  const isE2E = testPath.startsWith('e2e/') || testPath.includes('.spec.ts');
  const argv = isE2E
    ? ['bunx', 'playwright', 'test', testPath]
    : ['bun', 'run', 'test:server', '--', testPath];
  return exec(argv, { cwd, timeoutMs: 10 * 60_000 });
}

/**
 * Distinguishes "failed because the behaviour is missing" from "failed because
 * the file does not load". Only the former is evidence that a test is real.
 */
export function isAssertionFailure(result: CommandResult): boolean {
  const output = `${result.stdout}\n${result.stderr}`;
  const collectionErrors = [
    'Cannot find module',
    'Failed to load',
    'SyntaxError',
    'TypeError: Cannot read',
    'No test files found',
    'no tests found',
    'Error: Cannot find',
  ];
  if (collectionErrors.some((needle) => output.includes(needle))) return false;

  const assertionMarkers = [
    'AssertionError',
    'expect(',
    'Expected:',
    'toBe',
    'toEqual',
    'assert',
    'Test timeout',
  ];
  return assertionMarkers.some((needle) => output.includes(needle));
}

/** Playwright reports a test that passed on retry as flaky. */
export function extractFlakyTests(results: CommandResult[]): string[] {
  const flaky: string[] = [];
  for (const result of results) {
    for (const line of `${result.stdout}\n${result.stderr}`.split('\n')) {
      const match = line.match(/^\s*(\d+)\s+flaky/i);
      if (match) flaky.push(line.trim());
      if (/^\s*±.*flaky/i.test(line)) flaky.push(line.trim());
    }
  }
  return flaky;
}

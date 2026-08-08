import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ARTIFACTS_DIR } from './config';
import type { CommandResult, Outcome, RunState } from './types';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function supportsColor(): boolean {
  return process.stdout.isTTY === true && process.env.NO_COLOR === undefined;
}

function paint(text: string, color: keyof typeof COLORS): string {
  return supportsColor() ? `${COLORS[color]}${text}${COLORS.reset}` : text;
}

// A total Record rather than a ternary chain: a new Outcome kind then fails
// typecheck instead of silently falling through to the red FAILED branch.
export const OUTCOME_LABELS: Record<
  Outcome['kind'],
  { text: string; color: keyof typeof COLORS }
> = {
  success: { text: 'SUCCESS', color: 'green' },
  'local-success': { text: 'LOCAL SUCCESS', color: 'green' },
  'needs-info': { text: 'NEEDS INFO', color: 'yellow' },
  failed: { text: 'FAILED', color: 'red' },
};

export class Reporter {
  private gateLogIndex = 0;

  private constructor(
    readonly dir: string,
    private readonly transcript: import('bun').FileSink
  ) {}

  static async create(issue: number | null, startedAt: Date): Promise<Reporter> {
    const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
    const name = `${stamp}-${issue === null ? 'adhoc' : `issue-${issue}`}`;
    const dir = join(ARTIFACTS_DIR, name);
    await mkdir(join(dir, 'gate'), { recursive: true });
    const transcript = Bun.file(join(dir, 'transcript.jsonl')).writer();
    return new Reporter(dir, transcript);
  }

  phase(name: string, detail?: string): void {
    const line = detail ? `${name} ${paint(detail, 'dim')}` : name;
    console.log(`\n${paint(`── ${line}`, 'bold')}`);
  }

  tool(name: string, summary: string): void {
    const trimmed = summary.replace(/\s+/g, ' ').slice(0, 110);
    console.log(`  ${paint('·', 'dim')} ${paint(name, 'cyan')} ${paint(trimmed, 'dim')}`);
  }

  text(body: string): void {
    const trimmed = body.trim();
    if (trimmed) console.log(`  ${trimmed.split('\n').join('\n  ')}`);
  }

  info(message: string): void {
    console.log(`  ${paint(message, 'dim')}`);
  }

  warn(message: string): void {
    console.log(`  ${paint(`! ${message}`, 'yellow')}`);
  }

  command(result: CommandResult): void {
    const mark = result.code === 0 ? paint('ok  ', 'green') : paint('FAIL', 'red');
    const seconds = (result.durationMs / 1000).toFixed(1);
    console.log(`  ${mark} ${result.command} ${paint(`${seconds}s`, 'dim')}`);
  }

  async writeMessage(message: unknown): Promise<void> {
    this.transcript.write(`${JSON.stringify(message)}\n`);
  }

  async writeGateLog(tier: string, results: CommandResult[]): Promise<void> {
    this.gateLogIndex += 1;
    const body = results
      .map(
        (r) =>
          `$ ${r.command}\nexit ${r.code} in ${r.durationMs}ms\n\n${r.stdout}\n${r.stderr}`
      )
      .join('\n\n' + '-'.repeat(72) + '\n\n');
    await Bun.write(
      join(this.dir, 'gate', `${String(this.gateLogIndex).padStart(2, '0')}-${tier}.log`),
      body
    );
  }

  async finish(state: RunState): Promise<void> {
    await this.transcript.end();
    await Bun.write(join(this.dir, 'state.json'), JSON.stringify(state, null, 2));
    await Bun.write(join(this.dir, 'summary.md'), summarize(state));

    const outcome = state.outcome;
    if (!outcome) return;
    const { text, color } = OUTCOME_LABELS[outcome.kind];
    console.log(`\n${paint(text, color)} — artifacts in ${this.dir}`);
  }
}

function summarize(state: RunState): string {
  const lines = [
    `# Run summary`,
    '',
    `- Task: ${state.issue === null ? state.title : `#${state.issue} ${state.title}`}`,
    `- Started: ${state.startedAt}`,
    `- Branch: ${state.branch ?? '(none)'}`,
    `- Repair iterations: ${state.iterations}`,
    `- Review rounds: ${state.reviewRounds}`,
    `- Cost: $${state.costUsd.toFixed(2)}`,
    `- Outcome: ${state.outcome ? state.outcome.kind : 'incomplete'}`,
  ];

  if (state.outcome?.kind === 'success') lines.push(`- PR: ${state.outcome.prUrl}`);
  if (state.outcome?.kind === 'failed') {
    lines.push(`- Reason: ${state.outcome.reason}`);
    if (state.outcome.prUrl) lines.push(`- Draft PR: ${state.outcome.prUrl}`);
  }
  if (state.outcome?.kind === 'needs-info') {
    lines.push(`- Question: ${state.outcome.question}`);
  }

  if (state.flakyTests.length > 0) {
    lines.push('', '## Flaky tests', '');
    // Reported rather than blocking: a flaky test that blocks kills unattended
    // runs for reasons that are not the agent's fault, and one that is silent
    // accumulates rot.
    for (const flaky of state.flakyTests) lines.push(`- ${flaky}`);
  }

  return `${lines.join('\n')}\n`;
}

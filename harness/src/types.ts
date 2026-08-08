import type { BranchPrefix } from './config';

export interface Task {
  /** GitHub issue number, or null in ad-hoc mode. */
  issue: number | null;
  title: string;
  body: string;
  type: BranchPrefix;
}

export interface CommandResult {
  command: string;
  code: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface GateResult {
  tier: 'fast' | 'slow';
  passed: boolean;
  results: CommandResult[];
  /** Stable text used to detect "no progress" between iterations. */
  fingerprint: string;
}

export type Outcome =
  | { kind: 'success'; prUrl: string }
  | { kind: 'local-success'; branch: string }
  | { kind: 'needs-info'; question: string }
  | { kind: 'failed'; reason: string; prUrl?: string };

export interface RunState {
  startedAt: string;
  issue: number | null;
  title: string;
  branch: string | null;
  iterations: number;
  reviewRounds: number;
  costUsd: number;
  flakyTests: string[];
  outcome: Outcome | null;
}

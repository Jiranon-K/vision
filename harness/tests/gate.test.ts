import { describe, expect, it } from 'bun:test';
import { isAssertionFailure, touchesUi } from '../src/gate';
import { OUTCOME_LABELS } from '../src/report';
import { shouldPublishToGitHub } from '../src/runTask';
import type { CommandResult, Outcome } from '../src/types';

function result(output: string, code = 1): CommandResult {
  return { command: 'test', code, stdout: output, stderr: '', durationMs: 1 };
}

describe('slow-tier gating by path', () => {
  it('runs E2E when the diff touches the UI', () => {
    expect(touchesUi(['app/blog/page.tsx'])).toBe(true);
    expect(touchesUi(['components/Footer.tsx'])).toBe(true);
    expect(touchesUi(['hooks/useAuth.ts'])).toBe(true);
    expect(touchesUi(['middleware.ts'])).toBe(true);
  });

  it('skips E2E for server-only work', () => {
    expect(touchesUi(['server/src/controllers/posts.controller.ts'])).toBe(false);
    expect(touchesUi(['README.md', 'docs/adr/0001-x.md'])).toBe(false);
  });
});

describe('red-test classification', () => {
  it('accepts an assertion failure as real evidence', () => {
    expect(
      isAssertionFailure(result('AssertionError: expected 1 to be 2'))
    ).toBe(true);
    expect(isAssertionFailure(result('Expected: "Draft"\nReceived: undefined'))).toBe(
      true
    );
  });

  it('rejects a failure that means the file never loaded', () => {
    expect(isAssertionFailure(result("Cannot find module './missing'"))).toBe(false);
    expect(isAssertionFailure(result('SyntaxError: Unexpected token'))).toBe(false);
    expect(isAssertionFailure(result('No test files found'))).toBe(false);
  });
});

describe('publication policy', () => {
  it('keeps ad-hoc tasks local', () => {
    expect(
      shouldPublishToGitHub({
        issue: null,
        title: 'Add a category filter',
        body: 'Add a category filter',
        type: 'feat',
      })
    ).toBe(false);
  });

  it('keeps malformed tasks local by failing closed', () => {
    expect(shouldPublishToGitHub({ issue: undefined } as never)).toBe(false);
    expect(shouldPublishToGitHub({ issue: 0 } as never)).toBe(false);
    expect(shouldPublishToGitHub({ issue: -1 } as never)).toBe(false);
  });

  it('publishes queue tasks that originated from an issue', () => {
    expect(
      shouldPublishToGitHub({
        issue: 42,
        title: 'Add a category filter',
        body: 'Add a category filter',
        type: 'feat',
      })
    ).toBe(true);
  });
});

describe('terminal outcome labels', () => {
  const kinds: Outcome['kind'][] = ['success', 'local-success', 'needs-info', 'failed'];

  it('labels every outcome kind', () => {
    for (const kind of kinds) {
      expect(OUTCOME_LABELS[kind]?.text).toBeTruthy();
    }
  });

  it('reports a local success as a success rather than a failure', () => {
    expect(OUTCOME_LABELS['local-success'].color).toBe('green');
    expect(OUTCOME_LABELS['local-success'].text).not.toBe('FAILED');
  });

  it('keeps the failure kinds visually distinct from the successes', () => {
    expect(OUTCOME_LABELS.failed.color).toBe('red');
    expect(OUTCOME_LABELS['needs-info'].color).toBe('yellow');
  });
});

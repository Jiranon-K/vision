import { describe, expect, it } from 'bun:test';
import { isAssertionFailure, touchesUi } from '../src/gate';
import type { CommandResult } from '../src/types';

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

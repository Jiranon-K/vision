import { describe, it, expect, beforeAll } from 'vitest';

// Must be set before importing the token module — it reads JWT_SECRET at import time.
process.env.JWT_SECRET = 'test-secret-for-vitest';

const { hashToken } = await import('../../src/utils/token');

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest';
});

describe('hashToken', () => {
  it('produces deterministic output for the same input', () => {
    const token = 'abc123';
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('produces different output for different inputs', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('produces a 64-char hex string (SHA-256)', () => {
    const result = hashToken('any-input');
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });
});

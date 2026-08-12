import { describe, it, expect, afterEach } from 'vitest';

process.env['NODE_ENV'] = 'test';

const {
  selectedStoreKind,
  assertStoreIsUsable,
} = await import('../../src/config/rateLimitStore');

const originalEnv = { ...process.env };

afterEach(() => {
  process.env.NODE_ENV = originalEnv.NODE_ENV;
  delete process.env.RATE_LIMIT_REDIS_URL;
});

describe('Which store backs the limiters', () => {
  it('selects the in-memory store when none is configured', () => {
    expect(selectedStoreKind()).toBe('memory');
  });

  it('selects the shared store when one is configured', () => {
    process.env.RATE_LIMIT_REDIS_URL = 'redis://localhost:6379';
    expect(selectedStoreKind()).toBe('redis');
  });
});

describe('Production refuses to start without a shared store', () => {
  it('throws when production has no shared store configured', () => {
    process.env.NODE_ENV = 'production';
    expect(() => assertStoreIsUsable()).toThrow(/RATE_LIMIT_REDIS_URL/);
  });

  it('is satisfied when production has one', () => {
    process.env.NODE_ENV = 'production';
    process.env.RATE_LIMIT_REDIS_URL = 'redis://localhost:6379';
    expect(() => assertStoreIsUsable()).not.toThrow();
  });

  it('leaves development alone', () => {
    process.env.NODE_ENV = 'development';
    expect(() => assertStoreIsUsable()).not.toThrow();
  });
});

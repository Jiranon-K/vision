import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    // The first run on a clean machine (or in CI) downloads the in-memory
    // MongoDB binary inside beforeAll, which overruns the 10s default.
    hookTimeout: 180_000,
  },
});

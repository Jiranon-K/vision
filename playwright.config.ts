import { defineConfig, devices } from '@playwright/test';
import { API_URL, E2E_WEB_PORT, WEB_URL, serverEnv, webEnv } from './e2e/config';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  // A test that only passes on retry does not block the PR, but the harness
  // reports it — a flaky test that blocks kills unattended runs, and one that
  // is silent accumulates rot.
  retries: 1,
  reporter: process.env.CI ? [['list'], ['json', { outputFile: 'e2e-results.json' }]] : 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'bunx tsx src/index.ts',
      cwd: './server',
      url: `${API_URL}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: serverEnv,
    },
    {
      command: `bunx next dev --port ${E2E_WEB_PORT}`,
      port: E2E_WEB_PORT,
      reuseExistingServer: false,
      timeout: 180_000,
      env: webEnv,
    },
  ],
});

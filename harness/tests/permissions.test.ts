import { describe, expect, it } from 'bun:test';
import { createPermissionHandler, isProtectedPath } from '../src/permissions';

const WORKTREE = '/repo';
const allow = createPermissionHandler(WORKTREE);

async function bash(command: string) {
  return allow('Bash', { command }, {} as never);
}

describe('bash denylist', () => {
  const forbidden = [
    'git push origin main',
    'git push origin HEAD:main',
    'git push --force origin feat/x',
    'git push -f origin feat/x',
    'gh pr merge 12 --squash',
    'gh pr review 12 --approve',
    'git commit -m "wip" --no-verify',
    'cat .env',
    'cat server/.env',
    'rm -rf ../other-repo',
    'mongosh mongodb://localhost:27017/vision --eval "db.dropDatabase()"',
    'rm -rf .github/workflows',
  ];

  for (const command of forbidden) {
    it(`denies: ${command}`, async () => {
      const result = await bash(command);
      expect(result?.behavior).toBe('deny');
    });
  }

  const permitted = [
    'git push -u origin feat/my-branch',
    'git commit -m "feat: add thing"',
    'bun run typecheck',
    'bunx playwright install chromium',
    'gh issue create --label needs-triage --title x --body y',
    'gh pr view 12',
    'cat .env.example',
    'rm -rf node_modules/.cache',
    'mongosh mongodb://localhost:27017/vision_e2e --eval "db.stats()"',
    'git log -- app/blog/page.tsx',
  ];

  for (const command of permitted) {
    it(`allows: ${command}`, async () => {
      const result = await bash(command);
      expect(result?.behavior).toBe('allow');
    });
  }
});

describe('protected paths', () => {
  it('blocks writes outside the worktree', () => {
    expect(isProtectedPath('../vision/app/page.tsx', WORKTREE)).toBe(true);
    expect(isProtectedPath('/elsewhere/file.ts', WORKTREE)).toBe(true);
  });

  it('blocks the files that check the agent', () => {
    expect(isProtectedPath('.github/pull_request_template.md', WORKTREE)).toBe(true);
    expect(isProtectedPath('.husky/pre-commit', WORKTREE)).toBe(true);
    expect(isProtectedPath('skills-lock.json', WORKTREE)).toBe(true);
    expect(isProtectedPath('server/.env', WORKTREE)).toBe(true);
  });

  it('allows ordinary source files', () => {
    expect(isProtectedPath('app/page.tsx', WORKTREE)).toBe(false);
    expect(isProtectedPath('server/src/index.ts', WORKTREE)).toBe(false);
    expect(isProtectedPath('e2e/blog.spec.ts', WORKTREE)).toBe(false);
  });
});

describe('write tools', () => {
  it('denies a write to a protected path', async () => {
    const result = await allow('Write', { file_path: '.husky/pre-commit' }, {} as never);
    expect(result?.behavior).toBe('deny');
  });

  it('allows a write inside the worktree', async () => {
    const result = await allow('Write', { file_path: 'app/page.tsx' }, {} as never);
    expect(result?.behavior).toBe('allow');
  });
});

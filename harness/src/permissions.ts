import type { CanUseTool, PermissionResult } from '@anthropic-ai/claude-agent-sdk';
import { isAbsolute, relative, resolve } from 'node:path';

/**
 * A strict denylist rather than an allowlist.
 *
 * An allowlist reads as safer, but a working agent runs unpredictable commands
 * (`bun add`, `bunx playwright install`, `gh issue view`, `git log -- <path>`).
 * A narrow allowlist stalls the loop on permissions and then gets widened until
 * it is a denylist nobody reviewed. Safety here comes from the isolated
 * worktree plus this list.
 */
interface Rule {
  name: string;
  test: (command: string) => boolean;
  message: string;
}

const BASH_RULES: Rule[] = [
  {
    name: 'push-to-main',
    test: (c) =>
      /\bgit\s+push\b/.test(c) &&
      /(\borigin\s+(main|HEAD:main)\b|\bmain:main\b|:\s*refs\/heads\/main\b)/.test(c),
    message: 'Pushing to main is forbidden. Push your feature branch instead.',
  },
  {
    name: 'force-push',
    test: (c) => /\bgit\s+push\b/.test(c) && /(--force\b|--force-with-lease\b|\s-f\b)/.test(c),
    message: 'Force pushing is forbidden.',
  },
  {
    name: 'merge-or-approve',
    test: (c) => /\bgh\s+pr\s+(merge|review)\b/.test(c),
    message: 'Merging and approving are the human reviewer\'s decisions, not yours.',
  },
  {
    name: 'skip-hooks',
    test: (c) => /\b(git\s+(commit|push)|gh\b)[^\n]*--no-verify\b/.test(c),
    message:
      'Bypassing hooks defeats the verification gate. Fix the failure instead of skipping it.',
  },
  {
    name: 'env-files',
    test: (c) =>
      /(^|[\s&|;<>"'`(])(\.env(\.[\w-]+)?|server\/\.env(\.[\w-]+)?)(?![\w.-])/.test(c) &&
      !/\.env\.example/.test(c),
    message:
      'Environment files hold secrets and must not enter the transcript. Read .env.example instead.',
  },
  {
    name: 'destructive-outside-worktree',
    test: (c) => /\brm\s+-[rf]{1,2}\b|\bgit\s+clean\b/.test(c) && /\.\.[\\/]/.test(c),
    message: 'Destructive commands must stay inside the agent worktree.',
  },
  {
    name: 'non-e2e-database',
    test: (c) =>
      /\b(mongosh?|mongodump|mongorestore|mongoexport|mongoimport)\b/.test(c) &&
      !/_e2e\b/.test(c),
    message:
      'Mongo commands may only target a database whose name ends in "_e2e".',
  },
  {
    name: 'protected-config',
    test: (c) =>
      /(^|[\s&|;<>"'`(])(\.github[\\/]|\.husky[\\/]|skills-lock\.json)/.test(c) &&
      /\b(rm|mv|cp|>|>>|sed\s+-i|tee)\b/.test(c),
    message:
      'The agent must not edit the rules that check it (.github/, .husky/, skills-lock.json) unless the issue says so.',
  },
];

const PROTECTED_PATHS = [
  '.github',
  '.husky',
  'skills-lock.json',
  '.env',
  '.env.local',
  'server/.env',
];

function isProtectedPath(filePath: string, worktree: string): boolean {
  const absolute = isAbsolute(filePath) ? filePath : resolve(worktree, filePath);
  const rel = relative(worktree, absolute).replace(/\\/g, '/');

  // Anything resolving outside the worktree is out of bounds by definition.
  if (rel.startsWith('..')) return true;

  return PROTECTED_PATHS.some(
    (protectedPath) => rel === protectedPath || rel.startsWith(`${protectedPath}/`)
  );
}

const WRITE_TOOLS = new Set(['Write', 'Edit', 'NotebookEdit']);

export function createPermissionHandler(worktree: string): CanUseTool {
  return async (toolName, input): Promise<PermissionResult> => {
    if (toolName === 'Bash') {
      const command = String(input.command ?? '');
      const violated = BASH_RULES.find((rule) => rule.test(command));
      if (violated) {
        return { behavior: 'deny', message: `[${violated.name}] ${violated.message}` };
      }
    }

    if (WRITE_TOOLS.has(toolName)) {
      const filePath = String(input.file_path ?? input.notebook_path ?? '');
      if (filePath && isProtectedPath(filePath, worktree)) {
        return {
          behavior: 'deny',
          message: `Writing to ${filePath} is forbidden — it is either outside the agent worktree or a protected file.`,
        };
      }
    }

    return { behavior: 'allow' };
  };
}

/** Exported for the test suite; the rule list is the security boundary. */
export const bashRules = BASH_RULES;
export { isProtectedPath };

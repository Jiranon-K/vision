import type { CommandResult } from './types';

export interface ExecOptions {
  cwd: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

/**
 * Runs a command and always resolves — a non-zero exit is data the loop acts
 * on, not an exception to unwind through.
 */
export async function exec(
  argv: string[],
  options: ExecOptions
): Promise<CommandResult> {
  const command = argv.join(' ');
  const startedAt = Date.now();

  const proc = Bun.spawn(argv, {
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : process.env,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const timeout = options.timeoutMs
    ? setTimeout(() => proc.kill(), options.timeoutMs)
    : null;

  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (timeout) clearTimeout(timeout);

  return {
    command,
    code,
    stdout,
    stderr,
    durationMs: Date.now() - startedAt,
  };
}

export async function execOrThrow(
  argv: string[],
  options: ExecOptions
): Promise<string> {
  const result = await exec(argv, options);
  if (result.code !== 0) {
    throw new Error(
      `Command failed (${result.code}): ${result.command}\n${result.stderr || result.stdout}`
    );
  }
  return result.stdout.trim();
}

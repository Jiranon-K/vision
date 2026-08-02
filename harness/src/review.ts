import { MODELS } from './config';
import { Session } from './session';
import type { Reporter } from './report';

export interface Finding {
  severity: 'blocking' | 'non-blocking';
  file: string;
  summary: string;
}

const REVIEW_SYSTEM_PROMPT = `
You are reviewing a pull request diff for Vision, a publishing platform for
content creators. You did not write this code and have no memory of writing it.

You have read-only access. You report findings; someone else applies them.

Grade every finding:

- **blocking** — the change is wrong, unsafe, or does not do what the issue
  asked. Broken behaviour, a security or authorization hole, data loss, a leaked
  secret, a test that cannot fail, work outside the issue's scope.
- **non-blocking** — anything else: naming, structure, style, a nice-to-have.

Be strict about blocking and generous about letting non-blocking things go. Only
blocking findings must be fixed, so grading a preference as blocking stalls the
work for nothing.

Reply with a JSON array and nothing else:

[{"severity": "blocking", "file": "path/to/file.ts", "summary": "one sentence"}]

An empty array is a valid and common answer.
`.trim();

function parseFindings(text: string): Finding[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): Finding[] => {
      if (typeof entry !== 'object' || entry === null) return [];
      const record = entry as Record<string, unknown>;
      const severity = record.severity === 'blocking' ? 'blocking' : 'non-blocking';
      return [
        {
          severity,
          file: String(record.file ?? 'unknown'),
          summary: String(record.summary ?? '').trim(),
        },
      ];
    }).filter((f) => f.summary.length > 0);
  } catch {
    return [];
  }
}

/**
 * A second session that sees only the diff, the issue, and the conventions.
 *
 * Splitting sessions loses context, which is why the implementer keeps one.
 * Here the missing context is the point: an agent that just spent forty minutes
 * writing the code reads its own diff and sees what it meant to write.
 */
export async function review(options: {
  cwd: string;
  reporter: Reporter;
  issueTitle: string;
  issueBody: string;
  diff: string;
  abortController: AbortController;
}): Promise<{ findings: Finding[]; costUsd: number }> {
  const session = new Session({
    cwd: options.cwd,
    model: MODELS.reviewer.model,
    effort: MODELS.reviewer.effort,
    systemPrompt: REVIEW_SYSTEM_PROMPT,
    reporter: options.reporter,
    readOnly: true,
    abortController: options.abortController,
  });

  try {
    const result = await session.send(
      [
        `## What was asked`,
        '',
        `${options.issueTitle}`,
        '',
        options.issueBody,
        '',
        '## The diff',
        '',
        '```diff',
        options.diff.slice(0, 120_000),
        '```',
      ].join('\n')
    );

    return { findings: parseFindings(result.text), costUsd: result.costUsd };
  } finally {
    await session.close();
  }
}

import { query } from '@anthropic-ai/claude-agent-sdk';
import type {
  EffortLevel,
  Query,
  SDKMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-agent-sdk';
import { createPermissionHandler } from './permissions';
import type { Reporter } from './report';

export interface SessionOptions {
  cwd: string;
  model: string;
  effort: EffortLevel;
  systemPrompt: string;
  reporter: Reporter;
  /** Read-only sessions get no write tools at all, not just a prompt asking them not to write. */
  readOnly?: boolean;
  abortController: AbortController;
}

export interface TurnResult {
  text: string;
  costUsd: number;
  isError: boolean;
}

const WRITE_TOOLS = ['Write', 'Edit', 'NotebookEdit'];

/**
 * One SDK session, driven turn by turn. Gate failures go back into the same
 * session so the agent still remembers what it changed and why — a fresh
 * session would have to re-read the code to understand its own diff.
 */
export class Session {
  private inbox: SDKUserMessage[] = [];
  private wake: (() => void) | null = null;
  private closed = false;
  private pendingTurn: ((result: TurnResult) => void) | null = null;
  private readonly query: Query;
  private readonly pump: Promise<void>;
  private totalCostUsd = 0;

  constructor(private readonly options: SessionOptions) {
    this.query = query({
      prompt: this.input(),
      options: {
        cwd: options.cwd,
        model: options.model,
        effort: options.effort,
        systemPrompt: options.systemPrompt,
        // The prompt is assembled from committed files only; loading user or
        // project settings would make behaviour depend on the machine.
        settingSources: [],
        permissionMode: 'default',
        canUseTool: createPermissionHandler(options.cwd),
        ...(options.readOnly ? { disallowedTools: WRITE_TOOLS } : {}),
        abortController: options.abortController,
      },
    });
    this.pump = this.consume();
  }

  private async *input(): AsyncIterable<SDKUserMessage> {
    while (!this.closed) {
      const next = this.inbox.shift();
      if (next) {
        yield next;
        continue;
      }
      await new Promise<void>((resolve) => {
        this.wake = resolve;
      });
    }
  }

  private async consume(): Promise<void> {
    for await (const message of this.query) {
      await this.options.reporter.writeMessage(message);
      this.render(message);

      if (message.type === 'result') {
        this.totalCostUsd = message.total_cost_usd ?? this.totalCostUsd;
        const resolve = this.pendingTurn;
        this.pendingTurn = null;
        resolve?.({
          text: message.subtype === 'success' ? message.result : '',
          costUsd: this.totalCostUsd,
          isError: message.subtype !== 'success',
        });
      }
    }

    // The stream ended without a result — unblock any waiter rather than hang.
    const resolve = this.pendingTurn;
    this.pendingTurn = null;
    resolve?.({ text: '', costUsd: this.totalCostUsd, isError: true });
  }

  private render(message: SDKMessage): void {
    if (message.type !== 'assistant') return;
    for (const block of message.message.content) {
      if (block.type === 'text') {
        this.options.reporter.text(block.text);
      } else if (block.type === 'tool_use') {
        const input = block.input as Record<string, unknown>;
        const summary =
          typeof input.command === 'string'
            ? input.command
            : typeof input.file_path === 'string'
              ? input.file_path
              : typeof input.pattern === 'string'
                ? input.pattern
                : '';
        this.options.reporter.tool(block.name, summary);
      }
    }
  }

  send(text: string): Promise<TurnResult> {
    if (this.closed) {
      return Promise.resolve({ text: '', costUsd: this.totalCostUsd, isError: true });
    }

    const turn = new Promise<TurnResult>((resolve) => {
      this.pendingTurn = resolve;
    });

    this.inbox.push({
      type: 'user',
      message: { role: 'user', content: text },
      parent_tool_use_id: null,
      session_id: '',
    });

    const wake = this.wake;
    this.wake = null;
    wake?.();

    return turn;
  }

  get costUsd(): number {
    return this.totalCostUsd;
  }

  async close(): Promise<void> {
    this.closed = true;
    const wake = this.wake;
    this.wake = null;
    wake?.();
    try {
      await this.query.return(undefined);
    } catch {
      // Already finished.
    }
    await this.pump.catch(() => undefined);
  }
}

import { randomUUID } from "node:crypto";
import type { Project4McuHttpPayload } from "../protocol/project4-mcu-http-payload";

export interface PendingToolConfirmation {
  requestId: string;
  toolId: string;
  args: unknown;
  /** Snapshot when **`project4_*`** tools were enabled — restores MCU HTTP context after **`ai/tool_confirm`**. */
  project4McuHttp?: Project4McuHttpPayload;
  /** When true, resume with **`project4_*`** tools only (same as **`ai/request.project4McpOnly`**). */
  project4McpOnly?: boolean;
  /**
   * Optional continuation payload to resume an LLM/tool loop after user confirmation.
   * Stored in-memory only (dev-focused).
   */
  continuation?: {
    provider: "anthropic";
    toolUseId: string;
    messages: unknown[];
    model: string;
    maxTokens: number;
    temperature?: number;
    systemPrompt: string;
    devTrace: boolean;
    includeThinkingSummary: boolean;
    emitTextDeltas?: boolean;
  };
  createdAtMs: number;
  expiresAtMs: number;
}

export class ConfirmStore {
  private readonly pending = new Map<string, PendingToolConfirmation>();

  constructor(private readonly ttlMs: number) {}

  create(input: Omit<PendingToolConfirmation, "createdAtMs" | "expiresAtMs">): PendingToolConfirmation & {
    confirmToken: string;
  } {
    this.prune();
    const createdAtMs = Date.now();
    const expiresAtMs = createdAtMs + this.ttlMs;
    const confirmToken = randomUUID();
    const row: PendingToolConfirmation = {
      ...input,
      createdAtMs,
      expiresAtMs,
    };
    this.pending.set(confirmToken, row);
    return { ...row, confirmToken };
  }

  consume(confirmToken: string): PendingToolConfirmation | null {
    this.prune();
    const row = this.pending.get(confirmToken) ?? null;
    if (!row) return null;
    this.pending.delete(confirmToken);
    if (Date.now() > row.expiresAtMs) return null;
    return row;
  }

  prune(): void {
    const now = Date.now();
    for (const [token, row] of this.pending) {
      if (now > row.expiresAtMs) {
        this.pending.delete(token);
      }
    }
  }
}


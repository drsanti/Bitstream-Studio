import type { BitstreamMcpToolRegistration } from "../../bitstream/mcp-server/types";
import { getMcpToolRiskInfo, isRiskyMcpTool } from "../policy/mcp-tool-policy";
import type { AiBridgeEvent } from "../protocol/ai-bridge-protocol";
import type { Project4McuHttpPayload } from "../protocol/project4-mcu-http-payload";
import type { ConfirmStore } from "./confirm-store";
import { AnthropicClient, type AnthropicMessagesResponse, type AnthropicToolDescriptor } from "../providers/anthropic/anthropic-client";
import type { PendingToolConfirmation } from "./confirm-store";

/** Robot HTTP tools (`project4_*`) do not use Bitstream serial — skip **`ensureSession`** to avoid long port scans / attach timeouts. */
export function toolRequiresBitstreamHostSessionAttach(toolId: string): boolean {
  return !toolId.startsWith("project4_");
}

export interface AnthropicLoopOptions {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature?: number;
  systemPrompt: string;
  tools: Map<string, BitstreamMcpToolRegistration>;
  confirmStore: ConfirmStore;
  ensureSession?: () => Promise<unknown | null>;
  devTrace: boolean;
  includeThinkingSummary: boolean;
  /**
   * When true, emits `ai/llm_call_delta` events for the final assistant text.
   * This is simulated streaming (post-response), not provider streaming.
   */
  emitTextDeltas?: boolean;
  onEvent: (event: AiBridgeEvent) => void;
  requestId: string;
  userPrompt: string;
  /** Carried into **`PendingToolConfirmation`** so **`project4_*`** handlers run after **`ai/tool_confirm`**. */
  project4McuHttp?: Project4McuHttpPayload;
  /** Matches **`ai/request.project4McpOnly`** — resume must restore robot-only vs merged tool maps. */
  project4McpOnly?: boolean;
}

export type AnthropicContinuation = {
  toolUseId: string;
  toolId: string;
  args: unknown;
  messages: unknown[];
  model: string;
  maxTokens: number;
  temperature?: number;
  systemPrompt: string;
  devTrace: boolean;
  includeThinkingSummary: boolean;
  emitTextDeltas?: boolean;
};

/**
 * Anthropic requires every `tool_use` in an assistant message to have a matching `tool_result`
 * in the **very next** message (often one user message with multiple `tool_result` blocks).
 * When we pause for risky-tool confirm, the snapshot may end with an assistant turn that
 * contains several `tool_use`s; resume must not send only one result.
 */
const DEFERRED_SIBLING_TOOL_RESULT_MESSAGE =
  "Not executed: confirmation flow handles one gated tool at a time; other tool calls from the same assistant turn were skipped. Issue a new request if you still need them.";

type AnthropicToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
};

type AnthropicToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

function getLastAssistantToolUseBlocks(messages: Array<{ role?: string; content?: unknown }>): AnthropicToolUseBlock[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== "assistant") {
      continue;
    }
    const c = m.content;
    if (!Array.isArray(c)) {
      continue;
    }
    const blocks = c.filter((b): b is AnthropicToolUseBlock => {
      if (b == null || typeof b !== "object") {
        return false;
      }
      const o = b as Record<string, unknown>;
      return o.type === "tool_use" && typeof o.id === "string";
    });
    if (blocks.length > 0) {
      return blocks;
    }
  }
  return [];
}

function buildToolResultBlocksForAssistantBatch(
  assistantToolUses: AnthropicToolUseBlock[],
  resolvedToolUseId: string,
  resolved: Pick<AnthropicToolResultBlock, "content" | "is_error">,
): AnthropicToolResultBlock[] {
  if (assistantToolUses.length === 0) {
    return [{ type: "tool_result", tool_use_id: resolvedToolUseId, ...resolved }];
  }
  if (!assistantToolUses.some((u) => u.id === resolvedToolUseId)) {
    return [{ type: "tool_result", tool_use_id: resolvedToolUseId, ...resolved }];
  }
  return assistantToolUses.map((u) =>
    u.id === resolvedToolUseId
      ? { type: "tool_result", tool_use_id: u.id, ...resolved }
      : {
          type: "tool_result",
          tool_use_id: u.id,
          content: DEFERRED_SIBLING_TOOL_RESULT_MESSAGE,
          is_error: true,
        },
  );
}

function pushUserToolResultsAfterConfirm(
  messages: Array<{ role: string; content: unknown }>,
  resolvedToolUseId: string,
  resolved: Pick<AnthropicToolResultBlock, "content" | "is_error">,
): void {
  const batch = getLastAssistantToolUseBlocks(messages);
  messages.push({
    role: "user",
    content: buildToolResultBlocksForAssistantBatch(batch, resolvedToolUseId, resolved),
  });
}

function summarizeThinking(blocks: AnthropicMessagesResponse["content"]): { summary: string; redactedBytes?: number } | null {
  const thinkingText = blocks
    .filter((b) => b.type === "thinking")
    .map((b) => (b as { type: "thinking"; thinking: string }).thinking)
    .join("\n");
  const redactedText = blocks
    .filter((b) => b.type === "redacted_thinking")
    .map((b) => (b as { type: "redacted_thinking"; data: string }).data)
    .join("\n");

  const raw = (thinkingText + redactedText).trim();
  if (!raw) return null;
  // We do not surface raw chain-of-thought. We provide a short summary.
  const oneLine = raw.replace(/\s+/g, " ").slice(0, 240);
  return {
    summary:
      oneLine.length < raw.length
        ? `${oneLine}… (thinking redacted)`
        : `${oneLine} (thinking redacted)`,
    redactedBytes: raw.length,
  };
}

function extractAssistantText(blocks: AnthropicMessagesResponse["content"]): string {
  return blocks
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
}

async function emitTextDeltas(
  emit: (e: Omit<AiBridgeEvent, "atMs"> & { atMs?: number }) => void,
  text: string,
): Promise<void> {
  const normalized = text.replace(/\r\n/g, "\n");
  const chunkSize = 36;
  for (let i = 0; i < normalized.length; i += chunkSize) {
    const chunk = normalized.slice(i, i + chunkSize);
    if (!chunk) continue;
    emit({ kind: "ai/llm_call_delta", textDelta: chunk });
    await new Promise<void>((r) => setTimeout(r, 0));
  }
}

function buildToolDescriptors(tools: Map<string, BitstreamMcpToolRegistration>): AnthropicToolDescriptor[] {
  const sanitizeInputSchema = (schema: unknown): unknown => {
    if (!schema || typeof schema !== "object") {
      return {
        type: "object",
        additionalProperties: true,
      };
    }
    const s = schema as Record<string, unknown>;
    const out: Record<string, unknown> = { ...s };
    // Anthropic tool schemas reject anyOf/oneOf/allOf at the top level.
    delete out.anyOf;
    delete out.oneOf;
    delete out.allOf;
    // Ensure it's an object schema; be permissive in dev mode.
    out.type = "object";
    if (out.additionalProperties === undefined) {
      out.additionalProperties = true;
    }
    return out;
  };

  return [...tools.values()].map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: sanitizeInputSchema(t.inputSchema),
  }));
}

export async function runAnthropicToolLoop(opts: AnthropicLoopOptions): Promise<void> {
  const client = new AnthropicClient(opts.apiKey);

  const tools = buildToolDescriptors(opts.tools);
  const messages: Array<any> = [{ role: "user", content: opts.userPrompt }];

  const emit = (e: Omit<AiBridgeEvent, "atMs"> & { atMs?: number }) =>
    opts.onEvent({ ...(e as AiBridgeEvent), atMs: e.atMs ?? Date.now() });

  // Loop until Anthropic stops without tool_use blocks.
  for (let step = 0; step < 20; step++) {
    const startedAt = Date.now();
    emit({
      kind: "ai/llm_call_started",
      provider: "anthropic",
      model: opts.model,
      stream: false,
    });

    const response = await client.createMessage({
      model: opts.model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      system: opts.systemPrompt,
      messages,
      tools,
    });

    emit({
      kind: "ai/llm_call_completed",
      durationMs: Date.now() - startedAt,
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      },
      stopReason: response.stop_reason ?? undefined,
    });

    const thinking = summarizeThinking(response.content);
    if (opts.devTrace && opts.includeThinkingSummary && thinking) {
      emit({
        kind: "ai/model_thinking_summary",
        summary: thinking.summary,
        redactedBytes: thinking.redactedBytes,
      });
    }

    const toolUses = response.content.filter((b) => b.type === "tool_use") as Array<{
      type: "tool_use";
      id: string;
      name: string;
      input: unknown;
    }>;

    // If no tools, finalize with assistant text.
    if (toolUses.length === 0) {
      const answer = extractAssistantText(response.content).trim();
      if (opts.emitTextDeltas && answer.length > 0) {
        await emitTextDeltas(emit, answer);
      }
      emit({
        kind: "ai/final_answer_ready",
        answer: answer.length ? answer : "(empty assistant response)",
      });
      return;
    }

    // Append assistant tool_use blocks so Anthropic can relate tool_result to them.
    messages.push({
      role: "assistant",
      content: toolUses.map((u) => ({ type: "tool_use", id: u.id, name: u.name, input: u.input })),
    });

    // Execute each tool_use in order.
    for (const use of toolUses) {
      const toolId = use.name;
      const args = use.input ?? {};
      emit({ kind: "ai/tool_proposed", toolId, args, why: "Model requested tool use" });

      if (opts.ensureSession && toolRequiresBitstreamHostSessionAttach(toolId)) {
        const reason = `before tool ${toolId}`;
        emit({ kind: "ai/session_attach_started", reason });
        try {
          const s = await opts.ensureSession();
          if (s) {
            emit({ kind: "ai/session_attach_succeeded", reason });
          } else {
            emit({
              kind: "ai/session_attach_failed",
              reason,
              error: "No session (attach returned null)",
            });
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          emit({ kind: "ai/session_attach_failed", reason, error: msg });
        }
      }

      const risk = getMcpToolRiskInfo(toolId);
      emit({
        kind: "ai/tool_policy_decision",
        toolId,
        riskLevel: risk.level,
        reason: risk.reason,
        userFacingWarning: risk.userFacingWarning,
      });

      if (isRiskyMcpTool(toolId)) {
        const pending = opts.confirmStore.create({
          requestId: opts.requestId,
          toolId,
          args,
          project4McuHttp: opts.project4McuHttp,
          project4McpOnly: opts.project4McpOnly,
          continuation: {
            provider: "anthropic",
            toolUseId: use.id,
            messages: [...messages],
            model: opts.model,
            maxTokens: opts.maxTokens,
            temperature: opts.temperature,
            systemPrompt: opts.systemPrompt,
            devTrace: opts.devTrace,
            includeThinkingSummary: opts.includeThinkingSummary,
            emitTextDeltas: opts.emitTextDeltas,
          },
        });
        emit({
          kind: "ai/tool_confirm_required",
          toolId,
          confirmToken: pending.confirmToken,
          userFacingWarning: risk.userFacingWarning,
        });
        // Stop loop until UI confirms. (UI will send ai/tool_confirm which triggers execution in server.)
        return;
      }

      const startedToolAt = Date.now();
      emit({ kind: "ai/tool_started", toolId });
      const tool = opts.tools.get(toolId);
      if (!tool) {
        const error = `Unknown toolId: ${toolId}`;
        emit({
          kind: "ai/tool_result",
          toolId,
          ok: false,
          result: null,
          error,
          durationMs: Date.now() - startedToolAt,
        });
        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: use.id,
              content: error,
              is_error: true,
            },
          ],
        });
        continue;
      }

      try {
        const result = await tool.handler(args);
        emit({
          kind: "ai/tool_result",
          toolId,
          ok: true,
          result,
          durationMs: Date.now() - startedToolAt,
        });
        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: use.id,
              content: JSON.stringify(result),
            },
          ],
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        emit({
          kind: "ai/tool_result",
          toolId,
          ok: false,
          result: null,
          error: message,
          durationMs: Date.now() - startedToolAt,
        });
        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: use.id,
              content: message,
              is_error: true,
            },
          ],
        });
      }
    }
  }

  emit({
    kind: "ai/final_answer_ready",
    answer: "Tool loop exceeded max steps (20).",
  });
}

export async function resumeAnthropicToolLoopFromConfirmation(opts: {
  apiKey: string;
  tools: Map<string, BitstreamMcpToolRegistration>;
  confirmStore: ConfirmStore;
  ensureSession?: () => Promise<unknown | null>;
  onEvent: (event: AiBridgeEvent) => void;
  requestId: string;
  pending: PendingToolConfirmation;
}): Promise<void> {
  const cont = opts.pending.continuation;
  if (!cont || cont.provider !== "anthropic") {
    throw new Error("No Anthropic continuation payload found");
  }
  const client = new AnthropicClient(opts.apiKey);
  const tools = buildToolDescriptors(opts.tools);
  const messages = Array.isArray(cont.messages) ? [...(cont.messages as any[])] : [];

  const emit = (e: Omit<AiBridgeEvent, "atMs"> & { atMs?: number }) =>
    opts.onEvent({ ...(e as AiBridgeEvent), atMs: e.atMs ?? Date.now() });

  // Execute the confirmed tool.
  const toolId = opts.pending.toolId;
  const args = opts.pending.args ?? {};
  emit({ kind: "ai/tool_started", toolId });

  const tool = opts.tools.get(toolId);
  const startedToolAt = Date.now();
  if (!tool) {
    const error = `Unknown toolId: ${toolId}`;
    emit({
      kind: "ai/tool_result",
      toolId,
      ok: false,
      result: null,
      error,
      durationMs: Date.now() - startedToolAt,
    });
    pushUserToolResultsAfterConfirm(messages, cont.toolUseId, { content: error, is_error: true });
  } else {
    if (opts.ensureSession && toolRequiresBitstreamHostSessionAttach(toolId)) {
      const reason = `before tool ${toolId}`;
      emit({ kind: "ai/session_attach_started", reason });
      try {
        const s = await opts.ensureSession();
        if (s) emit({ kind: "ai/session_attach_succeeded", reason });
        else emit({ kind: "ai/session_attach_failed", reason, error: "No session (attach returned null)" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        emit({ kind: "ai/session_attach_failed", reason, error: msg });
      }
    }
    try {
      const result = await tool.handler(args);
      emit({
        kind: "ai/tool_result",
        toolId,
        ok: true,
        result,
        durationMs: Date.now() - startedToolAt,
      });
      pushUserToolResultsAfterConfirm(messages, cont.toolUseId, {
        content: JSON.stringify(result),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      emit({
        kind: "ai/tool_result",
        toolId,
        ok: false,
        result: null,
        error: message,
        durationMs: Date.now() - startedToolAt,
      });
      pushUserToolResultsAfterConfirm(messages, cont.toolUseId, {
        content: message,
        is_error: true,
      });
    }
  }

  // Continue the loop after tool_result.
  for (let step = 0; step < 18; step++) {
    const startedAt = Date.now();
    emit({ kind: "ai/llm_call_started", provider: "anthropic", model: cont.model, stream: false });
    const response = await client.createMessage({
      model: cont.model,
      max_tokens: cont.maxTokens,
      temperature: cont.temperature,
      system: cont.systemPrompt,
      messages,
      tools,
    });
    emit({
      kind: "ai/llm_call_completed",
      durationMs: Date.now() - startedAt,
      usage: { inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens },
      stopReason: response.stop_reason ?? undefined,
    });

    const thinking = summarizeThinking(response.content);
    if (cont.devTrace && cont.includeThinkingSummary && thinking) {
      emit({ kind: "ai/model_thinking_summary", summary: thinking.summary, redactedBytes: thinking.redactedBytes });
    }

    const toolUses = response.content.filter((b) => b.type === "tool_use") as Array<{
      type: "tool_use";
      id: string;
      name: string;
      input: unknown;
    }>;

    if (toolUses.length === 0) {
      const answer = extractAssistantText(response.content).trim();
      if (cont.emitTextDeltas && answer.length > 0) {
        await emitTextDeltas(emit, answer);
      }
      emit({ kind: "ai/final_answer_ready", answer: answer.length ? answer : "(empty assistant response)" });
      return;
    }

    messages.push({
      role: "assistant",
      content: toolUses.map((u) => ({ type: "tool_use", id: u.id, name: u.name, input: u.input })),
    });

    for (const use of toolUses) {
      const nextToolId = use.name;
      const nextArgs = use.input ?? {};
      emit({ kind: "ai/tool_proposed", toolId: nextToolId, args: nextArgs, why: "Model requested tool use" });
      const risk = getMcpToolRiskInfo(nextToolId);
      emit({
        kind: "ai/tool_policy_decision",
        toolId: nextToolId,
        riskLevel: risk.level,
        reason: risk.reason,
        userFacingWarning: risk.userFacingWarning,
      });

      if (isRiskyMcpTool(nextToolId)) {
        const pending = opts.confirmStore.create({
          requestId: opts.requestId,
          toolId: nextToolId,
          args: nextArgs,
          project4McuHttp: opts.pending.project4McuHttp,
          project4McpOnly: opts.pending.project4McpOnly,
          continuation: {
            provider: "anthropic",
            toolUseId: use.id,
            messages: [...messages],
            model: cont.model,
            maxTokens: cont.maxTokens,
            temperature: cont.temperature,
            systemPrompt: cont.systemPrompt,
            devTrace: cont.devTrace,
            includeThinkingSummary: cont.includeThinkingSummary,
            emitTextDeltas: cont.emitTextDeltas,
          },
        });
        emit({
          kind: "ai/tool_confirm_required",
          toolId: nextToolId,
          confirmToken: pending.confirmToken,
          userFacingWarning: risk.userFacingWarning,
        });
        return;
      }

      // Non-risky tool: execute inline.
      if (opts.ensureSession && toolRequiresBitstreamHostSessionAttach(nextToolId)) {
        const reason = `before tool ${nextToolId}`;
        emit({ kind: "ai/session_attach_started", reason });
        try {
          const s = await opts.ensureSession();
          if (s) emit({ kind: "ai/session_attach_succeeded", reason });
          else emit({ kind: "ai/session_attach_failed", reason, error: "No session (attach returned null)" });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          emit({ kind: "ai/session_attach_failed", reason, error: msg });
        }
      }

      const tool = opts.tools.get(nextToolId);
      const startedToolAt = Date.now();
      emit({ kind: "ai/tool_started", toolId: nextToolId });
      if (!tool) {
        const error = `Unknown toolId: ${nextToolId}`;
        emit({ kind: "ai/tool_result", toolId: nextToolId, ok: false, result: null, error, durationMs: Date.now() - startedToolAt });
        messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: use.id, content: error, is_error: true }] });
        continue;
      }
      try {
        const result = await tool.handler(nextArgs);
        emit({ kind: "ai/tool_result", toolId: nextToolId, ok: true, result, durationMs: Date.now() - startedToolAt });
        messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: use.id, content: JSON.stringify(result) }] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        emit({ kind: "ai/tool_result", toolId: nextToolId, ok: false, result: null, error: message, durationMs: Date.now() - startedToolAt });
        messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: use.id, content: message, is_error: true }] });
      }
    }
  }

  emit({ kind: "ai/final_answer_ready", answer: "Tool loop exceeded max steps after confirmation." });
}



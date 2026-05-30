import type { Project4McuHttpPayload } from "./project4-mcu-http-payload";

/** Anthropic Messages API `max_tokens` bounds accepted from clients and env (`AI_BRIDGE_MAX_OUTPUT_TOKENS`). */
export const AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MIN = 256;
export const AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MAX = 8192;

export function clampAiBridgeClientMaxOutputTokens(n: number): number {
  return Math.min(
    AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MAX,
    Math.max(AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MIN, Math.round(n)),
  );
}

export type AiClientKind = "vscode-webview" | "browser";

export type AiBridgeClientToServerMessage =
  | {
      type: "ai/hello";
      clientKind: AiClientKind;
      clientInstanceId: string;
      pairingToken?: string;
    }
  | {
      type: "ai/request";
      requestId: string;
      prompt: string;
      /** When true, bridge will stream verbose dev timeline events. */
      devTrace?: boolean;
      /** When true and devTrace is enabled, include model thinking summary events (redacted). */
      includeThinkingSummary?: boolean;
      /**
       * When **true**, register Bitstream MCP tools with Anthropic and allow the dev heuristic tool path without an API key.
       * Omit or **false** for plain chat only (recommended for Sensor Studio until MCP is ready).
       */
      enableMcpTools?: boolean;
      /**
       * Optional Anthropic API key for this request (e.g. from Sensor Studio localStorage).
       * Overrides process.env.ANTHROPIC_API_KEY on the bridge for this request only. Never log this field.
       */
      anthropicApiKey?: string;
      /**
       * Optional Anthropic **`max_tokens`** for this completion (clamped to **256–8192**).
       * When omitted, the bridge uses **`AI_BRIDGE_MAX_OUTPUT_TOKENS`** env or its built-in default (**4096**).
       */
      maxOutputTokens?: number;
      /**
       * When **`enableMcpTools`** is true, merges **`project4_telemetry_get`** / **`project4_move`** / **`project4_set_speed`**
       * with Bitstream tools. Omit when the client must not expose MCU HTTP to Claude.
       */
      project4McuHttp?: Project4McuHttpPayload;
      /**
       * **Project 4 Assistant:** when **`true`** with **`enableMcpTools`**, register **only** **`project4_*`** tools (no Bitstream).
       * If **`project4McuHttp`** is missing or invalid, the tool list is empty — chat-only with a Project 4–scoped system prompt.
       */
      project4McpOnly?: boolean;
    }
  | {
      type: "ai/tool_confirm";
      requestId: string;
      confirmToken: string;
      /** Same as ai/request — required to resume the Anthropic tool loop if env has no key. */
      anthropicApiKey?: string;
    };

export type AiBridgeServerToClientMessage =
  | {
      type: "ai/hello_ack";
      serverInstanceId: string;
      sessionToken: string;
      expiresAtMs: number;
      devDefaults: {
        devTraceEnabled: boolean;
      };
      /**
       * When **false**, the bridge was started with **`--no-bitstream`** / **`ai:bridge:no-serial`** —
       * Bitstream MCP tools cannot attach a `HostSession` (no sensor/device access).
       * Omitted by older servers — treat as unknown until **`ai/server_info`** or retry with an updated bridge.
       */
      bitstreamMcpAttachAvailable?: boolean;
    }
  | {
      type: "ai/event";
      requestId: string;
      event: AiBridgeEvent;
    }
  | {
      type: "ai/error";
      requestId?: string;
      error: string;
    };

export type AiBridgeEvent =
  | {
      kind: "ai/request_received";
      atMs: number;
      prompt: string;
      client: { clientKind: AiClientKind; clientInstanceId: string };
    }
  | {
      kind: "ai/server_info";
      atMs: number;
      serverInstanceId: string;
      pid: number;
      /** Simple string to identify runtime build/config. */
      runtime: {
        anthropicEnabled: boolean;
        modelDefault: string;
        /** Anthropic `max_tokens` per completion (HTML/visual replies need headroom). */
        maxOutputTokens?: number;
        ensureSessionHook: boolean;
        sessionAttachEventsInAnthropicLoop: boolean;
        /** Mirrors **`hello_ack.bitstreamMcpAttachAvailable`** on newer bridges. */
        bitstreamMcpAttachAvailable?: boolean;
      };
    }
  | {
      kind: "ai/llm_call_started";
      atMs: number;
      provider: "anthropic";
      model: string;
      stream: boolean;
    }
  | {
      kind: "ai/llm_call_delta";
      atMs: number;
      /** Text-only deltas (tool deltas are emitted as tool_proposed/tool_result). */
      textDelta: string;
    }
  | {
      kind: "ai/llm_call_completed";
      atMs: number;
      durationMs: number;
      usage?: { inputTokens?: number; outputTokens?: number };
      stopReason?: string;
    }
  | {
      kind: "ai/model_thinking_summary";
      atMs: number;
      /**
       * Summary only. We intentionally do NOT emit raw chain-of-thought.
       * This is meant for developer observability without exposing sensitive reasoning traces.
       */
      summary: string;
      redactedBytes?: number;
    }
  | {
      kind: "ai/tool_proposed";
      atMs: number;
      toolId: string;
      args: unknown;
      why: string;
    }
  | {
      kind: "ai/session_attach_started";
      atMs: number;
      reason: string;
    }
  | {
      kind: "ai/session_attach_failed";
      atMs: number;
      reason: string;
      error: string;
    }
  | {
      kind: "ai/session_attach_succeeded";
      atMs: number;
      reason: string;
    }
  | {
      kind: "ai/tool_policy_decision";
      atMs: number;
      toolId: string;
      riskLevel: "read_only" | "risky";
      reason: string;
      userFacingWarning: string;
    }
  | {
      kind: "ai/tool_confirm_required";
      atMs: number;
      toolId: string;
      confirmToken: string;
      userFacingWarning: string;
    }
  | {
      kind: "ai/tool_started";
      atMs: number;
      toolId: string;
    }
  | {
      kind: "ai/tool_result";
      atMs: number;
      toolId: string;
      ok: boolean;
      result: unknown;
      error?: string;
      durationMs: number;
    }
  | {
      kind: "ai/final_answer_ready";
      atMs: number;
      answer: string;
    };


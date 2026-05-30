import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import type { BitstreamMcpRuntimeContext } from "../../bitstream/mcp-server/types";
import { collectBitstreamMcpTools, type RegisteredBitstreamMcpTool } from "./bitstream-mcp-tool-registry";
import { collectProject4McpTools } from "./project4-mcp-tool-registry";
import { coerceProject4McuHttpPayload } from "./project4-coerce-http-payload";
import { runWithProject4BridgeHttp } from "./project4-bridge-http-context";
import { ConfirmStore } from "./confirm-store";
import {
  resumeAnthropicToolLoopFromConfirmation,
  runAnthropicToolLoop,
  toolRequiresBitstreamHostSessionAttach,
} from "./anthropic-tool-loop";
import {
  clampAiBridgeClientMaxOutputTokens,
  type AiBridgeClientToServerMessage,
  type AiBridgeEvent,
  type AiBridgeServerToClientMessage,
} from "../protocol/ai-bridge-protocol";
import type { Project4McuHttpPayload } from "../protocol/project4-mcu-http-payload";
import { getMcpToolRiskInfo, isRiskyMcpTool } from "../policy/mcp-tool-policy";
import {
  PROJECT4_ASSISTANT_MCP_WITHOUT_MCU_PROMPT,
  PROJECT4_MCP_MERGED_SESSION_PROMPT,
  PROJECT4_MCP_SYSTEM_PROMPT,
} from "./project4-mcp-system-prompt";

export interface AiBridgeServerOptions {
  host: string;
  port: number;
  pairingToken?: string;
  confirmTtlMs?: number;
  getSession: () => Bs2BrokerSession | null;
  ensureSession?: () => Promise<Bs2BrokerSession | null>;
  /**
   * When **false**, clients should show that Bitstream MCP tools cannot attach serial (`ai:bridge:no-serial`).
   * Default **true** for backward compatibility.
   */
  bitstreamMcpAttachAvailable?: boolean;
}

type ClientState = {
  clientKind: "vscode-webview" | "browser";
  clientInstanceId: string;
  sessionToken: string;
};

/**
 * Anthropic `max_tokens` per Messages completion.
 * Large HTML/markdown answers exceed tiny budgets quickly — responses stop mid-fence (e.g. cut inside `<span`).
 * Override with **`AI_BRIDGE_MAX_OUTPUT_TOKENS`** (integer **256–8192**).
 */
function resolveAiBridgeMaxOutputTokens(): number {
  const raw = process.env.AI_BRIDGE_MAX_OUTPUT_TOKENS?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) {
      return clampAiBridgeClientMaxOutputTokens(n);
    }
  }
  return 4096;
}

const RESOLVED_AI_BRIDGE_MAX_OUTPUT_TOKENS = resolveAiBridgeMaxOutputTokens();

function coerceMaxOutputTokensFromClient(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return undefined;
  }
  return clampAiBridgeClientMaxOutputTokens(n);
}

function normalizeAnthropicModelId(raw: string | undefined): string {
  const model = (raw ?? "").trim();
  if (!model) {
    return "claude-sonnet-4-6";
  }
  // Common pinned IDs may not exist for all accounts/regions; prefer the `-latest` aliases.
  if (model === "claude-3-5-sonnet-20241022") return "claude-sonnet-4-6";
  if (model === "claude-3-5-sonnet-latest") return "claude-sonnet-4-6";
  return model;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function send(ws: WebSocket, msg: AiBridgeServerToClientMessage) {
  ws.send(JSON.stringify(msg));
}

function nowEvent<T extends AiBridgeEvent>(event: Omit<T, "atMs"> & { atMs?: number }): T {
  return { ...(event as T), atMs: event.atMs ?? Date.now() };
}

/** Message-provided key overrides env (never log the resolved key). */
function resolveAnthropicApiKey(msg: { anthropicApiKey?: string }): string | undefined {
  const fromMsg = typeof msg.anthropicApiKey === "string" ? msg.anthropicApiKey.trim() : "";
  if (fromMsg.length > 0) {
    return fromMsg;
  }
  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : undefined;
}

/** When no LLM is available, surface tool JSON so the Reply pane is not empty. */
function formatDevModeToolAnswer(toolId: string, result: unknown): string {
  let body: string;
  try {
    body = typeof result === "string" ? result : JSON.stringify(result, null, 2);
  } catch {
    body = String(result);
  }
  const max = 14_000;
  if (body.length > max) {
    body = `${body.slice(0, max)}\n… (truncated)`;
  }
  return [`### ${toolId}`, "", "```json", body, "```"].join("\n");
}

function decideSingleToolFromPrompt(prompt: string): { toolId: string; args: unknown; why: string } | null {
  const p = prompt.toLowerCase();
  if (p === "hello" || p.includes("handshake") || p.includes("say hello")) {
    return {
      toolId: "bitstream_control_ops",
      args: { op: "hello" },
      why: "User asked to run hello/handshake",
    };
  }
  if (p.includes("caps")) {
    return { toolId: "bitstream_control_ops", args: { op: "caps" }, why: "User asked for caps" };
  }
  if (p.includes("ping")) {
    return { toolId: "bitstream_control_ops", args: { op: "ping" }, why: "User asked for ping" };
  }
  if (p.includes("health")) {
    return { toolId: "bitstream_health_check", args: {}, why: "User asked for health/status" };
  }
  if (p.includes("fault") || p.includes("fault event")) {
    return { toolId: "bitstream_diag_fault_events_get", args: {}, why: "User asked for fault events" };
  }
  if (p.includes("diag snapshot") || p.includes("diagnostic snapshot")) {
    return { toolId: "bitstream_diag_snapshot_get", args: {}, why: "User asked for diagnostics snapshot" };
  }
  if (p.includes("task table") || p.includes("diag tasks")) {
    return { toolId: "bitstream_diag_task_table_get", args: {}, why: "User asked for diagnostics task table" };
  }
  if (p.includes("status") && p.includes("sensor")) {
    return { toolId: "bitstream_sensor_status_get", args: {}, why: "User asked for sensor status" };
  }
  if (p.includes("latest") || p.includes("sample")) {
    return {
      toolId: "bitstream_sensor_latest_samples_get",
      args: { windowMs: 1500 },
      why: "User asked for latest samples",
    };
  }

  return null;
}

export class AiBridgeServer {
  private readonly serverInstanceId = randomUUID();
  private readonly wss: WebSocketServer;
  private readonly clients = new WeakMap<WebSocket, ClientState>();
  private readonly confirmStore: ConfirmStore;
  private readonly tools: ReturnType<typeof collectBitstreamMcpTools>;
  private readonly project4Tools: ReturnType<typeof collectProject4McpTools>;
  private readonly bitstreamMcpAttachAvailable: boolean;

  constructor(private readonly options: AiBridgeServerOptions) {
    this.bitstreamMcpAttachAvailable = options.bitstreamMcpAttachAvailable !== false;
    this.confirmStore = new ConfirmStore(options.confirmTtlMs ?? 60_000);
    const runtime: BitstreamMcpRuntimeContext = {
      getSession: options.getSession,
    };
    this.tools = collectBitstreamMcpTools(runtime);
    this.project4Tools = collectProject4McpTools();

    this.wss = new WebSocketServer({ host: options.host, port: options.port });
    this.wss.on("connection", (ws) => this.onConnection(ws));
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => resolve());
    });
  }

  private onConnection(ws: WebSocket) {
    ws.on("message", (data) => {
      const raw = typeof data === "string" ? data : data.toString("utf8");
      const parsed = safeJsonParse(raw);
      if (!parsed || typeof parsed !== "object") {
        send(ws, { type: "ai/error", error: "Invalid JSON message" });
        return;
      }
      void this.onClientMessage(ws, parsed as AiBridgeClientToServerMessage);
    });
  }

  private requireClient(ws: WebSocket): ClientState | null {
    return this.clients.get(ws) ?? null;
  }

  /** Bitstream tools plus optional Project 4 MCU HTTP tools when the client supplied **`project4McuHttp`**. */
  private mergedMcpTools(project4?: Project4McuHttpPayload): Map<string, RegisteredBitstreamMcpTool> {
    if (!project4) {
      return this.tools;
    }
    const merged = new Map(this.tools);
    for (const [id, tool] of this.project4Tools) {
      merged.set(id, tool);
    }
    return merged;
  }

  /** Resolves the MCP tool map for **`ai/request`** and **`ai/tool_confirm`** resume. */
  private mcpToolsForBridgeRequest(
    project4Payload: Project4McuHttpPayload | undefined,
    project4McpOnly: boolean | undefined,
  ): Map<string, RegisteredBitstreamMcpTool> {
    if (project4McpOnly === true) {
      return project4Payload ? new Map(this.project4Tools) : new Map();
    }
    return this.mergedMcpTools(project4Payload);
  }

  private async onClientMessage(ws: WebSocket, msg: AiBridgeClientToServerMessage) {
    if (msg.type === "ai/hello") {
      if (this.options.pairingToken && msg.pairingToken !== this.options.pairingToken) {
        send(ws, { type: "ai/error", error: "Pairing token rejected" });
        return;
      }
      const sessionToken = randomUUID();
      const expiresAtMs = Date.now() + 12 * 60 * 60 * 1000;
      this.clients.set(ws, {
        clientKind: msg.clientKind,
        clientInstanceId: msg.clientInstanceId,
        sessionToken,
      });
      send(ws, {
        type: "ai/hello_ack",
        serverInstanceId: this.serverInstanceId,
        sessionToken,
        expiresAtMs,
        devDefaults: { devTraceEnabled: true },
        bitstreamMcpAttachAvailable: this.bitstreamMcpAttachAvailable,
      });

      // Emit a server_info event so UI can confirm which bridge build it's talking to.
      this.emit(ws, "bridge", nowEvent({
        kind: "ai/server_info",
        serverInstanceId: this.serverInstanceId,
        pid: process.pid,
        runtime: {
          anthropicEnabled: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
          modelDefault: normalizeAnthropicModelId(process.env.ANTHROPIC_MODEL),
          maxOutputTokens: RESOLVED_AI_BRIDGE_MAX_OUTPUT_TOKENS,
          ensureSessionHook: typeof this.options.ensureSession === "function",
          sessionAttachEventsInAnthropicLoop: true,
          bitstreamMcpAttachAvailable: this.bitstreamMcpAttachAvailable,
        },
      }));
      return;
    }

    const client = this.requireClient(ws);
    if (!client) {
      send(ws, { type: "ai/error", error: "Client must send ai/hello first" });
      return;
    }

    if (msg.type === "ai/request") {
      const requestId = msg.requestId;
      /** Explicit opt-in: Bitstream MCP tools + dev heuristic without API key. Chat-first UIs omit this or set false. */
      const enableMcpTools = msg.enableMcpTools === true;
      const project4Payload =
        enableMcpTools && msg.project4McuHttp != null
          ? coerceProject4McuHttpPayload(msg.project4McuHttp)
          : undefined;
      const project4McpOnly = msg.project4McpOnly === true;

      this.emit(ws, requestId, nowEvent({
        kind: "ai/request_received",
        prompt: msg.prompt,
        client: { clientKind: client.clientKind, clientInstanceId: client.clientInstanceId },
      }));

      const anthropicKey = resolveAnthropicApiKey(msg);
      if (anthropicKey) {
        const model = normalizeAnthropicModelId(process.env.ANTHROPIC_MODEL);
        const customSystem = process.env.AI_SYSTEM_PROMPT?.trim();
        const chatSystemPrompt =
          customSystem ||
          [
            "You are a helpful assistant for TESAIoT Bitstream development and Sensor Studio.",
            "Answer clearly and concisely.",
            "You do not have Bitstream device tools in this session — reply from general knowledge only.",
          ].join("\n");
        const bitstreamToolsSystemPrompt =
          customSystem ||
          [
            "You are a developer-mode assistant for TESAIoT Bitstream.",
            "You may call tools to inspect or control the device.",
            "When you call a tool, use only the provided tool names and valid JSON args.",
            "Return a concise final answer for the user. Keep technical details in tool results and events.",
          ].join("\n");

        let toolsSystemPrompt = bitstreamToolsSystemPrompt;
        if (enableMcpTools) {
          if (project4McpOnly) {
            toolsSystemPrompt =
              customSystem ||
              (project4Payload != null
                ? PROJECT4_MCP_SYSTEM_PROMPT
                : PROJECT4_ASSISTANT_MCP_WITHOUT_MCU_PROMPT);
          } else if (project4Payload != null) {
            toolsSystemPrompt = customSystem || PROJECT4_MCP_MERGED_SESSION_PROMPT;
          }
        }

        const systemPrompt = enableMcpTools ? toolsSystemPrompt : chatSystemPrompt;
        const toolsForLoop: Map<string, RegisteredBitstreamMcpTool> = enableMcpTools
          ? this.mcpToolsForBridgeRequest(project4Payload, project4McpOnly)
          : new Map();

        const maxTokensForLoop =
          coerceMaxOutputTokensFromClient(msg.maxOutputTokens) ?? RESOLVED_AI_BRIDGE_MAX_OUTPUT_TOKENS;

        try {
          await runWithProject4BridgeHttp(project4Payload, async () =>
            runAnthropicToolLoop({
              apiKey: anthropicKey,
              model,
              maxTokens: maxTokensForLoop,
              temperature: 0.2,
              systemPrompt,
              tools: toolsForLoop,
              confirmStore: this.confirmStore,
              ensureSession: this.options.ensureSession,
              devTrace: msg.devTrace === true,
              includeThinkingSummary: msg.includeThinkingSummary === true,
              emitTextDeltas: msg.devTrace === true || !enableMcpTools,
              requestId,
              userPrompt: msg.prompt,
              project4McuHttp: project4Payload,
              project4McpOnly: project4McpOnly ? true : undefined,
              onEvent: (event) => this.emit(ws, requestId, event),
            }),
          );
          return;
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          this.emit(ws, requestId, nowEvent({ kind: "ai/final_answer_ready", answer: `Anthropic error: ${errMsg}` }));
          return;
        }
      }

      if (!enableMcpTools) {
        this.emit(
          ws,
          requestId,
          nowEvent({
            kind: "ai/final_answer_ready",
            answer:
              "No Anthropic API key: paste your key in Sensor Studio Assistant below (stored locally in this browser) or set ANTHROPIC_API_KEY on the AI bridge process. Bitstream MCP tools stay off until you enable them (AI Dev Trace).",
          }),
        );
        return;
      }

      const decision = decideSingleToolFromPrompt(msg.prompt);
      if (!decision) {
        this.emit(ws, requestId, nowEvent({ kind: "ai/final_answer_ready", answer: "No tool selected for this prompt (dev heuristic)." }));
        return;
      }

      const { toolId, args, why } = decision;
      this.emit(ws, requestId, nowEvent({ kind: "ai/tool_proposed", toolId, args, why }));
      const risk = getMcpToolRiskInfo(toolId);
      this.emit(ws, requestId, nowEvent({
        kind: "ai/tool_policy_decision",
        toolId,
        riskLevel: risk.level,
        reason: risk.reason,
        userFacingWarning: risk.userFacingWarning,
      }));

      if (isRiskyMcpTool(toolId)) {
        const pending = this.confirmStore.create({ requestId, toolId, args });
        this.emit(ws, requestId, nowEvent({
          kind: "ai/tool_confirm_required",
          toolId,
          confirmToken: pending.confirmToken,
          userFacingWarning: risk.userFacingWarning,
        }));
        return;
      }

      await this.executeTool(ws, requestId, toolId, args);
      return;
    }

    if (msg.type === "ai/tool_confirm") {
      const pending = this.confirmStore.consume(msg.confirmToken);
      if (!pending) {
        send(ws, { type: "ai/error", requestId: msg.requestId, error: "Confirm token not found or expired" });
        return;
      }
      if (pending.requestId !== msg.requestId) {
        send(ws, { type: "ai/error", requestId: msg.requestId, error: "Confirm token does not match requestId" });
        return;
      }
      const anthropicKey = resolveAnthropicApiKey(msg);
      if (anthropicKey) {
        // In Anthropic mode: resume the tool loop with the saved continuation payload so the
        // assistant can incorporate tool results into a proper final answer.
        try {
          await runWithProject4BridgeHttp(pending.project4McuHttp, async () =>
            resumeAnthropicToolLoopFromConfirmation({
              apiKey: anthropicKey,
              tools: this.mcpToolsForBridgeRequest(pending.project4McuHttp, pending.project4McpOnly),
              confirmStore: this.confirmStore,
              ensureSession: this.options.ensureSession,
              requestId: pending.requestId,
              pending,
              onEvent: (event) => this.emit(ws, pending.requestId, event),
            }),
          );
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          this.emit(
            ws,
            pending.requestId,
            nowEvent({ kind: "ai/final_answer_ready", answer: `Anthropic confirm resume error: ${errMsg}` }),
          );
        }
        return;
      }

      await this.executeTool(
        ws,
        pending.requestId,
        pending.toolId,
        pending.args,
        pending.project4McuHttp,
        pending.project4McpOnly,
      );
      return;
    }
  }

  private emit(ws: WebSocket, requestId: string, event: AiBridgeEvent) {
    send(ws, { type: "ai/event", requestId, event });
  }

  private async executeTool(
    ws: WebSocket,
    requestId: string,
    toolId: string,
    args: unknown,
    project4?: Project4McuHttpPayload,
    project4McpOnly?: boolean,
  ) {
    const tools = this.mcpToolsForBridgeRequest(project4, project4McpOnly);
    const tool = tools.get(toolId);
    if (!tool) {
      this.emit(ws, requestId, nowEvent({
        kind: "ai/tool_result",
        toolId,
        ok: false,
        result: null,
        error: `Unknown toolId: ${toolId}`,
        durationMs: 0,
      }));
      this.emit(ws, requestId, nowEvent({ kind: "ai/final_answer_ready", answer: `Tool not found: ${toolId}` }));
      return;
    }

    if (this.options.ensureSession && toolRequiresBitstreamHostSessionAttach(toolId)) {
      const reason = `before tool ${toolId}`;
      this.emit(ws, requestId, nowEvent({ kind: "ai/session_attach_started", reason }));
      try {
        const s = await this.options.ensureSession();
        if (s) {
          this.emit(ws, requestId, nowEvent({ kind: "ai/session_attach_succeeded", reason }));
        } else {
          this.emit(ws, requestId, nowEvent({ kind: "ai/session_attach_failed", reason, error: "No session (attach returned null)" }));
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.emit(ws, requestId, nowEvent({ kind: "ai/session_attach_failed", reason, error: msg }));
      }
    }

    const startedAt = Date.now();
    this.emit(ws, requestId, nowEvent({ kind: "ai/tool_started", toolId }));
    try {
      const result = await runWithProject4BridgeHttp(project4, async () => tool.handler(args));
      const durationMs = Date.now() - startedAt;
      this.emit(ws, requestId, nowEvent({
        kind: "ai/tool_result",
        toolId,
        ok: true,
        result,
        durationMs,
      }));
      this.emit(ws, requestId, nowEvent({
        kind: "ai/final_answer_ready",
        answer: formatDevModeToolAnswer(toolId, result),
      }));
    } catch (error: unknown) {
      const durationMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);
      this.emit(ws, requestId, nowEvent({
        kind: "ai/tool_result",
        toolId,
        ok: false,
        result: null,
        error: message,
        durationMs,
      }));
      this.emit(ws, requestId, nowEvent({ kind: "ai/final_answer_ready", answer: `Tool ${toolId} failed: ${message}` }));
    }
  }
}


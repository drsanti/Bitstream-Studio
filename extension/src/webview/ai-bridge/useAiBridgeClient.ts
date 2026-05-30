import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AiBridgeClientToServerMessage,
  AiBridgeEvent,
  AiBridgeServerToClientMessage,
} from "../../ai/protocol/ai-bridge-protocol";
import type { Project4McuHttpPayload } from "../../ai/protocol/project4-mcu-http-payload";
import {
  getAiBridgePairingToken,
  getDefaultAiBridgeWsUrl,
  getStoredAnthropicApiKey,
  getStoredAnthropicMaxOutputTokens,
  safeJsonParse,
} from "./ai-bridge-webview-config";

export type AiBridgeTraceRow = {
  requestId: string;
  event: AiBridgeEvent;
};

/** Server-side bridge errors (`type: ai/error`) — not part of `AiBridgeEvent` timeline. */
export type AiBridgeBridgeErrorRow = {
  atMs: number;
  requestId?: string;
  error: string;
};

/** Sanitized record of client → bridge WebSocket sends (secrets redacted). */
export type AiBridgeOutboundRow = {
  atMs: number;
  message: Record<string, unknown>;
};

const OUTBOUND_LOG_CAP = 64;

function sanitizeProject4McuHttpForOutboundLog(payload: Project4McuHttpPayload): Record<string, unknown> {
  let origin = "(invalid-url)";
  try {
    origin = new URL(payload.mcuBaseUrl).origin;
  } catch {
    origin = payload.mcuBaseUrl.length > 48 ? `${payload.mcuBaseUrl.slice(0, 48)}…` : payload.mcuBaseUrl;
  }
  return {
    mcuOrigin: origin,
    telemetryPath: payload.telemetryPath,
    movePath: payload.movePath,
    setSpeedPath: payload.setSpeedPath,
    httpRequestTimeoutMs: payload.httpRequestTimeoutMs,
    setSpeedUseQuery: payload.setSpeedUseQuery,
  };
}

function sanitizeAiBridgeOutbound(msg: AiBridgeClientToServerMessage): Record<string, unknown> {
  if (msg.type === "ai/hello") {
    return {
      type: msg.type,
      clientKind: msg.clientKind,
      clientInstanceId: msg.clientInstanceId,
      ...(msg.pairingToken != null && msg.pairingToken.length > 0 ? { pairingToken: "[redacted]" } : {}),
    };
  }
  if (msg.type === "ai/request") {
    const p = msg.prompt;
    return {
      type: msg.type,
      requestId: msg.requestId,
      promptPreview: p.length > 240 ? `${p.slice(0, 240)}…` : p,
      promptChars: p.length,
      devTrace: msg.devTrace,
      includeThinkingSummary: msg.includeThinkingSummary,
      enableMcpTools: msg.enableMcpTools,
      ...(msg.project4McuHttp != null ? { project4McuHttp: sanitizeProject4McuHttpForOutboundLog(msg.project4McuHttp) } : {}),
      ...(msg.project4McpOnly === true ? { project4McpOnly: true } : {}),
      ...(msg.anthropicApiKey != null && msg.anthropicApiKey.length > 0 ? { anthropicApiKey: "[redacted]" } : {}),
      ...(msg.maxOutputTokens != null ? { maxOutputTokens: msg.maxOutputTokens } : {}),
    };
  }
  return {
    type: msg.type,
    requestId: msg.requestId,
    confirmToken: "[redacted]",
    ...(msg.anthropicApiKey != null && msg.anthropicApiKey.length > 0 ? { anthropicApiKey: "[redacted]" } : {}),
  };
}

export type UseAiBridgeClientOptions = {
  /** Override WebSocket URL (default: injected global or ws://127.0.0.1:9987). */
  wsUrl?: string;
};

export type UseAiBridgeClientResult = {
  wsUrl: string;
  connected: boolean;
  send: (msg: AiBridgeClientToServerMessage) => void;
  traceRows: AiBridgeTraceRow[];
  /** Errors emitted by the bridge (protocol failures, confirm mismatch, etc.). */
  bridgeErrors: AiBridgeBridgeErrorRow[];
  activeRequestId: string | null;
  liveAnswer: string;
  finalAnswer: string | null;
  submitPrompt: (
    prompt: string,
    opts: {
      devTrace: boolean;
      includeThinkingSummary: boolean;
      /** When true, bridge registers Bitstream MCP tools (AI Dev Trace). Sensor Studio leaves this unset for plain chat. */
      enableMcpTools?: boolean;
      /** Overrides stored key for this send when non-empty; merged with localStorage in submitPrompt. */
      anthropicApiKey?: string;
      /** Overrides stored max output tokens for this send when set; merged with localStorage in submitPrompt. */
      maxOutputTokens?: number;
      /** When **`enableMcpTools`** is true, registers Project 4 MCU HTTP tools on the bridge. */
      project4McuHttp?: Project4McuHttpPayload;
      /** Project 4 Assistant: robot **`project4_*`** tools only (no Bitstream). */
      project4McpOnly?: boolean;
    },
  ) => void;
  resetAnswerState: () => void;
  /** Clear buffered `ai/event` rows (e.g. AI Dev Trace timeline). Does not reset WebSocket or active request. */
  clearTraceTimeline: () => void;
  /** Clear accumulated `ai/error` rows from the bridge. */
  clearBridgeErrors: () => void;
  /** Sanitized client → bridge sends (ring buffer). */
  outboundRows: AiBridgeOutboundRow[];
  clearOutboundLog: () => void;
  /**
   * **null** = unknown (before **`hello_ack`**) or older bridge without the flag.
   * **false** = bridge runs **`ai:bridge:no-serial`** — Bitstream MCP cannot attach a session.
   */
  bitstreamMcpAttachAvailable: boolean | null;
};

export function useAiBridgeClient(options?: UseAiBridgeClientOptions): UseAiBridgeClientResult {
  const wsUrl = useMemo(() => options?.wsUrl ?? getDefaultAiBridgeWsUrl(), [options?.wsUrl]);
  /** Bumps when pairing token is saved so the WebSocket reconnects with a new `ai/hello`. */
  const [pairingRevision, setPairingRevision] = useState(0);
  const [connected, setConnected] = useState(false);
  const [traceRows, setTraceRows] = useState<AiBridgeTraceRow[]>([]);
  const [bridgeErrors, setBridgeErrors] = useState<AiBridgeBridgeErrorRow[]>([]);
  const [outboundRows, setOutboundRows] = useState<AiBridgeOutboundRow[]>([]);
  const [bitstreamMcpAttachAvailable, setBitstreamMcpAttachAvailable] = useState<boolean | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const helloSentRef = useRef(false);
  const clientInstanceIdRef = useRef<string>(crypto.randomUUID());

  const send = useCallback((msg: AiBridgeClientToServerMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    setOutboundRows((prev) => {
      const row: AiBridgeOutboundRow = {
        atMs: Date.now(),
        message: sanitizeAiBridgeOutbound(msg),
      };
      const next = [...prev, row];
      return next.length > OUTBOUND_LOG_CAP ? next.slice(-OUTBOUND_LOG_CAP) : next;
    });
    ws.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    const bump = () => setPairingRevision((n) => n + 1);
    window.addEventListener("ternion-ai-bridge-pairing-changed", bump);
    return () => window.removeEventListener("ternion-ai-bridge-pairing-changed", bump);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    helloSentRef.current = false;

    const onOpen = () => {
      setConnected(true);
      setBitstreamMcpAttachAvailable(null);
      if (helloSentRef.current) {
        return;
      }
      helloSentRef.current = true;
      const pairingToken = getAiBridgePairingToken();
      send({
        type: "ai/hello",
        clientKind: window.WEBVIEW_READY ? "vscode-webview" : "browser",
        clientInstanceId: clientInstanceIdRef.current,
        ...(pairingToken ? { pairingToken } : {}),
      });
    };
    const onClose = () => {
      setConnected(false);
      setBitstreamMcpAttachAvailable(null);
    };
    const onMessage = (ev: MessageEvent) => {
      const parsed = safeJsonParse(String(ev.data));
      if (!parsed || typeof parsed !== "object") {
        return;
      }
      const msg = parsed as AiBridgeServerToClientMessage;
      if (msg.type === "ai/hello_ack") {
        setBitstreamMcpAttachAvailable(
          msg.bitstreamMcpAttachAvailable === undefined ? null : msg.bitstreamMcpAttachAvailable,
        );
        return;
      }
      if (msg.type === "ai/error") {
        setBridgeErrors((prev) => [
          ...prev,
          {
            atMs: Date.now(),
            requestId: msg.requestId,
            error: msg.error,
          },
        ]);
        return;
      }
      if (msg.type === "ai/event") {
        setTraceRows((prev) => [...prev, { requestId: msg.requestId, event: msg.event }]);
        const active = activeRequestIdRef.current;
        if (active && msg.requestId === active) {
          const e = msg.event;
          if (e.kind === "ai/llm_call_delta") {
            setLiveAnswer((prev) => prev + e.textDelta);
          }
          if (e.kind === "ai/final_answer_ready") {
            setFinalAnswer(e.answer);
          }
        }
      }
    };
    ws.addEventListener("open", onOpen);
    ws.addEventListener("close", onClose);
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("close", onClose);
      ws.removeEventListener("message", onMessage);
      ws.close();
      wsRef.current = null;
      helloSentRef.current = false;
    };
  }, [send, wsUrl, pairingRevision]);

  const submitPrompt = useCallback(
    (
      prompt: string,
      opts: {
        devTrace: boolean;
        includeThinkingSummary: boolean;
        enableMcpTools?: boolean;
        anthropicApiKey?: string;
        maxOutputTokens?: number;
        project4McuHttp?: Project4McuHttpPayload;
        project4McpOnly?: boolean;
      },
    ) => {
      const requestId = crypto.randomUUID();
      activeRequestIdRef.current = requestId;
      setActiveRequestId(requestId);
      setLiveAnswer("");
      setFinalAnswer(null);
      const fromOpts = opts.anthropicApiKey?.trim() ?? "";
      const fromStore = getStoredAnthropicApiKey().trim();
      const anthropicApiKey = fromOpts.length > 0 ? fromOpts : fromStore;
      const maxOutputTokens =
        opts.maxOutputTokens ?? getStoredAnthropicMaxOutputTokens() ?? undefined;
      send({
        type: "ai/request",
        requestId,
        prompt,
        devTrace: opts.devTrace,
        includeThinkingSummary: opts.includeThinkingSummary,
        /** Explicit boolean so the bridge never assumes MCP/heuristic mode when omitted in older bundles. */
        enableMcpTools: opts.enableMcpTools === true,
        ...(opts.project4McuHttp != null ? { project4McuHttp: opts.project4McuHttp } : {}),
        ...(opts.project4McpOnly === true ? { project4McpOnly: true } : {}),
        ...(anthropicApiKey.length > 0 ? { anthropicApiKey } : {}),
        ...(maxOutputTokens != null ? { maxOutputTokens } : {}),
      });
    },
    [send],
  );

  const resetAnswerState = useCallback(() => {
    setLiveAnswer("");
    setFinalAnswer(null);
    setActiveRequestId(null);
    activeRequestIdRef.current = null;
  }, []);

  const clearTraceTimeline = useCallback(() => {
    setTraceRows([]);
  }, []);

  const clearBridgeErrors = useCallback(() => {
    setBridgeErrors([]);
  }, []);

  const clearOutboundLog = useCallback(() => {
    setOutboundRows([]);
  }, []);

  return useMemo(
    () => ({
      wsUrl,
      connected,
      send,
      traceRows,
      bridgeErrors,
      outboundRows,
      activeRequestId,
      liveAnswer,
      finalAnswer,
      submitPrompt,
      resetAnswerState,
      clearTraceTimeline,
      clearBridgeErrors,
      clearOutboundLog,
      bitstreamMcpAttachAvailable,
    }),
    [
      wsUrl,
      connected,
      send,
      traceRows,
      bridgeErrors,
      outboundRows,
      bitstreamMcpAttachAvailable,
      activeRequestId,
      liveAnswer,
      finalAnswer,
      submitPrompt,
      resetAnswerState,
      clearTraceTimeline,
      clearBridgeErrors,
      clearOutboundLog,
    ],
  );
}

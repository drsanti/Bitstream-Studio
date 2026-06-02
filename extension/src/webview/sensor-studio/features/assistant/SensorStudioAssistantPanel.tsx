import {
  Activity,
  AlignJustify,
  AlertTriangle,
  Check,
  ClipboardCopy,
  FileText,
  ListTree,
  Loader2,
  Maximize2,
  Menu,
  MessageSquareText,
  Minimize2,
  PanelBottom,
  Play,
  RotateCcw,
  ScrollText,
  Send,
  Settings2,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  postAiBridgeStartFromExtension,
  postAiBridgeStopThenStartWithBitstreamLane,
} from "../../../ai-bridge/ai-bridge-extension-messages";
import {
  ANTHROPIC_API_KEY_CHANGED_EVENT,
  getStoredAnthropicApiKey,
} from "../../../ai-bridge/ai-bridge-webview-config";
import { useAiBridgeClient } from "../../../ai-bridge/useAiBridgeClient";
import { useAiBridgeExtensionHostStatus } from "../../../ai-bridge/useAiBridgeExtensionHostStatus";
import { isVsCodeExtensionWebview } from "../../../isVsCodeExtensionWebview";
import {
  TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID,
  TRN_HIGHLIGHTED_JSON_SYNTAX_THEME_OPTIONS,
  TRNHighlightedJsonBlock,
  TRNHintText,
  TRNIconButton,
  TRNInlineToggleRow,
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
  TRNMessageDialog,
  TRNTooltip,
  TRNWindow,
  isTrnHighlightedJsonSyntaxThemeId,
  type TRNHighlightedJsonSyntaxThemeId,
} from "../../../ui/TRN";
import {
  HTML_PREVIEW_DELIVERY_LABELS,
  useHtmlPreviewDeliveryStore,
  type HtmlPreviewDeliveryMode,
} from "../../../ui/TRN/htmlPreviewDelivery.store";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import {
  TRNMarkdownRenderer,
  TRNMarkdownZoomControls,
} from "../../../ui/TRN/TRNMarkdownRenderer.js";
import { useTrnMarkdownZoomStore } from "../../../ui/TRN/markdownZoom.store";
import { writeClipboardText } from "../../../ui/utils/clipboard";
import { useBitstreamConfigStore } from "../../../bitstream-app/state/bitstreamConfig.store";
import type { AiBridgeEvent } from "../../../../ai/protocol/ai-bridge-protocol";
import { AssistantTypingPlaceholder } from ".";

export type SensorStudioAssistantLayoutMode = "docked" | "floating";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SensorStudioAssistantPanelProps = {
  borderColor: string;
  panelBackgroundColor: string;
  layoutMode: SensorStudioAssistantLayoutMode;
  onLayoutModeChange: (mode: SensorStudioAssistantLayoutMode) => void;
  onRequestClose: () => void;
  boundsRef: RefObject<HTMLElement | null>;
  /** Opens Bitstream shell Diagnostics (runtime services + firmware diag cards). */
  onOpenSystemDiagnostics?: () => void;
};

const HTML_PREVIEW_DELIVERY_MODES = ["sandbox", "browser", "both"] as const satisfies readonly HtmlPreviewDeliveryMode[];

const ASSISTANT_RENDER_MARKDOWN_KEY = "ternion.sensorStudio.assistant.renderMarkdown";
const ASSISTANT_HTML_FENCE_PREVIEW_KEY = "ternion.sensorStudio.assistant.htmlFencePreview";
const ASSISTANT_CODE_SYNTAX_HIGHLIGHT_KEY = "ternion.sensorStudio.assistant.codeSyntaxHighlight";
const ASSISTANT_COMPOSER_FONT_PX_KEY = "ternion.sensorStudio.assistant.composerFontPx";
/** Persisted Bitstream / Sensor Studio assistant chat (close panel / reload). */
const ASSISTANT_TRANSCRIPT_KEY = "ternion.sensorStudio.assistant.transcript.v1";
const ASSISTANT_TRANSCRIPT_MAX_MESSAGES = 400;
const ASSISTANT_TRANSCRIPT_MAX_JSON_CHARS = 1_200_000;

const COMPOSER_FONT_PX_MIN = 10;
const COMPOSER_FONT_PX_MAX = 22;
const COMPOSER_FONT_PX_DEFAULT = 13;

function clampComposerFontPx(n: number): number {
  if (!Number.isFinite(n)) {
    return COMPOSER_FONT_PX_DEFAULT;
  }
  return Math.min(COMPOSER_FONT_PX_MAX, Math.max(COMPOSER_FONT_PX_MIN, Math.round(n)));
}

function readStoredComposerFontPx(): number {
  try {
    if (typeof window === "undefined") {
      return COMPOSER_FONT_PX_DEFAULT;
    }
    const raw = window.localStorage?.getItem(ASSISTANT_COMPOSER_FONT_PX_KEY);
    if (raw == null || raw.trim() === "") {
      return COMPOSER_FONT_PX_DEFAULT;
    }
    const parsed = Number.parseInt(raw, 10);
    return clampComposerFontPx(parsed);
  } catch {
    return COMPOSER_FONT_PX_DEFAULT;
  }
}

function isChatMessageRow(o: unknown): o is ChatMessage {
  if (o == null || typeof o !== "object") {
    return false;
  }
  const r = o as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    (r.role === "user" || r.role === "assistant") &&
    typeof r.content === "string"
  );
}

function readPersistedAssistantTranscript(): ChatMessage[] {
  try {
    if (typeof window === "undefined") {
      return [];
    }
    const raw = window.localStorage?.getItem(ASSISTANT_TRANSCRIPT_KEY);
    if (raw == null || raw.trim() === "") {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const rows = parsed.filter(isChatMessageRow);
    return rows.slice(-ASSISTANT_TRANSCRIPT_MAX_MESSAGES);
  } catch {
    return [];
  }
}

function writePersistedAssistantTranscript(messages: ChatMessage[]): void {
  try {
    if (typeof window === "undefined") {
      return;
    }
    if (messages.length === 0) {
      window.localStorage?.removeItem(ASSISTANT_TRANSCRIPT_KEY);
      return;
    }
    let slice = messages.slice(-ASSISTANT_TRANSCRIPT_MAX_MESSAGES);
    let json = JSON.stringify(slice);
    while (json.length > ASSISTANT_TRANSCRIPT_MAX_JSON_CHARS && slice.length > 2) {
      const drop = Math.max(1, Math.ceil(slice.length * 0.1));
      slice = slice.slice(drop);
      json = JSON.stringify(slice);
    }
    window.localStorage?.setItem(ASSISTANT_TRANSCRIPT_KEY, json);
  } catch {
    // QuotaExceededError or private mode — ignore
  }
}

const ENABLE_MCP_TOOLS_KEY = "ternion.sensorStudio.enableMcpTools";
const AUTO_CONFIRM_RISKY_TOOLS_KEY = "ternion.sensorStudio.autoConfirmRiskyMcpTools";
const DEBUG_TRACE_JSON_THEME_KEY = "ternion.sensorStudio.assistant.debugTraceJsonTheme";
const DEBUG_TRACE_HEADER_MODE_KEY = "ternion.sensorStudio.assistant.debugTraceHeaderMode";

type DebugTraceHeaderMode = "detail" | "simplified";

function parseDebugTraceHeaderMode(raw: string | null | undefined): DebugTraceHeaderMode {
  return raw === "simplified" ? "simplified" : "detail";
}

function confirmAckKey(requestId: string, confirmToken: string): string {
  return `${requestId}:${confirmToken}`;
}

function formatTraceWallClockIsoUtc(atMs: number): string {
  try {
    return new Date(atMs).toISOString();
  } catch {
    return String(atMs);
  }
}

/** Signed delta rounded to integer milliseconds (thin space before unit). */
function formatSignedRoundedMs(deltaMs: number): string {
  const n = Math.round(deltaMs);
  return `${n >= 0 ? "+" : ""}${n}\u202fms`;
}

/** One-line developer-facing summary; JSON below stays authoritative. */
function traceEventCaption(event: AiBridgeEvent): string | null {
  switch (event.kind) {
    case "ai/request_received":
      return `${event.prompt.length.toLocaleString()} prompt chars · client ${event.client.clientKind}`;
    case "ai/server_info": {
      const mo = event.runtime.maxOutputTokens;
      return mo != null
        ? `pid ${event.pid} · model ${event.runtime.modelDefault} · max_out ${mo} tok`
        : `pid ${event.pid} · model ${event.runtime.modelDefault}`;
    }
    case "ai/llm_call_started":
      return `${event.provider} · ${event.model}${event.stream ? " · streaming" : ""}`;
    case "ai/llm_call_delta":
      return `${event.textDelta.length.toLocaleString()} chars streamed`;
    case "ai/llm_call_completed": {
      const u = event.usage;
      const parts = [`LLM wall ${Math.round(event.durationMs)}\u202fms`];
      if (u?.inputTokens != null) {
        parts.push(`in ${u.inputTokens}`);
      }
      if (u?.outputTokens != null) {
        parts.push(`out ${u.outputTokens}`);
      }
      if (event.stopReason) {
        parts.push(event.stopReason);
      }
      return parts.join(" · ");
    }
    case "ai/model_thinking_summary":
      return `${event.summary.length.toLocaleString()} chars summary`;
    case "ai/tool_proposed":
      return `tool ${event.toolId}`;
    case "ai/session_attach_started":
      return event.reason;
    case "ai/session_attach_failed": {
      const err =
        event.error.length > 96 ? `${event.error.slice(0, 96)}…` : event.error;
      return `${event.reason} — ${err}`;
    }
    case "ai/session_attach_succeeded":
      return event.reason;
    case "ai/tool_policy_decision":
      return `${event.toolId} · ${event.riskLevel}`;
    case "ai/tool_confirm_required":
      return event.toolId;
    case "ai/tool_started":
      return event.toolId;
    case "ai/tool_result":
      return `${event.toolId} · ${event.ok ? "ok" : "fail"} · ${Math.round(event.durationMs)}\u202fms`;
    case "ai/final_answer_ready":
      return `${event.answer.length.toLocaleString()} chars answer`;
    default:
      return null;
  }
}

/** Full dev stack with Bitstream-capable AI lane (`package.json`). */
const DEV_FULL_STACK_NPM_COMMAND = "npm run start:with-bitstream-mcp";

function parseBaudRateText(raw: string): number {
  const t = raw.trim();
  if (!t) {
    return 921600;
  }
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 921600;
}

export function SensorStudioAssistantPanel(props: SensorStudioAssistantPanelProps) {
  const {
    borderColor,
    panelBackgroundColor,
    layoutMode,
    onLayoutModeChange,
    onRequestClose,
    boundsRef,
    onOpenSystemDiagnostics,
  } = props;

  const layoutModeRef = useRef(layoutMode);
  layoutModeRef.current = layoutMode;

  const {
    wsUrl,
    connected,
    send,
    traceRows,
    bridgeErrors,
    activeRequestId,
    liveAnswer,
    finalAnswer,
    submitPrompt,
    clearTraceTimeline,
    clearBridgeErrors,
    clearOutboundLog,
    bitstreamMcpAttachAvailable,
  } = useAiBridgeClient();

  const canStartAssistantServiceFromExtension = isVsCodeExtensionWebview();
  const extensionBridgeStatus = useAiBridgeExtensionHostStatus(canStartAssistantServiceFromExtension);

  const bitstreamWsUrl = useBitstreamConfigStore((s) => s.wsUrl);
  const bitstreamSerialPath = useBitstreamConfigStore((s) => s.serialPath);
  const bitstreamBaudRateText = useBitstreamConfigStore((s) => s.baudRateText);

  const [anthropicKeyRevision, setAnthropicKeyRevision] = useState(0);
  useEffect(() => {
    const bump = () => setAnthropicKeyRevision((r) => r + 1);
    window.addEventListener(ANTHROPIC_API_KEY_CHANGED_EVENT, bump);
    return () => window.removeEventListener(ANTHROPIC_API_KEY_CHANGED_EVENT, bump);
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>(() => readPersistedAssistantTranscript());
  /** Assistant reply shown alone, filling the scroll region between alerts and composer (parent panel). */
  const [expandedAssistantMessageId, setExpandedAssistantMessageId] = useState<string | null>(null);
  /** Inspect verbatim merged assistant text for a bubble (markdown exact copy fed into the renderer). */
  const [assistantRawReplyDialog, setAssistantRawReplyDialog] = useState<{
    messageId: string;
    content: string;
  } | null>(null);
  const [draft, setDraft] = useState("");
  const [composerFontPx, setComposerFontPx] = useState(readStoredComposerFontPx);
  const [devTrace, setDevTrace] = useState(false);
  const [enableMcpTools, setEnableMcpTools] = useState(false);
  const [autoConfirmRiskyTools, setAutoConfirmRiskyTools] = useState(false);
  const [assistantRenderMarkdown, setAssistantRenderMarkdown] = useState(true);
  const [assistantHtmlFencePreview, setAssistantHtmlFencePreview] = useState(true);
  const [assistantCodeSyntaxHighlight, setAssistantCodeSyntaxHighlight] = useState(true);
  const [advancedWindowOpen, setAdvancedWindowOpen] = useState(false);
  const [debugTraceWindowOpen, setDebugTraceWindowOpen] = useState(false);
  const [assistantMenuOpen, setAssistantMenuOpen] = useState(false);
  const assistantMenuRef = useRef<HTMLDivElement | null>(null);
  const [debugTraceSyntaxThemeId, setDebugTraceSyntaxThemeId] = useState<TRNHighlightedJsonSyntaxThemeId>(
    TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID,
  );
  const [debugTraceThemeMenuOpen, setDebugTraceThemeMenuOpen] = useState(false);
  const debugTraceThemeMenuRef = useRef<HTMLDivElement | null>(null);
  const [debugTraceHeaderMode, setDebugTraceHeaderMode] = useState<DebugTraceHeaderMode>("detail");
  const [assistantServiceStartPending, setAssistantServiceStartPending] = useState(false);
  const [devCommandCopied, setDevCommandCopied] = useState(false);
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Timeline keeps every `ai/tool_confirm_required`; hide rows once we've ACKed (server consumes token once). */
  const [ackedConfirmKeys, setAckedConfirmKeys] = useState<Record<string, true>>({});
  const sentConfirmGuardRef = useRef<Set<string>>(new Set());

  /** Short-lived banner when a risky MCP tool is confirmed (manual or auto). */
  const [riskyToolNotice, setRiskyToolNotice] = useState<{ toolId: string; token: number } | null>(null);
  const [riskyToolNoticeVisible, setRiskyToolNoticeVisible] = useState(false);
  const riskyNoticeTimersRef = useRef<{ hold?: number; fadeOut?: number }>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const debugTraceScrollRef = useRef<HTMLDivElement | null>(null);
  const prevTraceRowCountRef = useRef(0);

  const htmlPreviewDeliveryMode = useHtmlPreviewDeliveryStore((s) => s.deliveryMode);
  const setHtmlPreviewDeliveryMode = useHtmlPreviewDeliveryStore((s) => s.setDeliveryMode);
  const htmlPreviewSandboxAllowScripts = useHtmlPreviewDeliveryStore((s) => s.htmlPreviewSandboxAllowScripts);
  const setHtmlPreviewSandboxAllowScripts = useHtmlPreviewDeliveryStore((s) => s.setHtmlPreviewSandboxAllowScripts);

  const copyDevFullStackCommand = useCallback(async () => {
    const ok = await writeClipboardText(DEV_FULL_STACK_NPM_COMMAND);
    if (!ok) {
      return;
    }
    if (copyFeedbackTimerRef.current) {
      clearTimeout(copyFeedbackTimerRef.current);
    }
    setDevCommandCopied(true);
    copyFeedbackTimerRef.current = setTimeout(() => {
      setDevCommandCopied(false);
      copyFeedbackTimerRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const restartExtensionAiBridgeWithBitstream = useCallback(() => {
    const baud = parseBaudRateText(bitstreamBaudRateText);
    postAiBridgeStopThenStartWithBitstreamLane({
      t3dWsClientUrl: bitstreamWsUrl,
      serialPath: bitstreamSerialPath.trim(),
      baudRate: baud,
      mode: "data",
      autoDetectPort: true,
    });
  }, [bitstreamBaudRateText, bitstreamSerialPath, bitstreamWsUrl]);

  const requestStartAiAssistantService = useCallback(() => {
    setAssistantServiceStartPending(true);
    postAiBridgeStartFromExtension();
  }, []);

  useEffect(() => {
    if (connected && assistantServiceStartPending) {
      setAssistantServiceStartPending(false);
    }
  }, [assistantServiceStartPending, connected]);

  useEffect(() => {
    if (expandedAssistantMessageId == null) {
      return;
    }
    const stillHere = messages.some((m) => m.id === expandedAssistantMessageId && m.role === "assistant");
    if (!stillHere) {
      setExpandedAssistantMessageId(null);
    }
  }, [messages, expandedAssistantMessageId]);

  useEffect(() => {
    if (expandedAssistantMessageId == null) {
      return;
    }
    const onWindowKeyDown = (e: Event) => {
      if (!(e instanceof globalThis.KeyboardEvent)) {
        return;
      }
      if (e.key === "Escape") {
        setExpandedAssistantMessageId(null);
      }
    };
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [expandedAssistantMessageId]);

  useEffect(() => {
    if (!assistantServiceStartPending) {
      return;
    }
    const t = window.setTimeout(() => setAssistantServiceStartPending(false), 35_000);
    return () => window.clearTimeout(t);
  }, [assistantServiceStartPending]);

  useEffect(() => {
    try {
      setEnableMcpTools(window.localStorage?.getItem(ENABLE_MCP_TOOLS_KEY) === "1");
      setAutoConfirmRiskyTools(window.localStorage?.getItem(AUTO_CONFIRM_RISKY_TOOLS_KEY) === "1");
      setAssistantRenderMarkdown(window.localStorage?.getItem(ASSISTANT_RENDER_MARKDOWN_KEY) !== "0");
      setAssistantHtmlFencePreview(window.localStorage?.getItem(ASSISTANT_HTML_FENCE_PREVIEW_KEY) !== "0");
      setAssistantCodeSyntaxHighlight(window.localStorage?.getItem(ASSISTANT_CODE_SYNTAX_HIGHLIGHT_KEY) !== "0");
      const themeRaw = window.localStorage?.getItem(DEBUG_TRACE_JSON_THEME_KEY);
      if (themeRaw != null && isTrnHighlightedJsonSyntaxThemeId(themeRaw)) {
        setDebugTraceSyntaxThemeId(themeRaw);
      }
      setDebugTraceHeaderMode(parseDebugTraceHeaderMode(window.localStorage?.getItem(DEBUG_TRACE_HEADER_MODE_KEY)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage?.setItem(ENABLE_MCP_TOOLS_KEY, enableMcpTools ? "1" : "0");
    } catch {
      // ignore
    }
  }, [enableMcpTools]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(AUTO_CONFIRM_RISKY_TOOLS_KEY, autoConfirmRiskyTools ? "1" : "0");
    } catch {
      // ignore
    }
  }, [autoConfirmRiskyTools]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(DEBUG_TRACE_JSON_THEME_KEY, debugTraceSyntaxThemeId);
    } catch {
      // ignore
    }
  }, [debugTraceSyntaxThemeId]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(DEBUG_TRACE_HEADER_MODE_KEY, debugTraceHeaderMode);
    } catch {
      // ignore
    }
  }, [debugTraceHeaderMode]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(ASSISTANT_RENDER_MARKDOWN_KEY, assistantRenderMarkdown ? "1" : "0");
    } catch {
      // ignore
    }
  }, [assistantRenderMarkdown]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(ASSISTANT_HTML_FENCE_PREVIEW_KEY, assistantHtmlFencePreview ? "1" : "0");
    } catch {
      // ignore
    }
  }, [assistantHtmlFencePreview]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(ASSISTANT_CODE_SYNTAX_HIGHLIGHT_KEY, assistantCodeSyntaxHighlight ? "1" : "0");
    } catch {
      // ignore
    }
  }, [assistantCodeSyntaxHighlight]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(ASSISTANT_COMPOSER_FONT_PX_KEY, String(composerFontPx));
    } catch {
      // ignore
    }
  }, [composerFontPx]);

  useEffect(() => {
    if (enableMcpTools && bitstreamMcpAttachAvailable === false) {
      setAdvancedWindowOpen(true);
    }
  }, [enableMcpTools, bitstreamMcpAttachAvailable]);

  useEffect(() => {
    if (!assistantMenuOpen) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const el = assistantMenuRef.current;
      if (el != null && !el.contains(e.target as Node)) {
        setAssistantMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [assistantMenuOpen]);

  useEffect(() => {
    if (!debugTraceThemeMenuOpen) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const el = debugTraceThemeMenuRef.current;
      if (el != null && !el.contains(e.target as Node)) {
        setDebugTraceThemeMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [debugTraceThemeMenuOpen]);

  useEffect(() => {
    setAckedConfirmKeys({});
    sentConfirmGuardRef.current.clear();
  }, [activeRequestId]);

  useEffect(() => {
    return () => {
      const r = riskyNoticeTimersRef.current;
      if (r.hold != null) {
        window.clearTimeout(r.hold);
      }
      if (r.fadeOut != null) {
        window.clearTimeout(r.fadeOut);
      }
    };
  }, []);

  /** True while the bridge is working on the current request (no final body yet). */
  const awaitingCompletion = activeRequestId != null && finalAnswer == null;

  const [assistantTurnStartedAtMs, setAssistantTurnStartedAtMs] = useState<number | null>(null);
  const [assistantTypingElapsedMs, setAssistantTypingElapsedMs] = useState(0);

  useEffect(() => {
    if (activeRequestId != null) {
      setAssistantTurnStartedAtMs(Date.now());
    } else {
      setAssistantTurnStartedAtMs(null);
    }
  }, [activeRequestId]);

  useEffect(() => {
    const typingPhase = awaitingCompletion && liveAnswer.length === 0 && finalAnswer == null;
    if (!typingPhase || assistantTurnStartedAtMs == null) {
      return;
    }
    const start = assistantTurnStartedAtMs;
    const tick = () => setAssistantTypingElapsedMs(Date.now() - start);
    tick();
    const id = window.setInterval(tick, 200);
    return () => clearInterval(id);
  }, [awaitingCompletion, liveAnswer, finalAnswer, assistantTurnStartedAtMs]);

  const anthropicKeyConfigured = useMemo(
    () => getStoredAnthropicApiKey().trim().length > 0,
    [anthropicKeyRevision],
  );

  /** Latest bridge error that looks like key/account rejection (401, expired, etc.). */
  const anthropicBridgeAuthIssueMessage = useMemo(() => {
    const re =
      /anthropic|api\s*key|invalid.{0,64}key|authentication|401|unauthoriz|expired|credential|permission denied|forbidden/i;
    for (let i = bridgeErrors.length - 1; i >= 0; i--) {
      const err = bridgeErrors[i]?.error;
      if (typeof err === "string" && re.test(err)) {
        return err;
      }
    }
    return null;
  }, [bridgeErrors]);

  /** Ordering / deltas for Debug trace (wall clock ISO UTC + timings vs prev row vs request start). */
  const debugTracePresentationRows = useMemo(() => {
    const requestFirstAtMs = new Map<string, number>();
    for (const row of traceRows) {
      if (!requestFirstAtMs.has(row.requestId)) {
        requestFirstAtMs.set(row.requestId, row.event.atMs);
      }
    }
    return traceRows.map((row, idx) => {
      const atMs = row.event.atMs;
      const prevAtMs = idx > 0 ? traceRows[idx - 1]!.event.atMs : undefined;
      const deltaSincePrevMs = prevAtMs != null ? atMs - prevAtMs : undefined;
      const reqStart = requestFirstAtMs.get(row.requestId) ?? atMs;
      const deltaSinceRequestStartMs = atMs - reqStart;
      return {
        row,
        idx,
        seq: idx + 1,
        isoUtc: formatTraceWallClockIsoUtc(atMs),
        deltaSincePrevMs,
        deltaSinceRequestStartMs,
        caption: traceEventCaption(row.event),
      };
    });
  }, [traceRows]);

  /** Follow the live trace: smooth-scroll when new rows append (after layout). */
  useEffect(() => {
    const len = traceRows.length;
    const prev = prevTraceRowCountRef.current;
    prevTraceRowCountRef.current = len;
    if (len <= prev) {
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = debugTraceScrollRef.current;
        if (el == null || !el.isConnected) {
          return;
        }
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    });
  }, [traceRows.length]);

  const pendingConfirms = useMemo(() => {
    const out: Array<{ requestId: string; confirmToken: string; toolId: string; warning: string }> =
      [];
    for (const row of traceRows) {
      if (row.event.kind === "ai/tool_confirm_required") {
        const key = confirmAckKey(row.requestId, row.event.confirmToken);
        if (ackedConfirmKeys[key]) {
          continue;
        }
        out.push({
          requestId: row.requestId,
          confirmToken: row.event.confirmToken,
          toolId: row.event.toolId,
          warning: row.event.userFacingWarning,
        });
      }
    }
    return out;
  }, [traceRows, ackedConfirmKeys]);

  const fireToolConfirm = useCallback(
    (requestId: string, confirmToken: string) => {
      const ak = getStoredAnthropicApiKey().trim();
      send({
        type: "ai/tool_confirm",
        requestId,
        confirmToken,
        ...(ak.length > 0 ? { anthropicApiKey: ak } : {}),
      });
    },
    [send],
  );

  const RISKY_NOTICE_TRANSITION_MS = 300;
  const RISKY_NOTICE_HOLD_MS = 1000;

  const flashRiskyToolNotice = useCallback((toolId: string) => {
    const r = riskyNoticeTimersRef.current;
    if (r.hold != null) {
      window.clearTimeout(r.hold);
    }
    if (r.fadeOut != null) {
      window.clearTimeout(r.fadeOut);
    }
    r.hold = undefined;
    r.fadeOut = undefined;

    setRiskyToolNotice({ toolId, token: Date.now() });
    setRiskyToolNoticeVisible(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRiskyToolNoticeVisible(true);
      });
    });

    r.hold = window.setTimeout(() => {
      setRiskyToolNoticeVisible(false);
      r.fadeOut = window.setTimeout(() => {
        setRiskyToolNotice(null);
        r.fadeOut = undefined;
      }, RISKY_NOTICE_TRANSITION_MS);
      r.hold = undefined;
    }, RISKY_NOTICE_TRANSITION_MS + RISKY_NOTICE_HOLD_MS);
  }, []);

  useEffect(() => {
    if (!autoConfirmRiskyTools || !connected || !enableMcpTools) {
      return;
    }
    const additions: Record<string, true> = {};
    let lastConfirmedToolId: string | undefined;
    for (const row of traceRows) {
      if (row.event.kind !== "ai/tool_confirm_required") {
        continue;
      }
      const key = confirmAckKey(row.requestId, row.event.confirmToken);
      if (ackedConfirmKeys[key] || sentConfirmGuardRef.current.has(key)) {
        continue;
      }
      sentConfirmGuardRef.current.add(key);
      additions[key] = true;
      fireToolConfirm(row.requestId, row.event.confirmToken);
      lastConfirmedToolId = row.event.toolId;
    }
    if (Object.keys(additions).length > 0) {
      setAckedConfirmKeys((prev) => ({ ...prev, ...additions }));
      if (lastConfirmedToolId != null) {
        flashRiskyToolNotice(lastConfirmedToolId);
      }
    }
  }, [
    ackedConfirmKeys,
    autoConfirmRiskyTools,
    connected,
    enableMcpTools,
    fireToolConfirm,
    flashRiskyToolNotice,
    traceRows,
  ]);

  /** Keep the streaming assistant bubble in sync with the bridge hook. */
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const last = prev[prev.length - 1];
      if (last.role !== "assistant") {
        return prev;
      }
      const nextContent = finalAnswer ?? liveAnswer ?? "";
      // After reload, bridge text is empty until the next request — do not wipe restored transcript.
      if (nextContent === "" && last.content.length > 0 && !awaitingCompletion) {
        return prev;
      }
      if (last.content === nextContent) {
        return prev;
      }
      const next = [...prev];
      next[prev.length - 1] = { ...last, content: nextContent };
      return next;
    });
  }, [liveAnswer, finalAnswer, awaitingCompletion]);

  useEffect(() => {
    writePersistedAssistantTranscript(messages);
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, liveAnswer, finalAnswer, riskyToolNotice, riskyToolNoticeVisible]);

  const onSend = useCallback(() => {
    const text = draft.trim();
    if (text.length === 0 || !connected || awaitingCompletion) {
      return;
    }
    clearTraceTimeline();
    clearBridgeErrors();
    clearOutboundLog();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: crypto.randomUUID(), role: "assistant", content: "" },
    ]);
    setDraft("");
    submitPrompt(text, {
      devTrace,
      includeThinkingSummary: false,
      enableMcpTools,
    });
  }, [
    awaitingCompletion,
    clearBridgeErrors,
    clearOutboundLog,
    clearTraceTimeline,
    connected,
    devTrace,
    draft,
    enableMcpTools,
    submitPrompt,
  ]);

  const onComposerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend],
  );

  /**
   * Chrome applies Ctrl/⌘+wheel **page zoom** using default-passive semantics that often run
   * **before** element listeners see a cancelable event. Register **`window`** `wheel` in
   * **capture** with **`{ passive: false }`**, then **`preventDefault` + `stopPropagation`** once we
   * handle the gesture inside the assistant shell (message list, markdown, composer, chrome).
   */
  const assistantFloatingShellRef = useRef<HTMLDivElement | null>(null);
  const assistantDockedShellRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let attached = false;

    const onWindowWheelCapture = (ev: Event) => {
      const e = ev as globalThis.WheelEvent;
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      const t = e.target;
      if (!(t instanceof Node)) {
        return;
      }
      const mode = layoutModeRef.current;
      const panelEl =
        mode === "floating"
          ? assistantFloatingShellRef.current
          : assistantDockedShellRef.current;
      if (panelEl == null || !panelEl.contains(t)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (composerTextAreaRef.current != null && composerTextAreaRef.current.contains(t)) {
        const delta = e.deltaY > 0 ? -1 : 1;
        setComposerFontPx((prev) => clampComposerFontPx(prev + delta));
        return;
      }

      const { zoomIn, zoomOut } = useTrnMarkdownZoomStore.getState();
      if (e.deltaY > 0) {
        zoomOut();
      } else if (e.deltaY < 0) {
        zoomIn();
      }
    };

    const tryAttach = () => {
      if (cancelled || attached) {
        return;
      }
      const mode = layoutModeRef.current;
      const panelEl =
        mode === "floating"
          ? assistantFloatingShellRef.current
          : assistantDockedShellRef.current;
      if (panelEl == null) {
        rafId = requestAnimationFrame(tryAttach);
        return;
      }
      window.addEventListener("wheel", onWindowWheelCapture, { passive: false, capture: true });
      attached = true;
    };

    tryAttach();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (attached) {
        window.removeEventListener("wheel", onWindowWheelCapture, { capture: true });
      }
    };
  }, []);

  const replyThreadZoomPct = useTrnMarkdownZoomStore((s) => s.zoomPct);

  const clearChat = useCallback(() => {
    setAssistantRawReplyDialog(null);
    setExpandedAssistantMessageId(null);
    setMessages([]);
  }, []);

  const expandedAssistantMessage =
    expandedAssistantMessageId != null
      ? (messages.find((m) => m.id === expandedAssistantMessageId && m.role === "assistant") ?? null)
      : null;

  const assistantConnectionStatus = (
    <TRNTooltip
      placement="bottom-end"
      openDelayMs={120}
      disableHoverFx
      triggerAriaLabel={
        connected
          ? "Assistant online — technical connection details"
          : "Assistant offline — technical connection details"
      }
      triggerClassName="rounded-md px-1.5 py-0.5 text-zinc-400 hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-zinc-500/50"
      panelClassName="max-w-[min(20rem,calc(100vw-2rem))]"
      content={
        <div className="flex flex-col gap-2">
          <TRNHintText tone="muted" className="text-zinc-200">
            {connected ? (
              <>
                Your assistant is linked to the <strong className="font-semibold text-zinc-100">local AI service</strong>{" "}
                on your machine. Chat (and optional device tools when enabled) use that link.
              </>
            ) : (
              <>
                No link to the <strong className="font-semibold text-zinc-100">local AI assistant service</strong>. Start
                it from VS Code or your terminal (see project docs), then this panel should connect automatically when the
                address matches.
              </>
            )}
          </TRNHintText>
          <TRNHintText tone="muted" className="m-0 font-mono text-[10px] text-zinc-500">
            Service address (technical):{" "}
            <span className="break-all text-zinc-400">{wsUrl}</span>
          </TRNHintText>
        </div>
      }
      trigger={
        <span className="inline-flex items-center gap-2">
          <span className="relative flex h-3 w-3 shrink-0 items-center justify-center" aria-hidden>
            <span
              className={
                connected
                  ? "absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-emerald-400/45"
                  : "absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-rose-400/40"
              }
            />
            <span
              className={
                connected
                  ? "relative block h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)] motion-safe:animate-pulse"
                  : "relative block h-2 w-2 shrink-0 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.45)] motion-safe:animate-pulse"
              }
            />
          </span>
          <span
            className={
              connected ? "text-[11px] font-medium text-emerald-200/95" : "text-[11px] font-medium text-rose-200/90"
            }
          >
            {connected ? "Online" : "Offline"}
          </span>
        </span>
      }
    />
  );

  const sendDisabled = !connected || awaitingCompletion || draft.trim().length === 0;

  const advancedSettingsBody = (
    <div className="flex flex-col gap-2">
      <TRNInlineToggleRow
        label="Dev trace"
        hint="Verbose protocol events (see Debug trace window)."
        checked={devTrace}
        onCheckedChange={setDevTrace}
        className="border-zinc-700/60 bg-zinc-950/50"
      />
      <TRNInlineToggleRow
        label="Bitstream MCP tools"
        hint="Device control (risky operations require confirmation unless Always allow is on)."
        checked={enableMcpTools}
        onCheckedChange={setEnableMcpTools}
        className="border-zinc-700/60 bg-zinc-950/50"
      />
      <TRNInlineToggleRow
        label="Always allow risky tools"
        hint="Skip the orange confirmation step for Bitstream MCP tools (saved on this machine). Turn off for explicit Confirm each time."
        checked={autoConfirmRiskyTools}
        onCheckedChange={setAutoConfirmRiskyTools}
        disabled={!enableMcpTools}
        className="border-zinc-700/60 bg-zinc-950/50"
      />
      <TRNMenuSectionTitle spacing="settingsInset">Reply display</TRNMenuSectionTitle>
      <TRNInlineToggleRow
        label="Render Markdown"
        hint="When off, assistant replies show as plain monospace text (same payload as Raw). Markdown zoom shortcuts apply only when this is on."
        checked={assistantRenderMarkdown}
        onCheckedChange={setAssistantRenderMarkdown}
        className="border-zinc-700/60 bg-zinc-950/50"
      />
      <TRNInlineToggleRow
        label="HTML fenced preview"
        hint="When Markdown is on: Preview/Source tabs and sandbox iframe for ```html``` blocks. Off keeps HTML fences as highlighted code only."
        checked={assistantHtmlFencePreview}
        onCheckedChange={setAssistantHtmlFencePreview}
        disabled={!assistantRenderMarkdown}
        className="border-zinc-700/60 bg-zinc-950/50"
      />
      <TRNInlineToggleRow
        label="Allow JavaScript and popups in HTML preview"
        hint="Off (default): sandbox disables scripts — many charts look broken vs a real browser. On: JavaScript and window.open popups run inside the isolated iframe (model-generated HTML is still untrusted; prefer static/SVG or Open in browser when unsure)."
        checked={htmlPreviewSandboxAllowScripts}
        onCheckedChange={setHtmlPreviewSandboxAllowScripts}
        disabled={!assistantRenderMarkdown || !assistantHtmlFencePreview}
        className="border-zinc-700/60 bg-zinc-950/50"
      />
      <TRNInlineToggleRow
        label="Syntax-highlight fenced code"
        hint="When Markdown is on: colorized ``` fences (Prism). Turn off for plain monospace blocks."
        checked={assistantCodeSyntaxHighlight}
        onCheckedChange={setAssistantCodeSyntaxHighlight}
        disabled={!assistantRenderMarkdown}
        className="border-zinc-700/60 bg-zinc-950/50"
      />
      <TRNHintText className="px-0.5">
        Each send clears the debug trace and bridge-error buffer for that run so logs stay isolated.
      </TRNHintText>
    </div>
  );

  const debugTraceHeaderToolbar = (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-zinc-700/70 bg-zinc-950/55 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <TRNIconButton
        icon={<AlignJustify className="h-3.5 w-3.5 opacity-90" strokeWidth={2.25} aria-hidden />}
        label="Simplified trace headers — one compact line per event"
        aria-pressed={debugTraceHeaderMode === "simplified"}
        className={
          debugTraceHeaderMode === "simplified"
            ? "h-6 w-6 border-cyan-600/55 bg-cyan-950/50 text-cyan-50 shadow-[0_0_12px_-4px_rgba(34,211,238,0.4)]"
            : "h-6 w-6 border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
        }
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setDebugTraceHeaderMode("simplified")}
      />
      <TRNIconButton
        icon={<ListTree className="h-3.5 w-3.5 opacity-90" strokeWidth={2.25} aria-hidden />}
        label="Detailed trace headers — full UTC timestamps and deltas"
        aria-pressed={debugTraceHeaderMode === "detail"}
        className={
          debugTraceHeaderMode === "detail"
            ? "h-6 w-6 border-cyan-600/55 bg-cyan-950/50 text-cyan-50 shadow-[0_0_12px_-4px_rgba(34,211,238,0.4)]"
            : "h-6 w-6 border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
        }
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setDebugTraceHeaderMode("detail")}
      />
    </div>
  );

  const debugTraceThemeMenu = (
    <div ref={debugTraceThemeMenuRef} className="relative flex shrink-0 items-center">
      <TRNIconButton
        icon={<Menu className="h-3.5 w-3.5" strokeWidth={2.25} />}
        label="Debug trace menu — layout mode and JSON highlight theme"
        className="h-6 w-6 shrink-0 border-zinc-700/80 bg-zinc-900/75 hover:bg-zinc-800/75"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setDebugTraceThemeMenuOpen((v) => !v)}
      />
      {debugTraceThemeMenuOpen ? (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-[min(16rem,calc(100vw-1rem))] overflow-visible">
          <TRNMenuPanel tone="glass-dropdown">
            <div className="flex min-w-0 flex-col gap-1">
              <TRNMenuSectionTitle spacing="menuFirst">Trace header</TRNMenuSectionTitle>
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="menuitem"
                icon={<AlignJustify className="h-3.5 w-3.5 opacity-85" aria-hidden />}
                label="Simplified"
                rightSlot={
                  debugTraceHeaderMode === "simplified" ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
                  ) : null
                }
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setDebugTraceHeaderMode("simplified");
                  setDebugTraceThemeMenuOpen(false);
                }}
              />
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="menuitem"
                icon={<ListTree className="h-3.5 w-3.5 opacity-85" aria-hidden />}
                label="Detail"
                rightSlot={
                  debugTraceHeaderMode === "detail" ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
                  ) : null
                }
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setDebugTraceHeaderMode("detail");
                  setDebugTraceThemeMenuOpen(false);
                }}
              />
              <TRNMenuSectionTitle spacing="menuNext">JSON highlight</TRNMenuSectionTitle>
              {TRN_HIGHLIGHTED_JSON_SYNTAX_THEME_OPTIONS.map((opt) => (
                <TRNMenuItemButton
                  key={opt.id}
                  tone="glass-dropdown"
                  role="menuitem"
                  label={opt.label}
                  rightSlot={
                    debugTraceSyntaxThemeId === opt.id ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
                    ) : null
                  }
                  onClick={() => {
                    setDebugTraceSyntaxThemeId(opt.id);
                    setDebugTraceThemeMenuOpen(false);
                  }}
                />
              ))}
            </div>
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );

  const debugTraceBody = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={debugTraceScrollRef}
        className="min-h-[min(400px,50vh)] flex-1 overflow-y-auto rounded-md border border-white/8 bg-black/25 px-2 py-2 scrollbar-dark-micro"
      >
        {traceRows.length === 0 ? (
          <span className="text-[11px] leading-snug text-zinc-600">
            No events yet — enable Dev trace in Advanced settings and send a message.
          </span>
        ) : (
          <div className="flex flex-col gap-4">
            {debugTracePresentationRows.map(
              ({ row, idx, seq, isoUtc, deltaSincePrevMs, deltaSinceRequestStartMs, caption }) => (
                <div key={`${row.requestId}-${idx}`} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                  {debugTraceHeaderMode === "simplified" ? (
                    <div className="mb-2 rounded-lg border border-zinc-700/55 bg-zinc-950/55 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] leading-snug">
                        <span className="text-[12px] font-bold tracking-tight text-zinc-500">
                          #{seq}
                        </span>
                        <span className="font-mono text-[12px] font-semibold text-sky-100/95">{row.event.kind}</span>
                        {deltaSincePrevMs != null ? (
                          <span className="font-mono text-[11px] text-amber-200/88">
                            Δprev&nbsp;{formatSignedRoundedMs(deltaSincePrevMs)}
                          </span>
                        ) : null}
                        <span className="font-mono text-[11px] text-emerald-200/88">
                          Δreq&nbsp;{formatSignedRoundedMs(deltaSinceRequestStartMs)}
                        </span>
                        {caption != null ? (
                          <span className="min-w-0 flex-[1_1_220px] text-[11px] leading-snug text-zinc-400">
                            {caption}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2.5 flex flex-col gap-2 rounded-lg border border-white/7 bg-black/30 px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[11px] font-bold tracking-tight text-zinc-400">
                          #{seq}
                        </span>
                        <span className="rounded-md border border-sky-500/30 bg-sky-950/40 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-sky-100/95">
                          {row.event.kind}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400" title={row.requestId}>
                          req&nbsp;{row.requestId.slice(0, 8)}…
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] leading-none">
                        <span className="text-zinc-200/95" title="Bridge event time (UTC, ISO-8601)">
                          {isoUtc}
                        </span>
                        {deltaSincePrevMs != null ? (
                          <span
                            className="text-amber-200/90"
                            title="Milliseconds since the previous event on this timeline"
                          >
                            Δprev&nbsp;{formatSignedRoundedMs(deltaSincePrevMs)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">Δprev —</span>
                        )}
                        <span
                          className="text-emerald-200/90"
                          title="Milliseconds since the first event for this request id"
                        >
                          Δreq&nbsp;{formatSignedRoundedMs(deltaSinceRequestStartMs)}
                        </span>
                      </div>
                      {caption != null ? (
                        <div className="border-t border-white/6 pt-2 text-[11px] leading-relaxed text-zinc-300/95">
                          {caption}
                        </div>
                      ) : null}
                    </div>
                  )}
                  <TRNHighlightedJsonBlock
                    value={JSON.stringify(row.event, null, 2)}
                    syntaxThemeId={debugTraceSyntaxThemeId}
                    className="border-zinc-700/55 bg-black/40"
                  />
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );

  const assistantToolsMenu = (
    <div ref={assistantMenuRef} className="relative flex shrink-0 items-center">
      <TRNIconButton
        icon={<Menu className="h-3.5 w-3.5" strokeWidth={2.25} />}
        label="Assistant tools menu"
        className="h-6 w-6 shrink-0 border-zinc-700/80 bg-zinc-900/75 hover:bg-zinc-800/75"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setAssistantMenuOpen((v) => !v)}
      />
      {assistantMenuOpen ? (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-[min(16rem,calc(100vw-1rem))] overflow-visible">
          {/* Same section layout as BitstreamHeaderMenuPanel → TRNMenuPanel glass-dropdown. */}
          <TRNMenuPanel tone="glass-dropdown">
            <div className="flex min-w-0 flex-col gap-1">
              <TRNMenuSectionTitle spacing="menuFirst">Assistant tools</TRNMenuSectionTitle>
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="menuitem"
                icon={<Settings2 className="h-3.5 w-3.5 opacity-85" aria-hidden />}
                label="Advanced settings"
                onClick={() => {
                  setAdvancedWindowOpen(true);
                  setAssistantMenuOpen(false);
                }}
              />
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="menuitem"
                icon={<ScrollText className="h-3.5 w-3.5 opacity-85" aria-hidden />}
                label="Debug trace"
                onClick={() => {
                  setDebugTraceWindowOpen(true);
                  setAssistantMenuOpen(false);
                }}
              />
              {onOpenSystemDiagnostics != null ? (
                <TRNMenuItemButton
                  tone="glass-dropdown"
                  role="menuitem"
                  icon={<Activity className="h-3.5 w-3.5 opacity-85" aria-hidden />}
                  label="Diagnostics & runtime services"
                  title="Bitstream serial broker, transport, AI bridge host, model broker reachability"
                  onClick={() => {
                    onOpenSystemDiagnostics();
                    setAssistantMenuOpen(false);
                  }}
                />
              ) : null}
              <TRNMenuSectionTitle spacing="menuNext">HTML code preview</TRNMenuSectionTitle>
              {HTML_PREVIEW_DELIVERY_MODES.map((mode) => (
                <TRNMenuItemButton
                  key={mode}
                  tone="glass-dropdown"
                  role="menuitem"
                  icon={
                    <Check
                      className={
                        htmlPreviewDeliveryMode === mode
                          ? "h-3.5 w-3.5 text-emerald-400/95"
                          : "h-3.5 w-3.5 text-transparent"
                      }
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  }
                  label={HTML_PREVIEW_DELIVERY_LABELS[mode].title}
                  title={HTML_PREVIEW_DELIVERY_LABELS[mode].hint}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setHtmlPreviewDeliveryMode(mode);
                    setAssistantMenuOpen(false);
                  }}
                />
              ))}
              <TRNMenuSectionTitle spacing="menuNext">Reply text zoom</TRNMenuSectionTitle>
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="menuitem"
                icon={<ZoomIn className="h-3.5 w-3.5 opacity-85" aria-hidden />}
                label="Zoom in"
                title="Ctrl++ or ⌘++ · Also Ctrl/⌘ + scroll over the message list or a reply"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  useTrnMarkdownZoomStore.getState().zoomIn();
                  setAssistantMenuOpen(false);
                }}
              />
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="menuitem"
                icon={<ZoomOut className="h-3.5 w-3.5 opacity-85" aria-hidden />}
                label="Zoom out"
                title="Ctrl+- or ⌘+-"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  useTrnMarkdownZoomStore.getState().zoomOut();
                  setAssistantMenuOpen(false);
                }}
              />
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="menuitem"
                icon={<RotateCcw className="h-3.5 w-3.5 opacity-85" aria-hidden />}
                label="Reset zoom"
                title="Ctrl+0 or ⌘+0"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  useTrnMarkdownZoomStore.getState().reset();
                  setAssistantMenuOpen(false);
                }}
              />
            </div>
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );

  const renderAssistantMarkdownBody = useCallback(
    (
      markdown: string,
      htmlFenceGenerationMayStillStream: boolean,
      extra?: { scrollbars?: "none" | "dark-micro"; className?: string },
    ) => {
      const md = markdown.length > 0 ? markdown : "_…_";
      if (!assistantRenderMarkdown) {
        const pre = (
          <pre className="scrollbar-dark-micro m-0 max-h-none min-h-0 whitespace-pre-wrap wrap-break-word rounded border border-zinc-700/55 bg-black/35 p-2 font-mono text-[12px] leading-relaxed text-zinc-200">
            {md}
          </pre>
        );
        if (extra?.className != null && extra.className.length > 0) {
          return <div className={extra.className}>{pre}</div>;
        }
        return pre;
      }
      return (
        <TRNMarkdownRenderer
          markdown={md}
          tone="neutral"
          enableZoom={false}
          enableCodeCopy={true}
          enableSyntaxHighlight={assistantCodeSyntaxHighlight}
          enableHtmlPreview={assistantHtmlFencePreview}
          htmlFenceGenerationMayStillStream={htmlFenceGenerationMayStillStream}
          scrollbars={extra?.scrollbars ?? "none"}
          className={extra?.className}
        />
      );
    },
    [assistantCodeSyntaxHighlight, assistantHtmlFencePreview, assistantRenderMarkdown],
  );

  const chatColumn = (
    <div className="flex h-full w-full min-h-0 flex-1 flex-col basis-0">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden basis-0">
      {!anthropicKeyConfigured ? (
        <div
          className="shrink-0 rounded-lg border border-rose-500/35 bg-rose-950/25 px-3 py-2.5 text-[11px] leading-snug text-rose-50/95"
          role="alert"
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/90" aria-hidden />
            <div className="min-w-0">
              <p className="font-medium text-rose-50/95">No Claude API key saved here yet</p>
              <p className="mt-1 text-rose-100/85">
                Add your Anthropic API key so the assistant can reach Claude through the local bridge.
              </p>
              <p className="mt-2">
                <TRNHintText tone="warn" className="text-[11px] leading-snug">
                  Open the Bitstream menu (☰ in the toolbar) → Assistant AI settings.
                </TRNHintText>
              </p>
            </div>
          </div>
        </div>
      ) : anthropicBridgeAuthIssueMessage != null ? (
        <div
          className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2.5 text-[11px] leading-snug text-amber-100/95"
          role="alert"
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" aria-hidden />
            <div className="min-w-0">
              <p className="font-medium text-amber-50/95">Your API key or account was rejected</p>
              <p className="mt-1 text-amber-100/85">
                The service may return this when the key is invalid, expired, or the account cannot bill the request.
                Update the key from the Bitstream menu (☰) → Assistant AI settings, then try again.
              </p>
              <p className="mt-2 truncate font-mono text-[10px] text-amber-200/70" title={anthropicBridgeAuthIssueMessage}>
                {anthropicBridgeAuthIssueMessage}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {enableMcpTools && bitstreamMcpAttachAvailable === false ? (
        <div
          className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2.5 text-[11px] leading-snug text-amber-100/95"
          role="alert"
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" aria-hidden />
            <div className="min-w-0">
              <p className="font-medium text-amber-50/95">Device tools are not available yet</p>
              <p className="mt-1 text-amber-100/85">
                The assistant is connected, but it does not have a Bitstream session on your USB serial port. Tools that
                read or control the device need that session.
              </p>
              <p className="mt-2 font-semibold text-amber-50/95">What to do</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-amber-100/90">
                <li>
                  Plug in your board, then confirm the correct COM port and baud in this app&apos;s Bitstream / device
                  settings (same place you choose serial for telemetry).
                </li>
                {canStartAssistantServiceFromExtension ? (
                  <li>
                    Press <span className="font-semibold text-amber-50/95">Restart AI bridge (Bitstream)</span> below so
                    the extension starts the assistant service using those settings. Or use the Command Palette:{" "}
                    <span className="font-semibold text-amber-50/95">TERNION: Stop AI Bridge</span> then{" "}
                    <span className="font-semibold text-amber-50/95">TERNION: Start AI Bridge</span>.
                  </li>
                ) : (
                  <li>
                    From the repository folder, run the full dev stack in a terminal so the AI bridge can attach to
                    serial (see Development details below). This browser preview cannot start that for you.
                  </li>
                )}
                <li>
                  If you only want chat without hardware, turn off{" "}
                  <span className="font-semibold text-amber-50/95">Bitstream MCP tools</span> under Advanced.
                </li>
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-500/20 pt-3">
                {canStartAssistantServiceFromExtension ? (
                  <TRNButton
                    type="button"
                    size="compact"
                    className="gap-1.5 border-cyan-800/45 bg-cyan-950/35 hover:bg-cyan-900/35"
                    title="Restart the AI bridge via the extension using your Bitstream serial settings (same as AI Bridge Settings)."
                    onClick={restartExtensionAiBridgeWithBitstream}
                  >
                    <Play className="h-3.5 w-3.5 shrink-0 text-cyan-200/90" strokeWidth={2.25} aria-hidden />
                    <span className="text-[11px] font-semibold text-cyan-100/95">
                      Restart AI bridge (Bitstream)
                    </span>
                  </TRNButton>
                ) : null}
              </div>
              {/* npm/docs block is for browser/Vite dev only — VS Code webview users rely on Restart + palette commands. */}
              {!canStartAssistantServiceFromExtension ? (
                <details className="mt-2 rounded border border-amber-500/25 bg-black/25 px-2 py-1.5 text-[10px] text-amber-100/80">
                  <summary className="cursor-pointer list-none font-medium text-amber-200/85 marker:content-none [&::-webkit-details-marker]:hidden">
                    Development — why this happens (npm, ports, docs)
                  </summary>
                  <div className="mt-2 space-y-2 border-t border-amber-500/15 pt-2 text-amber-100/75">
                    <p>
                      The bridge may be running in a &quot;no Bitstream attach&quot; mode (same idea as{" "}
                      <kbd className="rounded bg-black/30 px-1 font-mono">--no-bitstream</kbd> /{" "}
                      <kbd className="rounded bg-black/30 px-1 font-mono">npm run ai:bridge:no-serial</kbd>). A typical{" "}
                      <kbd className="rounded bg-black/30 px-1 font-mono">npm start</kbd> dev stack uses that lane so the
                      serial broker stays free — sensor MCP tools need a bridge started{" "}
                      <span className="italic">with</span> attach.
                    </p>
                    <p>
                      One terminal command for broker + dev + attach-capable AI bridge:{" "}
                      <kbd className="rounded bg-black/30 px-1 font-mono">npm run start:with-bitstream-mcp</kbd> — set{" "}
                      <kbd className="rounded bg-black/30 px-1 font-mono">BITSTREAM_SERIAL_PATH</kbd> or{" "}
                      <kbd className="rounded bg-black/30 px-1 font-mono">--path=YOUR_COM</kbd>. If something else already
                      listens on port 9987, stop it first. See{" "}
                      <span className="font-mono text-[10px]">src/ai/README.md</span> and{" "}
                      <span className="font-mono text-[10px]">docs/DEVELOPMENT_COMMANDS.md</span>; use another{" "}
                      <kbd className="rounded bg-black/30 px-1 font-mono">AI_BRIDGE_PORT</kbd> if two bridges share one PC.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <TRNButton
                        type="button"
                        size="compact"
                        className="gap-1.5 border-amber-600/40 bg-amber-950/40 hover:bg-amber-900/30"
                        title={`Copy: ${DEV_FULL_STACK_NPM_COMMAND}`}
                        onClick={() => void copyDevFullStackCommand()}
                      >
                        <ClipboardCopy className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                        <span className="text-[11px] font-medium">Copy dev command</span>
                      </TRNButton>
                      {devCommandCopied ? (
                        <span className="text-[10px] text-emerald-300/90">Copied to clipboard.</span>
                      ) : null}
                    </div>
                    <p className="text-amber-100/65">
                      Copy is for engineers pasting into a terminal at the repo root; the panel cannot run{" "}
                      <kbd className="rounded bg-black/30 px-1 font-mono">npm</kbd> directly.
                    </p>
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Message thread — bubbles scroll together; risky-tool toast uses same lane as assistant */}
      <div
        ref={scrollRef}
        className={
          expandedAssistantMessage != null
            ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800/80 bg-black/25 px-2 py-3"
            : "min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-800/80 bg-black/25 px-2 py-3 scrollbar-dark-micro"
        }
        title="Ctrl+scroll or ⌘+scroll to zoom reply text (same as A− / A+ in the header)"
      >
        <div
          className={
            expandedAssistantMessage != null
              ? "flex min-h-0 min-w-0 flex-1 flex-col gap-2"
              : "min-w-0 space-y-3"
          }
          style={{ zoom: replyThreadZoomPct / 100 }}
        >
        {!connected ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-3 px-3 py-2 text-center">
            {canStartAssistantServiceFromExtension ? (
              <div className="w-full max-w-md rounded-lg border border-zinc-800/70 bg-black/30 px-3 py-2.5 text-left shadow-inner">
                <div className="text-[11px] font-semibold text-zinc-200">Assistant service is not connected</div>
                <p className="mt-1 text-[10px] leading-snug text-zinc-500">
                  In the VS Code extension you can start the local assistant with one click — no terminal commands
                  required.
                </p>
                {extensionBridgeStatus?.running && extensionBridgeStatus.externalProcess ? (
                  <p className="mt-2 text-[10px] leading-snug text-amber-200/90">
                    The assistant port is already in use by another process. If this panel still does not connect, check
                    the pairing token and Anthropic key (☰ menu).
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TRNButton
                    type="button"
                    size="compact"
                    className="gap-1.5 border-cyan-800/50 bg-cyan-950/35 px-2.5 hover:bg-cyan-900/35 disabled:opacity-60"
                    disabled={assistantServiceStartPending}
                    title="Start the AI assistant service via the extension"
                    onClick={requestStartAiAssistantService}
                  >
                    {assistantServiceStartPending ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-200/90" aria-hidden />
                    ) : (
                      <Play className="h-3.5 w-3.5 shrink-0 text-cyan-200/90" strokeWidth={2.25} aria-hidden />
                    )}
                    <span className="text-[11px] font-semibold text-cyan-100/95">
                      {assistantServiceStartPending ? "Starting…" : "Start assistant service"}
                    </span>
                  </TRNButton>
                  {extensionBridgeStatus?.running && extensionBridgeStatus.port != null ? (
                    <span className="text-[10px] text-zinc-600">
                      Host reports port <span className="font-mono">{extensionBridgeStatus.port}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            <p
              className="text-[12px] font-medium text-zinc-200"
              title={`Technical (troubleshooting): assistant link closed — ${wsUrl}`}
            >
              Assistant is offline
            </p>
            <p className="max-w-sm text-[11px] leading-snug text-zinc-500">
              {canStartAssistantServiceFromExtension
                ? "This panel talks to the local assistant on your machine. Start it above when needed, then wait a moment—we’ll reconnect automatically."
                : "Start the assistant service from your project (see the repo docs / dev scripts), reload if needed, and this chat will connect."}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
            <MessageSquareText className="h-10 w-10 text-zinc-600" aria-hidden />
            <p className="text-[13px] font-medium text-zinc-300">Bitstream Assistant</p>
            <p className="max-w-sm text-[11px] leading-relaxed text-zinc-500">
              Ask about firmware, the node graph, or Bitstream. Press{" "}
              <kbd className="rounded border border-zinc-600 bg-zinc-900 px-1 font-mono text-[10px]">Enter</kbd>{" "}
              to send,{" "}
              <kbd className="rounded border border-zinc-600 bg-zinc-900 px-1 font-mono text-[10px]">
                Shift+Enter
              </kbd>{" "}
              for a new line.
            </p>
            <p className="max-w-sm text-[10px] leading-snug text-zinc-600">
              Reply text size: use <span className="text-zinc-500">A−</span> / <span className="text-zinc-500">A+</span>{" "}
              in the header or ☰ → Reply text zoom, or hold Ctrl/⌘ and scroll anywhere in this message list (including
              empty padding).
            </p>
          </div>
        ) : expandedAssistantMessage != null ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800/70 pb-2">
              <p className="m-0 max-w-[min(100%,28rem)] text-[11px] leading-snug text-zinc-500">
                Expanded reply · fills this assistant message area above the composer. Press{" "}
                <kbd className="rounded border border-zinc-700 bg-zinc-950 px-1 font-mono text-[10px] text-zinc-400">
                  Esc
                </kbd>{" "}
                or Restore to show the full thread again.
              </p>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <TRNButton
                  type="button"
                  size="compact"
                  className="gap-1 border-zinc-600/45 bg-zinc-900/80 hover:bg-zinc-800/80"
                  title="Verbatim merged assistant text for this reply"
                  onClick={() =>
                    setAssistantRawReplyDialog({
                      messageId: expandedAssistantMessage.id,
                      content: expandedAssistantMessage.content,
                    })
                  }
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  <span className="text-[11px] font-medium">Raw</span>
                </TRNButton>
                <TRNButton
                  type="button"
                  size="compact"
                  className="gap-1 border-zinc-600/45 bg-zinc-900/80 hover:bg-zinc-800/80"
                  title="Show all messages again"
                  onClick={() => setExpandedAssistantMessageId(null)}
                >
                  <Minimize2 className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  <span className="text-[11px] font-medium">Restore thread</span>
                </TRNButton>
              </div>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/50 px-3 py-2">
              {renderAssistantMarkdownBody(
                expandedAssistantMessage.content.length > 0 ? expandedAssistantMessage.content : "_…_",
                awaitingCompletion &&
                  messages.length > 0 &&
                  messages[messages.length - 1]?.role === "assistant" &&
                  messages[messages.length - 1]?.id === expandedAssistantMessage.id,
                {
                  scrollbars: "dark-micro",
                  className: "min-h-0 flex-1 overflow-y-auto text-[13px] leading-relaxed",
                },
              )}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === "user";
            const isLastAssistant =
              m.role === "assistant" && idx === messages.length - 1 && awaitingCompletion;
            const showTyping =
              isLastAssistant && m.content.length === 0 && liveAnswer.length === 0 && finalAnswer == null;
            const canExpandAssistantBubble =
              !isUser && !showTyping && m.role === "assistant" && m.content.trim().length > 0;

            return (
              <div
                key={m.id}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    isUser
                      ? "max-w-[min(100%,85%)] rounded-2xl rounded-br-md border border-cyan-700/35 bg-cyan-950/40 px-3 py-2 text-[13px] leading-relaxed text-zinc-100"
                      : "relative w-full rounded-2xl rounded-bl-md border border-zinc-700/60 bg-zinc-900/50 px-3 py-2 text-[13px] leading-relaxed text-zinc-100"
                  }
                >
                  {canExpandAssistantBubble ? (
                    <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 flex flex-row-reverse items-center gap-1">
                      <TRNIconButton
                        icon={<Maximize2 className="h-3.5 w-3.5 opacity-90" strokeWidth={2.25} aria-hidden />}
                        label="Expand reply — fills assistant panel above composer"
                        className="pointer-events-auto h-7 w-7 border-zinc-700/70 bg-zinc-950/70 text-zinc-400 hover:bg-zinc-800/85 hover:text-zinc-100"
                        title="Expand reply to fill this assistant panel area"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setExpandedAssistantMessageId(m.id)}
                      />
                      <TRNIconButton
                        icon={<FileText className="h-3.5 w-3.5 opacity-90" strokeWidth={2.25} aria-hidden />}
                        label="View raw assistant reply — exact merged markdown or text for this bubble"
                        className="pointer-events-auto h-7 w-7 border-zinc-700/70 bg-zinc-950/70 text-zinc-400 hover:bg-zinc-800/85 hover:text-zinc-100"
                        title="Raw reply — verbatim text the UI received for this message"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() =>
                          setAssistantRawReplyDialog({
                            messageId: m.id,
                            content: m.content,
                          })
                        }
                      />
                    </div>
                  ) : null}
                  <div className={canExpandAssistantBubble ? "pr-2 pt-7" : undefined}>
                    {isUser ? (
                      <p className="m-0 whitespace-pre-wrap wrap-break-word">{m.content}</p>
                    ) : showTyping ? (
                      <AssistantTypingPlaceholder elapsedMs={assistantTypingElapsedMs} />
                    ) : (
                      renderAssistantMarkdownBody(
                        m.content.length > 0 ? m.content : "_…_",
                        m.role === "assistant" && idx === messages.length - 1 && awaitingCompletion,
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {riskyToolNotice != null ? (
          <div className="flex w-full justify-start">
            <div
              key={riskyToolNotice.token}
              role="status"
              aria-live="polite"
              className={
                "pointer-events-none w-full rounded-2xl rounded-bl-md border px-3 py-2 text-[13px] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[opacity,transform] duration-300 ease-out " +
                "border-amber-600/40 bg-amber-950/45 text-zinc-100 " +
                (riskyToolNoticeVisible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0")
              }
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/95" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[13px] font-medium leading-snug text-amber-50/95">Risky tool running</p>
                  <p className="mt-1 font-mono text-[12px] leading-snug text-amber-100/90">{riskyToolNotice.toolId}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </div>

      {pendingConfirms.length > 0 ? (
        <div className="shrink-0 rounded-lg border border-amber-500/35 bg-amber-950/25 p-2">
          <div className="text-xs font-semibold text-amber-100">Confirm tool</div>
          <div className="mt-2 flex flex-col gap-2">
            {pendingConfirms.map((c) => (
              <div
                key={`${c.requestId}:${c.confirmToken}`}
                className="flex items-start justify-between gap-2 rounded border border-amber-500/25 bg-black/20 p-2"
              >
                <div className="min-w-0 text-[11px] text-amber-50/95">
                  <span className="font-mono">{c.toolId}</span>
                  <div className="mt-1 text-amber-100/85">{c.warning}</div>
                </div>
                <TRNButton
                  size="compact"
                  className="border-amber-600/60 bg-amber-950/40 hover:bg-amber-900/35"
                  onClick={() => {
                    const key = confirmAckKey(c.requestId, c.confirmToken);
                    if (!connected || sentConfirmGuardRef.current.has(key)) {
                      return;
                    }
                    sentConfirmGuardRef.current.add(key);
                    setAckedConfirmKeys((prev) => ({ ...prev, [key]: true }));
                    fireToolConfirm(c.requestId, c.confirmToken);
                    flashRiskyToolNotice(c.toolId);
                  }}
                >
                  Confirm
                </TRNButton>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {bridgeErrors.length > 0 ? (
        <div className="shrink-0 rounded-lg border border-rose-500/35 bg-rose-950/20 p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-rose-100/95">Bridge errors ({bridgeErrors.length})</div>
            <TRNButton
              type="button"
              size="compact"
              className="border-rose-600/50 bg-rose-950/35 hover:bg-rose-900/30"
              title="Clear stored bridge error rows"
              onClick={() => clearBridgeErrors()}
            >
              Clear
            </TRNButton>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-rose-100/70">
            Protocol or validation errors from the local AI bridge (not model timeline events).
          </p>
          <div className="mt-2 flex max-h-28 flex-col gap-2 overflow-y-auto scrollbar-dark-micro">
            {bridgeErrors.map((err, idx) => (
              <TRNHighlightedJsonBlock
                key={`${err.atMs}-${idx}-${err.requestId ?? "none"}`}
                value={JSON.stringify(
                  {
                    type: "ai/error",
                    requestId: err.requestId,
                    error: err.error,
                    receivedAtMs: err.atMs,
                  },
                  null,
                  2,
                )}
                className="border-rose-500/20 bg-black/35"
              />
            ))}
          </div>
        </div>
      ) : null}
      </div>

      {/* Composer — sibling below flex-1 thread block so it stays at the bottom of the panel. */}
      <div className="shrink-0 rounded-xl border border-zinc-700/80 bg-zinc-950/60 p-2">
        <div className="relative min-h-[44px]">
          <textarea
            ref={composerTextAreaRef}
            className="max-h-36 min-h-[44px] w-full resize-none rounded-lg border border-zinc-700/80 bg-black/40 px-3 py-2 pr-12 pb-10 text-zinc-100 outline-none ring-cyan-500/30 placeholder:text-zinc-600 focus:border-cyan-600/50 focus:ring-1"
            style={{ borderColor, fontSize: `${composerFontPx}px` }}
            title="Ctrl+scroll or ⌘+scroll to change text size"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder={connected ? "Message… (Enter to send, Shift+Enter newline)" : "Connect the bridge to chat…"}
            disabled={!connected || awaitingCompletion}
            aria-label="Assistant message"
            aria-busy={awaitingCompletion}
          />
          <TRNIconButton
            icon={<Send className="h-4 w-4 text-cyan-200/95" strokeWidth={2.25} aria-hidden />}
            label={!connected ? "Connect the AI bridge" : awaitingCompletion ? "Wait for the reply" : "Send message"}
            disabled={sendDisabled}
            className={
              "pointer-events-auto absolute bottom-3.5 right-3 z-10 h-9! w-9! shrink-0 rounded-lg border border-cyan-600/50 " +
              "bg-cyan-950/85 text-cyan-50 shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-sm hover:bg-cyan-900/55 " +
              "disabled:border-zinc-700 disabled:bg-zinc-900/90 disabled:text-zinc-600 disabled:shadow-none"
            }
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => void onSend()}
          />
        </div>
      </div>

    </div>
  );

  const assistantSatelliteWindows = (
    <>
      <TRNMessageDialog
        open={assistantRawReplyDialog != null}
        onOpenChange={(open) => {
          if (!open) {
            setAssistantRawReplyDialog(null);
          }
        }}
        title="Raw assistant reply"
        variant="info"
        prefixIcon={<FileText className="h-4 w-4 text-sky-400" strokeWidth={2.25} aria-hidden />}
        zIndex={74}
        primaryAction={{
          label: "Close",
          onClick: () => {},
        }}
      >
        {assistantRawReplyDialog != null ? (
          <>
            <p className="m-0 text-[11px] leading-snug text-zinc-400">
              Character length (UTF-16 code units):{" "}
              <span className="font-medium text-zinc-300">
                {assistantRawReplyDialog.content.length.toLocaleString()}
              </span>
              . This string is what the panel merges from the bridge for this bubble and passes into the markdown
              renderer — useful for truncated fences, missing closing tags, or invisible characters.
            </p>
            <pre
              key={assistantRawReplyDialog.messageId}
              className="scrollbar-dark-micro mt-2 max-h-[min(52vh,360px)] overflow-auto whitespace-pre-wrap wrap-break-word rounded border border-zinc-700/70 bg-black/55 p-2 font-mono text-[11px] leading-snug text-zinc-200"
            >
              {assistantRawReplyDialog.content.length === 0 ? (
                <span className="text-zinc-500">(empty)</span>
              ) : (
                assistantRawReplyDialog.content
              )}
            </pre>
            <div className="flex flex-wrap gap-2 pt-2">
              <TRNButton
                type="button"
                size="compact"
                className="gap-1.5 border-zinc-600/45 bg-zinc-900/75 hover:bg-zinc-800/75"
                title="Copy entire raw reply"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => void writeClipboardText(assistantRawReplyDialog.content)}
              >
                <ClipboardCopy className="h-3.5 w-3.5 opacity-90" aria-hidden />
                Copy all
              </TRNButton>
            </div>
          </>
        ) : null}
      </TRNMessageDialog>
      <TRNWindow
        open={advancedWindowOpen}
        title="Advanced settings"
        prefixIcon={<Settings2 className="h-3.5 w-3.5 text-cyan-400/90" aria-hidden />}
        onClose={() => setAdvancedWindowOpen(false)}
        boundsRef={boundsRef}
        initialRect={{ x: 72, y: 88, width: 400, height: 340 }}
        minWidth={320}
        minHeight={260}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.72}
        modal={false}
        zIndex={50}
        showFooter={false}
        persistRectStorageKey="sensor-studio:assistant:advanced-settings"
        glass
        glassPreset="soft"
        contentClassName="scrollbar-dark-micro flex max-h-[min(72vh,620px)] flex-col overflow-hidden bg-black/50 p-3 pt-2"
      >
        {advancedSettingsBody}
      </TRNWindow>
      <TRNWindow
        open={debugTraceWindowOpen}
        title={`Debug trace (${traceRows.length})`}
        prefixIcon={<ScrollText className="h-3.5 w-3.5 text-cyan-400/90" aria-hidden />}
        onClose={() => setDebugTraceWindowOpen(false)}
        boundsRef={boundsRef}
        initialRect={{ x: 96, y: 120, width: 460, height: 420 }}
        minWidth={340}
        minHeight={280}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.75}
        modal={false}
        zIndex={43}
        showFooter={false}
        persistRectStorageKey="sensor-studio:assistant:debug-trace"
        glass
        glassPreset="medium"
        headerActions={
          <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
            {debugTraceHeaderToolbar}
            {debugTraceThemeMenu}
          </div>
        }
        contentClassName="scrollbar-dark-micro flex max-h-[min(75vh,680px)] min-h-[200px] flex-col overflow-hidden bg-black/45 p-3 pt-2"
      >
        {debugTraceBody}
      </TRNWindow>
    </>
  );

  if (layoutMode === "floating") {
    return (
      <>
      <TRNWindow
        open
        title="Bitstream Assistant"
        prefixIcon={<MessageSquareText className="h-3.5 w-3.5 text-cyan-400/90" aria-hidden />}
        onClose={onRequestClose}
        boundsRef={boundsRef}
        initialRect={{ x: 40, y: 40, width: 420, height: 560 }}
        minWidth={360}
        minHeight={320}
        heightMode="fixed"
        modal={false}
        zIndex={38}
        showFooter={false}
        showExpandFullWidth
        showExpandFullHeight
        persistRectStorageKey="sensor-studio:assistant:window"
        glass
        glassPreset="medium"
        shellRef={assistantFloatingShellRef}
        contentClassName="scrollbar-dark-micro flex h-full min-h-0 flex-1 flex-col basis-0 overflow-hidden bg-black/45 p-3 pt-2"
        contentStyle={{ flex: "1 1 0%", minHeight: 0 }}
        headerActions={
          <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
            {assistantConnectionStatus}
            <TRNMarkdownZoomControls />
            {messages.length > 0 ? (
              <TRNButton
                type="button"
                size="compact"
                title="Clear conversation"
                className="border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => clearChat()}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </TRNButton>
            ) : null}
            {assistantToolsMenu}
            <TRNButton
              type="button"
              size="compact"
              title="Dock assistant to the bottom of the workspace"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                onLayoutModeChange("docked");
              }}
            >
              <span className="inline-flex items-center gap-1">
                <PanelBottom className="h-3.5 w-3.5" aria-hidden />
                Dock
              </span>
            </TRNButton>
          </div>
        }
      >
        {chatColumn}
      </TRNWindow>
      {assistantSatelliteWindows}
      </>
    );
  }

  return (
    <>
    <div
      ref={assistantDockedShellRef}
      className="flex min-h-0 max-h-[min(48vh,560px)] shrink-0 flex-col gap-2 overflow-hidden border-t px-3 py-2 text-zinc-100 backdrop-blur-sm"
      style={{
        borderColor,
        backgroundColor: panelBackgroundColor,
      }}
    >
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquareText className="h-4 w-4 shrink-0 text-cyan-400/90" aria-hidden />
          <span className="text-sm font-semibold text-zinc-100">Bitstream Assistant</span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {assistantConnectionStatus}
          <TRNMarkdownZoomControls />
          {messages.length > 0 ? (
            <TRNButton
              type="button"
              size="compact"
              title="Clear conversation"
              className="border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              onClick={() => clearChat()}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </TRNButton>
          ) : null}
          {assistantToolsMenu}
          <TRNButton
            type="button"
            size="compact"
            title="Float assistant in a movable window"
            onClick={() => {
              onLayoutModeChange("floating");
            }}
          >
            Pop out
          </TRNButton>
        </div>
      </div>
      <div className="relative z-0 flex min-h-0 flex-1 flex-col">{chatColumn}</div>
    </div>
    {assistantSatelliteWindows}
    </>
  );
}

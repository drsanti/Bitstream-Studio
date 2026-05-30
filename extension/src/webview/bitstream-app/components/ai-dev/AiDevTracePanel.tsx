import { ClipboardCopy, Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AiBridgeEvent } from "../../../../ai/protocol/ai-bridge-protocol";
import { getStoredAnthropicApiKey } from "../../../ai-bridge/ai-bridge-webview-config";
import {
  useAiBridgeClient,
  type AiBridgeBridgeErrorRow,
  type AiBridgeOutboundRow,
  type AiBridgeTraceRow,
} from "../../../ai-bridge/useAiBridgeClient";
import {
  TRNDragHandle,
  TRNHighlightedJsonBlock,
  TRNInteractiveCard,
  TRNSortableContainer,
  TRNSortableItem,
} from "../../../ui/TRN";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNMarkdownRenderer } from "../../../ui/TRN/TRNMarkdownRenderer.js";

const SECTION_ORDER_KEY = "ternion.ai.devTrace.sectionOrder";
const SECTION_COLLAPSED_KEY = "ternion.ai.devTrace.sectionCollapsed";
const TIMELINE_ACTIVE_ONLY_KEY = "ternion.ai.devTrace.timelineActiveOnly";

const SECTION_IDS = ["prompt", "confirm", "answer", "bridgeErrors", "timeline"] as const;
type SectionId = (typeof SECTION_IDS)[number];

function isSectionId(id: string): id is SectionId {
  return (SECTION_IDS as readonly string[]).includes(id);
}

function normalizeSectionOrder(raw: unknown): SectionId[] {
  const base = [...SECTION_IDS];
  if (!Array.isArray(raw)) {
    return base;
  }
  const seen = new Set<SectionId>();
  const out: SectionId[] = [];
  for (const id of raw) {
    if (typeof id === "string" && isSectionId(id) && !seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  for (const id of base) {
    if (!seen.has(id)) {
      out.push(id);
    }
  }
  return out;
}

function loadSectionOrder(): SectionId[] {
  try {
    const raw = window.localStorage?.getItem(SECTION_ORDER_KEY);
    if (raw == null) {
      return [...SECTION_IDS];
    }
    return normalizeSectionOrder(JSON.parse(raw));
  } catch {
    return [...SECTION_IDS];
  }
}

function loadCollapsedMap(): Partial<Record<SectionId, boolean>> {
  try {
    const raw = window.localStorage?.getItem(SECTION_COLLAPSED_KEY);
    if (raw == null) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<Record<SectionId, boolean>> = {};
    for (const id of SECTION_IDS) {
      if (parsed[id] === true) {
        out[id] = true;
      }
    }
    return out;
  } catch {
    return {};
  }
}

type TraceRow = {
  requestId: string;
  event: AiBridgeEvent;
};

function toTraceRow(r: AiBridgeTraceRow): TraceRow {
  return r;
}

function confirmAckKey(requestId: string, confirmToken: string): string {
  return `${requestId}:${confirmToken}`;
}

type RequestPhase = "idle" | "running" | "awaiting_confirm" | "completed";

type ActiveRequestProgress = {
  phase: RequestPhase;
  /** Wall-clock start for the active request (from `ai/request_received` or earliest event). */
  startedAtMs: number | null;
  /** When `ai/final_answer_ready` arrived (active request only). */
  completedAtMs: number | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  /** Events recorded for this `requestId` (full trace may include older requests). */
  eventCountForRequest: number;
  lastModel?: string;
};

function fmtCompactTokens(n: number): string {
  if (n >= 10_000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(2)}k`;
  }
  return String(n);
}

function buildAiDevTraceExportPayload(params: {
  wsUrl: string;
  mode: "all" | "active_request";
  activeRequestId: string | null;
  rows: TraceRow[];
  bridgeErrors: AiBridgeBridgeErrorRow[];
  outboundRows: AiBridgeOutboundRow[];
}): Record<string, unknown> {
  const { wsUrl, mode, activeRequestId, rows, bridgeErrors, outboundRows } = params;
  const timeline =
    mode === "active_request" && activeRequestId != null
      ? rows.filter((r) => r.requestId === activeRequestId)
      : rows;
  const base: Record<string, unknown> = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    source: "ternion-t3d-extension-ai-dev-trace",
    wsUrl,
    filter:
      mode === "active_request" && activeRequestId != null
        ? { kind: "requestId", requestId: activeRequestId }
        : { kind: "full_timeline" },
    eventCount: timeline.length,
    timeline: timeline.map((r) => ({ requestId: r.requestId, event: r.event })),
  };
  if (bridgeErrors.length > 0) {
    base.bridgeErrors = bridgeErrors;
  }
  if (outboundRows.length > 0) {
    base.outboundSanitized = outboundRows;
  }
  return base;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadJsonFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function safeExportFilenamePart(iso: string): string {
  return iso.replace(/[:.]/g, "-");
}

const LARGE_JSON_CHAR_THRESHOLD = 3500;

function shouldCollapseTimelinePayload(kind: string, jsonCharLength: number): boolean {
  return kind === "ai/tool_result" || jsonCharLength > LARGE_JSON_CHAR_THRESHOLD;
}

function TimelineEventJsonBlock(props: { json: string; eventKind: string }) {
  const { json, eventKind } = props;
  const collapse = shouldCollapseTimelinePayload(eventKind, json.length);
  if (!collapse) {
    return <TRNHighlightedJsonBlock value={json} className="mt-1.5 max-h-[min(40vh,320px)]" />;
  }
  const kb = Math.max(1, Math.ceil(json.length / 1024));
  return (
    <details className="group mt-1.5 rounded border border-zinc-700/55 bg-black/20 open:border-cyan-500/30">
      <summary className="cursor-pointer list-none px-2 py-1.5 text-[10px] text-zinc-400 marker:content-none hover:text-zinc-200 [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-zinc-600 underline-offset-2 group-open:no-underline">
          Large payload — expand full JSON
        </span>
        <span className="ml-2 font-mono text-zinc-600">~{kb} KB</span>
      </summary>
      <div className="max-h-[min(55vh,480px)] overflow-auto px-1 pb-2">
        <TRNHighlightedJsonBlock value={json} className="border-zinc-700/70" />
      </div>
    </details>
  );
}

function formatElapsedMs(elapsedMs: number): string {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return "—";
  }
  if (elapsedMs < 60_000) {
    return `${(elapsedMs / 1000).toFixed(1)}s`;
  }
  const m = Math.floor(elapsedMs / 60_000);
  const s = Math.round((elapsedMs % 60_000) / 1000);
  return `${m}m ${s}s`;
}

function computeActiveRequestProgress(params: {
  activeRequestId: string | null;
  rows: TraceRow[];
  pendingConfirms: Array<{ requestId: string }>;
}): ActiveRequestProgress {
  const { activeRequestId, rows, pendingConfirms } = params;
  const empty: ActiveRequestProgress = {
    phase: "idle",
    startedAtMs: null,
    completedAtMs: null,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    eventCountForRequest: 0,
  };
  if (activeRequestId == null) {
    return empty;
  }

  const mine = rows.filter((r) => r.requestId === activeRequestId);
  const events = mine.map((r) => r.event);
  const received = events.find((e) => e.kind === "ai/request_received");
  const finalEv = events.find((e) => e.kind === "ai/final_answer_ready");

  let startedAtMs: number | null =
    received && "atMs" in received ? received.atMs : null;
  if (startedAtMs == null) {
    const withAt = events
      .filter((e): e is AiBridgeEvent & { atMs: number } => typeof (e as { atMs?: number }).atMs === "number")
      .map((e) => e.atMs);
    if (withAt.length > 0) {
      startedAtMs = Math.min(...withAt);
    }
  }

  const completedAtMs =
    finalEv && "atMs" in finalEv && typeof finalEv.atMs === "number" ? finalEv.atMs : null;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let lastModel: string | undefined;
  for (const e of events) {
    if (e.kind === "ai/llm_call_started") {
      lastModel = e.model;
    }
    if (e.kind === "ai/llm_call_completed") {
      const u = e.usage;
      if (typeof u?.inputTokens === "number") {
        totalInputTokens += u.inputTokens;
      }
      if (typeof u?.outputTokens === "number") {
        totalOutputTokens += u.outputTokens;
      }
    }
  }

  const needsConfirm = pendingConfirms.some((c) => c.requestId === activeRequestId);
  const isComplete = finalEv != null;

  let phase: RequestPhase;
  if (isComplete) {
    phase = "completed";
  } else if (needsConfirm) {
    phase = "awaiting_confirm";
  } else {
    phase = "running";
  }

  return {
    phase,
    startedAtMs,
    completedAtMs,
    totalInputTokens,
    totalOutputTokens,
    eventCountForRequest: mine.length,
    lastModel,
  };
}

function formatTimelineEventTime(atMs: number): string {
  try {
    return new Date(atMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return String(atMs);
  }
}

/** Short label for headers; full UUID in `title`. */
function shortRequestIdLabel(id: string): string {
  if (id.length <= 10) {
    return id;
  }
  return `${id.slice(0, 8)}…`;
}

/** One-line summary next to each timeline row (protocol already carries timing/tokens). */
function eventProgressSubtitle(event: AiBridgeEvent): string | null {
  if (event.kind === "ai/llm_call_started") {
    return event.model;
  }
  if (event.kind === "ai/llm_call_completed") {
    const parts: string[] = [formatElapsedMs(event.durationMs)];
    const u = event.usage;
    if (typeof u?.inputTokens === "number") {
      parts.push(`in ${fmtCompactTokens(u.inputTokens)}`);
    }
    if (typeof u?.outputTokens === "number") {
      parts.push(`out ${fmtCompactTokens(u.outputTokens)}`);
    }
    if (event.stopReason && event.stopReason.length > 0) {
      parts.push(event.stopReason);
    }
    return parts.join(" · ");
  }
  if (event.kind === "ai/tool_result") {
    const tail = event.ok ? "ok" : "failed";
    return `${tail} · ${formatElapsedMs(event.durationMs)}`;
  }
  if (event.kind === "ai/tool_started") {
    return event.toolId;
  }
  if (event.kind === "ai/tool_proposed") {
    return event.toolId;
  }
  return null;
}

function AnswerEmptyState(props: { connected: boolean; phase: RequestPhase }) {
  const { connected, phase } = props;
  if (!connected) {
    return (
      <div className="flex min-h-24 flex-col items-center justify-center gap-2 px-3 py-6 text-center">
        <p className="text-[11px] text-rose-200/90">WebSocket disconnected.</p>
        <p className="text-[10px] text-zinc-500">Connect the AI bridge, then send a prompt.</p>
      </div>
    );
  }
  if (phase === "awaiting_confirm") {
    return (
      <div className="flex min-h-24 flex-col items-center justify-center gap-2 px-3 py-6 text-center">
        <p className="text-[11px] text-amber-100/90">Waiting for tool confirmation.</p>
        <p className="text-[10px] text-zinc-500">Use the Tool confirmation card.</p>
      </div>
    );
  }
  if (phase === "running") {
    return (
      <div className="flex min-h-24 flex-col items-center justify-center gap-2 px-3 py-6 text-center">
        <Loader2 className="h-7 w-7 shrink-0 animate-spin text-cyan-400/85" aria-hidden />
        <p className="text-[11px] text-zinc-200">Generating answer…</p>
        <p className="text-[10px] text-zinc-500">Streaming text appears here; protocol events show in the timeline.</p>
      </div>
    );
  }
  if (phase === "completed") {
    return (
      <div className="flex min-h-24 flex-col items-center justify-center px-3 py-6 text-center">
        <p className="text-[11px] text-zinc-400">No assistant text for this request.</p>
      </div>
    );
  }
  return (
    <div className="flex min-h-24 flex-col items-center justify-center px-3 py-6 text-center">
      <p className="text-[11px] text-zinc-400">No answer yet.</p>
      <p className="text-[10px] text-zinc-500">Enter a prompt above and choose Send.</p>
    </div>
  );
}

function RequestProgressTrailing(props: {
  progress: ActiveRequestProgress;
  elapsedLabel: string;
  compact?: boolean;
}) {
  const { progress, elapsedLabel, compact } = props;
  const { phase, totalInputTokens, totalOutputTokens, eventCountForRequest, lastModel } = progress;

  const phaseUi = (() => {
    switch (phase) {
      case "idle":
        return (
          <span className="rounded border border-zinc-600/80 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            Idle
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/35 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200/95">
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
            In progress
          </span>
        );
      case "awaiting_confirm":
        return (
          <span className="rounded border border-amber-500/40 bg-amber-950/35 px-1.5 py-0.5 text-[10px] font-medium text-amber-100/95">
            Needs confirm
          </span>
        );
      case "completed":
        return (
          <span className="rounded border border-zinc-600/80 bg-zinc-900/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
            Done
          </span>
        );
      default: {
        const _x: never = phase;
        return _x;
      }
    }
  })();

  const tok =
    totalInputTokens > 0 || totalOutputTokens > 0
      ? `in ${fmtCompactTokens(totalInputTokens)} · out ${fmtCompactTokens(totalOutputTokens)}`
      : null;

  if (compact) {
    return (
      <div className="flex max-w-[min(100%,18rem)] flex-col items-end gap-0.5 text-right">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {phaseUi}
          <span className="font-mono text-[10px] text-zinc-500">{elapsedLabel}</span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">
          {eventCountForRequest} evt{eventCountForRequest === 1 ? "" : "s"}
          {tok != null ? ` · ${tok}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="flex max-w-[min(100%,22rem)] flex-col items-end gap-0.5 text-right">
      <div className="flex flex-wrap items-center justify-end gap-1">
        {phaseUi}
        <span className="font-mono text-[10px] text-zinc-500" title="Wall time for this request">
          {elapsedLabel}
        </span>
      </div>
      <div className="font-mono text-[10px] leading-tight text-zinc-500">
        {tok != null ? <span>{tok}</span> : null}
        {tok != null && lastModel != null ? <span> · </span> : null}
        {lastModel != null ? <span title="Last model seen in stream">{lastModel}</span> : null}
        <span>
          {" "}
          · {eventCountForRequest} evt{eventCountForRequest === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export function AiDevTracePanel() {
  const {
    wsUrl,
    connected,
    send,
    traceRows: rawRows,
    bridgeErrors,
    outboundRows,
    activeRequestId,
    liveAnswer,
    finalAnswer,
    submitPrompt: submitRequest,
    clearTraceTimeline,
    clearBridgeErrors,
    clearOutboundLog,
  } = useAiBridgeClient();
  const rows = useMemo(() => rawRows.map(toTraceRow), [rawRows]);

  const [prompt, setPrompt] = useState("Health check");
  const [devTraceEnabled, setDevTraceEnabled] = useState(true);
  const [thinkingSummaryEnabled, setThinkingSummaryEnabled] = useState(true);
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(loadSectionOrder);
  const [collapsedMap, setCollapsedMap] =
    useState<Partial<Record<SectionId, boolean>>>(loadCollapsedMap);
  const [timelineActiveOnly, setTimelineActiveOnly] = useState(() => {
    try {
      return window.localStorage?.getItem(TIMELINE_ACTIVE_ONLY_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const raw = window.localStorage?.getItem("ternion.ai.devTrace.enabled");
      if (raw === "0") {
        setDevTraceEnabled(false);
      }
      const rawThinking = window.localStorage?.getItem("ternion.ai.devTrace.thinkingSummary");
      if (rawThinking === "0") {
        setThinkingSummaryEnabled(false);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage?.setItem("ternion.ai.devTrace.enabled", devTraceEnabled ? "1" : "0");
      window.localStorage?.setItem(
        "ternion.ai.devTrace.thinkingSummary",
        thinkingSummaryEnabled ? "1" : "0",
      );
    } catch {
      // ignore localStorage errors
    }
  }, [devTraceEnabled, thinkingSummaryEnabled]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(TIMELINE_ACTIVE_ONLY_KEY, timelineActiveOnly ? "1" : "0");
    } catch {
      // ignore
    }
  }, [timelineActiveOnly]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(SECTION_ORDER_KEY, JSON.stringify(sectionOrder));
    } catch {
      // ignore
    }
  }, [sectionOrder]);

  const setSectionCollapsed = useCallback((id: SectionId, collapsed: boolean) => {
    setCollapsedMap((prev) => {
      const next = { ...prev, [id]: collapsed };
      try {
        window.localStorage?.setItem(SECTION_COLLAPSED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const submitPrompt = useCallback(() => {
    clearTraceTimeline();
    clearBridgeErrors();
    clearOutboundLog();
    setTimelineActiveOnly(true);
    submitRequest(prompt, {
      devTrace: devTraceEnabled,
      includeThinkingSummary: devTraceEnabled && thinkingSummaryEnabled,
      enableMcpTools: true,
    });
  }, [
    clearBridgeErrors,
    clearOutboundLog,
    clearTraceTimeline,
    devTraceEnabled,
    prompt,
    submitRequest,
    thinkingSummaryEnabled,
  ]);

  const [ackedConfirmKeys, setAckedConfirmKeys] = useState<Record<string, true>>({});
  const sentConfirmGuardRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setAckedConfirmKeys({});
    sentConfirmGuardRef.current.clear();
  }, [activeRequestId]);

  const pendingConfirms = useMemo(() => {
    const out: Array<{ requestId: string; confirmToken: string; toolId: string; warning: string }> = [];
    for (const row of rows) {
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
  }, [rows, ackedConfirmKeys]);

  const timelineDisplayRows = useMemo(() => {
    if (!timelineActiveOnly) {
      return rows;
    }
    if (activeRequestId == null) {
      return [];
    }
    return rows.filter((r) => r.requestId === activeRequestId);
  }, [rows, timelineActiveOnly, activeRequestId]);

  const activeRequestProgress = useMemo(
    () => computeActiveRequestProgress({ activeRequestId, rows, pendingConfirms }),
    [activeRequestId, rows, pendingConfirms],
  );

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (
      activeRequestProgress.phase !== "running" &&
      activeRequestProgress.phase !== "awaiting_confirm"
    ) {
      return;
    }
    const id = window.setInterval(() => setNowTick(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [activeRequestProgress.phase]);

  const elapsedLabel = useMemo(() => {
    const { startedAtMs, completedAtMs, phase } = activeRequestProgress;
    if (startedAtMs == null) {
      return "—";
    }
    if (phase === "completed" && completedAtMs != null) {
      return formatElapsedMs(completedAtMs - startedAtMs);
    }
    if (phase === "running" || phase === "awaiting_confirm") {
      return formatElapsedMs(nowTick - startedAtMs);
    }
    return "—";
  }, [activeRequestProgress, nowTick]);

  const [exportHint, setExportHint] = useState<string | null>(null);
  const exportHintTimerRef = useRef<number | null>(null);

  const flashExportHint = useCallback((msg: string) => {
    setExportHint(msg);
    if (exportHintTimerRef.current != null) {
      window.clearTimeout(exportHintTimerRef.current);
    }
    exportHintTimerRef.current = window.setTimeout(() => {
      setExportHint(null);
      exportHintTimerRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (exportHintTimerRef.current != null) {
        window.clearTimeout(exportHintTimerRef.current);
      }
    };
  }, []);

  const stringifyExport = useCallback(
    (mode: "all" | "active_request") => {
      const payload = buildAiDevTraceExportPayload({
        wsUrl,
        mode,
        activeRequestId,
        rows,
        bridgeErrors,
        outboundRows,
      });
      return JSON.stringify(payload, null, 2);
    },
    [activeRequestId, bridgeErrors, outboundRows, rows, wsUrl],
  );

  const onExportCopy = useCallback(
    async (mode: "all" | "active_request") => {
      if (mode === "active_request" && activeRequestId == null) {
        flashExportHint("No active request to copy.");
        return;
      }
      const text = stringifyExport(mode);
      const ok = await copyTextToClipboard(text);
      flashExportHint(ok ? "Copied to clipboard." : "Copy failed — check permissions.");
    },
    [activeRequestId, flashExportHint, stringifyExport],
  );

  const onExportDownload = useCallback(
    (mode: "all" | "active_request") => {
      if (mode === "active_request" && activeRequestId == null) {
        flashExportHint("No active request to export.");
        return;
      }
      const text = stringifyExport(mode);
      const stamp = safeExportFilenamePart(new Date().toISOString());
      const suffix = mode === "active_request" && activeRequestId != null ? `req-${activeRequestId.slice(0, 8)}` : "full";
      downloadJsonFile(`ai-dev-trace-${suffix}-${stamp}.json`, text);
      flashExportHint("Download started.");
    },
    [activeRequestId, flashExportHint, stringifyExport],
  );

  const handleReorder = useCallback((nextIds: string[]) => {
    const normalized = normalizeSectionOrder(nextIds);
    setSectionOrder(normalized);
  }, []);

  const renderSection = (id: SectionId): ReactNode => {
    const collapsed = Boolean(collapsedMap[id]);
    const dragTitle = (
      <span className="inline-flex min-w-0 items-center gap-1">
        <TRNDragHandle className="shrink-0" />
        <span className="truncate">
          {id === "prompt" && "Prompt & bridge"}
          {id === "confirm" && "Tool confirmation"}
          {id === "answer" && "Answer"}
          {id === "bridgeErrors" && "Bridge errors"}
          {id === "timeline" && "Event timeline"}
        </span>
      </span>
    );

    switch (id) {
      case "prompt":
        return (
          <TRNInteractiveCard
            key={id}
            title={dragTitle}
            collapsible
            collapsed={collapsed}
            onCollapsedChange={(next) => setSectionCollapsed("prompt", next)}
            className="shrink-0"
            contentClassName="pt-0"
          >
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border border-zinc-700/80 bg-black/40 px-2 py-1 text-xs text-zinc-100 outline-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type a prompt…"
              />
              <TRNButton size="compact" onClick={submitPrompt} disabled={!connected}>
                Send
              </TRNButton>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-zinc-300">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={devTraceEnabled}
                  onChange={(e) => setDevTraceEnabled(e.target.checked)}
                />
                Dev trace
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={thinkingSummaryEnabled}
                  disabled={!devTraceEnabled}
                  onChange={(e) => setThinkingSummaryEnabled(e.target.checked)}
                />
                Model thinking summary (redacted)
              </label>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              Bridge: <span className="font-mono">{wsUrl}</span>
            </div>
            <p className="mt-2 text-[10px] leading-snug text-zinc-600">
              On Send: timeline and bridge-error rows are cleared, <span className="font-mono">Active request only</span>{" "}
              is turned on, and only this run&apos;s events accumulate — reduces mix-ups with earlier prompts.
            </p>
          </TRNInteractiveCard>
        );
      case "confirm":
        return (
          <TRNInteractiveCard
            key={id}
            title={dragTitle}
            collapsible
            collapsed={collapsed}
            onCollapsedChange={(next) => setSectionCollapsed("confirm", next)}
            className={
              pendingConfirms.length > 0
                ? "shrink-0 border-amber-500/35 bg-amber-950/15"
                : "shrink-0"
            }
            contentClassName="pt-0"
          >
            {pendingConfirms.length === 0 ? (
              <div className="text-[11px] text-zinc-500">No tool confirmations pending.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingConfirms.map((c) => (
                  <div
                    key={`${c.requestId}:${c.confirmToken}`}
                    className="rounded border border-amber-500/25 bg-black/25 p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-amber-50">
                          <span className="font-mono">{c.toolId}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-amber-100/80">{c.warning}</div>
                        {devTraceEnabled ? (
                          <div className="mt-1 text-[10px] text-amber-100/60">
                            token: <span className="font-mono">{c.confirmToken}</span>
                          </div>
                        ) : null}
                      </div>
                      <TRNButton
                        size="compact"
                        tone="warning"
                        onClick={() => {
                          const key = confirmAckKey(c.requestId, c.confirmToken);
                          if (!connected || sentConfirmGuardRef.current.has(key)) {
                            return;
                          }
                          sentConfirmGuardRef.current.add(key);
                          setAckedConfirmKeys((prev) => ({ ...prev, [key]: true }));
                          const ak = getStoredAnthropicApiKey().trim();
                          send({
                            type: "ai/tool_confirm",
                            requestId: c.requestId,
                            confirmToken: c.confirmToken,
                            ...(ak.length > 0 ? { anthropicApiKey: ak } : {}),
                          });
                        }}
                      >
                        Confirm
                      </TRNButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TRNInteractiveCard>
        );
      case "answer":
        return (
          <TRNInteractiveCard
            key={id}
            title={dragTitle}
            collapsible
            collapsed={collapsed}
            onCollapsedChange={(next) => setSectionCollapsed("answer", next)}
            className="shrink-0"
            titleTrailingSlot={
              <RequestProgressTrailing
                progress={activeRequestProgress}
                elapsedLabel={elapsedLabel}
              />
            }
            contentClassName="pt-0"
          >
            <div className="max-h-[38vh] min-h-28 overflow-auto scrollbar-dark-micro rounded border border-white/5 bg-black/25 p-2">
              {(finalAnswer ?? liveAnswer ?? "").trim().length > 0 ? (
                <TRNMarkdownRenderer
                  markdown={finalAnswer ?? liveAnswer ?? ""}
                  tone="neutral"
                  enableZoom={true}
                  enableCodeCopy={true}
                  enableSyntaxHighlight={true}
                />
              ) : (
                <AnswerEmptyState connected={connected} phase={activeRequestProgress.phase} />
              )}
            </div>
          </TRNInteractiveCard>
        );
      case "bridgeErrors":
        return (
          <TRNInteractiveCard
            key={id}
            title={dragTitle}
            collapsible
            collapsed={collapsed}
            onCollapsedChange={(next) => setSectionCollapsed("bridgeErrors", next)}
            className={
              bridgeErrors.length > 0 ? "shrink-0 border-rose-500/35 bg-rose-950/10" : "shrink-0"
            }
            contentClassName="pt-0"
          >
            {bridgeErrors.length === 0 ? (
              <div className="text-[11px] text-zinc-500">No bridge errors.</div>
            ) : (
              <>
                <p className="mt-0 text-[10px] leading-snug text-rose-100/70">
                  Protocol or validation errors from the local AI bridge (not model events).
                </p>
                <div className="mt-2 flex max-h-[28vh] flex-col gap-2 overflow-y-auto scrollbar-dark-micro">
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
              </>
            )}
          </TRNInteractiveCard>
        );
      case "timeline":
        return (
          <TRNInteractiveCard
            key={id}
            title={dragTitle}
            collapsible
            collapsed={collapsed}
            onCollapsedChange={(next) => setSectionCollapsed("timeline", next)}
            className="flex min-h-0 flex-1 flex-col"
            headerClassName="shrink-0"
            titleTrailingSlot={
              <RequestProgressTrailing
                progress={activeRequestProgress}
                elapsedLabel={elapsedLabel}
                compact
              />
            }
            contentClassName="flex min-h-0 flex-1 flex-col pt-0"
            collapsibleMeasureIntrinsic={false}
          >
            <p className="shrink-0 text-[10px] leading-snug text-zinc-500">
              Chronological <span className="font-mono">ai/event</span> stream when Dev trace is on. Each row is one
              protocol event.
            </p>
            <div className="mt-2 flex shrink-0 flex-wrap items-center gap-2 border-b border-white/5 pb-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-400">
                <input
                  type="checkbox"
                  className="rounded border-zinc-600"
                  checked={timelineActiveOnly}
                  onChange={(e) => setTimelineActiveOnly(e.target.checked)}
                />
                Active request only
              </label>
              <TRNButton
                type="button"
                size="compact"
                className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
                title="Remove all timeline rows from this panel (does not affect the bridge)"
                onClick={() => clearTraceTimeline()}
              >
                Clear timeline
              </TRNButton>
              <TRNButton
                type="button"
                size="compact"
                className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
                disabled={bridgeErrors.length === 0}
                title="Clear stored bridge error rows"
                onClick={() => clearBridgeErrors()}
              >
                Clear bridge errors
              </TRNButton>
              <TRNButton
                type="button"
                size="compact"
                className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
                disabled={outboundRows.length === 0}
                title="Clear sanitized outbound message log (client → bridge)"
                onClick={() => clearOutboundLog()}
              >
                Clear outbound
              </TRNButton>
              <span className="mx-1 hidden h-4 w-px shrink-0 bg-zinc-700/90 sm:inline-block" aria-hidden />
              <TRNButton
                type="button"
                size="compact"
                className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
                disabled={rows.length === 0}
                title="Copy full timeline + bridge errors (if any) as JSON"
                onClick={() => void onExportCopy("all")}
              >
                <ClipboardCopy className="mr-1 inline h-3.5 w-3.5 opacity-80" aria-hidden />
                Copy all
              </TRNButton>
              <TRNButton
                type="button"
                size="compact"
                className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
                disabled={activeRequestId == null || rows.length === 0}
                title="Copy events for the active requestId only"
                onClick={() => void onExportCopy("active_request")}
              >
                <ClipboardCopy className="mr-1 inline h-3.5 w-3.5 opacity-80" aria-hidden />
                Copy active
              </TRNButton>
              <TRNButton
                type="button"
                size="compact"
                className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
                disabled={rows.length === 0}
                title="Download full timeline as a .json file"
                onClick={() => onExportDownload("all")}
              >
                <Download className="mr-1 inline h-3.5 w-3.5 opacity-80" aria-hidden />
                .json all
              </TRNButton>
              <TRNButton
                type="button"
                size="compact"
                className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
                disabled={activeRequestId == null || rows.length === 0}
                title="Download active request events as a .json file"
                onClick={() => onExportDownload("active_request")}
              >
                <Download className="mr-1 inline h-3.5 w-3.5 opacity-80" aria-hidden />
                .json active
              </TRNButton>
              {exportHint != null ? (
                <span className="text-[10px] text-emerald-300/95" role="status">
                  {exportHint}
                </span>
              ) : null}
              {timelineActiveOnly && rows.length > 0 ? (
                <span className="text-[10px] text-zinc-600">
                  Showing {timelineDisplayRows.length} / {rows.length} events
                </span>
              ) : null}
            </div>
            <div className="mt-2 shrink-0 rounded border border-zinc-800/90 bg-black/25 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  Outbound (sanitized)
                </span>
                <span className="text-[10px] text-zinc-600">{outboundRows.length} msg</span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-zinc-600">
                Client → bridge WebSocket payloads; API keys, pairing token, and confirm tokens are redacted; prompts are
                truncated with length.
              </p>
              <div className="mt-2 max-h-[22vh] overflow-y-auto scrollbar-dark-micro">
                {outboundRows.length === 0 ? (
                  <div className="text-[11px] text-zinc-600">No outbound rows yet (hello, request, tool confirm).</div>
                ) : (
                  outboundRows.map((row, oidx) => (
                    <div
                      key={`${row.atMs}-${oidx}`}
                      className="border-b border-white/5 py-2 last:border-b-0"
                    >
                      <div className="mb-1 text-[10px] text-zinc-500" title={new Date(row.atMs).toISOString()}>
                        {formatTimelineEventTime(row.atMs)}
                      </div>
                      <TRNHighlightedJsonBlock
                        value={JSON.stringify(row.message, null, 2)}
                        className="border-zinc-700/70"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto rounded border border-zinc-700/80 bg-black/20 p-2">
              {rows.length === 0 ? (
                <div className="text-[11px] text-zinc-500">No events yet — send a prompt with Dev trace enabled.</div>
              ) : timelineDisplayRows.length === 0 ? (
                <div className="text-[11px] text-zinc-500">
                  {timelineActiveOnly && activeRequestId == null
                    ? "No active request — turn off “Active request only” to see past runs, or send a prompt."
                    : "No events recorded yet for this request."}
                </div>
              ) : (
                timelineDisplayRows.map((row, idx) => {
                  const json = JSON.stringify(row.event, null, 2);
                  const atMs = "atMs" in row.event && typeof row.event.atMs === "number" ? row.event.atMs : null;
                  return (
                    <div
                      key={`${idx}-${row.requestId}-${row.event.kind}`}
                      className="border-b border-white/5 py-2 last:border-b-0"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                          <span className="rounded border border-cyan-500/35 bg-cyan-950/45 px-1.5 py-0.5 font-medium text-cyan-200/95">
                            {row.event.kind}
                          </span>
                          {atMs != null ? (
                            <span className="text-zinc-400" title={new Date(atMs).toISOString()}>
                              {formatTimelineEventTime(atMs)}
                            </span>
                          ) : null}
                        </div>
                        <span
                          className="shrink-0 font-mono text-[10px] leading-none text-zinc-500"
                          title={`requestId: ${row.requestId}`}
                        >
                          {shortRequestIdLabel(row.requestId)}
                        </span>
                      </div>
                      {eventProgressSubtitle(row.event) != null ? (
                        <div className="mt-0.5 text-[10px] text-zinc-500">
                          {eventProgressSubtitle(row.event)}
                        </div>
                      ) : null}
                      <TimelineEventJsonBlock json={json} eventKind={row.event.kind} />
                    </div>
                  );
                })
              )}
            </div>
          </TRNInteractiveCard>
        );
      default: {
        const _exhaustive: never = id;
        return _exhaustive;
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3 text-zinc-100">
      <div className="flex shrink-0 items-center justify-between">
        <div className="text-sm font-semibold">AI Dev Trace</div>
        <div className="text-xs text-zinc-400">
          WS:{" "}
          <span className={connected ? "text-emerald-300" : "text-rose-300"}>
            {connected ? "connected" : "disconnected"}
          </span>
        </div>
      </div>

      <p className="shrink-0 text-[10px] leading-snug text-zinc-500">
        Drag <span className="font-mono">⋮⋮</span> to reorder sections. Collapse cards to focus. Layout is saved in this
        browser (localStorage).
      </p>

      <TRNSortableContainer
        className="flex min-h-0 flex-1 flex-col gap-2"
        itemIds={[...sectionOrder]}
        onReorder={handleReorder}
        layout="vertical"
      >
        {sectionOrder.map((sid) => (
          <TRNSortableItem
            key={sid}
            id={sid}
            className={sid === "timeline" ? "flex min-h-0 flex-1 flex-col" : "shrink-0"}
            dragFx="lift"
          >
            {renderSection(sid)}
          </TRNSortableItem>
        ))}
      </TRNSortableContainer>
    </div>
  );
}

import { useCallback, useMemo, useState } from "react";
import { ClipboardCopy, FileDown, Pause, Play, Search, Trash2 } from "lucide-react";
import { TRNWindow } from "../../../ui/TRN/TRNWindow";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNInteractiveCard, TRNDragHandle, TRNSortableContainer, TRNSortableItem } from "../../../ui/TRN";
import { TRNScrollableEdgeHints } from "../../../ui/TRN/TRNScrollableEdgeHints";
import { useBitstreamConnectionStore } from "../../../bitstream-app/state/bitstreamConnection.store";

type LogSource = "webview" | "bridge" | "broker";
type LogLevel = "error" | "warn" | "info" | "debug";

type LogEntry = {
  id: string;
  tsMs: number;
  source: LogSource;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
};

// Theme constants (user-tunable) — keep in this file for quick iteration.
const LOGS_THEME = {
  maxEntries: 800,
  rowFontClass: "text-[11px]",
  monoFontClass: "font-mono text-[11px]",
  sourceAccent: {
    webview: "border-l-cyan-400/70",
    bridge: "border-l-emerald-400/70",
    broker: "border-l-violet-400/70",
  } satisfies Record<LogSource, string>,
  sourceBadge: {
    webview: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100",
    bridge: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
    broker: "border-violet-300/30 bg-violet-500/10 text-violet-100",
  } satisfies Record<LogSource, string>,
  levelBadge: {
    error: "border-rose-300/35 bg-rose-500/10 text-rose-100",
    warn: "border-amber-300/35 bg-amber-500/10 text-amber-100",
    info: "border-zinc-400/20 bg-white/5 text-zinc-200",
    debug: "border-zinc-500/15 bg-zinc-950/40 text-zinc-300",
  } satisfies Record<LogLevel, string>,
  cardClass:
    "rounded-md border border-zinc-700/80 bg-black/30 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
} as const;

const DEFAULT_CARD_ORDER = [
  "connection",
  "serialLease",
  "handshake",
  "cmdLane",
  "streaming",
  "logStream",
  "details",
] as const;

type CardId = (typeof DEFAULT_CARD_ORDER)[number];

function hashString(input: string): string
{
  // djb2-ish; stable and fast enough for UI IDs.
  let h = 5381;
  for (let i = 0; i < input.length; i++)
  {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function formatTime(tsMs: number): string
{
  const d = new Date(tsMs);
  return d.toLocaleTimeString(undefined, { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

function guessLevel(message: string): LogLevel
{
  const s = message.toLowerCase();
  if (s.includes("error") || s.includes("failed") || s.includes("timeout") || s.includes("rejected")) return "error";
  if (s.includes("warn") || s.includes("warning")) return "warn";
  if (s.includes("debug")) return "debug";
  return "info";
}

export function BitstreamSystemLogsWindow(props: { open: boolean; onClose: () => void })
{
  const { open, onClose } = props;
  const runtimeSnapshot = useBitstreamConnectionStore((s) => s.runtimeSnapshot);
  const runtimeOperations = useBitstreamConnectionStore((s) => s.runtimeOperations);
  const webviewLogs = useBitstreamConnectionStore((s) => s.logs);

  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSticky, setSelectedSticky] = useState<LogEntry | null>(null);

  const [sourceFilter, setSourceFilter] = useState<Record<LogSource, boolean>>({
    webview: true,
    bridge: true,
    broker: true,
  });
  const [levelFilter, setLevelFilter] = useState<Record<LogLevel, boolean>>({
    error: true,
    warn: true,
    info: true,
    debug: false,
  });

  const [cardOrder, setCardOrder] = useState<CardId[]>([...DEFAULT_CARD_ORDER]);
  const [collapsed, setCollapsed] = useState<Record<CardId, boolean>>({
    connection: false,
    serialLease: false,
    handshake: false,
    cmdLane: false,
    streaming: false,
    logStream: false,
    details: false,
  });

  const entries = useMemo<LogEntry[]>(() => {
    const list: LogEntry[] = [];
    const now = Date.now();

    // Webview logs (already stamped strings).
    // Assume new logs are appended. Iterate from newest to oldest so the relative
    // tsMs stays monotonic without relying on random IDs.
    for (let i = webviewLogs.length - 1; i >= 0; i--) {
      const line = webviewLogs[i] ?? "";
      const lineHash = hashString(line);
      list.push({
        id: `wv-${i}-${lineHash}`,
        tsMs: now - (webviewLogs.length - 1 - i) * 5,
        source: "webview",
        level: guessLevel(line),
        message: line,
      });
    }

    // Bridge operations.
    for (let i = 0; i < runtimeOperations.length; i++) {
      const op = runtimeOperations[i];
      const tsMs = typeof op.timestamp === "number" ? op.timestamp : now;
      const key = `[${op.type}] ${op.message} @${tsMs}`;
      list.push({
        id: `br-op-${i}-${hashString(key)}`,
        tsMs,
        source: "bridge",
        level: guessLevel(op.message),
        message: `[${op.type}] ${op.message}`,
        meta: op as unknown as Record<string, unknown>,
      });
    }

    // Broker events: minimal for now (we don't subscribe to broker monitor yet).
    // Kept for filter UX consistency.

    // Sort newest first.
    list.sort((a, b) => b.tsMs - a.tsMs);
    return list.slice(0, LOGS_THEME.maxEntries);
  }, [runtimeOperations, webviewLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (!sourceFilter[e.source]) return false;
      if (!levelFilter[e.level]) return false;
      if (!q) return true;
      return e.message.toLowerCase().includes(q);
    });
  }, [entries, levelFilter, search, sourceFilter]);

  const selected = useMemo(() => {
    if (!selectedId) return selectedSticky;
    // Prefer the latest matching entry from the full list (not filtered),
    // so selection won't reset when filters/search change or when new rows arrive.
    const direct = entries.find((e) => e.id === selectedId) ?? null;
    if (direct) return direct;
    // Fallback: if the entry aged out of `maxEntries`, keep showing the last selected content.
    return selectedSticky;
  }, [entries, selectedId, selectedSticky]);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }, []);

  const exportText = useCallback(() => {
    const text = filtered
      .map((e) => `${formatTime(e.tsMs)} ${e.level.toUpperCase()} ${e.source.toUpperCase()} ${e.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bitstream-system-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const headerControls = (
    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <TRNButton
        size="compact"
        selected={paused}
        onClick={() => setPaused((p) => !p)}
        className="gap-1"
        title={paused ? "Resume live tail" : "Pause live tail"}
      >
        {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
        <span>{paused ? "Resume" : "Pause"}</span>
      </TRNButton>
      <TRNButton size="compact" onClick={() => void copyText(filtered.map((e) => e.message).join("\n"))} className="gap-1">
        <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
        <span>Copy</span>
      </TRNButton>
      <TRNButton size="compact" onClick={exportText} className="gap-1">
        <FileDown className="h-3.5 w-3.5" aria-hidden />
        <span>Export</span>
      </TRNButton>
    </div>
  );

  const filters = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-zinc-300">Sources</span>
        {(["webview", "bridge", "broker"] as const).map((s) => (
          <TRNButton
            key={s}
            size="compact"
            selected={sourceFilter[s]}
            onClick={() => setSourceFilter((p) => ({ ...p, [s]: !p[s] }))}
          >
            {s}
          </TRNButton>
        ))}
        <span className="ml-2 text-[11px] font-semibold text-zinc-300">Levels</span>
        {(["error", "warn", "info", "debug"] as const).map((l) => (
          <TRNButton
            key={l}
            size="compact"
            selected={levelFilter[l]}
            onClick={() => setLevelFilter((p) => ({ ...p, [l]: !p[l] }))}
          >
            {l}
          </TRNButton>
        ))}
      </div>
      <label className="flex items-center gap-2 rounded border border-zinc-700/80 bg-zinc-950/40 px-2 py-1">
        <Search className="h-4 w-4 text-zinc-400" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs…"
          className="w-full bg-transparent text-[12px] text-zinc-100 outline-none placeholder:text-zinc-500"
        />
      </label>
    </div>
  );

  const card = (
    id: CardId,
    title: string,
    body: React.ReactNode,
    opts?: { collapsible?: boolean },
  ) => {
    if (isTwoCol && id === "details") {
      return null;
    }
    return (
      <TRNSortableItem key={id} id={id} dragFx="tilt">
        <TRNInteractiveCard
          title={title}
          titleLeadingSlot={<TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />}
          className={LOGS_THEME.cardClass}
          headerTitleClassName="normal-case tracking-normal text-zinc-100"
          collapsible={opts?.collapsible ?? true}
          collapsed={collapsed[id] ?? false}
          onCollapsedChange={(next) => setCollapsed((p) => ({ ...p, [id]: next }))}
          contentClassName="min-h-0"
        >
          {body}
        </TRNInteractiveCard>
      </TRNSortableItem>
    );
  };

  const connectionCard = (
    <div className="flex flex-col gap-1 text-[12px] text-zinc-200/90">
      <div>
        <span className="text-zinc-400">Broker:</span>{" "}
        <span className="font-mono">{runtimeSnapshot?.connectionState ?? "unknown"}</span>
      </div>
      <div>
        <span className="text-zinc-400">Clients:</span>{" "}
        <span className="font-mono">{runtimeSnapshot?.clients?.length ?? 0}</span>
      </div>
    </div>
  );

  const serialLeaseCard = (
    <div className="flex flex-col gap-1 text-[12px] text-zinc-200/90">
      <div>
        <span className="text-zinc-400">UART:</span>{" "}
        <span className="font-mono">{runtimeSnapshot?.serialStatus?.isOpen ? "open" : "closed"}</span>
        {runtimeSnapshot?.serialStatus?.path ? (
          <span className="ml-2 font-mono text-zinc-300">{runtimeSnapshot.serialStatus.path}</span>
        ) : null}
      </div>
      <div>
        <span className="text-zinc-400">Lease:</span>{" "}
        <span className="font-mono">{runtimeSnapshot?.leaseOwner ?? "<none>"}</span>
      </div>
      <div>
        <span className="text-zinc-400">Access:</span>{" "}
        <span className="font-mono">{runtimeSnapshot?.accessControl?.mode ?? "lease_only"}</span>
      </div>
    </div>
  );

  const handshakeCard = (
    <div className="flex flex-col gap-1 text-[12px] text-zinc-200/90">
      <div>
        <span className="text-zinc-400">State:</span>{" "}
        <span className="font-mono">{runtimeSnapshot?.handshakeState ?? "unknown"}</span>
      </div>
      {runtimeSnapshot?.handshakeLastError ? (
        <div className="font-mono text-rose-200/90">{runtimeSnapshot.handshakeLastError}</div>
      ) : (
        <div className="text-zinc-400">No errors.</div>
      )}
    </div>
  );

  const cmdLaneCard = (
    <div className="flex flex-col gap-1 text-[12px] text-zinc-200/90">
      <div className="text-zinc-400">CMD lane is Priority 0 (QoS1). Use Log Stream for per-request detail.</div>
    </div>
  );

  const streamingCard = (
    <div className="flex flex-col gap-1 text-[12px] text-zinc-200/90">
      <div className="text-zinc-400">
        Streaming is QoS0. This card will show throughput summaries (bytes/sec) in a follow-up.
      </div>
    </div>
  );

  const logStreamCard = (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {filters}
      <TRNScrollableEdgeHints
        className="min-h-0 flex-1 rounded border border-zinc-700/80 bg-black/20"
        scrollClassName="min-h-0"
      >
        {filtered.length === 0 ? (
          <div className="p-2 text-[12px] text-zinc-400">No logs match the current filters.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((e) => {
              const isSelected = selectedId === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(e.id);
                    setSelectedSticky(e);
                  }}
                  className={
                    "flex w-full items-start gap-2 border-l-2 px-2 py-1.5 text-left " +
                    (LOGS_THEME.sourceAccent[e.source] ?? "border-l-white/10") +
                    (isSelected ? " bg-white/6" : " hover:bg-white/3")
                  }
                  title={e.message}
                >
                  <span className={"shrink-0 tabular-nums text-zinc-400 " + LOGS_THEME.rowFontClass}>
                    {formatTime(e.tsMs)}
                  </span>
                  <span
                    className={
                      "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold " +
                      LOGS_THEME.levelBadge[e.level]
                    }
                  >
                    {e.level.toUpperCase()}
                  </span>
                  <span
                    className={
                      "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold " +
                      LOGS_THEME.sourceBadge[e.source]
                    }
                  >
                    {e.source.toUpperCase()}
                  </span>
                  <span className={"min-w-0 flex-1 truncate text-zinc-100/90 " + LOGS_THEME.rowFontClass}>
                    {e.message}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </TRNScrollableEdgeHints>
    </div>
  );

  const detailsCard = (
    <div className="flex min-h-0 flex-col gap-2">
      {!selected ? (
        <div className="text-[12px] text-zinc-400">Select a log row to see details.</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={"rounded border px-1.5 py-0.5 text-[10px] font-semibold " + LOGS_THEME.levelBadge[selected.level]}>
              {selected.level.toUpperCase()}
            </span>
            <span className={"rounded border px-1.5 py-0.5 text-[10px] font-semibold " + LOGS_THEME.sourceBadge[selected.source]}>
              {selected.source.toUpperCase()}
            </span>
            <span className="font-mono text-[11px] text-zinc-400">{formatTime(selected.tsMs)}</span>
            <div className="ml-auto inline-flex items-center gap-1">
              <TRNButton size="compact" onClick={() => void copyText(selected.message)} className="gap-1">
                <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
                <span>Copy</span>
              </TRNButton>
              <TRNButton
                size="compact"
                onClick={() => void copyText(JSON.stringify(selected, null, 2))}
                className="gap-1"
              >
                <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
                <span>JSON</span>
              </TRNButton>
              <TRNButton
                size="compact"
                onClick={() => {
                  setSelectedId(null);
                  setSelectedSticky(null);
                }}
                className="gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                <span>Unselect</span>
              </TRNButton>
            </div>
          </div>
          <div className={"whitespace-pre-wrap wrap-break-word text-zinc-100/90 " + LOGS_THEME.monoFontClass}>
            {selected.message}
          </div>
          {selected.meta ? (
            <div className={"whitespace-pre-wrap wrap-break-word text-zinc-200/90 " + LOGS_THEME.monoFontClass}>
              {JSON.stringify(selected.meta, null, 2)}
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  const isTwoCol = true;
  const leftCardOrder = useMemo(() => {
    if (isTwoCol) return ["logStream" as const];
    return cardOrder.slice();
  }, [cardOrder, isTwoCol]);

  const rightCardOrder = useMemo(() => {
    if (!isTwoCol) return [];
    // Keep these "status" cards on the right in wide mode.
    return [
      "connection",
      "cmdLane",
      "serialLease",
      "handshake",
      "streaming",
      // details is rendered as a dedicated card below in the right column.
    ] satisfies Exclude<CardId, "logStream" | "details">[];
  }, [isTwoCol]);

  const body = (
    <div
      className={
        "grid min-h-0 w-full flex-1 gap-2 " +
        "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
      }
    >
      <TRNSortableContainer
        itemIds={leftCardOrder}
        onReorder={(next) => setCardOrder(next as CardId[])}
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        {leftCardOrder.map((id) => {
          if (id === "logStream") {
            return (
              <TRNSortableItem
                key={id}
                id={id}
                dragFx="tilt"
                className="min-h-0 flex flex-1 flex-col"
              >
                <TRNInteractiveCard
                  title="Log Stream"
                  titleLeadingSlot={
                    <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
                  }
                  className={LOGS_THEME.cardClass + " flex min-h-0 flex-1 flex-col"}
                  headerTitleClassName="normal-case tracking-normal text-zinc-100"
                  collapsible={false}
                  contentClassName="flex min-h-0 flex-1 flex-col"
                >
                  {logStreamCard}
                </TRNInteractiveCard>
              </TRNSortableItem>
            );
          }
          return null;
        })}
      </TRNSortableContainer>
      <div className={"hidden md:flex min-h-0 flex-col gap-2 " + (isTwoCol ? "" : "")}>
        {rightCardOrder.map((id) => {
          if (id === "connection") return card(id, "Connection and Broker", connectionCard);
          if (id === "serialLease") return card(id, "Serial and Lease", serialLeaseCard);
          if (id === "handshake") return card(id, "Handshake", handshakeCard);
          if (id === "cmdLane") return card(id, "Command RPC (CMD lane)", cmdLaneCard);
          if (id === "streaming") return card(id, "Streaming summary", streamingCard);
          return null;
        })}
        {/* In wide mode we keep a dedicated details card for quick scan */}
        <TRNInteractiveCard
          title="Details"
          titleLeadingSlot={<span className="text-zinc-400">Selected</span>}
          className={LOGS_THEME.cardClass}
          headerTitleClassName="normal-case tracking-normal text-zinc-100"
          collapsible
          collapsed={collapsed.details ?? false}
          onCollapsedChange={(next) => setCollapsed((p) => ({ ...p, details: next }))}
          contentClassName="min-h-0"
          collapsibleMeasureIntrinsic={false}
        >
          {detailsCard}
        </TRNInteractiveCard>
      </div>
    </div>
  );

  return (
    <TRNWindow
      open={open}
      title="System Logs"
      onClose={onClose}
      modal={false}
      draggable
      resizable
      reopenStrategy="reset"
      zIndex={340}
      glass
      glassPreset="medium"
      heightMode="fixed"
      initialRect={{ x: 90, y: 100, width: 860, height: 600 }}
      minWidth={520}
      minHeight={360}
      contentClassName="flex min-h-0 flex-col gap-1.5 bg-black/40 p-2 text-zinc-100"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[12px] text-zinc-300">
          <span className="font-semibold text-zinc-100">System Logs</span>{" "}
          <span className="text-zinc-400">(Bitstream)</span>{" "}
          <span className="ml-2 text-zinc-400">
            shown <span className="font-mono text-zinc-200">{filtered.length}</span> /{" "}
            <span className="font-mono text-zinc-200">{entries.length}</span>
          </span>
        </div>
        <div className="ml-auto">{headerControls}</div>
      </div>
      {body}
    </TRNWindow>
  );
}


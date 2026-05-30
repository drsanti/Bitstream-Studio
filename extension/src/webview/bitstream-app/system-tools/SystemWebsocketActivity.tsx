import { Activity, Pause, Play, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isBrokerMonitorEnvelope,
  type BrokerMonitorEnvelope,
  type BrokerMonitorPublisher,
  T3D_WS_BROKER_MONITOR_TOPIC,
} from "../../../websocket/broker-monitor-events";
import { useWsClientStore } from "../../ws-client-store";
import { TRNWindow } from "../../ui/TRN/TRNWindow";

const MAX_ROWS = 500;
const LISTENER_ID = "admin-websocket-activity";

type MonitorKind = BrokerMonitorEnvelope["kind"];

const MONITOR_KINDS: MonitorKind[] = [
  "client-connected",
  "client-disconnected",
  "client-identified",
  "subscription-added",
  "subscription-removed",
  "message-published",
];

const KIND_LABELS: Record<MonitorKind, string> = {
  "client-connected": "Connect",
  "client-disconnected": "Disconnect",
  "client-identified": "Identify",
  "subscription-added": "Sub +",
  "subscription-removed": "Sub −",
  "message-published": "Publish",
};

const DEFAULT_KIND_FILTER: Record<MonitorKind, boolean> = {
  "client-connected": true,
  "client-disconnected": true,
  "client-identified": true,
  "subscription-added": true,
  "subscription-removed": true,
  "message-published": true,
};

export interface SystemWebsocketActivityProps {
  open: boolean;
  onClose: () => void;
}

function formatPublisher(p?: BrokerMonitorPublisher): string {
  if (!p) return "—";
  const parts = [p.role, p.name, p.instance].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function summarizeEnvelope(ev: BrokerMonitorEnvelope): string {
  switch (ev.kind) {
    case "client-connected":
      return `session=${ev.clientId}`;
    case "client-disconnected":
      return `session=${ev.clientId}`;
    case "client-identified":
      return `session=${ev.clientId} → ${formatPublisher(ev.identity)}`;
    case "subscription-added":
      return `${ev.clientId} → ${ev.topic} (${ev.channel})`;
    case "subscription-removed":
      return `${ev.clientId} ✕ ${ev.topic} (${ev.channel})`;
    case "message-published":
      return `${ev.topic} ${ev.channel} qos=${ev.qos} ${formatPublisher(ev.publisher)} session=${ev.from ?? "—"}${
        ev.correlationId ? ` corr=${ev.correlationId}` : ""
      }`;
    default:
      return JSON.stringify(ev);
  }
}

interface MonitorSessionStats {
  /** Replay of connect/disconnect in buffer (wrong if oldest rows were trimmed). */
  connectedNow: number;
  /** Distinct session ids that appeared in `client-connected` within the buffer. */
  uniqueSessionsSeen: number;
  connectEvents: number;
  disconnectEvents: number;
  identifyEvents: number;
  subscriptionAdded: number;
  subscriptionRemoved: number;
  /** Net subscription slots after replaying add/remove in buffer order. */
  activeSubscriptionSlots: number;
  /** Count of broker `message-published` telemetry rows (app publishes). */
  publishEvents: number;
  totalBufferedEvents: number;
}

function subscriptionSlotKey(
  clientId: string,
  channel: string,
  topic: string,
): string {
  return `${clientId}\u0000${channel}\u0000${topic}`;
}

function computeMonitorSessionStats(
  rows: BrokerMonitorEnvelope[],
): MonitorSessionStats {
  const connected = new Set<string>();
  const everConnected = new Set<string>();
  const subSlots = new Set<string>();
  let identifyEvents = 0;
  let publishEvents = 0;
  let subscriptionAdded = 0;
  let subscriptionRemoved = 0;
  let connectEvents = 0;
  let disconnectEvents = 0;

  for (const ev of rows) {
    switch (ev.kind) {
      case "client-connected":
        connectEvents++;
        everConnected.add(ev.clientId);
        connected.add(ev.clientId);
        break;
      case "client-disconnected":
        disconnectEvents++;
        connected.delete(ev.clientId);
        break;
      case "client-identified":
        identifyEvents++;
        break;
      case "subscription-added":
        subscriptionAdded++;
        subSlots.add(subscriptionSlotKey(ev.clientId, ev.channel, ev.topic));
        break;
      case "subscription-removed": {
        subscriptionRemoved++;
        const ch = ev.channel;
        if (ch === "both") {
          subSlots.delete(subscriptionSlotKey(ev.clientId, "json", ev.topic));
          subSlots.delete(subscriptionSlotKey(ev.clientId, "binary", ev.topic));
        } else {
          subSlots.delete(subscriptionSlotKey(ev.clientId, ch, ev.topic));
        }
        break;
      }
      case "message-published":
        publishEvents++;
        break;
      default:
        break;
    }
  }

  return {
    connectedNow: connected.size,
    uniqueSessionsSeen: everConnected.size,
    connectEvents,
    disconnectEvents,
    identifyEvents,
    subscriptionAdded,
    subscriptionRemoved,
    activeSubscriptionSlots: subSlots.size,
    publishEvents,
    totalBufferedEvents: rows.length,
  };
}

function StatPill({
  label,
  value,
  title,
}: {
  label: string;
  value: number;
  title?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1" title={title}>
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium tabular-nums text-zinc-200">{value}</span>
    </span>
  );
}

export function SystemWebsocketActivity({
  open,
  onClose,
}: SystemWebsocketActivityProps) {
  const [rows, setRows] = useState<BrokerMonitorEnvelope[]>([]);
  const [paused, setPaused] = useState(false);
  const [kindFilter, setKindFilter] = useState<Record<MonitorKind, boolean>>(
    () => ({
      ...DEFAULT_KIND_FILTER,
    }),
  );
  const pausedRef = useRef(paused);
  const wsConnected = useWsClientStore((s) => s.isConnected);

  pausedRef.current = paused;

  const appendRow = useCallback((ev: BrokerMonitorEnvelope) => {
    if (pausedRef.current) return;
    setRows((prev) => {
      const next = [...prev, ev];
      if (next.length > MAX_ROWS) next.splice(0, next.length - MAX_ROWS);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const {
      connect,
      subscribeTopic,
      unsubscribeTopic,
      addMessageListener,
      removeMessageListener,
    } = useWsClientStore.getState();

    let cancelled = false;

    void (async () => {
      try {
        await connect();
        if (cancelled) return;
        await subscribeTopic(T3D_WS_BROKER_MONITOR_TOPIC, 0, "json");
      } catch {
        /* broker may be down; UI still opens */
      }
    })();

    const onMsg = (topic: string, payload: unknown) => {
      if (topic !== T3D_WS_BROKER_MONITOR_TOPIC) return;
      if (!isBrokerMonitorEnvelope(payload)) return;
      appendRow(payload);
    };

    addMessageListener(LISTENER_ID, onMsg);

    return () => {
      cancelled = true;
      removeMessageListener(LISTENER_ID);
      void unsubscribeTopic(T3D_WS_BROKER_MONITOR_TOPIC, "json");
    };
  }, [open, appendRow]);

  const visibleRows = useMemo(
    () => rows.filter((r) => kindFilter[r.kind]),
    [rows, kindFilter],
  );

  const activeKindCount = useMemo(
    () => MONITOR_KINDS.reduce((n, k) => n + (kindFilter[k] ? 1 : 0), 0),
    [kindFilter],
  );

  const toggleKind = useCallback((kind: MonitorKind) => {
    setKindFilter((prev) => ({ ...prev, [kind]: !prev[kind] }));
  }, []);

  const showAllKinds = useCallback(() => {
    setKindFilter({ ...DEFAULT_KIND_FILTER });
  }, []);

  const sessionStats = useMemo(() => computeMonitorSessionStats(rows), [rows]);

  return (
    <TRNWindow
      open={open}
      title="WebSocket broker activity"
      prefixIcon={<Activity className="h-4 w-4 text-emerald-400" aria-hidden />}
      onClose={onClose}
      modal
      draggable
      resizable
      zIndex={200}
      glass
      glassPreset="medium"
      initialRect={{ x: 72, y: 72, width: 920, height: 560 }}
      minWidth={480}
      minHeight={320}
      contentClassName="flex flex-col bg-zinc-950/95 text-zinc-100"
    >
      <div className="shrink-0 border-b border-zinc-700/80">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <span
            className={`rounded px-2 py-0.5 text-[11px] font-medium ${
              wsConnected
                ? "bg-emerald-900/50 text-emerald-200"
                : "bg-amber-900/50 text-amber-200"
            }`}
          >
            WS client: {wsConnected ? "connected" : "disconnected"}
          </span>
          <span className="text-[10px] text-zinc-500">
            Kinds{" "}
            <span className="text-zinc-400">
              ({activeKindCount}/{MONITOR_KINDS.length})
            </span>
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-[11px] hover:bg-zinc-800"
              onClick={() => setPaused((p) => !p)}
              title={paused ? "Resume" : "Pause"}
            >
              {paused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-[11px] hover:bg-zinc-800"
              onClick={() => setRows([])}
              title="Clear list"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-zinc-800/80 px-3 py-1.5">
          {MONITOR_KINDS.map((kind) => (
            <label
              key={kind}
              className="flex cursor-pointer select-none items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-300"
            >
              <input
                type="checkbox"
                checked={kindFilter[kind]}
                onChange={() => toggleKind(kind)}
                className="rounded border-zinc-600"
              />
              <span title={kind}>{KIND_LABELS[kind]}</span>
            </label>
          ))}
          <button
            type="button"
            className="text-[11px] text-emerald-500/90 underline-offset-2 hover:text-emerald-400 hover:underline"
            onClick={showAllKinds}
          >
            Show all
          </button>
        </div>
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-800/80 bg-zinc-900/30 px-3 py-1.5 text-[11px]"
          title="Counts are recomputed from events kept in this table (max 500). Oldest rows may be dropped, so long-run totals can differ from the live broker. Clear resets the buffer and these stats."
        >
          <StatPill
            label="Connected"
            value={sessionStats.connectedNow}
            title="Sessions with connect after last disconnect, replayed from buffer"
          />
          <StatPill
            label="Sessions seen"
            value={sessionStats.uniqueSessionsSeen}
            title="Distinct client ids that appeared in client-connected (within buffer)"
          />
          <StatPill
            label="Publishes"
            value={sessionStats.publishEvents}
            title="message-published rows in buffer"
          />
          <StatPill
            label="Subs active"
            value={sessionStats.activeSubscriptionSlots}
            title="Net json/binary topic subscriptions after replaying sub + / sub − in buffer"
          />
          <StatPill
            label="Identifies"
            value={sessionStats.identifyEvents}
            title="client-identified events"
          />
          <StatPill
            label="Events"
            value={sessionStats.totalBufferedEvents}
            title="Rows in buffer"
          />
        </div>
      </div>

      <div className="scrollbar-dark-micro min-h-0 flex-1 overflow-auto pr-0.5 font-mono text-[11px] leading-snug">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-zinc-900/95 text-[10px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="border-b border-zinc-700/80 px-2 py-1.5 font-medium">
                Time
              </th>
              <th className="border-b border-zinc-700/80 px-2 py-1.5 font-medium">
                Kind
              </th>
              <th className="border-b border-zinc-700/80 px-2 py-1.5 font-medium">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-zinc-500">
                  {rows.length === 0
                    ? "No events yet. Connect the broker and open clients."
                    : "No rows match the current kind filters."}
                </td>
              </tr>
            ) : (
              visibleRows.map((ev, rowIndex) => (
                <tr
                  key={`${ev.ts}-${ev.kind}-${rowIndex}`}
                  className="border-b border-zinc-800/80 hover:bg-zinc-900/40"
                >
                  <td className="whitespace-nowrap px-2 py-1 text-zinc-500">
                    {(() => {
                      const d = new Date(ev.ts);
                      return `${d.toLocaleTimeString(undefined, { hour12: false })}.${String(d.getMilliseconds()).padStart(3, "0")}`;
                    })()}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1 text-emerald-400/90">
                    {ev.kind}
                  </td>
                  <td className="break-all px-2 py-1 text-zinc-300">
                    {summarizeEnvelope(ev)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-zinc-700/80 px-3 py-1.5 text-[10px] text-zinc-500">
        Topic{" "}
        <code className="text-zinc-400">{T3D_WS_BROKER_MONITOR_TOPIC}</code> ·
        max {MAX_ROWS} rows · stats from buffer
      </div>
    </TRNWindow>
  );
}

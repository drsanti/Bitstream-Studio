import { ArrowLeftRight, Pause, Play, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TRNWindow } from "../ui/TRN/TRNWindow";
import {
  POST_MESSAGE_TRACE_MAX,
  type PostMessageTraceDirection,
  type PostMessageTraceEntry,
  usePostMessageTraceStore,
} from "./post-message-trace.store";

export interface PostMessageTraceDashboardProps {
  open: boolean;
  onClose: () => void;
}

function directionClass(d: PostMessageTraceDirection): string {
  return d === "webview→host"
    ? "text-sky-300/90"
    : "text-amber-300/90";
}

export function PostMessageTraceDashboard({ open, onClose }: PostMessageTraceDashboardProps) {
  const entries = usePostMessageTraceStore((s) => s.entries);
  const paused = usePostMessageTraceStore((s) => s.paused);
  const setPaused = usePostMessageTraceStore((s) => s.setPaused);
  const clear = usePostMessageTraceStore((s) => s.clear);

  const [showToHost, setShowToHost] = useState(true);
  const [showFromHost, setShowFromHost] = useState(true);

  const visible = useMemo(() => {
    return entries.filter((e) => {
      if (e.direction === "webview→host") return showToHost;
      return showFromHost;
    });
  }, [entries, showToHost, showFromHost]);

  const counts = useMemo(() => {
    let toHost = 0;
    let fromHost = 0;
    for (const e of entries) {
      if (e.direction === "webview→host") toHost++;
      else fromHost++;
    }
    return { toHost, fromHost, total: entries.length };
  }, [entries]);

  const copyRow = useCallback(async (e: PostMessageTraceEntry) => {
    const text = `${e.direction}\t${e.typeLabel}\t${e.detail}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <TRNWindow
      open={open}
      title="Extension ↔ webview messages"
      prefixIcon={<ArrowLeftRight className="h-4 w-4 text-sky-400" aria-hidden />}
      onClose={onClose}
      modal
      draggable
      resizable
      zIndex={200}
      glass
      glassPreset="medium"
      initialRect={{ x: 96, y: 96, width: 880, height: 520 }}
      minWidth={520}
      minHeight={280}
      contentClassName="flex flex-col bg-zinc-950/95 text-zinc-100"
    >
      <div className="shrink-0 border-b border-zinc-700/80">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <span className="text-[10px] text-zinc-500">
            Webview capture · max {POST_MESSAGE_TRACE_MAX} rows ·{" "}
            <span className="text-zinc-400">to host {counts.toHost}</span> ·{" "}
            <span className="text-zinc-400">from host {counts.fromHost}</span>
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-[11px] hover:bg-zinc-800"
              onClick={() => setPaused(!paused)}
              title={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-[11px] hover:bg-zinc-800"
              onClick={() => clear()}
              title="Clear buffer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-800/80 px-3 py-1.5 text-[11px]">
          <label className="flex cursor-pointer items-center gap-1 text-zinc-400 hover:text-zinc-300">
            <input
              type="checkbox"
              checked={showToHost}
              onChange={(e) => setShowToHost(e.target.checked)}
              className="rounded border-zinc-600"
            />
            Webview → host
          </label>
          <label className="flex cursor-pointer items-center gap-1 text-zinc-400 hover:text-zinc-300">
            <input
              type="checkbox"
              checked={showFromHost}
              onChange={(e) => setShowFromHost(e.target.checked)}
              className="rounded border-zinc-600"
            />
            Host → webview
          </label>
        </div>
      </div>

      <div className="scrollbar-dark-micro min-h-0 flex-1 overflow-auto pr-0.5 font-mono text-[11px] leading-snug">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-zinc-900/95 text-[10px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="border-b border-zinc-700/80 px-2 py-1.5 font-medium">Time</th>
              <th className="border-b border-zinc-700/80 px-2 py-1.5 font-medium">Dir</th>
              <th className="border-b border-zinc-700/80 px-2 py-1.5 font-medium">Type</th>
              <th className="border-b border-zinc-700/80 px-2 py-1.5 font-medium">Payload</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                  {entries.length === 0
                    ? "No messages captured yet. Open this panel before reproducing the issue."
                    : "No rows match the direction filters."}
                </td>
              </tr>
            ) : (
              visible.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-b border-zinc-800/80 hover:bg-zinc-900/40"
                  title="Click Payload to copy row"
                >
                  <td className="whitespace-nowrap px-2 py-1 text-zinc-500">
                    {(() => {
                      const d = new Date(ev.ts);
                      return `${d.toLocaleTimeString(undefined, { hour12: false })}.${String(d.getMilliseconds()).padStart(3, "0")}`;
                    })()}
                  </td>
                  <td className={`whitespace-nowrap px-2 py-1 ${directionClass(ev.direction)}`}>
                    {ev.direction === "webview→host" ? "→ host" : "← host"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1 text-emerald-400/90">{ev.typeLabel}</td>
                  <td className="max-w-[min(52vw,28rem)] break-all px-2 py-1 text-zinc-300">
                    <button
                      type="button"
                      className="w-full cursor-copy text-left hover:text-zinc-100"
                      onClick={() => void copyRow(ev)}
                    >
                      {ev.detail || "—"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-zinc-700/80 px-3 py-1.5 text-[10px] text-zinc-500">
        Does not include Worker traffic. Payloads are truncated; click a payload cell to copy.
      </div>
    </TRNWindow>
  );
}

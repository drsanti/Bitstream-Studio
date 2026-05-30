/*******************************************************************************
 * File Name : TopicTapPanel.tsx
 *
 * Description : Live broker topic tap with filter, pause, and payload detail.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useMemo } from "react";
import { TRNButton } from "../../../ui/TRN";
import { topicMatchesFilter } from "../../lib/labTopics";
import { formatTapTime } from "../../lib/formatPayload";
import { useLabTopicTapStore } from "../../store/labTopicTap.store";
import { JsonBlock } from "../shared/JsonBlock";
import { useLabWorkbenchShell } from "../../workbench/lab-workbench-context";

export function TopicTapPanel() {
  const { includeSerialData, setIncludeSerialData } = useLabWorkbenchShell();
  const entries = useLabTopicTapStore((s) => s.entries);
  const paused = useLabTopicTapStore((s) => s.paused);
  const filter = useLabTopicTapStore((s) => s.filter);
  const throttleEvtSensor = useLabTopicTapStore((s) => s.throttleEvtSensor);
  const selectedId = useLabTopicTapStore((s) => s.selectedId);
  const setPaused = useLabTopicTapStore((s) => s.setPaused);
  const setFilter = useLabTopicTapStore((s) => s.setFilter);
  const setThrottleEvtSensor = useLabTopicTapStore((s) => s.setThrottleEvtSensor);
  const setSelectedId = useLabTopicTapStore((s) => s.setSelectedId);
  const clear = useLabTopicTapStore((s) => s.clear);
  const exportText = useLabTopicTapStore((s) => s.exportText);

  const filtered = useMemo(
    () => entries.filter((e) => topicMatchesFilter(e.topic, filter)),
    [entries, filter],
  );

  const selected = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? filtered[filtered.length - 1] ?? null,
    [filtered, selectedId],
  );

  const onExport = () => {
    const text = exportText();
    void navigator.clipboard?.writeText(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Filter topic…"
          className="min-w-[8rem] flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-200"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <TRNButton type="button" size="compact" onClick={() => setPaused(!paused)}>
          {paused ? "Resume" : "Pause"}
        </TRNButton>
        <TRNButton type="button" size="compact" onClick={clear}>
          Clear
        </TRNButton>
        <TRNButton type="button" size="compact" onClick={onExport}>
          Copy all
        </TRNButton>
        <label className="flex items-center gap-1 text-[10px] text-zinc-500">
          <input
            type="checkbox"
            checked={throttleEvtSensor}
            onChange={(e) => setThrottleEvtSensor(e.target.checked)}
          />
          Throttle evt/sensor
        </label>
        <label className="flex items-center gap-1 text-[10px] text-zinc-500">
          <input
            type="checkbox"
            checked={includeSerialData}
            onChange={(e) => setIncludeSerialData(e.target.checked)}
          />
          High volume (serialport/data, runtime-snapshot, …)
        </label>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2">
        <div className="scrollbar-dark-micro min-h-0 overflow-auto rounded border border-zinc-800">
          <table className="w-full border-collapse text-left font-mono text-[10px]">
            <thead className="sticky top-0 bg-zinc-900/95 text-zinc-500">
              <tr>
                <th className="px-2 py-1">Time</th>
                <th className="px-2 py-1">Topic</th>
                <th className="px-2 py-1">Ch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-zinc-600">
                    {entries.length === 0
                      ? "Connect and start the loopback bridge to see traffic."
                      : "No rows match the filter."}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr
                    key={e.id}
                    className={`cursor-pointer border-t border-zinc-800/80 hover:bg-zinc-900/60 ${
                      selected?.id === e.id ? "bg-zinc-800/50" : ""
                    }`}
                    onClick={() => setSelectedId(e.id)}
                  >
                    <td className="whitespace-nowrap px-2 py-0.5 text-zinc-500">
                      {formatTapTime(e.atMs)}
                    </td>
                    <td className="max-w-[10rem] truncate px-2 py-0.5 text-zinc-300" title={e.topic}>
                      {e.topic}
                    </td>
                    <td className="whitespace-nowrap px-2 py-0.5 text-zinc-500">{e.channel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex min-h-0 flex-col gap-1">
          {selected ? (
            <>
              <div className="shrink-0 font-mono text-[10px] text-zinc-500">
                {selected.topic} · {selected.channel} · qos {selected.qos} · {selected.payloadBytes} B
              </div>
              {selected.channel === "json" && selected.payloadJson !== undefined ? (
                <JsonBlock value={selected.payloadJson} />
              ) : (
                <pre className="scrollbar-dark-micro min-h-0 flex-1 overflow-auto rounded border border-zinc-800 bg-zinc-950/80 p-2 font-mono text-[11px] text-zinc-300">
                  {selected.payloadPreview}
                </pre>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-600">Select a row to inspect payload.</p>
          )}
        </div>
      </div>

      <p className="shrink-0 text-[10px] text-zinc-600">
        {filtered.length} shown · {entries.length} captured · max 500
      </p>
    </div>
  );
}

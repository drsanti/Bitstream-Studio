/*******************************************************************************
 * File Name : ActivityLogPanel.tsx
 *
 * Description : Curated activity log (connect, serial, errors) for Bitstream Lab.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef } from "react";
import { TRNButton } from "../../../ui/TRN";
import { formatTapTime } from "../../lib/formatPayload";
import type { LabActivityTone } from "../../types/labTypes";
import { useLabActivityStore } from "../../store/labActivity.store";

const TONE_CLASS: Record<LabActivityTone, string> = {
  info: "text-zinc-400",
  ok: "text-emerald-400/90",
  warning: "text-amber-400/90",
  error: "text-red-400/90",
};

export function ActivityLogPanel() {
  const lines = useLabActivityStore((s) => s.lines);
  const paused = useLabActivityStore((s) => s.paused);
  const setPaused = useLabActivityStore((s) => s.setPaused);
  const clear = useLabActivityStore((s) => s.clear);
  const exportText = useLabActivityStore((s) => s.exportText);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused || !scrollRef.current)
    {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, paused]);

  const onCopy = () => {
    void navigator.clipboard?.writeText(exportText());
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <TRNButton type="button" size="compact" onClick={() => setPaused(!paused)}>
          {paused ? "Resume scroll" : "Pause scroll"}
        </TRNButton>
        <TRNButton type="button" size="compact" onClick={clear}>
          Clear
        </TRNButton>
        <TRNButton type="button" size="compact" onClick={onCopy}>
          Copy all
        </TRNButton>
        <span className="text-[10px] text-zinc-600">{lines.length} lines</span>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto rounded border border-zinc-800 bg-black/30 font-mono text-[11px] leading-relaxed"
      >
        {lines.length === 0 ? (
          <p className="p-3 text-zinc-600">Connect WS and open serial to see activity.</p>
        ) : (
          <ul className="divide-y divide-zinc-900/80">
            {lines.map((line) => (
              <li key={line.id} className="px-2 py-1">
                <span className="text-zinc-600">[{formatTapTime(line.atMs)}]</span>{" "}
                <span className={TONE_CLASS[line.tone]}>{line.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import type { SensorTestUiStatus } from "../shared/sensorTestShared";

export type LogLine = {
  id: string;
  atMs: number;
  text: string;
  tone: SensorTestUiStatus["tone"];
};

type Props = {
  lines: LogLine[];
};

function toneClass(tone: LogLine["tone"]): string {
  if (tone === "ok") {
    return "text-emerald-400";
  }
  if (tone === "warning") {
    return "text-amber-300";
  }
  if (tone === "error") {
    return "text-red-400";
  }
  return "text-zinc-400";
}

export function MonitorActivityLog(props: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [props.lines.length]);

  return (
    <div className="min-h-[160px] flex-1 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/80 p-2 font-mono text-[11px] leading-relaxed">
      {props.lines.length === 0 ? (
        <div className="text-zinc-600">Activity log — run Quiet bus, presets, or round-trip…</div>
      ) : (
        props.lines.map((line) => (
          <div key={line.id} className={toneClass(line.tone)}>
            <span className="text-zinc-600">
              [{new Date(line.atMs).toISOString().slice(11, 23)}]
            </span>{" "}
            {line.text}
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

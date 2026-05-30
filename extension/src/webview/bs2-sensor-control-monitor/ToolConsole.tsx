import { useEffect, useRef } from "react";
import type { ToolLogLine } from "./tools/monitorToolTypes";

type Props = {
  lines: ToolLogLine[];
  emptyHint?: string;
};

function toneClass(tone: ToolLogLine["tone"]): string {
  if (tone === "pass") {
    return "text-emerald-400";
  }
  if (tone === "fail") {
    return "text-red-400";
  }
  if (tone === "warn") {
    return "text-amber-300";
  }
  if (tone === "cmd") {
    return "text-sky-400";
  }
  return "text-zinc-400";
}

export function ToolConsole(props: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [props.lines.length]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-zinc-800 bg-[#0d1117] p-2 font-mono text-[11px] leading-relaxed">
      {props.lines.length === 0 ? (
        <div className="text-zinc-600">{props.emptyHint ?? "Console output…"}</div>
      ) : (
        props.lines.map((line) => (
          <div key={line.id} className={toneClass(line.tone)}>
            <span className="text-zinc-600">[{new Date(line.atMs).toISOString().slice(11, 23)}]</span>{" "}
            {line.text}
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

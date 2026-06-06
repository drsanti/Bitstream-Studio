import { useEffect, useState } from "react";
import {
  collectVisionHudChips,
  type VisionHudChip,
} from "../../core/camera/collect-vision-hud-chips";
import { visionMediapipeLoadProgress } from "../../core/camera/vision-mediapipe-asset-loader";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";

const TONE_CLASS: Record<VisionHudChip["tone"], string> = {
  idle: "border-zinc-600/70 bg-zinc-900/85 text-zinc-300",
  loading: "border-amber-500/40 bg-amber-950/70 text-amber-100",
  live: "border-emerald-500/45 bg-emerald-950/75 text-emerald-100",
  error: "border-rose-500/45 bg-rose-950/75 text-rose-100",
};

export function StudioVisionDetectionsHud(props: {
  nodes: readonly FlowGraphNode[];
}) {
  const [chips, setChips] = useState<VisionHudChip[]>(() =>
    collectVisionHudChips(props.nodes),
  );

  useEffect(() => {
    const sync = () => setChips(collectVisionHudChips(props.nodes));
    sync();
    const t = window.setInterval(sync, 100);
    const unsub = visionMediapipeLoadProgress.subscribe(sync);
    return () => {
      window.clearInterval(t);
      unsub();
    };
  }, [props.nodes]);

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-2 top-2 z-[12] flex max-w-[min(100%-1rem,280px)] flex-col gap-1">
      {chips.map((chip) => (
        <div
          key={chip.flowNodeId}
          className={`rounded border px-2 py-1 shadow-md backdrop-blur-sm ${TONE_CLASS[chip.tone]}`}
        >
          <div className="text-[10px] font-medium leading-tight">{chip.title}</div>
          <div className="text-[10px] leading-snug opacity-90">{chip.detail}</div>
        </div>
      ))}
    </div>
  );
}

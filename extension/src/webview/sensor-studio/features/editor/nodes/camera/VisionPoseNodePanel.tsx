import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { ReadingLabel } from "../flow-node/readings/ReadingLabel";
import { formatVisionPoseLoadLabel, useVisionPoseUi } from "./vision-pose-chrome";

export function VisionPoseNodePanel(props: { nodeId: string }) {
  const ui = useVisionPoseUi(props.nodeId);
  const loadLabel = formatVisionPoseLoadLabel({
    status: ui.status,
    loadProgressPercent: ui.loadProgressPercent,
  });

  return (
    <ReadingPanel className="space-y-1">
      <ReadingLabel className="mb-0.5 block">Pose</ReadingLabel>
      <div className="text-[11px] text-zinc-300">
        {ui.status === "error"
          ? "Model load failed — check network / WASM access."
          : ui.detected
            ? "Body detected — nose / wrist vectors live."
            : ui.status === "loading"
              ? `Loading MediaPipe pose model… ${loadLabel}`
              : "Waiting for camera feed…"}
      </div>
      {ui.status === "loading" && ui.loadProgressPercent != null ? (
        <div className="h-1 overflow-hidden rounded bg-zinc-800/90">
          <div
            className="h-full bg-emerald-400/85 transition-[width] duration-150 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, ui.loadProgressPercent))}%` }}
          />
        </div>
      ) : null}
      {ui.errorMessage != null ? (
        <div className="text-[10px] leading-snug text-rose-200/85">{ui.errorMessage}</div>
      ) : null}
    </ReadingPanel>
  );
}

import { FlowNodeHeaderBadge } from "../flow-node/FlowNodeHeaderBadge";
import { ReadingLabel } from "../flow-node/readings/ReadingLabel";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import {
  resolveVisionDetectionHeaderBadge,
  resolveVisionLandmarksDebugHeaderBadge,
  useVisionFaceUi,
  useVisionHandsUi,
  useVisionLandmarksDebugUi,
  useVisionObjectUi,
} from "./vision-expansion-chrome";

export function VisionHandsHeaderBadge(props: { nodeId: string }) {
  const ui = useVisionHandsUi(props.nodeId);
  const badge = resolveVisionDetectionHeaderBadge({
    status: ui.status,
    detected: ui.detected,
    labels: {
      idle: "Idle",
      loading: "Loading",
      detected: "Hands",
      scan: "Scan",
      error: "Error",
    },
  });
  if (badge == null) {
    return null;
  }
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}

export function VisionFaceHeaderBadge(props: { nodeId: string }) {
  const ui = useVisionFaceUi(props.nodeId);
  const badge = resolveVisionDetectionHeaderBadge({
    status: ui.status,
    detected: ui.detected,
    labels: {
      idle: "Idle",
      loading: "Loading",
      detected: "Face",
      scan: "Scan",
      error: "Error",
    },
  });
  if (badge == null) {
    return null;
  }
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}

export function VisionObjectHeaderBadge(props: { nodeId: string }) {
  const ui = useVisionObjectUi(props.nodeId);
  const badge = resolveVisionDetectionHeaderBadge({
    status: ui.status,
    detected: ui.detected,
    labels: {
      idle: "Idle",
      loading: "Loading",
      detected: ui.label.length > 0 ? ui.label : "Object",
      scan: "Scan",
      error: "Error",
    },
  });
  if (badge == null) {
    return null;
  }
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}

export function VisionLandmarksDebugHeaderBadge(props: { nodeId: string }) {
  const ui = useVisionLandmarksDebugUi(props.nodeId);
  const badge = resolveVisionLandmarksDebugHeaderBadge(ui);
  if (badge == null) {
    return null;
  }
  return (
    <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
      {badge.label}
    </FlowNodeHeaderBadge>
  );
}

export function VisionHandsNodePanel(props: { nodeId: string }) {
  const ui = useVisionHandsUi(props.nodeId);
  return (
    <ReadingPanel className="space-y-1">
      <ReadingLabel className="mb-0.5 block">Hands</ReadingLabel>
      <div className="text-[11px] text-zinc-300">
        {ui.status === "error"
          ? "Hand model failed — check network / WASM access."
          : ui.detected
            ? "Hands detected — index fingertip vectors live."
            : ui.status === "loading"
              ? "Loading MediaPipe hand model…"
              : "Waiting for camera feed…"}
      </div>
    </ReadingPanel>
  );
}

export function VisionFaceNodePanel(props: { nodeId: string }) {
  const ui = useVisionFaceUi(props.nodeId);
  return (
    <ReadingPanel className="space-y-1">
      <ReadingLabel className="mb-0.5 block">Face</ReadingLabel>
      <div className="text-[11px] text-zinc-300">
        {ui.status === "error"
          ? "Face model failed — check network / WASM access."
          : ui.detected
            ? "Face detected — nose / eye vectors live."
            : ui.status === "loading"
              ? "Loading MediaPipe face model…"
              : "Waiting for camera feed…"}
      </div>
    </ReadingPanel>
  );
}

export function VisionObjectNodePanel(props: { nodeId: string }) {
  const ui = useVisionObjectUi(props.nodeId);
  return (
    <ReadingPanel className="space-y-1">
      <ReadingLabel className="mb-0.5 block">Objects</ReadingLabel>
      <div className="text-[11px] text-zinc-300">
        {ui.status === "error"
          ? "Object detector failed — check network / WASM access."
          : ui.detected
            ? `${ui.count} detection(s) — top: ${ui.label || "unknown"} (${ui.score.toFixed(2)})`
            : ui.status === "loading"
              ? "Loading object detector…"
              : "Waiting for camera feed…"}
      </div>
    </ReadingPanel>
  );
}

export function VisionLandmarksDebugNodePanel(props: { nodeId: string }) {
  const ui = useVisionLandmarksDebugUi(props.nodeId);
  const preview =
    ui.json.length > 72 ? `${ui.json.slice(0, 69)}…` : ui.json;
  return (
    <ReadingPanel className="space-y-1">
      <ReadingLabel className="mb-0.5 block">Landmarks JSON</ReadingLabel>
      <div className="text-[11px] text-zinc-300">
        {ui.status === "error"
          ? "Pose debug failed — check network / WASM access."
          : ui.status === "loading"
            ? "Loading pose model for debug export…"
            : ui.count > 0
              ? `${ui.count} landmarks — wire json to a string sink or logger.`
              : "No pose landmarks yet."}
      </div>
      {ui.status === "ready" && ui.count > 0 ? (
        <div className="break-all text-[10px] leading-snug text-zinc-400">{preview}</div>
      ) : null}
    </ReadingPanel>
  );
}

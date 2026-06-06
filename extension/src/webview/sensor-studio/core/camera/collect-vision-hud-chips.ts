import { formatVisionMediapipeLoadPercent, visionMediapipeLoadProgress } from "./vision-mediapipe-asset-loader";
import { isVisionInferenceNodeId } from "./evaluate-vision-flow-nodes";
import { studioVisionFaceRuntime } from "./studio-vision-face-runtime";
import { studioVisionHandsRuntime } from "./studio-vision-hands-runtime";
import { studioVisionLandmarksDebugRuntime } from "./studio-vision-landmarks-debug-runtime";
import { studioVisionObjectRuntime } from "./studio-vision-object-runtime";
import { studioVisionPoseRuntime } from "./studio-vision-pose-runtime";

export type VisionHudChip = {
  flowNodeId: string;
  catalogNodeId: string;
  title: string;
  tone: "idle" | "loading" | "live" | "error";
  detail: string;
};

function nodeTitle(label: unknown, catalogNodeId: string): string {
  if (typeof label === "string" && label.trim().length > 0) {
    return label.trim();
  }
  return catalogNodeId;
}

export function collectVisionHudChips(
  nodes: readonly {
    id: string;
    data: { nodeId: string; label?: string };
  }[],
): VisionHudChip[] {
  const chips: VisionHudChip[] = [];
  for (const node of nodes) {
    const catalogNodeId = node.data.nodeId;
    if (!isVisionInferenceNodeId(catalogNodeId)) {
      continue;
    }
    const title = nodeTitle(node.data.label, catalogNodeId);
    if (catalogNodeId === "vision-pose") {
      const snap = studioVisionPoseRuntime.getSnapshot(node.id);
      chips.push({
        flowNodeId: node.id,
        catalogNodeId,
        title,
        tone:
          snap.status === "error"
            ? "error"
            : snap.status === "loading"
              ? "loading"
              : snap.detected
                ? "live"
                : "idle",
        detail:
          snap.status === "error"
            ? snap.errorMessage ?? "Error"
            : snap.detected
              ? `score ${snap.score.toFixed(2)}`
              : snap.status === "loading"
                ? formatVisionMediapipeLoadPercent(
                    snap.loadProgressPercent ?? visionMediapipeLoadProgress.getState().percent,
                  )
                : "Scanning",
      });
      continue;
    }
    if (catalogNodeId === "vision-hands") {
      const snap = studioVisionHandsRuntime.getSnapshot(node.id);
      chips.push({
        flowNodeId: node.id,
        catalogNodeId,
        title,
        tone:
          snap.status === "error"
            ? "error"
            : snap.status === "loading"
              ? "loading"
              : snap.detected
                ? "live"
                : "idle",
        detail: snap.detected ? `score ${snap.score.toFixed(2)}` : "Scanning",
      });
      continue;
    }
    if (catalogNodeId === "vision-face") {
      const snap = studioVisionFaceRuntime.getSnapshot(node.id);
      chips.push({
        flowNodeId: node.id,
        catalogNodeId,
        title,
        tone:
          snap.status === "error"
            ? "error"
            : snap.status === "loading"
              ? "loading"
              : snap.detected
                ? "live"
                : "idle",
        detail: snap.detected ? `score ${snap.score.toFixed(2)}` : "Scanning",
      });
      continue;
    }
    if (catalogNodeId === "vision-object") {
      const snap = studioVisionObjectRuntime.getSnapshot(node.id);
      chips.push({
        flowNodeId: node.id,
        catalogNodeId,
        title,
        tone:
          snap.status === "error"
            ? "error"
            : snap.status === "loading"
              ? "loading"
              : snap.detected
                ? "live"
                : "idle",
        detail: snap.detected
          ? `${snap.label || "object"} (${snap.count})`
          : "Scanning",
      });
      continue;
    }
    if (catalogNodeId === "vision-landmarks-debug") {
      const snap = studioVisionLandmarksDebugRuntime.getSnapshot(node.id);
      chips.push({
        flowNodeId: node.id,
        catalogNodeId,
        title,
        tone:
          snap.status === "error"
            ? "error"
            : snap.status === "loading"
              ? "loading"
              : snap.count > 0
                ? "live"
                : "idle",
        detail: snap.count > 0 ? `${snap.count} landmarks` : "No pose",
      });
    }
  }
  return chips;
}

export function graphHasVisionHudNodes(
  nodes: readonly { data: { nodeId: string } }[],
): boolean {
  return nodes.some((n) => isVisionInferenceNodeId(n.data.nodeId));
}

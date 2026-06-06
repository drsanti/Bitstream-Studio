import { useEffect, useState } from "react";
import { studioVisionFaceRuntime } from "../../../../core/camera/studio-vision-face-runtime";
import { studioVisionHandsRuntime } from "../../../../core/camera/studio-vision-hands-runtime";
import { studioVisionLandmarksDebugRuntime } from "../../../../core/camera/studio-vision-landmarks-debug-runtime";
import { studioVisionObjectRuntime } from "../../../../core/camera/studio-vision-object-runtime";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

type VisionUiStatus = "idle" | "loading" | "ready" | "error";

function useVisionRuntimePoll<T extends { status: VisionUiStatus; detected?: boolean; errorMessage?: string }>(
  nodeId: string,
  read: (id: string) => T,
): T {
  const [ui, setUi] = useState(() => read(nodeId));
  useEffect(() => {
    const sync = () => setUi(read(nodeId));
    sync();
    const t = window.setInterval(sync, 250);
    return () => window.clearInterval(t);
  }, [nodeId, read]);
  return ui;
}

export function useVisionHandsUi(nodeId: string) {
  return useVisionRuntimePoll(nodeId, studioVisionHandsRuntime.getSnapshot.bind(studioVisionHandsRuntime));
}

export function useVisionFaceUi(nodeId: string) {
  return useVisionRuntimePoll(nodeId, studioVisionFaceRuntime.getSnapshot.bind(studioVisionFaceRuntime));
}

export function useVisionObjectUi(nodeId: string) {
  return useVisionRuntimePoll(nodeId, studioVisionObjectRuntime.getSnapshot.bind(studioVisionObjectRuntime));
}

export function useVisionLandmarksDebugUi(nodeId: string) {
  return useVisionRuntimePoll(
    nodeId,
    studioVisionLandmarksDebugRuntime.getSnapshot.bind(studioVisionLandmarksDebugRuntime),
  );
}

export function resolveVisionDetectionHeaderBadge(ui: {
  status: VisionUiStatus;
  detected?: boolean;
  labels?: { idle: string; loading: string; detected: string; scan: string; error: string };
}): { label: string; tone: FlowNodeHeaderBadgeTone; pulseDot: boolean } | null {
  const labels = ui.labels ?? {
    idle: "Idle",
    loading: "Loading",
    detected: "Detected",
    scan: "Scan",
    error: "Error",
  };
  if (ui.status === "error") {
    return { label: labels.error, tone: "invalid", pulseDot: false };
  }
  if (ui.status === "loading") {
    return { label: labels.loading, tone: "neutral", pulseDot: true };
  }
  if (ui.detected) {
    return { label: labels.detected, tone: "live", pulseDot: true };
  }
  if (ui.status === "ready") {
    return { label: labels.scan, tone: "neutral", pulseDot: false };
  }
  return null;
}

export function resolveVisionLandmarksDebugHeaderBadge(ui: {
  status: VisionUiStatus;
  count: number;
}): { label: string; tone: FlowNodeHeaderBadgeTone; pulseDot: boolean } | null {
  if (ui.status === "error") {
    return { label: "Error", tone: "invalid", pulseDot: false };
  }
  if (ui.status === "loading") {
    return { label: "Loading", tone: "neutral", pulseDot: true };
  }
  if (ui.status === "ready" && ui.count > 0) {
    return { label: `${ui.count} pts`, tone: "live", pulseDot: false };
  }
  if (ui.status === "ready") {
    return { label: "No pose", tone: "neutral", pulseDot: false };
  }
  return null;
}

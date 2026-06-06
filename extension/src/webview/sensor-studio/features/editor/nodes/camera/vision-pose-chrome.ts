import { useEffect, useState } from "react";
import { studioVisionPoseRuntime } from "../../../../core/camera/studio-vision-pose-runtime";
import { formatVisionMediapipeLoadPercent, visionMediapipeLoadProgress } from "../../../../core/camera/vision-mediapipe-asset-loader";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export function useVisionPoseUi(nodeId: string): {
  status: "idle" | "loading" | "ready" | "error";
  detected: boolean;
  loadProgressPercent: number | null;
  errorMessage?: string;
} {
  const [ui, setUi] = useState(() => {
    const snap = studioVisionPoseRuntime.getSnapshot(nodeId);
    return {
      status: snap.status,
      detected: snap.detected,
      loadProgressPercent: snap.loadProgressPercent ?? null,
      errorMessage: snap.errorMessage,
    };
  });

  useEffect(() => {
    const sync = () => {
      const snap = studioVisionPoseRuntime.getSnapshot(nodeId);
      setUi({
        status: snap.status,
        detected: snap.detected,
        loadProgressPercent: snap.loadProgressPercent ?? null,
        errorMessage: snap.errorMessage,
      });
    };
    sync();
    const t = window.setInterval(sync, 100);
    const unsub = visionMediapipeLoadProgress.subscribe(sync);
    return () => {
      window.clearInterval(t);
      unsub();
    };
  }, [nodeId]);

  return ui;
}

export function formatVisionPoseLoadLabel(args: {
  status: "idle" | "loading" | "ready" | "error";
  loadProgressPercent: number | null;
}): string {
  if (args.status !== "loading") {
    return "Loading";
  }
  return formatVisionMediapipeLoadPercent(args.loadProgressPercent);
}

export function resolveVisionPoseHeaderBadge(ui: {
  status: "idle" | "loading" | "ready" | "error";
  detected: boolean;
  loadProgressPercent: number | null;
}): { label: string; tone: FlowNodeHeaderBadgeTone; pulseDot: boolean } | null {
  if (ui.status === "error") {
    return { label: "Error", tone: "invalid", pulseDot: false };
  }
  if (ui.status === "loading") {
    return {
      label: formatVisionPoseLoadLabel(ui),
      tone: "neutral",
      pulseDot: true,
    };
  }
  if (ui.detected) {
    return { label: "Pose", tone: "live", pulseDot: true };
  }
  if (ui.status === "ready") {
    return { label: "Scan", tone: "neutral", pulseDot: false };
  }
  return null;
}

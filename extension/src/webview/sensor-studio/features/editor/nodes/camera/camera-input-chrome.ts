import { useEffect, useState } from "react";
import { studioCameraRuntime } from "../../../../core/camera/studio-camera-runtime";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export type CameraInputRuntimeUi = {
  enabled: boolean;
  status: "idle" | "requesting" | "active" | "denied" | "error";
  errorMessage?: string;
};

export function useCameraInputRuntimeUi(nodeId: string): CameraInputRuntimeUi {
  const [ui, setUi] = useState<CameraInputRuntimeUi>(() =>
    studioCameraRuntime.getCameraUiState(nodeId),
  );

  useEffect(() => {
    const t = window.setInterval(() => {
      setUi(studioCameraRuntime.getCameraUiState(nodeId));
    }, 250);
    return () => window.clearInterval(t);
  }, [nodeId]);

  return ui;
}

export type CameraInputHeaderBadgeView = {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
};

export function resolveCameraInputHeaderBadge(
  runtime: CameraInputRuntimeUi,
  configEnabled: boolean,
): CameraInputHeaderBadgeView | null {
  if (!configEnabled) {
    return null;
  }

  if (runtime.status === "active") {
    return { label: "Live", tone: "live", pulseDot: true };
  }
  if (runtime.status === "requesting") {
    return { label: "Requesting", tone: "family", pulseDot: false };
  }
  if (runtime.status === "denied") {
    return { label: "Denied", tone: "stale", pulseDot: false };
  }
  if (runtime.status === "error") {
    return { label: "Error", tone: "invalid", pulseDot: false };
  }

  return { label: "Idle", tone: "neutral", pulseDot: false };
}

export function cameraInputCardErrorLine(
  runtime: CameraInputRuntimeUi,
  configEnabled: boolean,
): string | null {
  if (runtime.errorMessage != null && runtime.errorMessage.trim().length > 0) {
    return runtime.errorMessage.trim();
  }
  if (configEnabled && runtime.status === "denied") {
    return "Camera permission denied — check webview / browser settings.";
  }
  return null;
}

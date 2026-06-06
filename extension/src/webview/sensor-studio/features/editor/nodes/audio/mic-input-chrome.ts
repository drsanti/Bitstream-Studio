import { useEffect, useState } from "react";
import { studioAudioRuntime } from "../../../../core/audio/studio-audio-runtime";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export type MicInputRuntimeUi = {
  enabled: boolean;
  status: "idle" | "requesting" | "active" | "denied" | "error";
  errorMessage?: string;
};

export function useMicInputRuntimeUi(nodeId: string): MicInputRuntimeUi {
  const [ui, setUi] = useState<MicInputRuntimeUi>(() =>
    studioAudioRuntime.getMicUiState(nodeId),
  );

  useEffect(() => {
    const t = window.setInterval(() => {
      setUi(studioAudioRuntime.getMicUiState(nodeId));
    }, 250);
    return () => window.clearInterval(t);
  }, [nodeId]);

  return ui;
}

export type MicInputHeaderBadgeView = {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
};

/** Header badge when capture is enabled or runtime reports a non-idle state. */
export function resolveMicInputHeaderBadge(
  runtime: MicInputRuntimeUi,
  configEnabled: boolean,
): MicInputHeaderBadgeView | null {
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

export function micInputCardErrorLine(
  runtime: MicInputRuntimeUi,
  configEnabled: boolean,
): string | null {
  if (runtime.errorMessage != null && runtime.errorMessage.trim().length > 0) {
    return runtime.errorMessage.trim();
  }
  if (configEnabled && runtime.status === "denied") {
    return "Microphone permission denied — check webview / browser settings.";
  }
  return null;
}

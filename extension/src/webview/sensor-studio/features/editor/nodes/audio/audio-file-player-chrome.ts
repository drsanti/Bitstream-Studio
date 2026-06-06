import { useEffect, useState } from "react";
import { studioAudioRuntime } from "../../../../core/audio/studio-audio-runtime";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export type FilePlayerRuntimeUi = {
  enabled: boolean;
  status: "idle" | "loading" | "ready" | "error";
  errorMessage?: string;
};

export type FilePlayerTransportUi = {
  playing: boolean;
  timeS: number;
  durationS: number;
};

export function useFilePlayerRuntimeUi(nodeId: string): FilePlayerRuntimeUi {
  const [ui, setUi] = useState<FilePlayerRuntimeUi>(() =>
    studioAudioRuntime.getFilePlayerUiState(nodeId),
  );

  useEffect(() => {
    const t = window.setInterval(() => {
      setUi(studioAudioRuntime.getFilePlayerUiState(nodeId));
    }, 250);
    return () => window.clearInterval(t);
  }, [nodeId]);

  return ui;
}

export function useFilePlayerTransportUi(nodeId: string): FilePlayerTransportUi {
  const [transport, setTransport] = useState<FilePlayerTransportUi>(() =>
    studioAudioRuntime.getFilePlayerTransport(nodeId),
  );

  useEffect(() => {
    const t = window.setInterval(() => {
      setTransport(studioAudioRuntime.getFilePlayerTransport(nodeId));
    }, 250);
    return () => window.clearInterval(t);
  }, [nodeId]);

  return transport;
}

export type FilePlayerHeaderBadgeView = {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
};

export function resolveFilePlayerHeaderBadge(
  runtime: FilePlayerRuntimeUi,
  configEnabled: boolean,
  gate: boolean,
  playing: boolean,
): FilePlayerHeaderBadgeView | null {
  if (!configEnabled) {
    return null;
  }
  if (runtime.status === "error") {
    return { label: "Error", tone: "invalid", pulseDot: false };
  }
  if (runtime.status === "loading") {
    return { label: "Loading", tone: "family", pulseDot: false };
  }
  if (gate && playing) {
    return { label: "Playing", tone: "live", pulseDot: true };
  }
  if (runtime.status === "ready") {
    return { label: "Ready", tone: "neutral", pulseDot: false };
  }
  return null;
}

export function filePlayerWiredInputParts(flags: {
  isGateWired: boolean;
  isGainWired: boolean;
}): string[] {
  return [
    ...(flags.isGateWired ? ["Gate"] : []),
    ...(flags.isGainWired ? ["Gain"] : []),
  ];
}

export function resolveFilePlayerGate(
  defaultConfig: Record<string, unknown>,
  liveInputGate: boolean | undefined,
  isGateWired: boolean,
): boolean {
  if (isGateWired && typeof liveInputGate === "boolean") {
    return liveInputGate;
  }
  return defaultConfig.gate === true;
}

export function filePlayerCardErrorLine(runtime: FilePlayerRuntimeUi): string | null {
  if (runtime.errorMessage != null && runtime.errorMessage.trim().length > 0) {
    return runtime.errorMessage.trim();
  }
  return null;
}

export function formatFilePlayerTransportClock(timeS: number, durationS: number): string {
  const t = Number.isFinite(timeS) ? Math.max(0, timeS) : 0;
  const d = Number.isFinite(durationS) ? Math.max(0, durationS) : 0;
  if (d > 0) {
    return `${t.toFixed(1)} s / ${d.toFixed(1)} s`;
  }
  return `${t.toFixed(1)} s`;
}

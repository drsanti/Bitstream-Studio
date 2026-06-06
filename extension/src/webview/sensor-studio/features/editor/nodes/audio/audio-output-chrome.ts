import { useEffect, useState } from "react";
import { studioAudioRuntime } from "../../../../core/audio/studio-audio-runtime";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export type AudioOutputRuntimeUi = {
  enabled: boolean;
  status: "idle" | "running" | "suspended" | "error";
  errorMessage?: string;
};

export function useAudioOutputRuntimeUi(): AudioOutputRuntimeUi {
  const [ui, setUi] = useState<AudioOutputRuntimeUi>(() =>
    studioAudioRuntime.getMasterUiState(),
  );

  useEffect(() => {
    const t = window.setInterval(() => {
      setUi(studioAudioRuntime.getMasterUiState());
    }, 250);
    return () => window.clearInterval(t);
  }, []);

  return ui;
}

export type AudioOutputHeaderBadgeView = {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
};

export function resolveAudioOutputHeaderBadge(
  runtime: AudioOutputRuntimeUi,
  configEnabled: boolean,
): AudioOutputHeaderBadgeView | null {
  if (!configEnabled) {
    return null;
  }

  if (runtime.status === "running") {
    return { label: "Running", tone: "live", pulseDot: true };
  }
  if (runtime.status === "suspended") {
    return { label: "Suspended", tone: "stale", pulseDot: false };
  }
  if (runtime.status === "error") {
    return { label: "Error", tone: "invalid", pulseDot: false };
  }

  return { label: "Idle", tone: "neutral", pulseDot: false };
}

export function audioOutputWiredInputParts(flags: {
  isGateWired: boolean;
  isGainWired: boolean;
}): string[] {
  return [
    ...(flags.isGateWired ? ["Gate"] : []),
    ...(flags.isGainWired ? ["Gain"] : []),
  ];
}

export function resolveAudioOutputGate(
  defaultConfig: Record<string, unknown>,
  liveInputGate: boolean | undefined,
  isGateWired: boolean,
): boolean {
  if (isGateWired && typeof liveInputGate === "boolean") {
    return liveInputGate;
  }
  return defaultConfig.gate === true;
}

export function audioOutputCardErrorLine(runtime: AudioOutputRuntimeUi): string | null {
  if (runtime.errorMessage != null && runtime.errorMessage.trim().length > 0) {
    return runtime.errorMessage.trim();
  }
  return null;
}

const AUDIO_OUTPUT_DEFAULT_MAX_GAIN = 0.25;

function readFiniteNumber(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Safety cap for Audio Output gain (0..1). Matches flow card + runtime. */
export function readAudioOutputMaxGain(raw: unknown): number {
  return Math.max(0, Math.min(1, readFiniteNumber(raw, AUDIO_OUTPUT_DEFAULT_MAX_GAIN)));
}

/** Clamps default gain to [0, maxGain] for display, scrub, and commit. */
export function clampAudioOutputGain(gain: unknown, maxGain: number): number {
  const cappedMax = readAudioOutputMaxGain(maxGain);
  return Math.max(0, Math.min(cappedMax, readFiniteNumber(gain, 0)));
}

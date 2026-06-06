import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export const AUDIO_SCOPE_MODE_OPTIONS = [
  { value: "waveform", label: "Waveform" },
  { value: "spectrum", label: "Spectrum" },
  { value: "both", label: "Both" },
] as const;

/** Compact segment labels for the flow card (three equal buttons in one row). */
export const AUDIO_SCOPE_MODE_CARD_SEGMENT_OPTIONS = [
  { value: "waveform", label: "Wave", hint: "Time-domain waveform" },
  { value: "spectrum", label: "Spec", hint: "FFT spectrum bars" },
  { value: "both", label: "Both", hint: "Waveform and spectrum overlay" },
] as const;

import { ANALYSER_FFT_SIZE_OPTIONS } from "../../../../core/audio/clamp-analyser-fft-size";

/** Scope card / inspector FFT picker (subset of full analyser sizes). */
export const AUDIO_SCOPE_FFT_OPTIONS = ANALYSER_FFT_SIZE_OPTIONS.filter(
  (o) => Number(o.value) >= 256,
);

export type AudioScopeHeaderBadgeView = {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
};

export function resolveAudioScopeHeaderBadge(
  enabled: boolean,
  mode: string,
): AudioScopeHeaderBadgeView | null {
  if (!enabled) {
    return null;
  }

  const label =
    mode === "spectrum" ? "Spectrum" : mode === "both" ? "Both" : "Waveform";

  return { label, tone: "family", pulseDot: false };
}

export function audioScopeWiredInputParts(flags: { isEnabledWired: boolean }): string[] {
  return flags.isEnabledWired ? ["Enabled"] : [];
}

export function resolveAudioScopeEnabled(
  defaultConfig: Record<string, unknown>,
  liveInputEnabled: boolean | undefined,
  isEnabledWired: boolean,
): boolean {
  if (isEnabledWired && typeof liveInputEnabled === "boolean") {
    return liveInputEnabled;
  }
  return defaultConfig.enabled !== false;
}

export function formatAudioScopeModeLabel(mode: string): string {
  const match = AUDIO_SCOPE_MODE_OPTIONS.find((o) => o.value === mode);
  return match?.label ?? mode;
}

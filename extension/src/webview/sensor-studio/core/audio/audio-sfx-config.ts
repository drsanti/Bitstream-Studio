import type { SweepCurve, SweepDirection } from "./oscillator-sweep";

export type AudioSfxPresetId = "riser" | "downer" | "siren" | "beep" | "noise-burst";

export type AudioSfxPreset = {
  id: AudioSfxPresetId;
  label: string;
  hint: string;
  waveform: "sine" | "square" | "sawtooth" | "triangle";
  sourceKind: "tone" | "noise";
  startHz: number;
  endHz: number;
  durationS: number;
  curve: SweepCurve;
  direction: SweepDirection;
  gain: number;
  attackMs: number;
  releaseMs: number;
};

export const AUDIO_SFX_PRESETS: readonly AudioSfxPreset[] = [
  {
    id: "riser",
    label: "Riser",
    hint: "Log up-sweep with a soft attack — good for builds and transitions.",
    waveform: "sawtooth",
    sourceKind: "tone",
    startHz: 120,
    endHz: 4800,
    durationS: 1.8,
    curve: "log",
    direction: "up",
    gain: 0.12,
    attackMs: 40,
    releaseMs: 180,
  },
  {
    id: "downer",
    label: "Downer",
    hint: "Log down-sweep — impacts and drops.",
    waveform: "sine",
    sourceKind: "tone",
    startHz: 2400,
    endHz: 80,
    durationS: 1.2,
    curve: "log",
    direction: "down",
    gain: 0.14,
    attackMs: 8,
    releaseMs: 220,
  },
  {
    id: "siren",
    label: "Siren",
    hint: "Up-down tone sweep for alarms and sci-fi cues.",
    waveform: "square",
    sourceKind: "tone",
    startHz: 280,
    endHz: 920,
    durationS: 1.5,
    curve: "linear",
    direction: "up-down",
    gain: 0.08,
    attackMs: 20,
    releaseMs: 120,
  },
  {
    id: "beep",
    label: "Beep",
    hint: "Short fixed-tone blip for UI and telemetry acks.",
    waveform: "sine",
    sourceKind: "tone",
    startHz: 880,
    endHz: 880,
    durationS: 0.12,
    curve: "linear",
    direction: "up",
    gain: 0.1,
    attackMs: 4,
    releaseMs: 60,
  },
  {
    id: "noise-burst",
    label: "Noise burst",
    hint: "Filtered-noise whoosh placeholder — band-limited burst.",
    waveform: "sawtooth",
    sourceKind: "noise",
    startHz: 400,
    endHz: 1200,
    durationS: 0.45,
    curve: "log",
    direction: "down",
    gain: 0.09,
    attackMs: 6,
    releaseMs: 140,
  },
] as const;

export function readAudioSfxPresetId(raw: unknown): AudioSfxPresetId {
  const hit = AUDIO_SFX_PRESETS.find((p) => p.id === raw);
  return hit?.id ?? "riser";
}

export function resolveAudioSfxPreset(raw: unknown): AudioSfxPreset {
  return AUDIO_SFX_PRESETS.find((p) => p.id === readAudioSfxPresetId(raw)) ?? AUDIO_SFX_PRESETS[0]!;
}

export function applyAudioSfxPresetToConfig(
  preset: AudioSfxPreset,
): Record<string, unknown> {
  return {
    preset: preset.id,
    waveform: preset.waveform,
    sourceKind: preset.sourceKind,
    startHz: preset.startHz,
    endHz: preset.endHz,
    durationS: preset.durationS,
    curve: preset.curve,
    direction: preset.direction,
    gain: preset.gain,
    attackMs: preset.attackMs,
    releaseMs: preset.releaseMs,
  };
}

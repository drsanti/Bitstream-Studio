import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export type OscillatorHeaderBadgeView = {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
};

export function resolveOscillatorHeaderBadge(gate: boolean): OscillatorHeaderBadgeView | null {
  if (!gate) {
    return null;
  }
  return { label: "Playing", tone: "live", pulseDot: true };
}

export function oscillatorWiredInputParts(flags: {
  isFreqWired: boolean;
  isGainWired: boolean;
  isGateWired: boolean;
}): string[] {
  return [
    ...(flags.isFreqWired ? ["Freq"] : []),
    ...(flags.isGainWired ? ["Gain"] : []),
    ...(flags.isGateWired ? ["Gate"] : []),
  ];
}

export function resolveOscillatorGate(
  defaultConfig: Record<string, unknown>,
  liveInputGate: boolean | undefined,
  isGateWired: boolean,
): boolean {
  if (isGateWired && typeof liveInputGate === "boolean") {
    return liveInputGate;
  }
  return defaultConfig.gate === true;
}

export function formatOscillatorLiveScalar(raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw.toFixed(3);
  }
  return "—";
}

export const OSCILLATOR_WAVEFORM_OPTIONS = [
  { value: "sine", label: "Sine" },
  { value: "square", label: "Square" },
  { value: "sawtooth", label: "Sawtooth" },
  { value: "triangle", label: "Triangle" },
] as const;

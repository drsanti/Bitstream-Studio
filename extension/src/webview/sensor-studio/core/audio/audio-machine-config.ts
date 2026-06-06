export type AudioMachineFamilyId = "motor" | "engine" | "drone" | "machine";

export type MotorPresetId = "servo" | "cnc-spindle" | "ev-motor";

export type MotorPreset = {
  id: MotorPresetId;
  label: string;
  hint: string;
  whineBaseHz: number;
  whineSpanHz: number;
  harmonicMix: number;
  rippleMix: number;
  noiseMix: number;
  gain: number;
};

export const MOTOR_MACHINE_PRESETS: readonly MotorPreset[] = [
  {
    id: "servo",
    label: "Servo",
    hint: "Soft electric sweep — good for actuators and positioning axes.",
    whineBaseHz: 80,
    whineSpanHz: 1200,
    harmonicMix: 0.15,
    rippleMix: 0.22,
    noiseMix: 0.05,
    gain: 0.1,
  },
  {
    id: "cnc-spindle",
    label: "CNC spindle",
    hint: "Bright high-band whine with torque ripple.",
    whineBaseHz: 200,
    whineSpanHz: 4200,
    harmonicMix: 0.35,
    rippleMix: 0.45,
    noiseMix: 0.08,
    gain: 0.09,
  },
  {
    id: "ev-motor",
    label: "EV motor",
    hint: "Cleaner low-mid whine for traction and pump motors.",
    whineBaseHz: 60,
    whineSpanHz: 900,
    harmonicMix: 0.1,
    rippleMix: 0.12,
    noiseMix: 0.03,
    gain: 0.11,
  },
] as const;

export function readMotorPresetId(raw: unknown): MotorPresetId {
  const hit = MOTOR_MACHINE_PRESETS.find((p) => p.id === raw);
  return hit?.id ?? "servo";
}

export function resolveMotorPreset(raw: unknown): MotorPreset {
  return (
    MOTOR_MACHINE_PRESETS.find((p) => p.id === readMotorPresetId(raw)) ??
    MOTOR_MACHINE_PRESETS[0]!
  );
}

export function readMachineFamilyId(raw: unknown): AudioMachineFamilyId {
  if (raw === "engine" || raw === "drone" || raw === "machine") {
    return raw;
  }
  return "motor";
}

export function applyMotorPresetToConfig(preset: MotorPreset): Record<string, unknown> {
  return {
    family: "motor",
    preset: preset.id,
    whineBaseHz: preset.whineBaseHz,
    whineSpanHz: preset.whineSpanHz,
    harmonicMix: preset.harmonicMix,
    rippleMix: preset.rippleMix,
    noiseMix: preset.noiseMix,
    gain: preset.gain,
  };
}

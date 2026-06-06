export type AudioMachineFamilyId = "motor" | "engine" | "drone" | "machine";

export type MotorPresetId = "servo" | "cnc-spindle" | "ev-motor";
export type EnginePresetId = "inline-4" | "v6" | "diesel";
export type DronePresetId = "quad-small" | "hex-cine" | "racing-quad";
export type IndustrialPresetId = "conveyor" | "lathe" | "press";

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

export type EnginePreset = {
  id: EnginePresetId;
  label: string;
  hint: string;
  rumbleBaseHz: number;
  rumbleSpanHz: number;
  cylinders: number;
  roughness: number;
  turboMix: number;
  gain: number;
};

export type DronePreset = {
  id: DronePresetId;
  label: string;
  hint: string;
  motorBaseHz: number;
  motorSpanHz: number;
  motorCount: number;
  detuneCents: number;
  washMix: number;
  gain: number;
};

export type IndustrialPreset = {
  id: IndustrialPresetId;
  label: string;
  hint: string;
  cycleBaseHz: number;
  cycleSpanHz: number;
  frictionMix: number;
  clankMix: number;
  gain: number;
};

export const MACHINE_FAMILY_OPTIONS: readonly {
  id: AudioMachineFamilyId;
  label: string;
}[] = [
  { id: "motor", label: "Motor" },
  { id: "engine", label: "Engine" },
  { id: "drone", label: "Drone" },
  { id: "machine", label: "Industrial" },
] as const;

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

export const ENGINE_MACHINE_PRESETS: readonly EnginePreset[] = [
  {
    id: "inline-4",
    label: "Inline-4",
    hint: "Balanced four-cylinder rumble with light turbo whistle at high RPM.",
    rumbleBaseHz: 38,
    rumbleSpanHz: 95,
    cylinders: 4,
    roughness: 0.28,
    turboMix: 0.18,
    gain: 0.12,
  },
  {
    id: "v6",
    label: "V6",
    hint: "Smoother six-cylinder character with stronger turbo presence.",
    rumbleBaseHz: 42,
    rumbleSpanHz: 110,
    cylinders: 6,
    roughness: 0.16,
    turboMix: 0.28,
    gain: 0.11,
  },
  {
    id: "diesel",
    label: "Diesel",
    hint: "Low rumble, rough exhaust texture, minimal turbo.",
    rumbleBaseHz: 28,
    rumbleSpanHz: 70,
    cylinders: 4,
    roughness: 0.48,
    turboMix: 0.06,
    gain: 0.14,
  },
] as const;

export const DRONE_MACHINE_PRESETS: readonly DronePreset[] = [
  {
    id: "quad-small",
    label: "Quad (small)",
    hint: "Four-motor whine with moderate blade wash.",
    motorBaseHz: 120,
    motorSpanHz: 620,
    motorCount: 4,
    detuneCents: 8,
    washMix: 0.34,
    gain: 0.09,
  },
  {
    id: "hex-cine",
    label: "Hex (cine)",
    hint: "Six-motor spread with softer wash for camera rigs.",
    motorBaseHz: 90,
    motorSpanHz: 420,
    motorCount: 6,
    detuneCents: 11,
    washMix: 0.26,
    gain: 0.1,
  },
  {
    id: "racing-quad",
    label: "Racing quad",
    hint: "Aggressive high-band motors with tight detune.",
    motorBaseHz: 210,
    motorSpanHz: 1300,
    motorCount: 4,
    detuneCents: 16,
    washMix: 0.2,
    gain: 0.11,
  },
] as const;

export const INDUSTRIAL_MACHINE_PRESETS: readonly IndustrialPreset[] = [
  {
    id: "conveyor",
    label: "Conveyor",
    hint: "Low cycle rhythm with roller friction — good for belt speed demos.",
    cycleBaseHz: 1.2,
    cycleSpanHz: 7,
    frictionMix: 0.36,
    clankMix: 0.22,
    gain: 0.1,
  },
  {
    id: "lathe",
    label: "Lathe",
    hint: "Faster spindle cycle with steady cutting friction.",
    cycleBaseHz: 4,
    cycleSpanHz: 36,
    frictionMix: 0.44,
    clankMix: 0.14,
    gain: 0.09,
  },
  {
    id: "press",
    label: "Press",
    hint: "Slow heavy strokes with pronounced clank on Trigger.",
    cycleBaseHz: 0.5,
    cycleSpanHz: 2.5,
    frictionMix: 0.3,
    clankMix: 0.42,
    gain: 0.12,
  },
] as const;

export function readMachineFamilyId(raw: unknown): AudioMachineFamilyId {
  if (raw === "engine" || raw === "drone" || raw === "machine") {
    return raw;
  }
  return "motor";
}

export function readMotorPresetId(raw: unknown): MotorPresetId {
  const hit = MOTOR_MACHINE_PRESETS.find((p) => p.id === raw);
  return hit?.id ?? "servo";
}

export function readEnginePresetId(raw: unknown): EnginePresetId {
  const hit = ENGINE_MACHINE_PRESETS.find((p) => p.id === raw);
  return hit?.id ?? "inline-4";
}

export function readDronePresetId(raw: unknown): DronePresetId {
  const hit = DRONE_MACHINE_PRESETS.find((p) => p.id === raw);
  return hit?.id ?? "quad-small";
}

export function readIndustrialPresetId(raw: unknown): IndustrialPresetId {
  const hit = INDUSTRIAL_MACHINE_PRESETS.find((p) => p.id === raw);
  return hit?.id ?? "conveyor";
}

export function resolveMotorPreset(raw: unknown): MotorPreset {
  return (
    MOTOR_MACHINE_PRESETS.find((p) => p.id === readMotorPresetId(raw)) ??
    MOTOR_MACHINE_PRESETS[0]!
  );
}

export function resolveEnginePreset(raw: unknown): EnginePreset {
  return (
    ENGINE_MACHINE_PRESETS.find((p) => p.id === readEnginePresetId(raw)) ??
    ENGINE_MACHINE_PRESETS[0]!
  );
}

export function resolveDronePreset(raw: unknown): DronePreset {
  return (
    DRONE_MACHINE_PRESETS.find((p) => p.id === readDronePresetId(raw)) ??
    DRONE_MACHINE_PRESETS[0]!
  );
}

export function resolveIndustrialPreset(raw: unknown): IndustrialPreset {
  return (
    INDUSTRIAL_MACHINE_PRESETS.find((p) => p.id === readIndustrialPresetId(raw)) ??
    INDUSTRIAL_MACHINE_PRESETS[0]!
  );
}

export function readMachinePresetId(family: AudioMachineFamilyId, raw: unknown): string {
  if (family === "engine") {
    return readEnginePresetId(raw);
  }
  if (family === "drone") {
    return readDronePresetId(raw);
  }
  if (family === "machine") {
    return readIndustrialPresetId(raw);
  }
  return readMotorPresetId(raw);
}

export function listMachinePresetOptions(
  family: AudioMachineFamilyId,
): Array<{ value: string; label: string }> {
  if (family === "engine") {
    return ENGINE_MACHINE_PRESETS.map((p) => ({ value: p.id, label: p.label }));
  }
  if (family === "drone") {
    return DRONE_MACHINE_PRESETS.map((p) => ({ value: p.id, label: p.label }));
  }
  if (family === "machine") {
    return INDUSTRIAL_MACHINE_PRESETS.map((p) => ({ value: p.id, label: p.label }));
  }
  return MOTOR_MACHINE_PRESETS.map((p) => ({ value: p.id, label: p.label }));
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

export function applyEnginePresetToConfig(preset: EnginePreset): Record<string, unknown> {
  return {
    family: "engine",
    preset: preset.id,
    rumbleBaseHz: preset.rumbleBaseHz,
    rumbleSpanHz: preset.rumbleSpanHz,
    cylinders: preset.cylinders,
    roughness: preset.roughness,
    turboMix: preset.turboMix,
    gain: preset.gain,
  };
}

export function applyDronePresetToConfig(preset: DronePreset): Record<string, unknown> {
  return {
    family: "drone",
    preset: preset.id,
    motorBaseHz: preset.motorBaseHz,
    motorSpanHz: preset.motorSpanHz,
    motorCount: preset.motorCount,
    detuneCents: preset.detuneCents,
    washMix: preset.washMix,
    gain: preset.gain,
  };
}

export function applyIndustrialPresetToConfig(preset: IndustrialPreset): Record<string, unknown> {
  return {
    family: "machine",
    preset: preset.id,
    cycleBaseHz: preset.cycleBaseHz,
    cycleSpanHz: preset.cycleSpanHz,
    frictionMix: preset.frictionMix,
    clankMix: preset.clankMix,
    gain: preset.gain,
  };
}

export function applyMachineFamilyDefaultPreset(
  family: AudioMachineFamilyId,
): Record<string, unknown> {
  if (family === "engine") {
    return applyEnginePresetToConfig(ENGINE_MACHINE_PRESETS[0]!);
  }
  if (family === "drone") {
    return applyDronePresetToConfig(DRONE_MACHINE_PRESETS[0]!);
  }
  if (family === "machine") {
    return applyIndustrialPresetToConfig(INDUSTRIAL_MACHINE_PRESETS[0]!);
  }
  return applyMotorPresetToConfig(MOTOR_MACHINE_PRESETS[0]!);
}

export function resolveMachinePresetHint(
  family: AudioMachineFamilyId,
  presetRaw: unknown,
): string | null {
  const id = readMachinePresetId(family, presetRaw);
  if (family === "engine") {
    return ENGINE_MACHINE_PRESETS.find((p) => p.id === id)?.hint ?? null;
  }
  if (family === "drone") {
    return DRONE_MACHINE_PRESETS.find((p) => p.id === id)?.hint ?? null;
  }
  if (family === "machine") {
    return INDUSTRIAL_MACHINE_PRESETS.find((p) => p.id === id)?.hint ?? null;
  }
  return MOTOR_MACHINE_PRESETS.find((p) => p.id === id)?.hint ?? null;
}

export function applyMachinePresetById(
  family: AudioMachineFamilyId,
  presetId: string,
): Record<string, unknown> | null {
  if (family === "engine") {
    const preset = ENGINE_MACHINE_PRESETS.find((p) => p.id === presetId);
    return preset != null ? applyEnginePresetToConfig(preset) : null;
  }
  if (family === "drone") {
    const preset = DRONE_MACHINE_PRESETS.find((p) => p.id === presetId);
    return preset != null ? applyDronePresetToConfig(preset) : null;
  }
  if (family === "machine") {
    const preset = INDUSTRIAL_MACHINE_PRESETS.find((p) => p.id === presetId);
    return preset != null ? applyIndustrialPresetToConfig(preset) : null;
  }
  const preset = MOTOR_MACHINE_PRESETS.find((p) => p.id === presetId);
  return preset != null ? applyMotorPresetToConfig(preset) : null;
}

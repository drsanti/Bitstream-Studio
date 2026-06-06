import {
  readMachineFamilyId,
  readMachinePresetId,
  type AudioMachineFamilyId,
} from "./audio-machine-config";

export const AUDIO_MACHINE_PRESET_SCHEMA = "sensor-studio.audio-machine-preset" as const;
export const AUDIO_MACHINE_PRESET_VERSION = 1 as const;

export type AudioMachinePresetJsonV1 = {
  schema: typeof AUDIO_MACHINE_PRESET_SCHEMA;
  version: typeof AUDIO_MACHINE_PRESET_VERSION;
  family: AudioMachineFamilyId;
  preset: string;
  label?: string;
  drive: {
    speed: number;
    load: number;
    gain: number;
  };
  layers: Record<string, number>;
};

const MOTOR_LAYER_KEYS = [
  "whineBaseHz",
  "whineSpanHz",
  "harmonicMix",
  "rippleMix",
  "noiseMix",
] as const;

const ENGINE_LAYER_KEYS = [
  "rumbleBaseHz",
  "rumbleSpanHz",
  "cylinders",
  "roughness",
  "turboMix",
] as const;

const DRONE_LAYER_KEYS = [
  "motorBaseHz",
  "motorSpanHz",
  "motorCount",
  "detuneCents",
  "washMix",
] as const;

const INDUSTRIAL_LAYER_KEYS = [
  "cycleBaseHz",
  "cycleSpanHz",
  "frictionMix",
  "clankMix",
] as const;

function readFinite(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function pickLayers(
  family: AudioMachineFamilyId,
  cfg: Record<string, unknown>,
): Record<string, number> {
  const keys =
    family === "engine"
      ? ENGINE_LAYER_KEYS
      : family === "drone"
        ? DRONE_LAYER_KEYS
        : family === "machine"
          ? INDUSTRIAL_LAYER_KEYS
          : MOTOR_LAYER_KEYS;
  const layers: Record<string, number> = {};
  for (const key of keys) {
    layers[key] = readFinite(cfg[key], 0);
  }
  return layers;
}

export function exportAudioMachinePresetJson(
  cfg: Record<string, unknown>,
  options?: { label?: string },
): string {
  const family = readMachineFamilyId(cfg.family);
  const preset = readMachinePresetId(family, cfg.preset);
  const payload: AudioMachinePresetJsonV1 = {
    schema: AUDIO_MACHINE_PRESET_SCHEMA,
    version: AUDIO_MACHINE_PRESET_VERSION,
    family,
    preset,
    drive: {
      speed: readFinite(cfg.speed, 0.35),
      load: readFinite(cfg.load, 0.25),
      gain: readFinite(cfg.gain, 0.1),
    },
    layers: pickLayers(family, cfg),
  };
  const label = options?.label?.trim();
  if (label != null && label.length > 0) {
    payload.label = label;
  }
  return JSON.stringify(payload, null, 2);
}

export type ParseAudioMachinePresetResult =
  | { ok: true; fields: Record<string, unknown> }
  | { ok: false; error: string };

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === "object" && raw != null && !Array.isArray(raw);
}

export function parseAudioMachinePresetJson(rawText: string): ParseAudioMachinePresetResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }
  if (!isRecord(parsed)) {
    return { ok: false, error: "Expected a JSON object." };
  }
  if (parsed.schema !== AUDIO_MACHINE_PRESET_SCHEMA) {
    return { ok: false, error: "Unsupported schema (expected sensor-studio.audio-machine-preset)." };
  }
  if (parsed.version !== AUDIO_MACHINE_PRESET_VERSION) {
    return { ok: false, error: `Unsupported version (expected ${AUDIO_MACHINE_PRESET_VERSION}).` };
  }

  const family = readMachineFamilyId(parsed.family);
  const presetRaw = typeof parsed.preset === "string" ? parsed.preset.trim() : "";
  if (presetRaw.length === 0) {
    return { ok: false, error: "Missing preset id." };
  }

  const drive = isRecord(parsed.drive) ? parsed.drive : null;
  if (drive == null) {
    return { ok: false, error: "Missing drive block." };
  }
  const layers = isRecord(parsed.layers) ? parsed.layers : null;
  if (layers == null) {
    return { ok: false, error: "Missing layers block." };
  }

  const fields: Record<string, unknown> = {
    family,
    preset: presetRaw,
    speed: Math.max(0, Math.min(1, readFinite(drive.speed, 0.35))),
    load: Math.max(0, Math.min(1, readFinite(drive.load, 0.25))),
    gain: Math.max(0, Math.min(1, readFinite(drive.gain, 0.1))),
  };

  const allowedKeys =
    family === "engine"
      ? ENGINE_LAYER_KEYS
      : family === "drone"
        ? DRONE_LAYER_KEYS
        : family === "machine"
          ? INDUSTRIAL_LAYER_KEYS
          : MOTOR_LAYER_KEYS;

  for (const key of allowedKeys) {
    const raw = layers[key];
    if (raw == null) {
      continue;
    }
    if (key === "cylinders" || key === "motorCount") {
      fields[key] = Math.max(1, Math.round(readFinite(raw, 1)));
      continue;
    }
    if (key === "detuneCents") {
      fields[key] = Math.max(0, Math.round(readFinite(raw, 0)));
      continue;
    }
    if (key.endsWith("Hz")) {
      fields[key] = Math.max(0, readFinite(raw, 0));
      continue;
    }
    fields[key] = Math.max(0, Math.min(1, readFinite(raw, 0)));
  }

  return { ok: true, fields };
}

import * as THREE from "three";
import {
  PROJECT4_GRAPHICS_DEFAULTS,
  PROJECT4_GRAPHICS_MAX_LIGHTS,
} from "./project4-graphics.defaults";
import type {
  Project4GraphicsState,
  Project4OutputColorSpaceKey,
  Project4ToneMappingKey,
  Project4TwinLightEntry,
  Project4TwinLightKind,
} from "./project4-graphics.types";

export const PROJECT4_TONE_MAPPING_KEYS: readonly Project4ToneMappingKey[] = [
  "none",
  "linear",
  "reinhard",
  "cineon",
  "acesFilmic",
] as const;

export const PROJECT4_LIGHT_KINDS: readonly Project4TwinLightKind[] = [
  "ambient",
  "directional",
  "point",
  "spot",
  "hemisphere",
] as const;

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

export function isProject4ToneMappingKey(value: string): value is Project4ToneMappingKey {
  return (PROJECT4_TONE_MAPPING_KEYS as readonly string[]).includes(value);
}

export function isProject4LightKind(value: string): value is Project4TwinLightKind {
  return (PROJECT4_LIGHT_KINDS as readonly string[]).includes(value);
}

export function toneMappingKeyToThree(key: Project4ToneMappingKey): THREE.ToneMapping {
  switch (key) {
    case "none":
      return THREE.NoToneMapping;
    case "linear":
      return THREE.LinearToneMapping;
    case "reinhard":
      return THREE.ReinhardToneMapping;
    case "cineon":
      return THREE.CineonToneMapping;
    case "acesFilmic":
    default:
      return THREE.ACESFilmicToneMapping;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeHex(value: unknown, fallback: string): string {
  if (typeof value === "string" && HEX6.test(value.trim())) {
    return value.trim();
  }
  return fallback;
}

function normalizePosition(value: unknown): [number, number, number] {
  const d = [0, 2.5, 2.5] as [number, number, number];
  if (!Array.isArray(value) || value.length < 3) {
    return d;
  }
  const ax = Number(value[0]);
  const ay = Number(value[1]);
  const az = Number(value[2]);
  const x = Number.isFinite(ax) ? clamp(ax, -500, 500) : d[0];
  const y = Number.isFinite(ay) ? clamp(ay, -500, 500) : d[1];
  const z = Number.isFinite(az) ? clamp(az, -500, 500) : d[2];
  return [x, y, z];
}

export function normalizeProject4TwinLightEntry(value: unknown, index: number): Project4TwinLightEntry {
  const base = PROJECT4_GRAPHICS_DEFAULTS.lights[Math.min(index, PROJECT4_GRAPHICS_DEFAULTS.lights.length - 1)];
  if (!value || typeof value !== "object") {
    return { ...base, id: base.id ?? `light-${index}` };
  }
  const o = value as Record<string, unknown>;
  const kindRaw = typeof o.kind === "string" ? o.kind : base.kind;
  const kind: Project4TwinLightKind = isProject4LightKind(kindRaw) ? kindRaw : base.kind;
  const id =
    typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : base.id || `light-${index}-${kind}`;

  const intensityRaw = Number(o.intensity);
  const intensity = Number.isFinite(intensityRaw)
    ? clamp(intensityRaw, 0, kind === "ambient" ? 5 : 50)
    : base.intensity;

  return {
    id,
    kind,
    color: normalizeHex(o.color, base.color),
    intensity,
    position: normalizePosition(o.position),
    castShadow: typeof o.castShadow === "boolean" ? o.castShadow : base.castShadow,
    helperVisible: typeof o.helperVisible === "boolean" ? o.helperVisible : base.helperVisible,
    groundColor: normalizeHex(o.groundColor, base.groundColor),
    distance: (() => {
      const n = Number(o.distance);
      return Number.isFinite(n) ? clamp(n, 0, 500) : base.distance;
    })(),
    decay: (() => {
      const n = Number(o.decay);
      return Number.isFinite(n) ? clamp(n, 0, 4) : base.decay;
    })(),
    angleDeg: (() => {
      const n = Number(o.angleDeg);
      return Number.isFinite(n) ? clamp(n, 1, 89) : base.angleDeg;
    })(),
    penumbra: (() => {
      const n = Number(o.penumbra);
      return Number.isFinite(n) ? clamp(n, 0, 1) : base.penumbra;
    })(),
  };
}

export function normalizeProject4GraphicsSettings(
  input: Partial<Project4GraphicsState> | Project4GraphicsState,
): Project4GraphicsState {
  const d = PROJECT4_GRAPHICS_DEFAULTS;
  const toneRaw =
    typeof input.toneMappingKey === "string" && isProject4ToneMappingKey(input.toneMappingKey)
      ? input.toneMappingKey
      : d.toneMappingKey;

  const exposureRaw = Number(input.toneMappingExposure);
  const toneMappingExposure = Number.isFinite(exposureRaw)
    ? clamp(exposureRaw, 0.05, 4)
    : d.toneMappingExposure;

  const ocsRaw = input.outputColorSpaceKey;
  const outputColorSpaceKey: Project4OutputColorSpaceKey =
    ocsRaw === "srgb" || ocsRaw === "linear" ? ocsRaw : d.outputColorSpaceKey;

  const shadowsEnabled =
    typeof input.shadowsEnabled === "boolean" ? input.shadowsEnabled : d.shadowsEnabled;

  const envRaw = Number(input.environmentIntensity);
  const environmentIntensity = Number.isFinite(envRaw) ? clamp(envRaw, 0, 5) : d.environmentIntensity;

  let lightsIn = Array.isArray(input.lights) ? input.lights : d.lights;
  lightsIn = lightsIn.slice(0, PROJECT4_GRAPHICS_MAX_LIGHTS);
  const lights = lightsIn.map((entry, i) => normalizeProject4TwinLightEntry(entry, i));

  return {
    schemaVersion: 1,
    toneMappingKey: toneRaw,
    toneMappingExposure,
    outputColorSpaceKey,
    shadowsEnabled,
    environmentIntensity,
    lights,
  };
}

export function mergeProject4GraphicsFromUnknown(raw: unknown): Project4GraphicsState {
  if (raw == null || typeof raw !== "object") {
    return normalizeProject4GraphicsSettings(PROJECT4_GRAPHICS_DEFAULTS);
  }
  return normalizeProject4GraphicsSettings({
    ...PROJECT4_GRAPHICS_DEFAULTS,
    ...(raw as Partial<Project4GraphicsState>),
  });
}

export function newProject4LightId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `lite-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createProject4TwinLight(kind: Project4TwinLightKind): Project4TwinLightEntry {
  const position: [number, number, number] =
    kind === "ambient" ? [0, 0, 0] : [3.5, 6, 4];
  return normalizeProject4TwinLightEntry(
    {
      id: newProject4LightId(),
      kind,
      color: "#ffffff",
      intensity: kind === "ambient" ? 0.45 : kind === "hemisphere" ? 0.85 : 1,
      position,
      castShadow: kind === "directional",
      helperVisible: false,
      groundColor: "#445566",
      distance: 0,
      decay: 2,
      angleDeg: 40,
      penumbra: 0.25,
    },
    0,
  );
}

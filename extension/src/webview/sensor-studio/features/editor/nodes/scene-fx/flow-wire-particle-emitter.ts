import {
  coerceScene3DConfigV1,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../rotation/scene3d-config";

/** Serialized particle bundle on **`particleEmitter`** flow wires. */
export type FlowWireParticleEmitterV1 = {
  version: 1;
  enabled: boolean;
  preset: string;
  trigger: number;
  rate: number;
  life: number;
  colorHex: string;
  target: string;
};

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function asHexColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }
  return fallback;
}

function asPreset(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

export function defaultFlowWireParticleEmitterV1(): FlowWireParticleEmitterV1 {
  return {
    version: 1,
    enabled: true,
    preset: "sparks",
    trigger: 0,
    rate: 0,
    life: 1,
    colorHex: "#ffaa00",
    target: "",
  };
}

export function flowWireParticleEmitterFromEval(
  out: { trigger: number; rate: number },
  cfg: Record<string, unknown>,
): FlowWireParticleEmitterV1 {
  const d = defaultFlowWireParticleEmitterV1();
  return {
    version: 1,
    enabled: cfg.enabled !== false,
    preset: asPreset(cfg.preset, d.preset),
    trigger: out.trigger,
    rate: out.rate,
    life: clampNumber(asFiniteNumber(cfg.life, d.life), 0.05, 30),
    colorHex: asHexColor(cfg.color ?? cfg.colorHex, d.colorHex),
    target: typeof cfg.target === "string" ? cfg.target.trim() : "",
  };
}

export function coerceFlowWireParticleEmitterV1(raw: unknown): FlowWireParticleEmitterV1 {
  const d = defaultFlowWireParticleEmitterV1();
  if (raw == null || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  return {
    version: 1,
    enabled: o.enabled !== false,
    preset: asPreset(o.preset, d.preset),
    trigger: asFiniteNumber(o.trigger, d.trigger),
    rate: Math.max(0, asFiniteNumber(o.rate, d.rate)),
    life: clampNumber(asFiniteNumber(o.life, d.life), 0.05, 30),
    colorHex: asHexColor(o.colorHex ?? o.color, d.colorHex),
    target: typeof o.target === "string" ? o.target.trim() : "",
  };
}

export function mergeFlowWireParticleEmitterIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWireParticleEmitterV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null) {
    return scene3d;
  }
  const next: Scene3DConfigV1 = {
    ...scene3d,
    particleEmitter: {
      enabled: wire.enabled,
      preset: wire.preset,
      trigger: wire.trigger,
      rate: wire.rate,
      life: wire.life,
      colorHex: wire.colorHex,
      target: wire.target,
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function isFlowWireParticleEmitterV1(v: unknown): v is FlowWireParticleEmitterV1 {
  return v != null && typeof v === "object" && (v as FlowWireParticleEmitterV1).version === 1;
}

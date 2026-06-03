import {
  coerceScene3DConfigV1,
  parseHexToThreeColor,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../../../../core/scene3d/scene3d-config";

export type FlowWireFogMode = "linear" | "exp2";

/** Serialized fog bundle on **`fog`** flow wires (subset of `Scene3DConfigV1.fog`). */
export type FlowWireFogV1 = {
  version: 1;
  enabled: boolean;
  mode: FlowWireFogMode;
  near: number;
  far: number;
  density: number;
  colorHex: string;
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

export function defaultFlowWireFogV1(): FlowWireFogV1 {
  return {
    version: 1,
    enabled: true,
    mode: "linear",
    near: 1,
    far: 50,
    density: 0.05,
    colorHex: "#1a1a2e",
  };
}

export function flowWireFogFromEval(
  out: { near: number; far: number; density: number },
  cfg: Record<string, unknown>,
): FlowWireFogV1 {
  const d = defaultFlowWireFogV1();
  return {
    version: 1,
    enabled: cfg.enabled !== false,
    mode: cfg.mode === "exp2" ? "exp2" : "linear",
    near: out.near,
    far: out.far,
    density: out.density,
    colorHex: asHexColor(cfg.colorHex, d.colorHex),
  };
}

export function coerceFlowWireFogV1(raw: unknown): FlowWireFogV1 {
  const d = defaultFlowWireFogV1();
  if (raw == null || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  return {
    version: 1,
    enabled: o.enabled !== false,
    mode: o.mode === "exp2" ? "exp2" : "linear",
    near: clampNumber(asFiniteNumber(o.near, d.near), 0.001, 1e6),
    far: clampNumber(asFiniteNumber(o.far, d.far), 0.001, 1e6),
    density: clampNumber(asFiniteNumber(o.density, d.density), 0, 1),
    colorHex: asHexColor(o.colorHex, d.colorHex),
  };
}

export function mergeFlowWireFogIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWireFogV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null) {
    return scene3d;
  }
  const next: Scene3DConfigV1 = {
    ...scene3d,
    fog: {
      enabled: wire.enabled,
      mode: wire.mode,
      near: wire.near,
      far: wire.far,
      density: wire.density,
      colorHex: wire.colorHex,
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function isFlowWireFogV1(v: unknown): v is FlowWireFogV1 {
  return v != null && typeof v === "object" && (v as FlowWireFogV1).version === 1;
}

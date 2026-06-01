import {
  coerceScene3DConfigV1,
  parseHexToThreeColor,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../rotation/scene3d-config";

/** Serialized contact-shadow bundle on **`contactShadows`** flow wires. */
export type FlowWireContactShadowsV1 = {
  version: 1;
  enabled: boolean;
  opacity: number;
  blur: number;
  far: number;
  scale: number;
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

export function defaultFlowWireContactShadowsV1(): FlowWireContactShadowsV1 {
  return {
    version: 1,
    enabled: true,
    opacity: 0.5,
    blur: 2,
    far: 10,
    scale: 10,
    colorHex: "#000000",
  };
}

export function flowWireContactShadowsFromEval(
  out: { opacity: number; blur: number; far: number; scale: number },
  cfg: Record<string, unknown>,
): FlowWireContactShadowsV1 {
  const d = defaultFlowWireContactShadowsV1();
  return {
    version: 1,
    enabled: cfg.enabled !== false,
    opacity: out.opacity,
    blur: out.blur,
    far: out.far,
    scale: out.scale,
    colorHex: asHexColor(cfg.color, d.colorHex),
  };
}

export function coerceFlowWireContactShadowsV1(raw: unknown): FlowWireContactShadowsV1 {
  const d = defaultFlowWireContactShadowsV1();
  if (raw == null || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  return {
    version: 1,
    enabled: o.enabled !== false,
    opacity: clampNumber(asFiniteNumber(o.opacity, d.opacity), 0, 1),
    blur: clampNumber(asFiniteNumber(o.blur, d.blur), 0.1, 20),
    far: clampNumber(asFiniteNumber(o.far, d.far), 0.1, 100),
    scale: clampNumber(asFiniteNumber(o.scale, d.scale), 0.1, 100),
    colorHex: asHexColor(o.colorHex, d.colorHex),
  };
}

export function mergeFlowWireContactShadowsIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWireContactShadowsV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null) {
    return scene3d;
  }
  const next: Scene3DConfigV1 = {
    ...scene3d,
    contactShadows: {
      enabled: wire.enabled,
      opacity: wire.opacity,
      blur: wire.blur,
      far: wire.far,
      scale: wire.scale,
      colorHex: wire.colorHex,
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function isFlowWireContactShadowsV1(v: unknown): v is FlowWireContactShadowsV1 {
  return v != null && typeof v === "object" && (v as FlowWireContactShadowsV1).version === 1;
}

export { parseHexToThreeColor };

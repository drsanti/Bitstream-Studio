import {
  coerceScene3DConfigV1,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../rotation/scene3d-config";

/** Serialized bloom bundle on **`postProcessing`** flow wires. */
export type FlowWirePostProcessingV1 = {
  version: 1;
  enabled: boolean;
  enableBloom: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
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

export function defaultFlowWirePostProcessingV1(): FlowWirePostProcessingV1 {
  return {
    version: 1,
    enabled: true,
    enableBloom: true,
    bloomIntensity: 1.5,
    bloomThreshold: 1.0,
  };
}

export function flowWirePostProcessingFromEval(
  out: { bloomIntensity: number; bloomThreshold: number },
  cfg: Record<string, unknown>,
): FlowWirePostProcessingV1 {
  return {
    version: 1,
    enabled: cfg.enabled !== false,
    enableBloom: cfg.enableBloom !== false,
    bloomIntensity: out.bloomIntensity,
    bloomThreshold: out.bloomThreshold,
  };
}

export function coerceFlowWirePostProcessingV1(raw: unknown): FlowWirePostProcessingV1 {
  const d = defaultFlowWirePostProcessingV1();
  if (raw == null || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  return {
    version: 1,
    enabled: o.enabled !== false,
    enableBloom: o.enableBloom !== false,
    bloomIntensity: clampNumber(asFiniteNumber(o.bloomIntensity, d.bloomIntensity), 0, 8),
    bloomThreshold: clampNumber(asFiniteNumber(o.bloomThreshold, d.bloomThreshold), 0, 2),
  };
}

export function mergeFlowWirePostProcessingIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWirePostProcessingV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null) {
    return scene3d;
  }
  const next: Scene3DConfigV1 = {
    ...scene3d,
    postProcessing: {
      enabled: wire.enabled,
      enableBloom: wire.enableBloom,
      bloomIntensity: wire.bloomIntensity,
      bloomThreshold: wire.bloomThreshold,
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function isFlowWirePostProcessingV1(v: unknown): v is FlowWirePostProcessingV1 {
  return v != null && typeof v === "object" && (v as FlowWirePostProcessingV1).version === 1;
}

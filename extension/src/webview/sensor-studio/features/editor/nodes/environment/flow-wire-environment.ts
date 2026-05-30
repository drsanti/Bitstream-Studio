import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../rotation/scene3d-config";

/** Serialized environment bundle carried on **`environment`** flow wires (subset of `Scene3DConfigV1.environment`). */
export type FlowWireEnvironmentV1 = {
  version: 1;
  presetIndex: number;
  studioAssetId?: string;
  showBackgroundTexture: boolean;
  useCubemapIbl: boolean;
  iblStrength: number;
  iblOffStrengthFrac: number;
  yawDeg: number;
  backgroundColorHex: string;
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

export function defaultFlowWireEnvironmentV1(): FlowWireEnvironmentV1 {
  const e = defaultScene3DConfig().environment;
  return {
    version: 1,
    presetIndex: Math.max(0, Math.round(e.presetIndex)),
    studioAssetId:
      typeof e.studioAssetId === "string" && e.studioAssetId.trim().length > 0
        ? e.studioAssetId.trim()
        : undefined,
    showBackgroundTexture: e.showBackgroundTexture,
    useCubemapIbl: e.useCubemapIbl,
    iblStrength: e.iblStrength,
    iblOffStrengthFrac: e.iblOffStrengthFrac,
    yawDeg: e.yawDeg,
    backgroundColorHex: e.backgroundColorHex,
  };
}

export function coerceFlowWireEnvironmentV1(raw: unknown): FlowWireEnvironmentV1 {
  const d = defaultFlowWireEnvironmentV1();
  if (raw == null || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  const sid = o.studioAssetId;
  return {
    version: 1,
    presetIndex: clampNumber(Math.round(asFiniteNumber(o.presetIndex, d.presetIndex)), 0, 4096),
    studioAssetId:
      typeof sid === "string" && sid.trim().length > 0 ? sid.trim() : undefined,
    showBackgroundTexture:
      typeof o.showBackgroundTexture === "boolean" ? o.showBackgroundTexture : d.showBackgroundTexture,
    useCubemapIbl: typeof o.useCubemapIbl === "boolean" ? o.useCubemapIbl : d.useCubemapIbl,
    iblStrength: clampNumber(asFiniteNumber(o.iblStrength, d.iblStrength), 0, 8),
    iblOffStrengthFrac: clampNumber(
      asFiniteNumber(o.iblOffStrengthFrac, d.iblOffStrengthFrac),
      0,
      1,
    ),
    yawDeg: clampNumber(asFiniteNumber(o.yawDeg, d.yawDeg), -3600, 3600),
    backgroundColorHex: asHexColor(o.backgroundColorHex, d.backgroundColorHex),
  };
}

export function flowWireEnvironmentFromNodeDefaultConfig(
  dc: Record<string, unknown>,
): FlowWireEnvironmentV1 {
  return coerceFlowWireEnvironmentV1({ version: 1, ...dc });
}

export function mergeFlowWireEnvironmentIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWireEnvironmentV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null) {
    return scene3d;
  }
  const next: Scene3DConfigV1 = {
    ...scene3d,
    environment: {
      ...scene3d.environment,
      presetIndex: wire.presetIndex,
      showBackgroundTexture: wire.showBackgroundTexture,
      useCubemapIbl: wire.useCubemapIbl,
      iblStrength: wire.iblStrength,
      iblOffStrengthFrac: wire.iblOffStrengthFrac,
      yawDeg: wire.yawDeg,
      backgroundColorHex: wire.backgroundColorHex,
      studioAssetId:
        wire.studioAssetId != null && wire.studioAssetId.length > 0 ? wire.studioAssetId : undefined,
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function isFlowWireEnvironmentV1(v: unknown): v is FlowWireEnvironmentV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWireEnvironmentV1).version === 1 &&
    typeof (v as Record<string, unknown>).presetIndex === "number"
  );
}

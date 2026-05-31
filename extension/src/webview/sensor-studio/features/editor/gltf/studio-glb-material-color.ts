import type { FlowWireVec3 } from "../../../core/live/flow-wire-types";

export const STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY = "glbMaterialColorTarget" as const;
export const STUDIO_GLB_MATERIAL_COLOR_HEX_KEY = "glbMaterialColorHex" as const;

/** RGB channels driven on GLB materials (0–1). */
export type StudioGlbMaterialColorTargetV1 = "baseColor" | "emissiveColor";

export const STUDIO_GLB_MATERIAL_COLOR_TARGETS: readonly StudioGlbMaterialColorTargetV1[] = [
  "baseColor",
  "emissiveColor",
] as const;

export type GlbMaterialColorRgb = { r: number; g: number; b: number };

export type GlbMaterialColorDriveRow = {
  baseColor?: GlbMaterialColorRgb;
  emissiveColor?: GlbMaterialColorRgb;
};

export function isStudioGlbMaterialColorTargetV1(
  value: unknown,
): value is StudioGlbMaterialColorTargetV1 {
  return value === "baseColor" || value === "emissiveColor";
}

export function readGlbMaterialColorTarget(
  config: Record<string, unknown> | null | undefined,
): StudioGlbMaterialColorTargetV1 {
  if (config == null) {
    return "baseColor";
  }
  const raw = config[STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY];
  return isStudioGlbMaterialColorTargetV1(raw) ? raw : "baseColor";
}

export function defaultGlbMaterialColorHex(target: StudioGlbMaterialColorTargetV1): string {
  return target === "emissiveColor" ? "#000000" : "#ffffff";
}

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export function hexToGlbMaterialColorRgb(hex: string): GlbMaterialColorRgb {
  const normalized = hex.trim().replace("#", "");
  if (normalized.length !== 6) {
    return { r: 1, g: 1, b: 1 };
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return { r: 1, g: 1, b: 1 };
  }
  return {
    r: clampUnit(r / 255),
    g: clampUnit(g / 255),
    b: clampUnit(b / 255),
  };
}

export function glbMaterialColorRgbToHex(rgb: GlbMaterialColorRgb): string {
  const toByte = (v: number) =>
    Math.round(clampUnit(v) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(rgb.r)}${toByte(rgb.g)}${toByte(rgb.b)}`;
}

export function flowVec3ToGlbMaterialColorRgb(vec: FlowWireVec3): GlbMaterialColorRgb {
  return {
    r: clampUnit(vec.x),
    g: clampUnit(vec.y),
    b: clampUnit(vec.z),
  };
}

export function readGlbMaterialColorRgbFromConfig(
  config: Record<string, unknown> | null | undefined,
): GlbMaterialColorRgb {
  if (config == null) {
    return { r: 1, g: 1, b: 1 };
  }
  const target = readGlbMaterialColorTarget(config);
  const hex =
    typeof config[STUDIO_GLB_MATERIAL_COLOR_HEX_KEY] === "string"
      ? (config[STUDIO_GLB_MATERIAL_COLOR_HEX_KEY] as string).trim()
      : defaultGlbMaterialColorHex(target);
  return hexToGlbMaterialColorRgb(hex);
}

export function mergeGlbMaterialColorDriveRow(
  row: GlbMaterialColorDriveRow | undefined,
  target: StudioGlbMaterialColorTargetV1,
  rgb: GlbMaterialColorRgb,
): GlbMaterialColorDriveRow {
  const next: GlbMaterialColorDriveRow = row != null ? { ...row } : {};
  next[target] = rgb;
  return next;
}

export function glbMaterialColorRowHasValues(row: GlbMaterialColorDriveRow | undefined): boolean {
  if (row == null) {
    return false;
  }
  return row.baseColor != null || row.emissiveColor != null;
}

export function materialColorTargetLabel(target: StudioGlbMaterialColorTargetV1): string {
  switch (target) {
    case "baseColor":
      return "Base color";
    case "emissiveColor":
      return "Emissive color";
    default:
      return target;
  }
}

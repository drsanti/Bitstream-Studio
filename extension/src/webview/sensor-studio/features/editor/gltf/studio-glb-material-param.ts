export const STUDIO_GLB_MATERIAL_PARAM_KEY = "glbMaterialParam" as const;

/** PBR scalar channels driven on GLB **MeshStandardMaterial** / **MeshPhysicalMaterial** by name. */
export type StudioGlbMaterialParamV1 = "emissive" | "roughness" | "metalness" | "opacity";

export const STUDIO_GLB_MATERIAL_PARAMS: readonly StudioGlbMaterialParamV1[] = [
  "emissive",
  "roughness",
  "metalness",
  "opacity",
] as const;

export type GlbMaterialPbrDriveRow = {
  emissive?: number;
  roughness?: number;
  metalness?: number;
  opacity?: number;
};

export function isStudioGlbMaterialParamV1(value: unknown): value is StudioGlbMaterialParamV1 {
  return (
    value === "emissive" ||
    value === "roughness" ||
    value === "metalness" ||
    value === "opacity"
  );
}

/** Default channel when legacy **`number-constant`** rows omit `glbMaterialParam`. */
export function readGlbMaterialParam(
  config: Record<string, unknown> | null | undefined,
): StudioGlbMaterialParamV1 {
  if (config == null) {
    return "emissive";
  }
  const raw = config[STUDIO_GLB_MATERIAL_PARAM_KEY];
  return isStudioGlbMaterialParamV1(raw) ? raw : "emissive";
}

export function defaultGlbMaterialParamValue(param: StudioGlbMaterialParamV1): number {
  switch (param) {
    case "emissive":
      return 0;
    case "roughness":
      return 0.5;
    case "metalness":
      return 0;
    case "opacity":
      return 1;
    default:
      return 0;
  }
}

export function clampGlbMaterialParamValue(
  param: StudioGlbMaterialParamV1,
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return defaultGlbMaterialParamValue(param);
  }
  switch (param) {
    case "emissive":
      return Math.max(0, value);
    case "roughness":
    case "metalness":
    case "opacity":
      return Math.min(1, Math.max(0, value));
    default:
      return value;
  }
}

export function mergeGlbMaterialPbrDriveRow(
  row: GlbMaterialPbrDriveRow | undefined,
  param: StudioGlbMaterialParamV1,
  value: number,
): GlbMaterialPbrDriveRow {
  const next: GlbMaterialPbrDriveRow = row != null ? { ...row } : {};
  const clamped = clampGlbMaterialParamValue(param, value);
  next[param] = clamped;
  return next;
}

export function glbMaterialPbrRowHasValues(row: GlbMaterialPbrDriveRow | undefined): boolean {
  if (row == null) {
    return false;
  }
  return (
    row.emissive != null ||
    row.roughness != null ||
    row.metalness != null ||
    row.opacity != null
  );
}

export function materialParamLabel(param: StudioGlbMaterialParamV1): string {
  switch (param) {
    case "emissive":
      return "Emissive intensity";
    case "roughness":
      return "Roughness";
    case "metalness":
      return "Metalness";
    case "opacity":
      return "Opacity";
    default:
      return param;
  }
}

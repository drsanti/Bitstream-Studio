export const STUDIO_GLB_MATERIAL_TEXTURE_SLOT_KEY = "glbMaterialTextureSlot" as const;
export const STUDIO_TEXTURE_URL_KEY = "textureUrl" as const;
export const STUDIO_TEXTURE_ASSET_ID_KEY = "selectedStudioTextureAssetId" as const;

/** Standard map slots on Three.js MeshStandardMaterial / MeshPhysicalMaterial. */
export type StudioGlbMaterialTextureSlotV1 =
  | "map"
  | "normalMap"
  | "roughnessMap"
  | "metalnessMap"
  | "emissiveMap"
  | "aoMap";

export const STUDIO_GLB_MATERIAL_TEXTURE_SLOTS: readonly StudioGlbMaterialTextureSlotV1[] = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "emissiveMap",
  "aoMap",
] as const;

export type GlbMaterialTextureDriveRow = Partial<
  Record<StudioGlbMaterialTextureSlotV1, string>
>;

export function isStudioGlbMaterialTextureSlotV1(
  value: unknown,
): value is StudioGlbMaterialTextureSlotV1 {
  return (
    value === "map" ||
    value === "normalMap" ||
    value === "roughnessMap" ||
    value === "metalnessMap" ||
    value === "emissiveMap" ||
    value === "aoMap"
  );
}

export function readGlbMaterialTextureSlot(
  config: Record<string, unknown> | null | undefined,
): StudioGlbMaterialTextureSlotV1 {
  if (config == null) {
    return "map";
  }
  const raw = config[STUDIO_GLB_MATERIAL_TEXTURE_SLOT_KEY];
  return isStudioGlbMaterialTextureSlotV1(raw) ? raw : "map";
}

export function readGlbMaterialTextureUrl(
  config: Record<string, unknown> | null | undefined,
  liveValue?: unknown,
): string {
  if (typeof liveValue === "string") {
    const wired = liveValue.trim();
    if (wired.length > 0) {
      return wired;
    }
  }
  if (config == null) {
    return "";
  }
  const raw = config[STUDIO_TEXTURE_URL_KEY];
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "";
}

export function mergeGlbMaterialTextureDriveRow(
  row: GlbMaterialTextureDriveRow | undefined,
  slot: StudioGlbMaterialTextureSlotV1,
  url: string,
): GlbMaterialTextureDriveRow {
  const next: GlbMaterialTextureDriveRow = row != null ? { ...row } : {};
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    delete next[slot];
    return next;
  }
  next[slot] = trimmed;
  return next;
}

export function glbMaterialTextureRowHasValues(
  row: GlbMaterialTextureDriveRow | undefined,
): boolean {
  if (row == null) {
    return false;
  }
  return STUDIO_GLB_MATERIAL_TEXTURE_SLOTS.some((slot) => {
    const u = row[slot];
    return typeof u === "string" && u.trim().length > 0;
  });
}

export function materialTextureSlotLabel(slot: StudioGlbMaterialTextureSlotV1): string {
  switch (slot) {
    case "map":
      return "Base color (map)";
    case "normalMap":
      return "Normal map";
    case "roughnessMap":
      return "Roughness map";
    case "metalnessMap":
      return "Metalness map";
    case "emissiveMap":
      return "Emissive map";
    case "aoMap":
      return "Ambient occlusion (aoMap)";
    default:
      return slot;
  }
}

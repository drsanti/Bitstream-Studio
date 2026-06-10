import type { Diagram3dMaterialV1 } from "../../schemas/diagram.v1";

/** Three.js MeshStandardMaterial / MeshPhysicalMaterial texture slots. */
export const DIAGRAM_3D_TEXTURE_MAP_SLOTS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "emissiveMap",
  "aoMap",
] as const;

export type Diagram3dTextureMapSlot = (typeof DIAGRAM_3D_TEXTURE_MAP_SLOTS)[number];

export type Diagram3dMaterialTextureUrlField =
  | "mapUrl"
  | "normalMapUrl"
  | "roughnessMapUrl"
  | "metalnessMapUrl"
  | "emissiveMapUrl"
  | "aoMapUrl";

export const DIAGRAM_3D_MATERIAL_TEXTURE_URL_FIELDS: readonly Diagram3dMaterialTextureUrlField[] =
  [
    "mapUrl",
    "normalMapUrl",
    "roughnessMapUrl",
    "metalnessMapUrl",
    "emissiveMapUrl",
    "aoMapUrl",
  ];

const TEXTURE_URL_FIELD_BY_SLOT: Record<Diagram3dTextureMapSlot, Diagram3dMaterialTextureUrlField> =
  {
    map: "mapUrl",
    normalMap: "normalMapUrl",
    roughnessMap: "roughnessMapUrl",
    metalnessMap: "metalnessMapUrl",
    emissiveMap: "emissiveMapUrl",
    aoMap: "aoMapUrl",
  };

export type Diagram3dResolvedTextureMaps = Partial<
  Record<Diagram3dTextureMapSlot, string>
>;

export function diagram3dTextureMapSlotLabel(slot: Diagram3dTextureMapSlot): string {
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
      return "Ambient occlusion";
    default:
      return slot;
  }
}

export function diagram3dTextureUrlFieldLabel(field: Diagram3dMaterialTextureUrlField): string {
  const slot = DIAGRAM_3D_TEXTURE_MAP_SLOTS.find(
    (entry) => TEXTURE_URL_FIELD_BY_SLOT[entry] === field,
  );
  return slot != null ? diagram3dTextureMapSlotLabel(slot) : field;
}

/** Accepts http(s) image URLs for online texture maps. */
export function sanitizeDiagram3dTextureUrl(raw: string | undefined): string | undefined {
  if (raw == null) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }
    return trimmed;
  } catch {
    return undefined;
  }
}

export function resolveDiagram3dMaterialTextureMaps(
  material?: Diagram3dMaterialV1,
): Diagram3dResolvedTextureMaps {
  if (material == null) {
    return {};
  }
  const resolved: Diagram3dResolvedTextureMaps = {};
  for (const slot of DIAGRAM_3D_TEXTURE_MAP_SLOTS) {
    const field = TEXTURE_URL_FIELD_BY_SLOT[slot];
    const url = sanitizeDiagram3dTextureUrl(material[field]);
    if (url != null) {
      resolved[slot] = url;
    }
  }
  return resolved;
}

export function hasDiagram3dMaterialTextureMaps(
  maps: Diagram3dResolvedTextureMaps,
): maps is Required<Diagram3dResolvedTextureMaps> {
  return DIAGRAM_3D_TEXTURE_MAP_SLOTS.some((slot) => maps[slot] != null);
}

export function diagram3dMaterialHasAnyTextureUrl(material?: Diagram3dMaterialV1): boolean {
  return DIAGRAM_3D_TEXTURE_MAP_SLOTS.some((slot) => {
    const field = TEXTURE_URL_FIELD_BY_SLOT[slot];
    return sanitizeDiagram3dTextureUrl(material?.[field]) != null;
  });
}

export function stripEmptyDiagram3dMaterialTextureUrls(
  material: Diagram3dMaterialV1,
): Diagram3dMaterialV1 {
  const next: Diagram3dMaterialV1 = { ...material };
  for (const field of DIAGRAM_3D_MATERIAL_TEXTURE_URL_FIELDS) {
    const raw = next[field];
    if (typeof raw === "string" && raw.trim().length === 0) {
      delete next[field];
    }
  }
  return next;
}

import type {
  Diagram3dMaterialKindV1,
  Diagram3dMaterialV1,
} from "../../schemas/diagram.v1";
import {
  DIAGRAM_3D_MATERIAL_TEXTURE_URL_FIELDS,
  stripEmptyDiagram3dMaterialTextureUrls,
} from "./diagram3dTextureMaps";

export type ResolvedDiagram3dMaterial = {
  kind: Diagram3dMaterialKindV1;
  presetId?: string;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  ior: number;
  thickness: number;
  wireframe: boolean;
};

export const DEFAULT_DIAGRAM_3D_MESH_MATERIAL: ResolvedDiagram3dMaterial = {
  kind: "standard",
  color: "#64748b",
  emissive: "#94a3b8",
  emissiveIntensity: 0.05,
  metalness: 0.25,
  roughness: 0.55,
  clearcoat: 0,
  clearcoatRoughness: 0,
  transmission: 0,
  ior: 1.5,
  thickness: 0,
  wireframe: false,
};

export const PROCEDURAL_PCB_DEFAULT_MATERIAL: ResolvedDiagram3dMaterial = {
  kind: "standard",
  color: "#1a4a2a",
  emissive: "#34D399",
  emissiveIntensity: 0.08,
  metalness: 0.2,
  roughness: 0.7,
  clearcoat: 0,
  clearcoatRoughness: 0,
  transmission: 0,
  ior: 1.5,
  thickness: 0,
  wireframe: false,
};

export const PROCEDURAL_CHIP_DEFAULT_MATERIAL: ResolvedDiagram3dMaterial = {
  kind: "standard",
  color: "#222222",
  emissive: "#34D399",
  emissiveIntensity: 0.08,
  metalness: 0.6,
  roughness: 0.5,
  clearcoat: 0,
  clearcoatRoughness: 0,
  transmission: 0,
  ior: 1.5,
  thickness: 0,
  wireframe: false,
};

export function resolveDiagram3dMaterialKind(
  material?: Diagram3dMaterialV1,
): Diagram3dMaterialKindV1 {
  return material?.kind ?? "standard";
}

export function mergeDiagram3dMaterial(
  defaults: ResolvedDiagram3dMaterial,
  override?: Diagram3dMaterialV1,
): ResolvedDiagram3dMaterial {
  if (override == null) {
    return defaults;
  }
  return {
    kind: override.kind ?? defaults.kind,
    presetId: override.presetId ?? defaults.presetId,
    color: override.color ?? defaults.color,
    emissive: override.emissive ?? defaults.emissive,
    emissiveIntensity: override.emissiveIntensity ?? defaults.emissiveIntensity,
    metalness: override.metalness ?? defaults.metalness,
    roughness: override.roughness ?? defaults.roughness,
    clearcoat: override.clearcoat ?? defaults.clearcoat,
    clearcoatRoughness: override.clearcoatRoughness ?? defaults.clearcoatRoughness,
    transmission: override.transmission ?? defaults.transmission,
    ior: override.ior ?? defaults.ior,
    thickness: override.thickness ?? defaults.thickness,
    wireframe: override.wireframe ?? defaults.wireframe,
  };
}

export function mergeDiagram3dMaterialPatch(
  current: Diagram3dMaterialV1 | undefined,
  patch: Partial<Diagram3dMaterialV1> | null | undefined,
): Diagram3dMaterialV1 | undefined {
  if (patch === null) {
    return undefined;
  }
  if (patch == null) {
    return current;
  }
  const merged = stripEmptyDiagram3dMaterialTextureUrls({ ...current, ...patch });
  const hasValue = Object.entries(merged).some(([key, value]) => {
    if (value === undefined) {
      return false;
    }
    if (
      (DIAGRAM_3D_MATERIAL_TEXTURE_URL_FIELDS as readonly string[]).includes(key) &&
      typeof value === "string" &&
      value.trim().length === 0
    ) {
      return false;
    }
    return true;
  });
  return hasValue ? merged : undefined;
}

export function diagram3dMaterialNeedsTransparency(
  resolved: ResolvedDiagram3dMaterial,
  opacity: number,
): boolean {
  return opacity < 1 || resolved.transmission > 0;
}

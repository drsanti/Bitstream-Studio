import {
  countStudioGltfExtractionRows,
  type StudioGltfExtractKind,
  type StudioGltfExtractionResult,
} from "../gltf/studio-gltf-extract";

export type ModelOutlinerTypeFilter = "all" | StudioGltfExtractKind;

/** Filters that map to {@link StudioGltfExtractionResult.sceneTree} nodes (parts, lights, cameras). */
export function isSceneHierarchyTypeFilter(filter: ModelOutlinerTypeFilter): boolean {
  return filter === "all" || filter === "part" || filter === "light" || filter === "camera";
}

/**
 * Animations, materials, and morphs are GLB metadata — not Object3D nodes in the scene graph.
 * Hierarchy mode lists them via the flat extract panel instead of the object tree.
 */
export function typeFilterUsesFlatExtractList(filter: ModelOutlinerTypeFilter): boolean {
  return filter === "animation" || filter === "material" || filter === "morph";
}

export const MODEL_OUTLINER_TYPE_FILTER_CHIPS: readonly {
  id: ModelOutlinerTypeFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "animation", label: "Anim" },
  { id: "part", label: "Parts" },
  { id: "material", label: "Mat" },
  { id: "morph", label: "Morph" },
  { id: "light", label: "Light" },
  { id: "camera", label: "Cam" },
] as const;

export function countModelOutlinerTypeFilter(
  result: StudioGltfExtractionResult,
  filter: ModelOutlinerTypeFilter,
): number {
  if (filter === "all") {
    return countStudioGltfExtractionRows(result);
  }
  switch (filter) {
    case "animation":
      return result.animations.length;
    case "part":
      return result.parts.length;
    case "material":
      return result.materials.length;
    case "morph":
      return result.morphs.length;
    case "light":
      return result.lights.length;
    case "camera":
      return result.cameras.length;
    default:
      return 0;
  }
}

export function filterExtractionByType(
  result: StudioGltfExtractionResult,
  filter: ModelOutlinerTypeFilter,
): StudioGltfExtractionResult {
  if (filter === "all") {
    return result;
  }
  return {
    animations: filter === "animation" ? result.animations : [],
    parts: filter === "part" ? result.parts : [],
    materials: filter === "material" ? result.materials : [],
    morphs: filter === "morph" ? result.morphs : [],
    lights: filter === "light" ? result.lights : [],
    cameras: filter === "camera" ? result.cameras : [],
    sceneTree: result.sceneTree,
    objectDetailsByPath: result.objectDetailsByPath,
    materialDetailsByName: result.materialDetailsByName,
  };
}

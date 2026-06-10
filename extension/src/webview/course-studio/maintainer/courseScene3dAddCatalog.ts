import type { Diagram3dModelIdV1, Diagram3dNodeV1 } from "../schemas/diagram.v1";
import { buildCourseDiagramModelSelectOptions } from "../content/courseDiagramGlbCatalog";
import {
  buildCourseScene3dAddPresetNode,
  buildCourseScene3dCatalogModelNode,
  COURSE_SCENE_3D_ADD_PRESETS,
  type CourseScene3dAddPresetId,
} from "./courseScene3dModelPresets";
import { matchesTrnMenuSearch } from "../../ui/TRN/TRNMenuSearch";

export type CourseScene3dAddCategoryId = "mesh" | "presets" | "catalog";

export type CourseScene3dAddMenuEntry = {
  id: string;
  categoryId: CourseScene3dAddCategoryId;
  label: string;
  keywords?: string;
  spawn: () => Diagram3dNodeV1;
};

export type CourseScene3dAddCategory = {
  id: CourseScene3dAddCategoryId;
  label: string;
  keywords?: string;
};

export const COURSE_SCENE_3D_ADD_CATEGORIES: CourseScene3dAddCategory[] = [
  { id: "mesh", label: "Mesh", keywords: "primitive box cube sphere plane torus capsule" },
  { id: "presets", label: "Presets", keywords: "pcb triad gimbal domain" },
  { id: "catalog", label: "Catalog GLB", keywords: "glb model import" },
];

function spawnProceduralMeshNode(
  prefix: string,
  modelId: Extract<
    Diagram3dModelIdV1,
    | "procedural-sphere"
    | "procedural-cylinder"
    | "procedural-cone"
    | "procedural-plane"
    | "procedural-torus"
    | "procedural-capsule"
    | "procedural-ring"
    | "procedural-icosahedron"
    | "procedural-torus-knot"
  >,
): Diagram3dNodeV1 {
  return {
    id: `${prefix}-${Date.now().toString(36)}`,
    type: "model",
    modelId,
  };
}

const MESH_ENTRIES: CourseScene3dAddMenuEntry[] = [
  {
    id: "mesh-box",
    categoryId: "mesh",
    label: "Box",
    keywords: "cube primitive mesh",
    spawn: () => buildCourseScene3dAddPresetNode("box"),
  },
  {
    id: "mesh-sphere",
    categoryId: "mesh",
    label: "Sphere",
    keywords: "ball round primitive mesh",
    spawn: () => spawnProceduralMeshNode("sphere", "procedural-sphere"),
  },
  {
    id: "mesh-cylinder",
    categoryId: "mesh",
    label: "Cylinder",
    keywords: "tube round primitive mesh",
    spawn: () => spawnProceduralMeshNode("cylinder", "procedural-cylinder"),
  },
  {
    id: "mesh-cone",
    categoryId: "mesh",
    label: "Cone",
    keywords: "pyramid primitive mesh",
    spawn: () => spawnProceduralMeshNode("cone", "procedural-cone"),
  },
  {
    id: "mesh-plane",
    categoryId: "mesh",
    label: "Plane",
    keywords: "floor ground card quad primitive mesh",
    spawn: () => spawnProceduralMeshNode("plane", "procedural-plane"),
  },
  {
    id: "mesh-torus",
    categoryId: "mesh",
    label: "Torus",
    keywords: "donut ring primitive mesh",
    spawn: () => spawnProceduralMeshNode("torus", "procedural-torus"),
  },
  {
    id: "mesh-capsule",
    categoryId: "mesh",
    label: "Capsule",
    keywords: "pill capsule primitive mesh",
    spawn: () => spawnProceduralMeshNode("capsule", "procedural-capsule"),
  },
  {
    id: "mesh-ring",
    categoryId: "mesh",
    label: "Ring",
    keywords: "washer disc flat primitive mesh",
    spawn: () => spawnProceduralMeshNode("ring", "procedural-ring"),
  },
  {
    id: "mesh-icosahedron",
    categoryId: "mesh",
    label: "Icosahedron",
    keywords: "polyhedron d20 primitive mesh",
    spawn: () => spawnProceduralMeshNode("icosahedron", "procedural-icosahedron"),
  },
  {
    id: "mesh-torus-knot",
    categoryId: "mesh",
    label: "Torus knot",
    keywords: "knot twisted primitive mesh",
    spawn: () => spawnProceduralMeshNode("torus-knot", "procedural-torus-knot"),
  },
];

const PRESET_IDS: CourseScene3dAddPresetId[] = ["pcb", "axis-triad", "gyro-gimbal"];

export function buildCourseScene3dAddMenuEntries(): CourseScene3dAddMenuEntry[] {
  const presetEntries: CourseScene3dAddMenuEntry[] = PRESET_IDS.map((presetId) => {
    const preset = COURSE_SCENE_3D_ADD_PRESETS.find((entry) => entry.id === presetId);
    return {
      id: `preset-${presetId}`,
      categoryId: "presets" as const,
      label: preset?.label ?? presetId,
      keywords: preset?.keywords,
      spawn: () => buildCourseScene3dAddPresetNode(presetId),
    };
  });

  const catalogEntries: CourseScene3dAddMenuEntry[] = buildCourseDiagramModelSelectOptions()
    .filter((entry) => entry.value.startsWith("catalog:"))
    .map((entry) => ({
      id: `catalog-${entry.value}`,
      categoryId: "catalog" as const,
      label: entry.label,
      keywords: entry.value,
      spawn: () => buildCourseScene3dCatalogModelNode(entry.value as Diagram3dModelIdV1),
    }));

  return [...MESH_ENTRIES, ...presetEntries, ...catalogEntries];
}

export function spawnCourseScene3dGroupNode(): Diagram3dNodeV1 {
  return buildCourseScene3dAddPresetNode("group");
}

export function categoryEntryCount(
  entries: readonly CourseScene3dAddMenuEntry[],
  categoryId: CourseScene3dAddCategoryId,
): number {
  return entries.filter((entry) => entry.categoryId === categoryId).length;
}

export function entriesForCategory(
  entries: readonly CourseScene3dAddMenuEntry[],
  categoryId: CourseScene3dAddCategoryId,
): CourseScene3dAddMenuEntry[] {
  return entries.filter((entry) => entry.categoryId === categoryId);
}

export type CourseScene3dAddSearchRow = {
  entry: CourseScene3dAddMenuEntry;
  categoryLabel: string;
};

export function filterCourseScene3dAddMenuEntries(
  entries: readonly CourseScene3dAddMenuEntry[],
  query: string,
): CourseScene3dAddSearchRow[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }
  const categoryLabelById = new Map(
    COURSE_SCENE_3D_ADD_CATEGORIES.map((category) => [category.id, category.label]),
  );
  return entries
    .filter((entry) =>
      matchesTrnMenuSearch(trimmed, entry.label, [
        entry.keywords,
        categoryLabelById.get(entry.categoryId),
      ]),
    )
    .map((entry) => ({
      entry,
      categoryLabel: categoryLabelById.get(entry.categoryId) ?? entry.categoryId,
    }));
}

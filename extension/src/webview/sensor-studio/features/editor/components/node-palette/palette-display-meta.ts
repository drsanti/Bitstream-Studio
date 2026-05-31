import type { NodeCatalogEntry } from "../../../../core/config/config-types";

/** Blender GN–style display groups (9) over the 7 schema categories. */
export type PaletteDisplayGroup =
  | "input"
  | "data"
  | "transform"
  | "logic"
  | "output"
  | "scene"
  | "animation"
  | "events"
  | "utilities";

export const PALETTE_DISPLAY_GROUP_ORDER: PaletteDisplayGroup[] = [
  "input",
  "data",
  "transform",
  "logic",
  "output",
  "scene",
  "animation",
  "events",
  "utilities",
];

export const PALETTE_DISPLAY_GROUP_LABEL: Record<PaletteDisplayGroup, string> = {
  input: "Input",
  data: "Data",
  transform: "Transform",
  logic: "Logic",
  output: "Output",
  scene: "Scene",
  animation: "Animation",
  events: "Events",
  utilities: "Utilities",
};

const EVENT_ID_PREFIXES = ["event-", "on-"];
const SCENE_ID_PREFIXES = ["model-", "glb-", "scene-", "camera-", "light-", "environment-"];

export function resolvePaletteDisplayGroup(entry: NodeCatalogEntry): PaletteDisplayGroup {
  const id = entry.id.toLowerCase();
  if (entry.category === "input") {
    return "input";
  }
  if (entry.category === "sensor") {
    return "data";
  }
  if (entry.category === "transform") {
    return "transform";
  }
  if (entry.category === "logic") {
    return "logic";
  }
  if (entry.category === "output") {
    return "output";
  }
  if (entry.category === "generator") {
    return "animation";
  }
  if (EVENT_ID_PREFIXES.some((p) => id.startsWith(p))) {
    return "events";
  }
  if (SCENE_ID_PREFIXES.some((p) => id.startsWith(p))) {
    return "scene";
  }
  return "utilities";
}

export function groupEntriesByDisplayGroup(
  entries: readonly NodeCatalogEntry[],
): Map<PaletteDisplayGroup, NodeCatalogEntry[]> {
  const map = new Map<PaletteDisplayGroup, NodeCatalogEntry[]>();
  for (const g of PALETTE_DISPLAY_GROUP_ORDER) {
    map.set(g, []);
  }
  for (const entry of entries) {
    const group = resolvePaletteDisplayGroup(entry);
    map.get(group)?.push(entry);
  }
  return map;
}

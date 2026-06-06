import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { getPaletteEntryMeta } from "./palette-entry-meta";

/** Group catalog entries by palette subgroup id (sensor family, scene role, …). */
export function buildPaletteSubgroupMap<T extends string>(
  order: readonly T[],
  entries: readonly NodeCatalogEntry[],
  resolveSubgroup: (entry: NodeCatalogEntry) => T | null,
): Map<T, NodeCatalogEntry[]> {
  const map = new Map<T, NodeCatalogEntry[]>();
  for (const sg of order) {
    map.set(sg, []);
  }
  for (const entry of entries) {
    const sg = resolveSubgroup(entry);
    if (sg != null) {
      map.get(sg)?.push(entry);
    }
  }
  return map;
}

export function resolvePaletteSensorSubgroup(entry: NodeCatalogEntry) {
  return getPaletteEntryMeta(entry).sensorSubgroup;
}

export function resolvePaletteSceneSubgroup(entry: NodeCatalogEntry) {
  return getPaletteEntryMeta(entry).sceneSubgroup;
}

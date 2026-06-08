import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { GLB_ANIMATION_FLOW_SEARCH_ALIASES } from "../../../../config/glb-animation-flow-search-aliases";
import { MESH_PRIMITIVE_SEARCH_ALIASES } from "../../../../config/mesh-primitive-search-aliases";
import { VECTOR_QUATERNION_MATH_SEARCH_ALIASES } from "../../../../config/vector-quaternion-math-search-aliases";
import { getPaletteEntryMeta } from "./palette-entry-meta";

const PALETTE_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  ...VECTOR_QUATERNION_MATH_SEARCH_ALIASES,
  ...GLB_ANIMATION_FLOW_SEARCH_ALIASES,
  ...MESH_PRIMITIVE_SEARCH_ALIASES,
};

function entryMatchesSearchQuery(entry: NodeCatalogEntry, q: string): boolean {
  if (
    entry.title.toLowerCase().includes(q) ||
    entry.id.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q)
  ) {
    return true;
  }
  const aliases = PALETTE_SEARCH_ALIASES[entry.id];
  if (aliases != null && aliases.some((term) => term.includes(q) || q.includes(term))) {
    return true;
  }
  return false;
}

export function filterPaletteEntries(entries: NodeCatalogEntry[], query: string): NodeCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return entries;
  }
  return entries.filter((e) => {
    if (entryMatchesSearchQuery(e, q)) {
      return true;
    }
    const meta = getPaletteEntryMeta(e);
    if (meta.chip != null && meta.chip.toLowerCase().includes(q)) {
      return true;
    }
    if (meta.subgroupLabel.length > 0 && meta.subgroupLabel.toLowerCase().includes(q)) {
      return true;
    }
    return false;
  });
}

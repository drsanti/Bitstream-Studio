import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { VECTOR_QUATERNION_MATH_SEARCH_ALIASES } from "../../../../config/vector-quaternion-math-search-aliases";
import { getPaletteEntryMeta } from "./palette-entry-meta";

function entryMatchesSearchQuery(entry: NodeCatalogEntry, q: string): boolean {
  if (
    entry.title.toLowerCase().includes(q) ||
    entry.id.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q)
  ) {
    return true;
  }
  const aliases = VECTOR_QUATERNION_MATH_SEARCH_ALIASES[entry.id];
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

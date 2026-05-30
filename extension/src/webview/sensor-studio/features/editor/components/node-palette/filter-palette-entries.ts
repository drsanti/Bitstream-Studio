import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { getPaletteEntryMeta } from "./palette-entry-meta";

export function filterPaletteEntries(entries: NodeCatalogEntry[], query: string): NodeCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return entries;
  }
  return entries.filter((e) => {
    if (
      e.title.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    ) {
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

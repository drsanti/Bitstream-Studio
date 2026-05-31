import type { NodeCatalogEntry } from "../../../../core/config/config-types";

/** Catalog rows shown in Library and the Shift+A add-node menu. */
export function listAddableCatalogEntries(entries: readonly NodeCatalogEntry[]): NodeCatalogEntry[] {
  return entries.filter((e) => e.defaultVisible !== false);
}

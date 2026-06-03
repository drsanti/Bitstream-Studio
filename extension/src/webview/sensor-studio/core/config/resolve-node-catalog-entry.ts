import { NODE_CATALOG_DEFAULTS } from "../../config/node-catalog.config";
import type { NodeCatalogEntry } from "./config-types";

let catalogByNodeId: Map<string, NodeCatalogEntry> | null = null;

function catalogEntryMap(): Map<string, NodeCatalogEntry> {
  if (catalogByNodeId == null) {
    catalogByNodeId = new Map(
      NODE_CATALOG_DEFAULTS.payload.nodes.map((entry) => [entry.id, entry]),
    );
  }
  return catalogByNodeId;
}

export function resolveNodeCatalogEntry(
  nodeId: string,
): NodeCatalogEntry | undefined {
  return catalogEntryMap().get(nodeId);
}

export function resolveNodeCatalogIconSlug(nodeId: string): string {
  return resolveNodeCatalogEntry(nodeId)?.icon ?? "box";
}

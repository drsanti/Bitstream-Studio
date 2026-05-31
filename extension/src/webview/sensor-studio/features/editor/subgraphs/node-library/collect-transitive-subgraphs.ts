import type { Node } from "@xyflow/react";
import type { StudioNodeGroupData, StudioSubgraphDocument } from "../studio-subgraph.types";

/** Collect subgraph keys reachable from roots, including nested `studio-node-group` hosts. */
export function collectTransitiveSubgraphKeys(
  subgraphs: Record<string, StudioSubgraphDocument>,
  rootKeys: Iterable<string>,
): Set<string> {
  const keys = new Set<string>();

  const walk = (key: string) => {
    if (keys.has(key)) {
      return;
    }
    keys.add(key);
    const doc = subgraphs[key];
    if (doc == null) {
      return;
    }
    for (const node of doc.nodes) {
      if (node.type !== "studio-node-group") {
        continue;
      }
      const data = node.data as StudioNodeGroupData;
      walk(data.subgraphId ?? node.id);
    }
  };

  for (const key of rootKeys) {
    walk(key);
  }

  return keys;
}

export function pickSubgraphs(
  subgraphs: Record<string, StudioSubgraphDocument>,
  keys: Set<string>,
): Record<string, StudioSubgraphDocument> {
  const out: Record<string, StudioSubgraphDocument> = {};
  for (const key of keys) {
    const doc = subgraphs[key];
    if (doc != null) {
      out[key] = structuredClone(doc);
    }
  }
  return out;
}

/** All nodes inside the given subgraph keys (for dependency scan). */
export function nodesInSubgraphKeys(
  subgraphs: Record<string, StudioSubgraphDocument>,
  keys: Set<string>,
): Node[] {
  const nodes: Node[] = [];
  for (const key of keys) {
    const doc = subgraphs[key];
    if (doc != null) {
      nodes.push(...doc.nodes);
    }
  }
  return nodes;
}

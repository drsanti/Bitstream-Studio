import type { Edge, Node } from "@xyflow/react";
import { cloneStudioSubgraphDeep } from "./clone-studio-subgraph";
import type { StudioNodeGroupData, StudioSubgraphDocument } from "./studio-subgraph.types";
import { isStudioNodeGroupNode } from "./studio-subgraph.types";
import { countSubgraphHosts } from "./dissolve-studio-node-group";

const DUPLICATE_OFFSET = { x: 48, y: 32 };

function newGroupHostId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function resolveGroupTitle(data: StudioNodeGroupData, subgraph?: StudioSubgraphDocument): string {
  const fromData = typeof data.graphTitle === "string" ? data.graphTitle.trim() : "";
  const fromSub = typeof subgraph?.graphTitle === "string" ? subgraph.graphTitle.trim() : "";
  return fromData || fromSub || "Node Group";
}

export function countStudioSubgraphHosts(
  subgraphId: string,
  rootNodes: readonly Node[],
  subgraphs: Record<string, StudioSubgraphDocument>,
): number {
  return countSubgraphHosts(subgraphId, [...rootNodes], subgraphs);
}

export type DuplicateGroupInstanceResult = {
  hostNode: Node;
  subgraphs: Record<string, StudioSubgraphDocument>;
};

/** Second shell sharing the same `subgraphs[subgraphId]` document. */
export function duplicateStudioGroupLinked(
  source: Node,
  subgraphs: Record<string, StudioSubgraphDocument>,
): DuplicateGroupInstanceResult | null {
  if (!isStudioNodeGroupNode(source)) {
    return null;
  }
  const data = source.data;
  const subgraphId = data.subgraphId ?? source.id;
  if (subgraphs[subgraphId] == null) {
    return null;
  }

  const title = resolveGroupTitle(data, subgraphs[subgraphId]);
  const linkedTitle = title.endsWith("(linked)") ? title : `${title} (linked)`;

  return {
    hostNode: {
      ...structuredClone(source),
      id: newGroupHostId(),
      position: {
        x: source.position.x + DUPLICATE_OFFSET.x,
        y: source.position.y + DUPLICATE_OFFSET.y,
      },
      selected: true,
      data: {
        ...data,
        graphTitle: linkedTitle,
        subgraphId,
      },
    },
    subgraphs,
  };
}

/** Independent subgraph clone keyed by the new host id. */
export function duplicateStudioGroupDeepCopy(
  source: Node,
  subgraphs: Record<string, StudioSubgraphDocument>,
): DuplicateGroupInstanceResult | null {
  if (!isStudioNodeGroupNode(source)) {
    return null;
  }
  const data = source.data;
  const sourceSubgraphId = data.subgraphId ?? source.id;
  if (subgraphs[sourceSubgraphId] == null) {
    return null;
  }

  const newHostId = newGroupHostId();
  const title = resolveGroupTitle(data, subgraphs[sourceSubgraphId]);
  const copyTitle = title.endsWith("(copy)") ? title : `${title} (copy)`;

  return {
    hostNode: {
      ...structuredClone(source),
      id: newHostId,
      position: {
        x: source.position.x + DUPLICATE_OFFSET.x,
        y: source.position.y + DUPLICATE_OFFSET.y,
      },
      selected: true,
      data: {
        ...data,
        graphTitle: copyTitle,
        subgraphId: newHostId,
      },
    },
    subgraphs: cloneStudioSubgraphDeep(subgraphs, sourceSubgraphId, newHostId),
  };
}

/** Insert a duplicated group shell onto the root graph buffer. */
export function appendGroupHostToRootGraph(
  rootNodes: Node[],
  rootEdges: Edge[],
  hostNode: Node,
): { rootNodes: Node[]; rootEdges: Edge[] } {
  return {
    rootNodes: [...rootNodes.map((n) => ({ ...n, selected: false })), hostNode],
    rootEdges,
  };
}

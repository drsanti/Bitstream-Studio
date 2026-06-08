import type { Edge } from "@xyflow/react";
import { studioFlowPinKey } from "../store/flow-editor.store";
import { STUDIO_HANDLE_IN } from "../studio-handle-ids";
import {
  findGroupBoundaryNode,
  isStudioNodeGroupNode,
  type StudioGroupSocketDefaultValue,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

type FlowPinValue = number | boolean | string;

function remapInnerNodeId(hostNodeId: string, innerId: string): string {
  if (innerId.startsWith(`${hostNodeId}__`)) {
    return innerId;
  }
  return `${hostNodeId}__${innerId}`;
}

function defaultAsPinValue(value: StudioGroupSocketDefaultValue | undefined): FlowPinValue | null {
  if (value === undefined) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "boolean" || typeof value === "string") {
    return value;
  }
  return null;
}

/**
 * Seed flattened-eval pin values for unwired group inputs using per-socket defaults.
 */
export function applyUnwiredGroupInputDefaults(args: {
  rootNodes: readonly { id: string; type?: string; data?: unknown }[];
  rootEdges: readonly Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  pinValues: Map<string, unknown>;
}): void {
  const { rootNodes, rootEdges, subgraphs, pinValues } = args;

  for (const host of rootNodes) {
    if (!isStudioNodeGroupNode(host as Parameters<typeof isStudioNodeGroupNode>[0])) {
      continue;
    }
    const hostId = host.id;
    const subKey =
      (host.data as { subgraphId?: string }).subgraphId ?? hostId;
    const sub = subgraphs[subKey];
    if (sub == null) {
      continue;
    }

    const inputNode = findGroupBoundaryNode(sub.nodes, "input");
    if (inputNode == null) {
      continue;
    }

    for (const sock of sub.interface.inputs) {
      const hasParentWire = rootEdges.some(
        (e) => e.target === hostId && e.targetHandle === sock.id,
      );
      if (hasParentWire) {
        continue;
      }
      const defaultPin = defaultAsPinValue(sock.defaultValue);
      if (defaultPin == null) {
        continue;
      }

      for (const edge of sub.edges) {
        if (edge.source !== inputNode.id || edge.sourceHandle !== sock.id) {
          continue;
        }
        const remappedTarget = remapInnerNodeId(hostId, edge.target);
        const handle = edge.targetHandle ?? STUDIO_HANDLE_IN;
        const key = studioFlowPinKey(remappedTarget, handle);
        if (!pinValues.has(key)) {
          pinValues.set(key, defaultPin);
        }
      }
    }
  }
}

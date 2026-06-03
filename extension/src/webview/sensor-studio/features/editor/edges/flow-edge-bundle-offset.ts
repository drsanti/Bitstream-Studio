import type { Edge } from "@xyflow/react";
import type { FlowCanvasEdgeBundleMode } from "../../../persistence/flow-canvas-preferences";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../studio-handle-ids";
import { symmetricOffsetsForEdgeGroups } from "./flow-edge-offset-groups";

/** Wires leaving the same output socket (fan-out / trunk split). */
export function sourceBundleGroupKey(edge: Edge): string {
  return `${edge.source ?? ""}|${edge.sourceHandle ?? STUDIO_HANDLE_OUT}`;
}

/** Wires arriving at the same input socket (fan-in / merge). */
export function targetBundleGroupKey(edge: Edge): string {
  return `${edge.target ?? ""}|${edge.targetHandle ?? STUDIO_HANDLE_IN}`;
}

function groupEdgesByKey(
  edges: readonly Edge[],
  keyFn: (edge: Edge) => string,
): Map<string, Edge[]> {
  const groups = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = keyFn(edge);
    const list = groups.get(key);
    if (list != null) {
      list.push(edge);
    } else {
      groups.set(key, [edge]);
    }
  }
  return groups;
}

/**
 * Adds bundle offsets on top of any existing `pathOptions.offset` (e.g. parallel pair spacing).
 */
export function applyEdgeBundleOffsets(
  edges: readonly Edge[],
  mode: FlowCanvasEdgeBundleMode,
  spacingPx: number,
): Edge[] {
  if (mode === "off" || spacingPx <= 0) {
    return edges.map((e) => e);
  }

  const addById = new Map<string, number>();

  const mergeOffsets = (offsets: Map<string, number>) => {
    for (const [id, delta] of offsets) {
      addById.set(id, (addById.get(id) ?? 0) + delta);
    }
  };

  if (mode === "fanOut" || mode === "both") {
    mergeOffsets(
      symmetricOffsetsForEdgeGroups(groupEdgesByKey(edges, sourceBundleGroupKey), spacingPx),
    );
  }
  if (mode === "fanIn" || mode === "both") {
    mergeOffsets(
      symmetricOffsetsForEdgeGroups(groupEdgesByKey(edges, targetBundleGroupKey), spacingPx),
    );
  }

  if (addById.size === 0) {
    return edges.map((e) => e);
  }

  return edges.map((edge) => {
    const delta = addById.get(edge.id);
    if (delta == null || delta === 0) {
      return edge;
    }
    const existing =
      typeof edge.pathOptions?.offset === "number" ? edge.pathOptions.offset : 0;
    const offset = existing + delta;
    return {
      ...edge,
      pathOptions: { ...(edge.pathOptions ?? {}), offset },
    };
  });
}

import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import { SCENE_OUTPUT_NODE_ID } from "./evaluate-stage-scene-snapshot";

function stableJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

/** True when the evaluation graph contains a **scene-output** node. */
export function graphHasSceneOutputNode(nodes: readonly FlowGraphNode[]): boolean {
  return nodes.some((node) => node.data.nodeId === SCENE_OUTPUT_NODE_ID);
}

/**
 * Revision for Stage scene structure — ignores simulation `live*` fields.
 * Bumps when Scene Output wiring or committed source configs change.
 */
export function readStageStructuralRevision(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): string {
  const parts: string[] = [];
  const outputIds = new Set<string>();

  for (const node of nodes) {
    if (node.type !== "studio") {
      continue;
    }
    const nodeId = node.data.nodeId;
    const dc = node.data.defaultConfig as Record<string, unknown>;
    if (nodeId === SCENE_OUTPUT_NODE_ID) {
      outputIds.add(node.id);
      parts.push(
        `out:${node.id}:${stableJson({ showGrid: dc.showGrid, scene3d: dc.scene3d })}`,
      );
    }
  }

  for (const edge of edges) {
    if (!outputIds.has(edge.target)) {
      continue;
    }
    const sh = edge.sourceHandle ?? "";
    const th = edge.targetHandle ?? "";
    parts.push(`e:${edge.id}:${edge.source}:${sh}:${th}`);
    const src = nodes.find((n) => n.id === edge.source);
    if (src?.type !== "studio") {
      continue;
    }
    const srcDc = src.data.defaultConfig as Record<string, unknown>;
    const srcNodeId = src.data.nodeId;
    if (srcNodeId === "model-select") {
      parts.push(
        `m:${src.id}:${String(srcDc.selectedModelUrl ?? "")}:${String(srcDc.selectedStudioAssetId ?? "")}`,
      );
      continue;
    }
    if (srcNodeId != null && srcNodeId.startsWith("mesh-")) {
      parts.push(`mesh:${src.id}:${srcNodeId}:${stableJson(srcDc)}`);
    }
  }

  parts.sort();
  return parts.join("\u0000");
}

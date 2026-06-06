import type { StudioNode } from "../../features/editor/store/flow-editor.store";
import { STUDIO_HANDLE_OUT } from "../../features/editor/store/flow-editor.store";
import {
  nextGlbAnimEventTriggerConfig,
} from "../../features/editor/nodes/events/glb-anim-event-config";
import {
  readGlbPartSetVisibleTarget,
  readGlbPartVisibilityScalar,
  toggleGlbPartVisibilityScalar,
} from "../../features/editor/nodes/events/glb-part-event-config";

export type FlowEventEdgeLike = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type FlowEventActionId =
  | "event-toggle-boolean"
  | "event-set-boolean"
  | "event-toggle-glb-part"
  | "event-set-glb-part"
  | "event-trigger-glb-anim";

export function readFlowEventActionId(node: StudioNode): FlowEventActionId | null {
  if (node.data.nodeId === "event-toggle-boolean") {
    return "event-toggle-boolean";
  }
  if (node.data.nodeId === "event-set-boolean") {
    return "event-set-boolean";
  }
  if (node.data.nodeId === "event-toggle-glb-part") {
    return "event-toggle-glb-part";
  }
  if (node.data.nodeId === "event-set-glb-part") {
    return "event-set-glb-part";
  }
  if (node.data.nodeId === "event-trigger-glb-anim") {
    return "event-trigger-glb-anim";
  }
  return null;
}

export function collectFlowEventTargetNodeIds(
  edges: readonly FlowEventEdgeLike[],
  sourceNodeId: string,
  sourceHandle: string = STUDIO_HANDLE_OUT,
): string[] {
  const ids: string[] = [];
  for (const edge of edges) {
    if (edge.source !== sourceNodeId) {
      continue;
    }
    if ((edge.sourceHandle ?? STUDIO_HANDLE_OUT) !== sourceHandle) {
      continue;
    }
    ids.push(edge.target);
  }
  return ids;
}

export function readEventBooleanValue(defaultConfig: Record<string, unknown>): boolean {
  const raw = defaultConfig.value;
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw !== 0;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

/** @deprecated alias */
export const readEventToggleBooleanValue = readEventBooleanValue;

export function readEventSetBooleanTarget(defaultConfig: Record<string, unknown>): boolean {
  const raw = defaultConfig.setTo;
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw !== 0;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return true;
}

/** Apply event actions wired from event source nodes — returns patched nodes (immutable). */
export function applyFlowEventActionsToNodes(
  nodes: readonly StudioNode[],
  targetNodeIds: readonly string[],
): StudioNode[] {
  const targetSet = new Set(targetNodeIds);
  return nodes.map((node) => {
    if (!targetSet.has(node.id)) {
      return node;
    }
    const action = readFlowEventActionId(node);
    if (action === "event-toggle-boolean") {
      const nextValue = !readEventBooleanValue(node.data.defaultConfig as Record<string, unknown>);
      return {
        ...node,
        data: {
          ...node.data,
          defaultConfig: {
            ...node.data.defaultConfig,
            value: nextValue,
          },
        },
      };
    }
    if (action === "event-set-boolean") {
      const dc = node.data.defaultConfig as Record<string, unknown>;
      const nextValue = readEventSetBooleanTarget(dc);
      return {
        ...node,
        data: {
          ...node.data,
          defaultConfig: {
            ...dc,
            value: nextValue,
          },
        },
      };
    }
    if (action === "event-toggle-glb-part") {
      const dc = node.data.defaultConfig as Record<string, unknown>;
      const nextValue = toggleGlbPartVisibilityScalar(readGlbPartVisibilityScalar(dc));
      return {
        ...node,
        data: {
          ...node.data,
          defaultConfig: {
            ...dc,
            value: nextValue,
          },
        },
      };
    }
    if (action === "event-set-glb-part") {
      const dc = node.data.defaultConfig as Record<string, unknown>;
      const nextValue = readGlbPartSetVisibleTarget(dc);
      return {
        ...node,
        data: {
          ...node.data,
          defaultConfig: {
            ...dc,
            value: nextValue,
          },
        },
      };
    }
    if (action === "event-trigger-glb-anim") {
      const dc = node.data.defaultConfig as Record<string, unknown>;
      return {
        ...node,
        data: {
          ...node.data,
          defaultConfig: nextGlbAnimEventTriggerConfig(dc),
        },
      };
    }
    return node;
  });
}

/** Mark event source nodes with a transient pulse timestamp (not persisted). */
export function pulseFlowEventSourceNodes(
  nodes: readonly StudioNode[],
  sourceNodeIds: readonly string[],
  nowMs: number = Date.now(),
): StudioNode[] {
  const sourceSet = new Set(sourceNodeIds);
  return nodes.map((node) => {
    if (!sourceSet.has(node.id)) {
      return node;
    }
    return {
      ...node,
      data: {
        ...node.data,
        flowEventLastFiredAtMs: nowMs,
      },
    };
  });
}

/** Run actions for each source id, then pulse sources. */
export function runFlowEventDispatch(args: {
  nodes: readonly StudioNode[];
  edges: readonly FlowEventEdgeLike[];
  sourceNodeIds: readonly string[];
  sourceHandle?: string;
  nowMs?: number;
}): StudioNode[] {
  const nowMs = args.nowMs ?? Date.now();
  const sourceHandle = args.sourceHandle ?? STUDIO_HANDLE_OUT;
  let nextNodes = [...args.nodes];
  const allTargets: string[] = [];
  for (const sourceId of args.sourceNodeIds) {
    allTargets.push(...collectFlowEventTargetNodeIds(args.edges, sourceId, sourceHandle));
  }
  nextNodes = applyFlowEventActionsToNodes(nextNodes, allTargets);
  return pulseFlowEventSourceNodes(nextNodes, args.sourceNodeIds, nowMs);
}

import type { StudioNodeData } from "../../store/flow-editor.store";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../../store/flow-editor.store";
import { isStudioFlowNode } from "../../layout/layout-port-resolution";
import type {
  LiveReadingStreamTone,
  LiveScalarReadingColorHints,
} from "./readings/live-reading-colors";
import { resolveLiveReadingStreamTone } from "./readings/live-reading-colors";

export type IncomingFlowEdge = {
  source: string;
  sourceHandle: string;
  targetHandle: string;
};

export type InputScalarHint = LiveScalarReadingColorHints & {
  streamMode: LiveReadingStreamTone;
};

type FlowNodeSnapshot = {
  id: string;
  type?: string;
  data: StudioNodeData;
};

function chooseIncomingEdge(
  list: IncomingFlowEdge[] | undefined,
  targetHandle: string,
): IncomingFlowEdge | null {
  if (list == null || list.length === 0) {
    return null;
  }
  return list.find((e) => e.targetHandle === targetHandle) ?? null;
}

function resolveOutputPortLabel(data: StudioNodeData, handleId: string): string | undefined {
  const fromHandles = data.outputHandles?.find((h) => h.id === handleId);
  if (fromHandles != null) {
    return fromHandles.label;
  }
  if (handleId === STUDIO_HANDLE_OUT && data.outputType != null) {
    return "Out";
  }
  return undefined;
}

function scalarOnSourceHandle(data: StudioNodeData, handleId: string): number | undefined {
  const fromMap = data.liveNumberByHandle?.[handleId];
  if (typeof fromMap === "number" && Number.isFinite(fromMap)) {
    return fromMap;
  }
  if (handleId === STUDIO_HANDLE_OUT && typeof data.liveValue === "number" && Number.isFinite(data.liveValue)) {
    return data.liveValue;
  }
  return undefined;
}

function isPassthroughFlowNode(node: FlowNodeSnapshot): boolean {
  return node.type === "studio-reroute" || node.type === "studio-split";
}

/** Utility nodes whose **Out** preserves upstream scalar semantics — recurse into the value input. */
const SCALAR_SEMANTIC_PASSTHROUGH_UPSTREAM_INPUT: Record<string, string | readonly string[]> = {
  "map-range": "value",
  clamp: "value",
  lerp: ["a", "b"],
  "material-mix": ["a", "b"],
  "value-normalizer": STUDIO_HANDLE_IN,
};

function resolvePassthroughUpstreamInputHandle(
  nodeId: string,
  flowNodeId: string,
  incomingByTarget: Map<string, IncomingFlowEdge[]>,
): string | null {
  const spec = SCALAR_SEMANTIC_PASSTHROUGH_UPSTREAM_INPUT[nodeId];
  if (spec == null) {
    return null;
  }
  if (typeof spec === "string") {
    return spec;
  }
  for (const handleId of spec) {
    if (chooseIncomingEdge(incomingByTarget.get(flowNodeId), handleId) != null) {
      return handleId;
    }
  }
  return spec[0] ?? null;
}

function shouldRecurseUtilityPassthrough(sourceHandle: string): boolean {
  return sourceHandle === STUDIO_HANDLE_OUT;
}

/** Walk upstream from a target input pin to the originating scalar source for semantic tint. */
export function resolveInputScalarHintFromUpstream(args: {
  targetFlowId: string;
  targetHandle: string;
  incomingByTarget: Map<string, IncomingFlowEdge[]>;
  nodeById: Map<string, FlowNodeSnapshot>;
  depth?: number;
}): InputScalarHint | null {
  const { targetFlowId, targetHandle, incomingByTarget, nodeById, depth = 0 } = args;
  if (depth > 12) {
    return null;
  }

  const edge = chooseIncomingEdge(incomingByTarget.get(targetFlowId), targetHandle);
  if (edge == null) {
    return null;
  }

  const sourceNode = nodeById.get(edge.source);
  if (sourceNode == null) {
    return null;
  }

  if (isPassthroughFlowNode(sourceNode)) {
    return resolveInputScalarHintFromUpstream({
      targetFlowId: sourceNode.id,
      targetHandle: STUDIO_HANDLE_IN,
      incomingByTarget,
      nodeById,
      depth: depth + 1,
    });
  }

  if (!isStudioFlowNode(sourceNode)) {
    return null;
  }

  const sourceHandle = edge.sourceHandle || STUDIO_HANDLE_OUT;
  const sourceData = sourceNode.data;

  if (shouldRecurseUtilityPassthrough(sourceHandle)) {
    const upstreamInput = resolvePassthroughUpstreamInputHandle(
      sourceData.nodeId,
      sourceNode.id,
      incomingByTarget,
    );
    if (upstreamInput != null) {
      const fromUpstream = resolveInputScalarHintFromUpstream({
        targetFlowId: sourceNode.id,
        targetHandle: upstreamInput,
        incomingByTarget,
        nodeById,
        depth: depth + 1,
      });
      if (fromUpstream != null) {
        return fromUpstream;
      }
    }
  }

  const label = resolveOutputPortLabel(sourceData, sourceHandle);
  const scalar = scalarOnSourceHandle(sourceData, sourceHandle);

  return {
    handleId: sourceHandle,
    nodeId: sourceData.nodeId,
    label,
    streamMode: resolveLiveReadingStreamTone({
      sensorHealth: sourceData.sensorHealth,
      lastValidAtIso: sourceData.sensorLastValidAtByHandle?.[sourceHandle],
      value: scalar,
    }),
  };
}

import type { Edge } from "@xyflow/react";
import type { StudioNodeData } from "../../store/flow-editor.store";
import {
  resolveInputScalarHintFromUpstream,
  type IncomingFlowEdge,
} from "../flow-node/resolve-input-scalar-hints";
import { resolveScalarSemanticColorHex } from "../flow-node/readings/scalar-semantic-color-hex";
import {
  PLOTTER_INPUT_IDS,
  type PlotterChannelStyle,
  type PlotterConfig,
  type PlotterInputId,
} from "./plotter-config";

function buildIncomingByTarget(edges: readonly Edge[]): Map<string, IncomingFlowEdge[]> {
  const map = new Map<string, IncomingFlowEdge[]>();
  for (const edge of edges) {
    const list = map.get(edge.target) ?? [];
    list.push({
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? "out",
      targetHandle: edge.targetHandle ?? "in",
    });
    map.set(edge.target, list);
  }
  return map;
}

export function resolvePlotterChannelColorHex(
  channel: PlotterChannelStyle,
  wireHint: ReturnType<typeof resolveInputScalarHintFromUpstream>,
): string {
  if (channel.colorMode === "custom") {
    return channel.colorHex;
  }
  if (wireHint == null) {
    return channel.colorHex;
  }
  return resolveScalarSemanticColorHex(
    {
      handleId: wireHint.handleId,
      nodeId: wireHint.nodeId,
      label: wireHint.label,
      streamMode: wireHint.streamMode,
    },
    channel.colorHex,
  );
}

export function resolvePlotterChannelColors(args: {
  plotterFlowNodeId: string;
  config: PlotterConfig;
  edges: readonly Edge[];
  nodes: readonly { id: string; type?: string; data: StudioNodeData }[];
}): Record<PlotterInputId, string> {
  const { plotterFlowNodeId, config, edges, nodes } = args;
  const incomingByTarget = buildIncomingByTarget(edges);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const out = {} as Record<PlotterInputId, string>;

  for (const chId of PLOTTER_INPUT_IDS) {
    const sty = config.channels[chId];
    if (sty == null) {
      continue;
    }
    const hint = resolveInputScalarHintFromUpstream({
      targetFlowId: plotterFlowNodeId,
      targetHandle: chId,
      incomingByTarget,
      nodeById,
    });
    out[chId] = resolvePlotterChannelColorHex(sty, hint);
  }
  return out;
}

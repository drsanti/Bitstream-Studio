import type { Edge } from "@xyflow/react";
import { CANVAS_DEMO_TEMPLATE_OPTIONS } from "../components/inspector/canvas-inspector-demo-templates";
import type { FlowGraphNode, StudioDemoTemplateId } from "../store/flow-editor.store";
import type { StudioSubgraphDocument } from "../subgraphs/studio-subgraph.types";
import { buildDemoTemplateFlowPreset } from "./build-demo-template-flow-preset";
import { officialFlowPresetFileName } from "./demo-template-flow-preset-category";
import {
  downloadStudioFlowPresetFile,
  type StudioFlowPresetFile,
} from "./studio-flow-preset-file";

export type OfficialFlowPresetOverrideGraph = {
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  activeGraphId: string;
  rootNodes: readonly FlowGraphNode[];
  rootEdges: readonly Edge[];
};

export function buildOfficialFlowPresetOverride(
  templateId: StudioDemoTemplateId,
  graph: OfficialFlowPresetOverrideGraph,
  metaPatch?: { name?: string; description?: string },
): StudioFlowPresetFile {
  const option = CANVAS_DEMO_TEMPLATE_OPTIONS.find((entry) => entry.value === templateId);
  return buildDemoTemplateFlowPreset({
    templateId,
    name: metaPatch?.name?.trim() || option?.label || templateId,
    description: metaPatch?.description ?? option?.hint,
    nodes: graph.nodes,
    edges: graph.edges,
    subgraphs: graph.subgraphs,
    activeGraphId: graph.activeGraphId,
    rootNodes: graph.rootNodes,
    rootEdges: graph.rootEdges,
  });
}

export function downloadOfficialFlowPresetOverride(
  templateId: StudioDemoTemplateId,
  graph: OfficialFlowPresetOverrideGraph,
  metaPatch?: { name?: string; description?: string },
): void {
  const preset = buildOfficialFlowPresetOverride(templateId, graph, metaPatch);
  downloadStudioFlowPresetFile(preset, officialFlowPresetFileName(templateId));
}

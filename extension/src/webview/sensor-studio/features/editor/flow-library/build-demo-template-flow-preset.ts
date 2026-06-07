import type { Edge } from "@xyflow/react";
import type { FlowGraphNode, StudioDemoTemplateId } from "../store/flow-editor.store";
import type { StudioSubgraphDocument } from "../subgraphs/studio-subgraph.types";
import { buildFlowPresetFromCanvas } from "./build-flow-preset-from-canvas";
import {
  demoTemplateFlowPresetCategory,
  officialFlowPresetIdForTemplate,
} from "./demo-template-flow-preset-category";
import {
  serializeStudioFlowPresetFile,
  type StudioFlowPresetFile,
} from "./studio-flow-preset-file";

export type DemoTemplateFlowPresetInput = {
  templateId: StudioDemoTemplateId;
  name: string;
  description?: string;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  activeGraphId: string;
  rootNodes: readonly FlowGraphNode[];
  rootEdges: readonly Edge[];
};

export function buildDemoTemplateFlowPreset(
  input: DemoTemplateFlowPresetInput,
): StudioFlowPresetFile {
  const { templateId, name, description, ...graph } = input;
  const rootNodes = graph.rootNodes.length > 0 ? graph.rootNodes : graph.nodes;
  const rootEdges = graph.rootEdges.length > 0 ? graph.rootEdges : graph.edges;
  const preset = buildFlowPresetFromCanvas({
    name,
    description,
    presetKind: "flowFull",
    category: demoTemplateFlowPresetCategory(templateId),
    nodes: graph.nodes,
    edges: graph.edges,
    subgraphs: graph.subgraphs,
    activeGraphId: graph.activeGraphId,
    rootNodes,
    rootEdges,
    sourceScopeId: `official:${templateId}`,
    existingMeta: {
      id: officialFlowPresetIdForTemplate(templateId),
      tags: ["official", "demo-template", templateId],
    },
  });
  return preset;
}

export function serializeDemoTemplateFlowPreset(input: DemoTemplateFlowPresetInput): string {
  return serializeStudioFlowPresetFile(buildDemoTemplateFlowPreset(input));
}

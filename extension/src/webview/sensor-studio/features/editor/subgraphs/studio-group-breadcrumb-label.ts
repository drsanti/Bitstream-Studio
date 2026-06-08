import { STUDIO_ROOT_GRAPH_ID, type StudioSubgraphDocument } from "./studio-subgraph.types";

export type GroupBreadcrumbCrumb = {
  id: string;
  title: string;
  inputCount: number | null;
  outputCount: number | null;
  isRoot: boolean;
};

export function resolveGroupBreadcrumbCrumb(
  graphId: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): GroupBreadcrumbCrumb {
  if (graphId === STUDIO_ROOT_GRAPH_ID) {
    return {
      id: graphId,
      title: "Root",
      inputCount: null,
      outputCount: null,
      isRoot: true,
    };
  }
  const doc = subgraphs[graphId];
  const title = doc?.graphTitle?.trim() || "Node Group";
  const inputCount = doc?.interface?.inputs.length ?? 0;
  const outputCount = doc?.interface?.outputs.length ?? 0;
  return {
    id: graphId,
    title,
    inputCount,
    outputCount,
    isRoot: false,
  };
}

export function formatGroupBreadcrumbLabel(
  graphId: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): string {
  const crumb = resolveGroupBreadcrumbCrumb(graphId, subgraphs);
  if (crumb.isRoot) {
    return crumb.title;
  }
  return `${crumb.title} (${crumb.inputCount} in / ${crumb.outputCount} out)`;
}

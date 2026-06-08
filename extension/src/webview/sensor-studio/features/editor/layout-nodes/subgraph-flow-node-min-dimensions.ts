export type SubgraphFlowNodeKind = "node-group" | "group-boundary";

const MIN_BY_KIND: Readonly<
  Record<SubgraphFlowNodeKind, { minWidth: number; minHeight: number }>
> = {
  "node-group": { minWidth: 168, minHeight: 72 },
  "group-boundary": { minWidth: 168, minHeight: 72 },
};

export function resolveSubgraphFlowNodeMinDimensions(kind: SubgraphFlowNodeKind): {
  minWidth: number;
  minHeight: number;
} {
  return MIN_BY_KIND[kind];
}

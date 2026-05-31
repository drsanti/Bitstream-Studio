import type { Node } from "@xyflow/react";
import type { StudioSubgraphDocument } from "./studio-subgraph.types";

export type CreateStudioNodeGroupResult = {
  groupNode: Node;
  subgraph: StudioSubgraphDocument;
};

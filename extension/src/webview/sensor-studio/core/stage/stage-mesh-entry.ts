import type { FlowWireMeshV1 } from "../../features/editor/nodes/mesh/flow-wire-mesh";

/** One procedural mesh committed to Stage from Scene Output **Meshes** wires. */
export type StageMeshEntryV1 = {
  /** Flow node id that emitted the mesh wire. */
  sourceNodeId: string;
  label: string;
  wire: FlowWireMeshV1;
  /** Index when a group wire was flattened into multiple Stage meshes. */
  meshLeafIndex?: number;
};

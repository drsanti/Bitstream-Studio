import { describe, expect, it } from "vitest";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";
import { repairOrphanedNodeGroupSubgraphs } from "../../src/webview/sensor-studio/features/editor/subgraphs/repair-orphaned-node-group-subgraphs";

function groupHost(id: string, subgraphId = id): FlowGraphNode {
  return {
    id,
    type: "studio-node-group",
    position: { x: 0, y: 0 },
    data: { subgraphId, graphTitle: "My Group" },
  } as FlowGraphNode;
}

describe("repairOrphanedNodeGroupSubgraphs", () => {
  it("creates an empty inner document for a host missing from subgraphs", () => {
    const host = groupHost("group_old");
    const repaired = repairOrphanedNodeGroupSubgraphs({}, [host]);
    expect(repaired.group_old).toBeDefined();
    expect(repaired.group_old!.graphTitle).toBe("My Group");
    expect(repaired.group_old!.nodes).toHaveLength(2);
  });

  it("does not replace an existing subgraph document", () => {
    const host = groupHost("group_keep");
    const existing = {
      nodes: [],
      edges: [],
      interface: { inputs: [], outputs: [] },
      graphTitle: "Kept",
    };
    const repaired = repairOrphanedNodeGroupSubgraphs(
      { group_keep: existing },
      [host],
    );
    expect(repaired.group_keep).toBe(existing);
  });

  it("does not recurse infinitely when a subgraph contains its own host", () => {
    const host = groupHost("group_cycle");
    const cyclicDoc = {
      nodes: [host],
      edges: [],
      interface: { inputs: [], outputs: [] },
    };
    expect(() =>
      repairOrphanedNodeGroupSubgraphs({ group_cycle: cyclicDoc }, [host]),
    ).not.toThrow();
  });

  it("repairs nested hosts inside an existing subgraph", () => {
    const nestedHost = groupHost("nested_group");
    const parentHost = groupHost("parent_group");
    const parentDoc = {
      nodes: [nestedHost],
      edges: [],
      interface: { inputs: [], outputs: [] },
    };
    const repaired = repairOrphanedNodeGroupSubgraphs(
      { parent_group: parentDoc },
      [parentHost],
    );
    expect(repaired.nested_group).toBeDefined();
    expect(repaired.nested_group!.nodes).toHaveLength(2);
  });
});

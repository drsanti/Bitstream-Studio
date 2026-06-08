import { describe, expect, it } from "vitest";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";
import { resolveSelectedNodeGroupSubgraphId } from "../../src/webview/sensor-studio/features/editor/subgraphs/resolve-selected-node-group";

function groupNode(
  id: string,
  subgraphId?: string,
  selected = false,
): FlowGraphNode {
  return {
    id,
    type: "studio-node-group",
    position: { x: 0, y: 0 },
    data: { subgraphId: subgraphId ?? id, title: "Group" },
    selected,
  } as FlowGraphNode;
}

describe("resolveSelectedNodeGroupSubgraphId", () => {
  it("prefers render-node selection over stale store nodes", () => {
    const group = groupNode("group_a", "sub_a", true);
    expect(
      resolveSelectedNodeGroupSubgraphId({
        renderNodes: [group],
        storeNodes: [groupNode("group_a", "sub_a", false)],
        selectedNodeIds: [],
        selectedNodeId: null,
      }),
    ).toBe("sub_a");
  });

  it("falls back to store selectedNodeIds when render nodes lack selected flag", () => {
    const storeGroup = groupNode("group_b", "sub_b", false);
    expect(
      resolveSelectedNodeGroupSubgraphId({
        renderNodes: [storeGroup],
        storeNodes: [storeGroup],
        selectedNodeIds: ["group_b"],
        selectedNodeId: "group_b",
      }),
    ).toBe("sub_b");
  });

  it("returns null when multiple groups are selected", () => {
    expect(
      resolveSelectedNodeGroupSubgraphId({
        renderNodes: [
          groupNode("group_1", "sub_1", true),
          groupNode("group_2", "sub_2", true),
        ],
        storeNodes: [],
        selectedNodeIds: ["group_1", "group_2"],
        selectedNodeId: "group_1",
      }),
    ).toBeNull();
  });
});

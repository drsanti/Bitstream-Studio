import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFrameFlowNode } from "../../src/webview/sensor-studio/features/editor/layout/layout-flow-node-builders";
import {
  applyFlowFrameDragStop,
  attachNodeToFrame,
  detachNodeFromFrame,
  dissolveStudioFrames,
  nodeAbsolutePosition,
  sortFlowNodesParentFirst,
  syncFrameChildren,
} from "../../src/webview/sensor-studio/features/editor/layout/frame-flow-nodes";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function studioNode(id: string, x: number, y: number): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x, y },
    data: {
      nodeId: "number-source",
      label: "Number",
      category: "input",
      config: { value: 1 },
      outputType: "number",
    },
  };
}

describe("frame-flow-nodes", () => {
  it("sorts frames before other nodes for render order", () => {
    const frame = buildFrameFlowNode({ x: 0, y: 0 });
    const node = studioNode("n1", 40, 40);
    const sorted = sortFlowNodesParentFirst([node, frame]);
    assert.equal(sorted[0]?.type, "studio-frame");
    assert.equal(sorted[1]?.id, "n1");
  });

  it("parents overlapping nodes when a frame is synced", () => {
    const frame = buildFrameFlowNode({ x: 0, y: 0 });
    const node = studioNode("n1", 40, 40);
    const synced = syncFrameChildren(frame, [frame, node]);
    assert.equal(synced.changed, true);
    const child = synced.nodes.find((n) => n.id === "n1");
    assert.equal(child?.parentId, frame.id);
    assert.equal(child?.extent, "parent");
  });

  it("detaches and preserves absolute position", () => {
    const frame = buildFrameFlowNode({ x: 100, y: 100 });
    const attached = attachNodeToFrame(studioNode("n1", 140, 140), frame, [frame]);
    const nodes = [frame, attached];
    const absBefore = nodeAbsolutePosition(attached, nodes);
    const detached = detachNodeFromFrame(attached, nodes);
    assert.equal(detached.parentId, undefined);
    assert.equal(detached.position.x, absBefore.x);
    assert.equal(detached.position.y, absBefore.y);
  });

  it("dissolves frames and keeps children on canvas", () => {
    const frame = buildFrameFlowNode({ x: 0, y: 0 });
    const attached = attachNodeToFrame(studioNode("n1", 40, 40), frame, [frame]);
    const nodes = [frame, attached];
    const absBefore = nodeAbsolutePosition(attached, nodes);
    const dissolved = dissolveStudioFrames([frame.id], nodes);
    assert.equal(dissolved.changed, true);
    assert.equal(dissolved.nodes.some((n) => n.id === frame.id), false);
    const child = dissolved.nodes.find((n) => n.id === "n1");
    assert.equal(child?.parentId, undefined);
    assert.equal(child?.position.x, absBefore.x);
    assert.equal(child?.position.y, absBefore.y);
  });

  it("applyFlowFrameDragStop attaches dragged node overlapping a frame", () => {
    const frame = buildFrameFlowNode({ x: 0, y: 0 });
    const dragged = studioNode("n1", 50, 50);
    const result = applyFlowFrameDragStop(dragged, [frame, dragged]);
    assert.equal(result.changed, true);
    const child = result.nodes.find((n) => n.id === "n1");
    assert.equal(child?.parentId, frame.id);
  });
});

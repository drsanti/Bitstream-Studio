import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLayoutFlowNode, buildRerouteFlowNode } from "../../src/webview/sensor-studio/features/editor/layout/layout-flow-node-builders";
import { layoutNodeAcceptsInput } from "../../src/webview/sensor-studio/features/editor/layout/layout-port-resolution";
import { splitOutputHandleIds } from "../../src/webview/sensor-studio/features/editor/layout/layout-flow-nodes.types";

describe("layout-flow-node-builders", () => {
  it("builds typed layout nodes at flow coordinates", () => {
    const reroute = buildRerouteFlowNode({ x: 100, y: 80 }, "number");
    assert.equal(reroute.type, "studio-reroute");
    assert.equal(reroute.data.socketType, "number");

    const frame = buildLayoutFlowNode("frame", { x: 200, y: 120 });
    assert.equal(frame.type, "studio-frame");

    const note = buildLayoutFlowNode("note", { x: 50, y: 50 });
    assert.equal(note.type, "studio-note");

    const split = buildLayoutFlowNode("split", { x: 10, y: 10 });
    assert.equal(split.type, "studio-split");
    assert.equal(splitOutputHandleIds(split.data.outputCount).length, 4);
  });
});

describe("layout-port-resolution", () => {
  it("accepts matching socket types on reroute input", () => {
    const reroute = buildRerouteFlowNode({ x: 0, y: 0 });
    assert.equal(layoutNodeAcceptsInput(reroute, "in", "number"), true);
    assert.equal(layoutNodeAcceptsInput(reroute, "in", "boolean"), true);

    const locked = buildRerouteFlowNode({ x: 0, y: 0 }, "event");
    assert.equal(layoutNodeAcceptsInput(locked, "in", "event"), true);
    assert.equal(layoutNodeAcceptsInput(locked, "in", "number"), false);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLayoutFlowNode, buildRerouteFlowNode } from "../../src/webview/sensor-studio/features/editor/layout/layout-flow-node-builders";
import {
  inferLayoutNodeSmartConnectPortType,
  layoutNodeAcceptsInput,
} from "../../src/webview/sensor-studio/features/editor/layout/layout-port-resolution";
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

  it("infers smart-connect port type on unlocked reroute from upstream wire", () => {
    const reroute = buildRerouteFlowNode({ x: 50, y: 0 });
    const src = {
      id: "src",
      type: "studio" as const,
      position: { x: 0, y: 0 },
      data: { outputType: "number" },
    };
    const edges = [
      {
        id: "e1",
        source: "src",
        target: reroute.id,
        targetHandle: "in",
        label: "number",
      },
    ];
    assert.equal(
      inferLayoutNodeSmartConnectPortType(
        reroute,
        "in",
        "target",
        edges,
        [src, reroute],
      ),
      "number",
    );
    assert.equal(
      inferLayoutNodeSmartConnectPortType(
        reroute,
        "out",
        "source",
        edges,
        [src, reroute],
      ),
      "number",
    );
  });

  it("infers smart-connect port type on unlocked reroute from downstream wire", () => {
    const reroute = buildRerouteFlowNode({ x: 50, y: 0 });
    const dst = {
      id: "dst",
      type: "studio" as const,
      position: { x: 100, y: 0 },
      data: { inputType: "boolean" },
    };
    const edges = [
      {
        id: "e1",
        source: reroute.id,
        sourceHandle: "out",
        target: "dst",
        targetHandle: "in",
        label: "boolean",
      },
    ];
    assert.equal(
      inferLayoutNodeSmartConnectPortType(
        reroute,
        "in",
        "target",
        edges,
        [reroute, dst],
      ),
      "boolean",
    );
  });
});

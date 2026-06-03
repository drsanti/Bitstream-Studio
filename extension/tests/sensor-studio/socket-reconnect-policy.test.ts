import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeReconnectConnection,
  reconnectWithPolicy,
} from "../../src/webview/sensor-studio/features/editor/connect/socket-connection-policy";

describe("socket-reconnect-policy", () => {
  const nodes = [
    {
      id: "n1",
      type: "studio",
      position: { x: 0, y: 0 },
      data: {
        nodeId: "number-constant",
        inputType: "number",
        outputType: "number",
        inputHandles: [],
        outputHandles: [{ id: "out", portType: "number" }],
      },
    },
    {
      id: "n2",
      type: "studio",
      position: { x: 200, y: 0 },
      data: {
        nodeId: "number-constant",
        inputType: "number",
        outputType: "number",
        inputHandles: [{ id: "in", portType: "number" }],
        outputHandles: [],
      },
    },
    {
      id: "n3",
      type: "studio",
      position: { x: 400, y: 0 },
      data: {
        nodeId: "number-constant",
        inputType: "number",
        outputType: "number",
        inputHandles: [{ id: "in", portType: "number" }],
        outputHandles: [],
      },
    },
  ] as const;

  it("mergeReconnectConnection fills missing endpoints from the old edge", () => {
    const merged = mergeReconnectConnection(
      {
        id: "e1",
        source: "n1",
        target: "n2",
        sourceHandle: "out",
        targetHandle: "in",
      },
      { target: "n3", targetHandle: "in" },
    );
    assert.equal(merged.source, "n1");
    assert.equal(merged.target, "n3");
    assert.equal(merged.sourceHandle, "out");
    assert.equal(merged.targetHandle, "in");
  });

  it("reconnectWithPolicy moves target and keeps edge id", () => {
    const edges = [
      {
        id: "e1",
        source: "n1",
        target: "n2",
        sourceHandle: "out",
        targetHandle: "in",
        label: "number",
      },
    ];
    const result = reconnectWithPolicy(
      edges[0]!,
      { target: "n3", targetHandle: "in" },
      { nodes: [...nodes], edges: [...edges], subgraphs: {} },
    );
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.edges.length, 1);
    assert.equal(result.edges[0]?.id, "e1");
    assert.equal(result.edges[0]?.target, "n3");
  });

  it("reconnectWithPolicy rejects type mismatch", () => {
    const boolTarget = {
      id: "nb",
      type: "studio",
      position: { x: 0, y: 0 },
      data: {
        nodeId: "number-constant",
        inputType: "boolean",
        outputType: "boolean",
        inputHandles: [{ id: "in", portType: "boolean" }],
        outputHandles: [],
      },
    };
    const edges = [
      {
        id: "e1",
        source: "n1",
        target: "n2",
        sourceHandle: "out",
        targetHandle: "in",
      },
    ];
    const result = reconnectWithPolicy(
      edges[0]!,
      { target: "nb", targetHandle: "in" },
      { nodes: [nodes[0], boolTarget], edges, subgraphs: {} },
    );
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.equal(result.reason, "type_mismatch");
  });
});

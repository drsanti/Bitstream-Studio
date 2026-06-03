import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";
import {
  connectWithPolicy,
  edgesToPopOnConnectStart,
  getSocketCardinality,
  incomingEdgesToReplace,
  SINGLE_OUTPUT_SOCKETS,
  validateStudioConnection,
} from "../../src/webview/sensor-studio/features/editor/connect/socket-connection-policy";

function numberSource(id: string): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "number-source",
      label: "Number",
      category: "input",
      defaultConfig: { value: 1 },
      outputType: "number",
    },
  };
}

function mathNode(id: string): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 200, y: 0 },
    data: {
      nodeId: "math",
      label: "Math",
      category: "utility",
      defaultConfig: { operation: "add" },
      inputHandles: [
        { id: "a", portType: "number", label: "A" },
        { id: "b", portType: "number", label: "B" },
      ],
      outputHandles: [{ id: "out", portType: "number", label: "Out" }],
    },
  };
}

describe("socket-connection-policy", () => {
  it("rejects self-loop and duplicate edges", () => {
    const nodes = [numberSource("a")];
    const edges: Edge[] = [];
    const graph = { nodes, edges, subgraphs: {} };
    assert.equal(
      validateStudioConnection(
        { source: "a", target: "a", sourceHandle: "out", targetHandle: "in" },
        graph,
        { allowIncomplete: false },
      ).ok,
      false,
    );
    const edge: Edge = {
      id: "e1",
      source: "s",
      target: "t",
      sourceHandle: "out",
      targetHandle: "in",
    };
    assert.equal(
      validateStudioConnection(
        { source: "s", target: "t", sourceHandle: "out", targetHandle: "in" },
        { nodes, edges: [edge], subgraphs: {} },
        { allowIncomplete: false },
      ).ok,
      false,
    );
  });

  it("replaces prior wire on single-input connect (same target handle)", () => {
    const nodes = [numberSource("src"), numberSource("src2"), mathNode("math")];
    const edges: Edge[] = [
      {
        id: "old",
        source: "src",
        target: "math",
        sourceHandle: "out",
        targetHandle: "a",
      },
    ];
    const result = connectWithPolicy(
      {
        source: "src2",
        target: "math",
        sourceHandle: "out",
        targetHandle: "a",
      },
      { nodes, edges, subgraphs: {} },
    );
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(result.removedEdgeIds, ["old"]);
    assert.equal(result.edges.length, 1);
    assert.equal(result.edges[0]?.source, "src2");
    assert.equal(result.edges[0]?.targetHandle, "a");
  });

  it("allows two wires to different inputs on the same node", () => {
    const nodes = [numberSource("src"), numberSource("src2"), mathNode("math")];
    const edges: Edge[] = [
      {
        id: "to-a",
        source: "src",
        target: "math",
        sourceHandle: "out",
        targetHandle: "a",
      },
    ];
    const result = connectWithPolicy(
      {
        source: "src2",
        target: "math",
        sourceHandle: "out",
        targetHandle: "b",
      },
      { nodes, edges, subgraphs: {} },
    );
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(result.removedEdgeIds, []);
    assert.equal(result.edges.length, 2);
  });

  it("lists incoming edges to replace for single-input sockets", () => {
    const nodes = [mathNode("math")];
    const edges: Edge[] = [
      {
        id: "e1",
        source: "x",
        target: "math",
        sourceHandle: "out",
        targetHandle: "a",
      },
    ];
    const ids = incomingEdgesToReplace(
      { source: "y", target: "math", sourceHandle: "out", targetHandle: "a" },
      nodes,
      edges,
    );
    assert.deepEqual(ids, ["e1"]);
  });

  it("pops wired single-input on connect start", () => {
    const nodes = [mathNode("math")];
    const edges: Edge[] = [
      {
        id: "e1",
        source: "x",
        target: "math",
        sourceHandle: "out",
        targetHandle: "a",
      },
    ];
    const pop = edgesToPopOnConnectStart("math", "a", "target", nodes, edges);
    assert.deepEqual(pop, ["e1"]);
  });

  it("treats group output glbAnimation socket as multi-input", () => {
    const animId = "playback";
    const animPlayer = (id: string): FlowGraphNode => ({
      id,
      type: "studio",
      position: { x: 0, y: 0 },
      data: {
        nodeId: "glb-animation-bundle",
        label: "Player",
        category: "output",
        defaultConfig: {},
        outputType: "glbAnimation",
      },
    });
    const nodes: FlowGraphNode[] = [
      animPlayer("p1"),
      animPlayer("p2"),
      animPlayer("p3"),
      {
        id: "go",
        type: "studio-group-output",
        position: { x: 0, y: 0 },
        data: {
          role: "output",
          interface: {
            inputs: [],
            outputs: [
              {
                id: animId,
                label: "Playback",
                portType: "glbAnimation",
                direction: "output",
                boundaryKey: "k",
              },
            ],
          },
        },
      },
    ];
    const groupOut = nodes.find((n) => n.id === "go");
    assert.equal(getSocketCardinality(groupOut, animId, "target"), "multi");
    const edges: Edge[] = [
      {
        id: "e1",
        source: "p1",
        target: "go",
        sourceHandle: "out",
        targetHandle: animId,
      },
      {
        id: "e2",
        source: "p2",
        target: "go",
        sourceHandle: "out",
        targetHandle: animId,
      },
    ];
    const result = connectWithPolicy(
      {
        source: "p3",
        target: "go",
        sourceHandle: "out",
        targetHandle: animId,
      },
      { nodes, edges, subgraphs: {} },
    );
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(result.removedEdgeIds, []);
    assert.equal(result.edges.length, 3);
  });

  it("pops outgoing wires when dragging from a single-output socket", () => {
    const fixtureId = "__fixture-single-output";
    SINGLE_OUTPUT_SOCKETS[fixtureId] = new Set(["out"]);
    try {
      const nodes: FlowGraphNode[] = [
        {
          id: "src",
          type: "studio",
          position: { x: 0, y: 0 },
          data: {
            nodeId: fixtureId,
            label: "Fixture",
            category: "output",
            defaultConfig: {},
            outputType: "number",
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: "e1",
          source: "src",
          target: "t1",
          sourceHandle: "out",
          targetHandle: "in",
        },
      ];
      assert.equal(getSocketCardinality(nodes[0], "out", "source"), "single");
      const pop = edgesToPopOnConnectStart("src", "out", "source", nodes, edges);
      assert.deepEqual(pop, ["e1"]);
    } finally {
      delete SINGLE_OUTPUT_SOCKETS[fixtureId];
    }
  });

  it("does not pop multi-input number-average on connect start", () => {
    const nodes: FlowGraphNode[] = [
      {
        id: "avg",
        type: "studio",
        position: { x: 0, y: 0 },
        data: {
          nodeId: "number-average",
          label: "Average",
          category: "utility",
          defaultConfig: {},
          inputType: "number",
        },
      },
    ];
    const edges: Edge[] = [
      {
        id: "e1",
        source: "a",
        target: "avg",
        sourceHandle: "out",
        targetHandle: "in",
      },
    ];
    const pop = edgesToPopOnConnectStart("avg", "in", "target", nodes, edges);
    assert.deepEqual(pop, []);
  });
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { studioFlowPinKey } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";
import {
  promoteGroupConnection,
  syncGroupInterfaceFromHostWires,
} from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-group-connect-promote";
import { filterParentEdgesForGroupInterface } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-group-interface-sync";
import { applyUnwiredGroupInputDefaults } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-group-input-defaults";
import { defaultGroupInterface } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";

test("promoteGroupConnection does not duplicate input when wiring to existing group shell socket", () => {
  const hostId = "group_host";
  const subgraphId = hostId;
  const floatId = "float_node";
  const valueSock = {
    id: "sock_value",
    label: "Value",
    portType: "number" as const,
    direction: "input" as const,
    boundaryKey: "manual:input:number:Value:sock_value",
  };
  const iface = { inputs: [valueSock], outputs: defaultGroupInterface().outputs };
  const promoted = promoteGroupConnection(
    {
      source: floatId,
      sourceHandle: "out",
      target: hostId,
      targetHandle: valueSock.id,
    },
    {
      nodes: [
        { id: floatId, type: "studio", data: { nodeId: "number-constant", outputType: "number" } },
        { id: hostId, type: "studio-node-group", data: { subgraphId, graphTitle: "G" } },
      ],
      edges: [],
      subgraphs: {
        [subgraphId]: {
          nodes: [],
          edges: [],
          interface: iface,
        },
      },
    },
    [{ id: hostId, type: "studio-node-group", data: { subgraphId, graphTitle: "G" } }],
  );
  assert.equal(promoted, null);
});

test("promoteGroupConnection creates output socket when wiring inner node to Group Output", () => {
  const iface = defaultGroupInterface();
  const hostId = "group_host";
  const subgraphId = hostId;
  const outputNodeId = `${hostId}_output`;
  const innerId = "inner_math";
  const promoted = promoteGroupConnection(
    {
      source: innerId,
      sourceHandle: "out",
      target: outputNodeId,
      targetHandle: iface.outputs[0]!.id,
    },
    {
      nodes: [
        { id: innerId, type: "studio", data: { nodeId: "math", outputType: "number" } },
        { id: outputNodeId, type: "studio-group-output", data: { interface: iface } },
      ],
      edges: [],
      subgraphs: {
        [subgraphId]: {
          nodes: [
            { id: outputNodeId, type: "studio-group-output", data: { interface: iface } },
            { id: innerId, type: "studio", data: { nodeId: "math" } },
          ],
          edges: [],
          interface: iface,
        },
      },
    },
    [
      {
        id: hostId,
        type: "studio-node-group",
        data: { subgraphId, graphTitle: "G" },
      },
    ],
  );
  assert.ok(promoted != null);
  assert.equal(promoted.hostNodeId, hostId);
  assert.ok(
    promoted.nextInterface.outputs.some((s) => s.id === promoted.connection.targetHandle),
  );
});

test("applyUnwiredGroupInputDefaults seeds inner pins from input socket default", () => {
  const iface = defaultGroupInterface();
  const inSock = { ...iface.inputs[0]!, defaultValue: 7 };
  const hostId = "group_host";
  const inputNodeId = `${hostId}_input`;
  const innerId = "inner_clamp";
  const pinValues = new Map<string, unknown>();
  applyUnwiredGroupInputDefaults({
    rootNodes: [
      {
        id: hostId,
        type: "studio-node-group",
        data: { subgraphId: hostId },
      },
    ],
    rootEdges: [],
    subgraphs: {
      [hostId]: {
        nodes: [
          { id: inputNodeId, type: "studio-group-input", data: { interface: { inputs: [inSock], outputs: [] } } },
          { id: innerId, type: "studio", data: {} },
        ],
        edges: [
          {
            id: "e1",
            source: inputNodeId,
            sourceHandle: inSock.id,
            target: innerId,
            targetHandle: "value",
          },
        ],
        interface: { inputs: [inSock], outputs: iface.outputs },
      },
    },
    pinValues,
  });
  assert.equal(pinValues.get(studioFlowPinKey(`${hostId}__${innerId}`, "value")), 7);
});

test("syncGroupInterfaceFromHostWires preserves wired parent edges and does not duplicate sockets", () => {
  const hostId = "group_host";
  const inputNodeId = `${hostId}_input`;
  const outputNodeId = `${hostId}_output`;
  const innerA = "inner_a";
  const floatId = "float_node";
  const iface = defaultGroupInterface();
  const inId = iface.inputs[0]!.id;
  const outId = iface.outputs[0]!.id;
  const synced = syncGroupInterfaceFromHostWires({
    hostNodeId: hostId,
    rootNodes: [
      {
        id: floatId,
        type: "studio",
        data: { nodeId: "float-constant", label: "Float", outputType: "number" },
      },
      { id: hostId, type: "studio-node-group", data: { subgraphId: hostId } },
      {
        id: "scene_out",
        type: "studio",
        data: { nodeId: "scene-output", inputHandles: [{ id: "animation", portType: "glbAnimation", label: "Animation" }] },
      },
    ],
    rootEdges: [
      {
        id: "parent_in",
        source: floatId,
        sourceHandle: "out",
        target: hostId,
        targetHandle: inId,
      },
      {
        id: "parent_out",
        source: hostId,
        sourceHandle: outId,
        target: "scene_out",
        targetHandle: "animation",
      },
    ],
    subgraph: {
      nodes: [
        { id: inputNodeId, type: "studio-group-input", data: { interface: iface } },
        { id: outputNodeId, type: "studio-group-output", data: { interface: iface } },
        {
          id: innerA,
          type: "studio",
          data: {
            nodeId: "animation-mix",
            label: "Animation Mix",
            outputType: "glbAnimation",
          },
        },
      ],
      edges: [
        {
          id: "inner_in",
          source: inputNodeId,
          sourceHandle: inId,
          target: innerA,
          targetHandle: "factor",
        },
        {
          id: "inner_out",
          source: innerA,
          sourceHandle: "out",
          target: outputNodeId,
          targetHandle: outId,
        },
      ],
      interface: iface,
    },
    subgraphs: {},
  });
  assert.equal(synced.inputs.length, 1);
  assert.equal(synced.inputs[0]!.id, inId);
  assert.equal(synced.outputs.length, 1);
  assert.equal(synced.outputs[0]!.id, outId);
});

test("syncGroupInterfaceFromHostWires keeps parent edges when applied through filterParentEdgesForGroupInterface", () => {
  const hostId = "group_host";
  const iface = defaultGroupInterface();
  const inId = iface.inputs[0]!.id;
  const synced = syncGroupInterfaceFromHostWires({
    hostNodeId: hostId,
    rootNodes: [
      { id: "float_node", type: "studio", data: { nodeId: "float-constant", outputType: "number" } },
      { id: hostId, type: "studio-node-group", data: { subgraphId: hostId } },
    ],
    rootEdges: [
      {
        id: "parent_in",
        source: "float_node",
        sourceHandle: "out",
        target: hostId,
        targetHandle: inId,
      },
    ],
    subgraph: {
      nodes: [
        { id: `${hostId}_input`, type: "studio-group-input", data: { interface: iface } },
        { id: `${hostId}_output`, type: "studio-group-output", data: { interface: iface } },
      ],
      edges: [],
      interface: iface,
    },
    subgraphs: {},
  });
  const filtered = filterParentEdgesForGroupInterface(
    [
      {
        id: "parent_in",
        source: "float_node",
        sourceHandle: "out",
        target: hostId,
        targetHandle: inId,
      },
    ],
    hostId,
    synced,
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]!.targetHandle, inId);
});

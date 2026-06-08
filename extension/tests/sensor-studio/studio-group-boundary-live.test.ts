import assert from "node:assert/strict";
import { test } from "node:test";
import { studioFlowPinKey } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";
import { buildStudioGroupBoundaryLiveFields } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-group-boundary-live";
import { defaultGroupInterface } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";

test("buildStudioGroupBoundaryLiveFields resolves Group Output from upstream inner pin", () => {
  const iface = defaultGroupInterface();
  const outSock = iface.outputs[0]!;
  const hostId = "group_host";
  const boundaryId = `${hostId}_output`;
  const innerId = "inner_math";
  const pinValues = new Map<string, unknown>([
    [studioFlowPinKey(`${hostId}__${innerId}`, "out"), 3.5],
  ]);
  const live = buildStudioGroupBoundaryLiveFields({
    role: "output",
    boundaryNodeId: boundaryId,
    iface,
    subgraphEdges: [
      {
        id: "e1",
        source: innerId,
        sourceHandle: "out",
        target: boundaryId,
        targetHandle: outSock.id,
      },
    ],
    flattenedEdges: [],
    hostNodeId: hostId,
    pinValues,
  });
  assert.equal(live.liveNumberByHandle?.[outSock.id], 3.5);
});

test("buildStudioGroupBoundaryLiveFields resolves Group Input from remapped inner target pin", () => {
  const iface = defaultGroupInterface();
  const inSock = iface.inputs[0]!;
  const hostId = "group_host";
  const boundaryId = `${hostId}_input`;
  const innerId = "inner_clamp";
  const pinValues = new Map<string, unknown>([
    [studioFlowPinKey(`${hostId}__${innerId}`, "value"), 12],
  ]);
  const live = buildStudioGroupBoundaryLiveFields({
    role: "input",
    boundaryNodeId: boundaryId,
    iface,
    subgraphEdges: [
      {
        id: "e1",
        source: boundaryId,
        sourceHandle: inSock.id,
        target: innerId,
        targetHandle: "value",
      },
    ],
    flattenedEdges: [],
    hostNodeId: hostId,
    pinValues,
  });
  assert.equal(live.liveNumberByHandle?.[inSock.id], 12);
});

test("buildStudioGroupBoundaryLiveFields resolves wired Group Input from flattened upstream output pin", () => {
  const iface = defaultGroupInterface();
  const inSock = iface.inputs[0]!;
  const hostId = "group_host";
  const boundaryId = `${hostId}_input`;
  const innerId = "inner_clamp";
  const remappedInner = `${hostId}__${innerId}`;
  const constantId = "num_const";
  const pinValues = new Map<string, unknown>([
    [studioFlowPinKey(constantId, "out"), 7.25],
  ]);
  const live = buildStudioGroupBoundaryLiveFields({
    role: "input",
    boundaryNodeId: boundaryId,
    iface,
    subgraphEdges: [
      {
        id: "e_bridge",
        source: boundaryId,
        sourceHandle: inSock.id,
        target: innerId,
        targetHandle: "value",
      },
    ],
    flattenedEdges: [
      {
        id: "e_flat",
        source: constantId,
        sourceHandle: "out",
        target: remappedInner,
        targetHandle: "value",
      },
    ],
    hostNodeId: hostId,
    pinValues,
  });
  assert.equal(live.liveNumberByHandle?.[inSock.id], 7.25);
});

test("buildStudioGroupBoundaryLiveFields resolves wired Group Input boolean from flattened upstream", () => {
  const iface = defaultGroupInterface();
  iface.inputs[0]!.portType = "boolean";
  const inSock = iface.inputs[0]!;
  const hostId = "group_host";
  const boundaryId = `${hostId}_input`;
  const innerId = "inner_switch";
  const remappedInner = `${hostId}__${innerId}`;
  const sourceId = "bool_src";
  const pinValues = new Map<string, unknown>([[studioFlowPinKey(sourceId, "out"), true]]);
  const live = buildStudioGroupBoundaryLiveFields({
    role: "input",
    boundaryNodeId: boundaryId,
    iface,
    subgraphEdges: [
      {
        id: "e_bridge",
        source: boundaryId,
        sourceHandle: inSock.id,
        target: innerId,
        targetHandle: "in",
      },
    ],
    flattenedEdges: [
      {
        id: "e_flat",
        source: sourceId,
        sourceHandle: "out",
        target: remappedInner,
        targetHandle: "in",
      },
    ],
    hostNodeId: hostId,
    pinValues,
  });
  assert.equal(live.liveBooleanByHandle?.[inSock.id], true);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  boundarySocketKeyForCrossingInput,
  inferGroupInterface,
} from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-group-boundary-sockets";

test("boundarySocketKeyForCrossingInput ignores inner target handle", () => {
  const keyA = boundarySocketKeyForCrossingInput("route-1", "out", undefined, "speed", undefined);
  const keyB = boundarySocketKeyForCrossingInput("route-1", "out", undefined, "weight", undefined);
  assert.equal(keyA, keyB);
});

test("inferGroupInterface dedupes fan-out from one upstream pin", () => {
  const selectedIds = new Set(["clip-a", "clip-b"]);
  const allNodes = [
    { id: "route-1", type: "studio", data: { nodeId: "number-constant", label: "Route" } },
    { id: "clip-a", type: "studio", data: { nodeId: "animation-clip", label: "Clip A" } },
    { id: "clip-b", type: "studio", data: { nodeId: "animation-clip", label: "Clip B" } },
  ];
  const allEdges = [
    {
      id: "e1",
      source: "route-1",
      sourceHandle: "out",
      target: "clip-a",
      targetHandle: "speed",
    },
    {
      id: "e2",
      source: "route-1",
      sourceHandle: "out",
      target: "clip-b",
      targetHandle: "speed",
    },
  ];

  const iface = inferGroupInterface(selectedIds, allNodes, allEdges);
  assert.equal(iface.inputs.length, 1);
  assert.equal(iface.inputs[0]?.boundaryKey, boundarySocketKeyForCrossingInput(
    "route-1",
    "out",
    allNodes[1],
    "speed",
    undefined,
  ));
});

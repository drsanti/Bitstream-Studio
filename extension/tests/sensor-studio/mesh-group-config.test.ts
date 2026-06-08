import assert from "node:assert/strict";
import test from "node:test";

import { mergeFlowWireMeshesV1 } from "../../src/webview/sensor-studio/features/editor/nodes/mesh/mesh-group-config";
import { flattenFlowWireMeshesForStage } from "../../src/webview/sensor-studio/features/editor/nodes/mesh/flow-wire-mesh";

const boxWire = {
  version: 1 as const,
  kind: "box" as const,
  box: { width: 1, height: 1, depth: 1 },
};

const sphereWire = {
  version: 1 as const,
  kind: "sphere" as const,
  sphere: { radius: 0.5, widthSegments: 32, heightSegments: 16 },
};

test("mergeFlowWireMeshesV1 returns null for empty inputs", () => {
  assert.equal(mergeFlowWireMeshesV1([]), null);
  assert.equal(mergeFlowWireMeshesV1([null, undefined]), null);
});

test("mergeFlowWireMeshesV1 returns single child without group wrapper", () => {
  const wire = mergeFlowWireMeshesV1([boxWire]);
  assert.equal(wire?.kind, "box");
  assert.equal(wire?.box?.width, 1);
  assert.notEqual(wire?.kind, "group");
});

test("mergeFlowWireMeshesV1 combines multiple meshes into group", () => {
  const wire = mergeFlowWireMeshesV1([boxWire, sphereWire]);
  assert.equal(wire?.kind, "group");
  assert.equal(wire?.children?.length, 2);
  assert.equal(wire?.children?.[0]?.kind, "box");
  assert.equal(wire?.children?.[1]?.kind, "sphere");
});

test("flattenFlowWireMeshesForStage expands group leaves", () => {
  const group = mergeFlowWireMeshesV1([boxWire, sphereWire]);
  assert.notEqual(group, null);
  const leaves = flattenFlowWireMeshesForStage(group!);
  assert.equal(leaves.length, 2);
  assert.equal(leaves[0]?.kind, "box");
  assert.equal(leaves[1]?.kind, "sphere");
});

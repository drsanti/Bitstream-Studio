import assert from "node:assert/strict";
import test from "node:test";

import {
  coerceFlowWireVideoBusV1,
  isFlowWireVideoBusV1,
  isFlowWireVideoTextureV1,
  makeFlowWireVideoBusV1,
  makeFlowWireVideoTextureV1,
} from "../../src/webview/sensor-studio/core/camera/flow-wire-video";

test("makeFlowWireVideoBusV1 produces a valid videoBus handle", () => {
  const wire = makeFlowWireVideoBusV1("cam-1");
  assert.deepEqual(wire, { kind: "videoBus", sourceNodeId: "cam-1" });
  assert.equal(isFlowWireVideoBusV1(wire), true);
  assert.equal(coerceFlowWireVideoBusV1(wire)?.sourceNodeId, "cam-1");
});

test("makeFlowWireVideoTextureV1 produces a valid videoTexture handle", () => {
  const wire = makeFlowWireVideoTextureV1({
    sourceNodeId: "tex-1",
    cameraNodeId: "cam-1",
  });
  assert.deepEqual(wire, {
    kind: "videoTexture",
    sourceNodeId: "tex-1",
    cameraNodeId: "cam-1",
  });
  assert.equal(isFlowWireVideoTextureV1(wire), true);
});

test("coerceFlowWireVideoBusV1 rejects invalid values", () => {
  assert.equal(coerceFlowWireVideoBusV1(null), null);
  assert.equal(coerceFlowWireVideoBusV1({ kind: "audioBus" }), null);
  assert.equal(coerceFlowWireVideoBusV1({ kind: "videoBus" }), null);
  assert.equal(
    coerceFlowWireVideoBusV1({ kind: "videoBus", sourceNodeId: "" }),
    null,
  );
});

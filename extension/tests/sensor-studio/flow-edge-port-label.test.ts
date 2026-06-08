import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatFlowPortTypeLabel } from "../../src/webview/sensor-studio/features/editor/edges/flow-edge-port-label";

describe("flow-edge-port-label", () => {
  it("formats known port types", () => {
    assert.equal(formatFlowPortTypeLabel("number"), "Number");
    assert.equal(formatFlowPortTypeLabel("glbAnimation"), "Animation");
  });

  it("falls back for unknown types", () => {
    assert.equal(formatFlowPortTypeLabel("customType"), "CustomType");
  });
});

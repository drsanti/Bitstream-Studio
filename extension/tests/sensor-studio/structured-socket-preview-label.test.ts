import assert from "node:assert/strict";
import test from "node:test";

import { defaultFlowWireCameraV1 } from "../../src/webview/sensor-studio/features/editor/nodes/camera-view/flow-wire-camera";
import { defaultFlowWireEnvironmentV1 } from "../../src/webview/sensor-studio/features/editor/nodes/environment/flow-wire-environment";
import {
  resolveCameraWireSocketLabel,
  resolveEnvironmentWireSocketLabel,
} from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/structured-socket-preview-label";

test("resolveCameraWireSocketLabel formats FOV", () => {
  const wire = { ...defaultFlowWireCameraV1(), fovDeg: 45.6 };
  assert.equal(resolveCameraWireSocketLabel(wire), "46° FOV");
});

test("resolveEnvironmentWireSocketLabel uses catalog label when asset id is set", () => {
  const wire = {
    ...defaultFlowWireEnvironmentV1(),
    studioAssetId: "env.test.sky",
    presetIndex: 0,
  };
  const label = resolveEnvironmentWireSocketLabel(wire, [
    {
      id: "env.test.sky",
      label: "Sunset HDRI",
      category: "environment",
      source: "bundled",
      url: "/textures/env/sunset",
    },
  ]);
  assert.equal(label, "Sunset HDRI");
});

test("resolveEnvironmentWireSocketLabel falls back to Environment", () => {
  const wire = { ...defaultFlowWireEnvironmentV1(), presetIndex: 9999, studioAssetId: undefined };
  const label = resolveEnvironmentWireSocketLabel(wire, []);
  assert.ok(label.length > 0);
});

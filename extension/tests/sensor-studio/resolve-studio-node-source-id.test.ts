import assert from "node:assert/strict";
import test from "node:test";

import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../src/webview/bitstream-app/constants/sensorSourceIds";
import { resolveStudioNodeSourceId } from "../../src/webview/sensor-studio/core/device/resolve-studio-node-source-id";
import type { StudioNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function stub(nodeId: string, defaultConfig: Record<string, unknown> = {}): StudioNode {
  return {
    id: "n-test",
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      label: "Test",
      category: "input",
      nodeId,
      defaultConfig,
    },
  };
}

test("resolveStudioNodeSourceId maps dedicated sensor nodes and taps", () => {
  assert.equal(resolveStudioNodeSourceId(stub("bmi270-input")), SENSOR_SOURCE_ID_BMI270);
  assert.equal(resolveStudioNodeSourceId(stub("bmi270-tap-accel")), SENSOR_SOURCE_ID_BMI270);
  assert.equal(resolveStudioNodeSourceId(stub("dps368-input")), SENSOR_SOURCE_ID_DPS368);
  assert.equal(resolveStudioNodeSourceId(stub("dps368-tap-pressure")), SENSOR_SOURCE_ID_DPS368);
  assert.equal(resolveStudioNodeSourceId(stub("sht40-tap-humidity")), SENSOR_SOURCE_ID_SHT40);
  assert.equal(resolveStudioNodeSourceId(stub("bmm350-tap-magnetic")), SENSOR_SOURCE_ID_BMM350);
});

test("resolveStudioNodeSourceId derives sourceId from sensor-input sourceKey", () => {
  assert.equal(
    resolveStudioNodeSourceId(stub("sensor-input", { sourceKey: "sht40.humidity" })),
    SENSOR_SOURCE_ID_SHT40,
  );
  assert.equal(
    resolveStudioNodeSourceId(stub("sensor-input", { sourceKey: "dps368.pressure" })),
    SENSOR_SOURCE_ID_DPS368,
  );
});

test("resolveStudioNodeSourceId returns null for non-hardware nodes", () => {
  const thresholdLike = stub("threshold");
  thresholdLike.data.category = "transform";
  assert.equal(resolveStudioNodeSourceId(thresholdLike), null);
  assert.equal(resolveStudioNodeSourceId(null), null);
});

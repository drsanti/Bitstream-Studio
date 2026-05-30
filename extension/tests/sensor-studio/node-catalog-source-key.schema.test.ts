import assert from "node:assert/strict";
import test from "node:test";

import { NODE_CATALOG_DEFAULTS } from "../../src/webview/sensor-studio/config/node-catalog.config";
import { nodeCatalogSchema } from "../../src/webview/sensor-studio/core/schema/config/node-catalog.schema";

test("nodeCatalogSchema accepts built-in defaults", () => {
  const parsed = nodeCatalogSchema.parse(NODE_CATALOG_DEFAULTS);
  assert.equal(parsed.payload.nodes.find((n) => n.id === "sensor-input")?.defaultConfig.sourceKey, "bmi270.accel.x");
});

test("nodeCatalogSchema rejects sensor-input with unknown sourceKey", () => {
  const bad = JSON.parse(JSON.stringify(NODE_CATALOG_DEFAULTS)) as typeof NODE_CATALOG_DEFAULTS;
  const sensor = bad.payload.nodes.find((n) => n.id === "sensor-input");
  assert.ok(sensor != null);
  sensor.defaultConfig.sourceKey = "bmi270.accel.not_a_real_field";
  assert.throws(() => nodeCatalogSchema.parse(bad), /Invalid sensor-input sourceKey/);
});

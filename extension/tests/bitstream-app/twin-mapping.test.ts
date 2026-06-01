import assert from "node:assert/strict";
import test from "node:test";
import { applyAnimationLabTwinMappingOverrides } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-mapping.apply.js";
import {
  composeTwinLiveSourceKey,
  decomposeTwinLiveSourceKey,
  TWIN_MAPPING_SENSOR_NONE,
} from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-mapping-catalog.js";
import { readEffectiveLiveSourceKeyForRow } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-mapping.store.js";

test("decompose and compose twin live source keys", () => {
  assert.deepEqual(decomposeTwinLiveSourceKey("bmi270.temperature"), {
    sensor: "bmi270",
    subParam: "temperature",
  });
  assert.deepEqual(decomposeTwinLiveSourceKey("bmi270.accel.magnitude"), {
    sensor: "bmi270",
    subParam: "accel.magnitude",
  });
  assert.equal(composeTwinLiveSourceKey("bmi270", "temperature"), "bmi270.temperature");
  assert.equal(
    composeTwinLiveSourceKey("bmi270", "accel.magnitude"),
    "bmi270.accel.magnitude",
  );
  assert.equal(composeTwinLiveSourceKey(TWIN_MAPPING_SENSOR_NONE, ""), undefined);
});

test("applyAnimationLabTwinMappingOverrides merges operator mapping", () => {
  const twin = {
    assetId: "test",
    components: [
      {
        id: "imu",
        label: "IMU",
        signals: [
          {
            key: "imu.temp",
            label: "Temp",
            unit: "°C",
            liveSourceKey: "bmi270.temperature",
          },
        ],
      },
    ],
  };
  const effective = applyAnimationLabTwinMappingOverrides(twin, {
    signalLiveSourceByKey: { "imu::imu.temp": null },
    cardPrimaryByComponent: {},
  });
  assert.equal(effective.components[0]?.signals[0]?.liveSourceKey, undefined);

  const remapped = applyAnimationLabTwinMappingOverrides(twin, {
    signalLiveSourceByKey: { "imu::imu.temp": "sht40.humidity" },
    cardPrimaryByComponent: { imu: "imu.temp" },
  });
  assert.equal(remapped.components[0]?.signals[0]?.liveSourceKey, "sht40.humidity");
  assert.equal(remapped.components[0]?.cardPrimarySignalKey, "imu.temp");
});

test("readEffectiveLiveSourceKeyForRow respects override vs metadata", () => {
  assert.equal(
    readEffectiveLiveSourceKeyForRow({
      metadataLiveSourceKey: "bmi270.temperature",
      signalLiveSourceByKey: {},
      componentId: "imu",
      signalKey: "t",
    }),
    "bmi270.temperature",
  );
  assert.equal(
    readEffectiveLiveSourceKeyForRow({
      metadataLiveSourceKey: "bmi270.temperature",
      signalLiveSourceByKey: { "imu::t": null },
      componentId: "imu",
      signalKey: "t",
    }),
    undefined,
  );
});

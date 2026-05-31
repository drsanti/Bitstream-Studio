import assert from "node:assert/strict";
import test from "node:test";
import { SENSOR_SOURCE_ID_BMI270, SENSOR_SOURCE_ID_DPS368 } from "../../src/webview/bitstream-app/constants/sensorSourceIds";
import { useBitstreamConfigStore } from "../../src/webview/bitstream-app/state/bitstreamConfig.store";
import { useBitstreamDeviceSensorConfigStore } from "../../src/webview/bitstream-app/state/bitstreamDeviceSensorConfig.store";
import { useBmi270FirmwareExtrasDraftStore } from "../../src/webview/bitstream-app/state/bmi270FirmwareExtrasDraft.store";
import {
  runSensorCfgApplyScope,
  sensorCfgApplyScopeLabel,
} from "../../src/webview/sensor-telemetry/lib/applySensorConfigScope";

const BMI270_ROW = {
  sourceId: SENSOR_SOURCE_ID_BMI270,
  enabled: true,
  publishMode: 2 as const,
  mask: 0xffff,
  samplingIntervalMs: 20,
  deltaX100: 5,
  minPublishIntervalMs: 100,
  publishIntervalMs: 20,
  updatedAtMs: 1,
};

test("sensorCfgApplyScopeLabel — card scopes", () => {
  assert.match(sensorCfgApplyScopeLabel({ kind: "bmi270-operation" }), /BMI270 operation/i);
  assert.match(sensorCfgApplyScopeLabel({ kind: "bmi270-output-profile" }), /telemetry sources/i);
  assert.match(sensorCfgApplyScopeLabel({ kind: "bmi270-fusion-feed" }), /fusion feed/i);
});

test("runSensorCfgApplyScope — no-op when card scope has no work", async () => {
  useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows([BMI270_ROW]);
  useBitstreamDeviceSensorConfigStore.getState().setSensorCfgTruthReady(true);
  useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(true);
  useBmi270FirmwareExtrasDraftStore.getState().commitStreamModeBaseline("hybrid");
  useBitstreamConfigStore.getState().setBmi270StreamMode("hybrid");

  let applyAllCalls = 0;
  let applyOneCalls = 0;
  const res = await runSensorCfgApplyScope({
    scope: { kind: "bmi270-sampling" },
    applyDirtySensorConfigs: async () => {
      applyAllCalls += 1;
      return true;
    },
    applyDirtySensorConfigForSource: async () => {
      applyOneCalls += 1;
      return true;
    },
    bmi270Transport: {},
    publishBmi270StreamModeUpdated: () => {},
    publishBmi270FusionFeedUpdated: () => {},
  });
  assert.equal(res.ok, true);
  assert.equal(applyAllCalls, 0);
  assert.equal(applyOneCalls, 0);
});

test("runSensorCfgApplyScope — sampling scope applies one sensor", async () => {
  useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows([BMI270_ROW]);
  useBitstreamDeviceSensorConfigStore.getState().setSensorCfgTruthReady(true);
  useBitstreamDeviceSensorConfigStore.getState().mergeVerifiedDeviceSensorConfig({
    ...BMI270_ROW,
    samplingIntervalMs: 50,
  });

  let appliedSourceId: number | null = null;
  const res = await runSensorCfgApplyScope({
    scope: { kind: "bmi270-sampling" },
    applyDirtySensorConfigs: async () => true,
    applyDirtySensorConfigForSource: async (sourceId) => {
      appliedSourceId = sourceId;
      return true;
    },
    bmi270Transport: {},
    publishBmi270StreamModeUpdated: () => {},
    publishBmi270FusionFeedUpdated: () => {},
  });
  assert.equal(res.ok, true);
  assert.equal(appliedSourceId, SENSOR_SOURCE_ID_BMI270);
});

test("runSensorCfgApplyScope — generic sensor sampling scope", async () => {
  useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows([
    {
      sourceId: SENSOR_SOURCE_ID_DPS368,
      enabled: true,
      publishMode: 2,
      mask: 0xff,
      samplingIntervalMs: 1000,
      deltaX100: 0,
      minPublishIntervalMs: 0,
      publishIntervalMs: 0,
      updatedAtMs: 1,
    },
  ]);
  useBitstreamDeviceSensorConfigStore.getState().setSensorCfgTruthReady(true);
  useBitstreamDeviceSensorConfigStore.getState().mergeVerifiedDeviceSensorConfig({
    sourceId: SENSOR_SOURCE_ID_DPS368,
    enabled: true,
    publishMode: 2,
    mask: 0xff,
    samplingIntervalMs: 500,
    deltaX100: 0,
    minPublishIntervalMs: 0,
    publishIntervalMs: 0,
  });

  let appliedSourceId: number | null = null;
  const res = await runSensorCfgApplyScope({
    scope: { kind: "sensor-sampling", sourceId: SENSOR_SOURCE_ID_DPS368 },
    applyDirtySensorConfigs: async () => true,
    applyDirtySensorConfigForSource: async (sourceId) => {
      appliedSourceId = sourceId;
      return true;
    },
    bmi270Transport: {},
    publishBmi270StreamModeUpdated: () => {},
    publishBmi270FusionFeedUpdated: () => {},
  });
  assert.equal(res.ok, true);
  assert.equal(appliedSourceId, SENSOR_SOURCE_ID_DPS368);
});

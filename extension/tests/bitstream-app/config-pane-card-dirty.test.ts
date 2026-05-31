import assert from "node:assert/strict";
import test from "node:test";
import { SENSOR_SOURCE_ID_BMI270 } from "../../src/webview/bitstream-app/constants/sensorSourceIds";
import { useBitstreamConfigStore } from "../../src/webview/bitstream-app/state/bitstreamConfig.store";
import { useBitstreamDeviceSensorConfigStore } from "../../src/webview/bitstream-app/state/bitstreamDeviceSensorConfig.store";
import {
  useBmi270FirmwareExtrasDraftStore,
} from "../../src/webview/bitstream-app/state/bmi270FirmwareExtrasDraft.store";
import {
  isBmi270DeltaCardDirty,
  isBmi270FusionFeedCardDirty,
  isBmi270MinPublishCardDirty,
  isBmi270OperationCardDirty,
  isBmi270OutputProfileCardDirty,
  isBmi270SamplingCardDirty,
  isSensorCfgFieldsDirty,
} from "../../src/webview/sensor-telemetry/lib/configPaneCardDirty";

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

test("isSensorCfgFieldsDirty — false when truth not ready", () => {
  useBitstreamDeviceSensorConfigStore.getState().resetSensorCfgSyncState();
  assert.equal(isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["samplingIntervalMs"]), false);
});

test("isSensorCfgFieldsDirty — detects single field drift", () => {
  useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows([BMI270_ROW]);
  useBitstreamDeviceSensorConfigStore.getState().setSensorCfgTruthReady(true);
  useBitstreamDeviceSensorConfigStore.getState().mergeVerifiedDeviceSensorConfig({
    ...BMI270_ROW,
    samplingIntervalMs: 50,
  });
  assert.equal(isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["samplingIntervalMs"]), true);
  assert.equal(isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["deltaX100"]), false);
});

test("BMI270 card dirty helpers — output profile includes stream mode extras", () => {
  useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows([BMI270_ROW]);
  useBitstreamDeviceSensorConfigStore.getState().setSensorCfgTruthReady(true);
  useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(true);
  useBmi270FirmwareExtrasDraftStore.getState().commitStreamModeBaseline("hybrid");
  useBmi270FirmwareExtrasDraftStore.getState().commitFusionFeedBaseline(10);
  useBitstreamConfigStore.getState().setBmi270StreamMode("raw");
  assert.equal(isBmi270OperationCardDirty(), false);
  assert.equal(isBmi270OutputProfileCardDirty(), true);
  assert.equal(isBmi270FusionFeedCardDirty(), false);
  assert.equal(isBmi270SamplingCardDirty(), false);
});

test("BMI270 card dirty helpers — per-card field scopes", () => {
  useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows([BMI270_ROW]);
  useBitstreamDeviceSensorConfigStore.getState().setSensorCfgTruthReady(true);
  useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(true);
  useBmi270FirmwareExtrasDraftStore.getState().commitStreamModeBaseline("hybrid");
  useBmi270FirmwareExtrasDraftStore.getState().commitFusionFeedBaseline(10);
  useBitstreamConfigStore.getState().setBmi270StreamMode("hybrid");
  useBitstreamDeviceSensorConfigStore.getState().mergeVerifiedDeviceSensorConfig({
    ...BMI270_ROW,
    deltaX100: 12,
    minPublishIntervalMs: 200,
    samplingIntervalMs: 40,
  });
  assert.equal(isBmi270SamplingCardDirty(), true);
  assert.equal(isBmi270DeltaCardDirty(), true);
  assert.equal(isBmi270MinPublishCardDirty(), true);
  assert.equal(isBmi270OperationCardDirty(), false);
});

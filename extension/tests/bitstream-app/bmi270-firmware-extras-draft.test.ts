import assert from "node:assert/strict";
import test from "node:test";
import { useBitstreamConfigStore } from "../../src/webview/bitstream-app/state/bitstreamConfig.store";
import {
  isBmi270FirmwareExtrasDirty,
  isBmi270FusionFeedDraftDirty,
  isBmi270StreamModeDraftDirty,
  useBmi270FirmwareExtrasDraftStore,
} from "../../src/webview/bitstream-app/state/bmi270FirmwareExtrasDraft.store";
import { listConfigPaneDirtySourceIds } from "../../src/webview/sensor-telemetry/lib/configPaneDirty";
import { SENSOR_SOURCE_ID_BMI270 } from "../../src/webview/bitstream-app/constants/sensorSourceIds";

test("BMI270 extras dirty — false when defer off", () => {
  useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(false);
  useBmi270FirmwareExtrasDraftStore.getState().commitStreamModeBaseline("hybrid");
  useBitstreamConfigStore.getState().setBmi270StreamMode("raw");
  assert.equal(isBmi270StreamModeDraftDirty(), false);
  assert.equal(isBmi270FirmwareExtrasDirty(), false);
});

test("BMI270 extras dirty — stream mode draft", () => {
  useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(true);
  useBmi270FirmwareExtrasDraftStore.getState().commitStreamModeBaseline("hybrid");
  useBmi270FirmwareExtrasDraftStore.getState().commitFusionFeedBaseline(10);
  useBitstreamConfigStore.getState().setBmi270StreamMode("raw");
  useBitstreamConfigStore.getState().setBmi270FusionFeedIntervalMs(10);
  assert.equal(isBmi270StreamModeDraftDirty(), true);
  assert.equal(isBmi270FusionFeedDraftDirty(), false);
  assert.equal(isBmi270FirmwareExtrasDirty(), true);
});

test("BMI270 extras dirty — null baseline forces apply while defer on", () => {
  useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(true);
  useBmi270FirmwareExtrasDraftStore.getState().resetBaselines();
  useBitstreamConfigStore.getState().setBmi270StreamMode("hybrid");
  assert.equal(isBmi270StreamModeDraftDirty(), true);
  assert.equal(isBmi270FirmwareExtrasDirty(), true);
});

test("BMI270 extras dirty — extrasUserEdited while defer on", () => {
  useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(true);
  useBmi270FirmwareExtrasDraftStore.getState().commitStreamModeBaseline("hybrid");
  useBmi270FirmwareExtrasDraftStore.getState().commitFusionFeedBaseline(10);
  useBitstreamConfigStore.getState().setBmi270StreamMode("hybrid");
  assert.equal(isBmi270FirmwareExtrasDirty(), false);
  useBmi270FirmwareExtrasDraftStore.getState().markExtrasUserEdited();
  assert.equal(isBmi270FirmwareExtrasDirty(), true);
});

test("listConfigPaneDirtySourceIds includes BMI270 for extras-only dirty", () => {
  useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(true);
  useBmi270FirmwareExtrasDraftStore.getState().commitStreamModeBaseline("hybrid");
  useBmi270FirmwareExtrasDraftStore.getState().commitFusionFeedBaseline(10);
  useBitstreamConfigStore.getState().setBmi270StreamMode("fusion");
  const ids = listConfigPaneDirtySourceIds();
  assert.ok(ids.includes(SENSOR_SOURCE_ID_BMI270));
});

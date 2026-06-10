import assert from "node:assert/strict";
import test from "node:test";

import { createPageBlock } from "../../src/webview/course-studio/maintainer/blockFactory";
import { courseSensorTelemetryCardUnavailableReason } from "../../src/webview/course-studio/runtime/useCourseSensorTelemetryDeckSamples";
import {
  COURSE_SENSOR_TELEMETRY_CARD_PRESET_DEFAULT,
  courseSensorTelemetryCardPresetLabel,
} from "../../src/webview/course-studio/schemas/sensorTelemetryCardPreset";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

test("createPageBlock sensor-telemetry-card defaults to euler preset", () => {
  const page = parsePageV1({
    version: 1,
    id: "sensor-card-test",
    title: "Sensor card",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [],
  });

  const block = createPageBlock("sensor-telemetry-card", page);
  assert.equal(block.kind, "sensor-telemetry-card");
  if (block.kind !== "sensor-telemetry-card") {
    return;
  }
  assert.equal(block.preset, COURSE_SENSOR_TELEMETRY_CARD_PRESET_DEFAULT);
  assert.equal(courseSensorTelemetryCardPresetLabel(block.preset), "BMI270 Euler Angles");
});

test("parsePageV1 accepts sensor-telemetry-card block", () => {
  const page = parsePageV1({
    version: 1,
    id: "sensor-card-page",
    title: "Euler lesson",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "euler-card",
        kind: "sensor-telemetry-card",
        placement: { column: 1, row: 1, columnSpan: 5, rowSpan: 3 },
        preset: "euler",
      },
    ],
  });
  assert.equal(page.blocks[0]?.kind, "sensor-telemetry-card");
});

test("courseSensorTelemetryCardUnavailableReason respects BMI270 stream mode", () => {
  const base = {
    bmi270TelemetryEnabled: true,
    dps368TelemetryEnabled: true,
    sht40TelemetryEnabled: true,
    bmm350TelemetryEnabled: true,
    bmi270StreamMode: "raw" as const,
    bmi270Sample: null,
    dpsSample: null,
    sht40Sample: null,
    bmm350Sample: null,
    samplingIntervalMs: 25,
    dpsSamplingIntervalMs: 1000,
    shtSamplingIntervalMs: 500,
    bmm350SamplingIntervalMs: 50,
  };

  assert.match(
    courseSensorTelemetryCardUnavailableReason("euler", base) ?? "",
    /Fusion/i,
  );
  assert.equal(courseSensorTelemetryCardUnavailableReason("gyro", base), null);

  const fusion = { ...base, bmi270StreamMode: "fusion" as const };
  assert.equal(courseSensorTelemetryCardUnavailableReason("euler", fusion), null);
  assert.match(
    courseSensorTelemetryCardUnavailableReason("gyro", fusion) ?? "",
    /Raw/i,
  );
});
